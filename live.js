/* live.js - "Hey Prashanth" conversations through Gemini Live: the visitor's voice streams to Gemini, Gemini's voice
   streams back (~0.7 s to first sound), with captions from both sides and barge-in (talk over it to interrupt).
   The relay (chat-relay/Code.gs) hands out a one-use pass locked to Prashanth's instructions and story, so no key is
   ever in the page. One pass is fetched ahead of time, when voice is switched on, so a wake word connects at once.
   Exposes window.PORTFOLIO_LIVE = { supported, prefetch, ready, start, stop, active }. */
(function () {
  'use strict';
  var CFG = window.PORTFOLIO_CHAT || {};
  var WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';
  var IDLE_MS = 20000;            // close the conversation after this long with nobody talking (saves the free quota)
  var pass = null, fetching = null, failedUntil = 0;
  var SESSION = Math.random().toString(36).slice(2, 12);
  var sent = 0;
  var ws = null, actx = null, micStream = null, micNode = null, srcNode = null, sources = [], playAt = 0, idleTimer = null, handlers = {};

  function supported() {
    return !!(CFG.endpoint && window.WebSocket && (window.AudioContext || window.webkitAudioContext) &&
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.AudioWorkletNode);
  }

  /* ---------- the pass ---------- */
  function prefetch() {
    if (!supported() || pass || fetching || Date.now() < failedUntil) { return fetching || Promise.resolve(pass); }
    fetching = fetch(CFG.endpoint + '?live=1&session=' + SESSION).then(function (r) { return r.json(); }).then(function (d) {
      fetching = null;
      if (!d || !d.token) { failedUntil = Date.now() + 5 * 60000; return null; }   // over the cap or down: retry later
      pass = { token: d.token, model: d.model, until: Date.now() + 25 * 60000 };
      return pass;
    }).catch(function () { fetching = null; failedUntil = Date.now() + 60000; return null; });
    return fetching;
  }
  function ready() { return !!(pass && Date.now() < pass.until); }

  /* ---------- microphone: 16 kHz, 16-bit PCM chunks via an AudioWorklet ---------- */
  var WORKLET = 'class Down extends AudioWorkletProcessor{constructor(){super();this.buf=[];this.ratio=sampleRate/16000;this.pos=0;}' +
    'process(inp){var ch=inp[0]&&inp[0][0];if(!ch)return true;' +
    'for(;this.pos<ch.length;this.pos+=this.ratio){var s=Math.max(-1,Math.min(1,ch[Math.floor(this.pos)]));this.buf.push(s<0?s*32768:s*32767);}' +
    'this.pos-=ch.length;if(this.buf.length>=640){this.port.postMessage(Int16Array.from(this.buf).buffer,[]);this.buf=[];}return true;}}' +
    'registerProcessor("down16k",Down);';
  function b64(buf) {
    var bytes = new Uint8Array(buf), s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) { s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); }
    return btoa(s);
  }
  function startMic() {
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function (stream) {
      micStream = stream;
      var url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
      return actx.audioWorklet.addModule(url).then(function () {
        srcNode = actx.createMediaStreamSource(stream);
        micNode = new AudioWorkletNode(actx, 'down16k');
        micNode.port.onmessage = function (e) {
          sent++;
          if (ws && ws.readyState === 1) { ws.send(JSON.stringify({ realtimeInput: { audio: { data: b64(e.data), mimeType: 'audio/pcm;rate=16000' } } })); }
        };
        srcNode.connect(micNode);
        // Chrome only runs nodes that lead to the speakers, so route it there at zero volume: nobody hears themselves.
        var mute = actx.createGain(); mute.gain.value = 0; micNode.connect(mute); mute.connect(actx.destination);
      });
    });
  }

  /* ---------- playback: 24 kHz PCM chunks scheduled back to back ---------- */
  function play(base64) {
    var bin = atob(base64), n = bin.length >> 1, f = new Float32Array(n);
    for (var i = 0; i < n; i++) { var v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); f[i] = (v >= 32768 ? v - 65536 : v) / 32768; }
    var buf = actx.createBuffer(1, n, 24000); buf.copyToChannel(f, 0);
    var src = actx.createBufferSource(); src.buffer = buf; src.connect(actx.destination);
    var at = Math.max(actx.currentTime + 0.03, playAt); src.start(at); playAt = at + buf.duration;
    sources.push(src);
    src.onended = function () {
      sources = sources.filter(function (s) { return s !== src; });
      if (!sources.length) { emit('speaking', false); armIdle(); }
    };
    if (sources.length === 1) { emit('speaking', true); clearTimeout(idleTimer); }
  }
  function hush() {   // the visitor talked over the answer
    sources.forEach(function (s) { try { s.onended = null; s.stop(); } catch (e) {} });
    sources = []; playAt = 0; emit('speaking', false);
  }

  function emit(name, v) { if (handlers[name]) { try { handlers[name](v); } catch (e) {} } }
  function armIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(function () { stop('idle'); }, IDLE_MS); }

  /* ---------- a conversation ---------- */
  function start(opts) {
    opts = opts || {};
    handlers = opts.on || {};
    if (!ready()) { return Promise.reject(new Error('no pass')); }
    var p = pass; pass = null;                       // one use
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') { actx.resume(); }
    return new Promise(function (resolve, reject) {
      var opened = false, userText = '', botText = '';
      ws = new WebSocket(WS_URL + '?access_token=' + encodeURIComponent(p.token));
      ws.onopen = function () { ws.send(JSON.stringify({ setup: { model: p.model } })); };   // everything else is locked in the pass
      ws.onmessage = function (e) {
        Promise.resolve(typeof e.data === 'string' ? e.data : e.data.text()).then(function (raw) {
          var d = JSON.parse(raw);
          if (d.setupComplete) {
            opened = true;
            startMic().then(function () {
              if (opts.question) { ws.send(JSON.stringify({ clientContent: { turns: [{ role: 'user', parts: [{ text: opts.question }] }], turnComplete: true } })); }
              armIdle(); resolve();
            }).catch(function (err) { stop('mic'); reject(err); });
            return;
          }
          var sc = d.serverContent;
          if (!sc) { if (d.goAway) { stop('limit'); } return; }
          if (sc.interrupted) { hush(); }
          if (sc.inputTranscription && sc.inputTranscription.text) {
            if (botText) { botText = ''; userText = ''; }
            userText += sc.inputTranscription.text; clearTimeout(idleTimer); emit('user', userText.trim());
          }
          (sc.modelTurn && sc.modelTurn.parts || []).forEach(function (part) { if (part.inlineData && part.inlineData.data) { play(part.inlineData.data); } });
          if (sc.outputTranscription && sc.outputTranscription.text) { botText += sc.outputTranscription.text; emit('bot', botText.trim()); }
          if (sc.turnComplete) { emit('turn', { user: userText.trim(), bot: botText.trim() }); userText = ''; botText = ''; if (!sources.length) { armIdle(); } }
        }).catch(function () {});
      };
      ws.onerror = function () { if (!opened) { reject(new Error('connect failed')); } };
      ws.onclose = function () { if (!opened) { reject(new Error('closed')); } cleanup(); emit('end', 'closed'); };
    });
  }
  function cleanup() {
    clearTimeout(idleTimer);
    if (micNode) { try { micNode.port.onmessage = null; micNode.disconnect(); } catch (e) {} micNode = null; }
    if (srcNode) { try { srcNode.disconnect(); } catch (e) {} srcNode = null; }
    if (micStream) { micStream.getTracks().forEach(function (t) { t.stop(); }); micStream = null; }
    ws = null;
    setTimeout(prefetch, 500);                       // a fresh pass for the next "Hey Prashanth"
  }
  function stop(why) {
    hush();
    if (ws) { var w = ws; ws = null; w.onclose = null; try { w.close(); } catch (e) {} }
    cleanup(); emit('end', why || 'stopped');
  }

  window.PORTFOLIO_LIVE = { supported: supported, prefetch: prefetch, ready: ready, start: start, stop: stop,
    active: function () { return !!ws; }, chunksSent: function () { return sent; }, speaking: function () { return sources.length > 0; } };
})();
