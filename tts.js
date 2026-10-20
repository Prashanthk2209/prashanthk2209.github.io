/* tts.js - natural voice for the portfolio, in the browser.
   Kokoro-82M (open source, Apache-2.0) through kokoro-js runs on the visitor's device inside tts-worker.js: downloaded
   once (about 90 MB, cached by the browser), then every answer is synthesized locally. Nothing leaves the page.
   No lag at the start of an answer:
   - the whole answer is queued for synthesis the moment it is known, so it is built in the background while the
     first piece plays; pieces are scheduled back to back on the audio clock, so there are no gaps between them;
   - the first piece is short (a few words), so it is ready in well under a second;
   - every piece is cached, and likely answers are synthesized ahead of time while the page is idle;
   - if the first piece is still not ready after 200 ms, a short pre-made filler ("Sure.") plays while it finishes.
   If the model cannot load, chat.js falls back to the browser's built-in voice.
   Exposes window.PORTFOLIO_TTS = { warm, speak, stop, prefetch, ready, voices, setVoice, voiceName, onStatus, onReady }. */
(function () {
  'use strict';
  var VOICE_KEY = 'ttsVoice';
  var VOICES = [
    { id: 'am_michael', label: 'Michael (US)' }, { id: 'am_adam', label: 'Adam (US)' }, { id: 'am_eric', label: 'Eric (US)' },
    { id: 'am_liam', label: 'Liam (US)' }, { id: 'am_onyx', label: 'Onyx (US, deep)' }, { id: 'am_puck', label: 'Puck (US)' },
    { id: 'bm_george', label: 'George (UK)' }, { id: 'bm_lewis', label: 'Lewis (UK)' }, { id: 'bm_daniel', label: 'Daniel (UK)' }, { id: 'bm_fable', label: 'Fable (UK)' }
  ];
  var FILLERS = ['Sure.', 'Good question.', 'Right, so.', 'Okay.'];
  var FILLER_WAIT_MS = 200, CACHE_MAX = 300;
  var worker = null, ready = false, failed = false, warming = null, warmResolve = null, warmReject = null;
  var jobs = {}, nextId = 1, cache = new Map(), actx = null, sources = [], token = 0, liveIds = [], fillerTurn = 0;
  var onStatus = null, readyFns = [], stats = [];
  var voiceId = null;
  try { voiceId = localStorage.getItem(VOICE_KEY); } catch (e) { voiceId = null; }
  if (!voiceId || !VOICES.some(function (v) { return v.id === voiceId; })) { voiceId = 'am_michael'; }

  function status(msg) { if (onStatus) { try { onStatus(msg); } catch (e) {} } }
  function supported() { return typeof WebAssembly === 'object' && typeof Worker === 'function' && !!(window.AudioContext || window.webkitAudioContext); }

  /* ---------- worker ---------- */
  function fail(err) {
    failed = true; status('');
    if (warmReject) { warmReject(err || new Error('tts failed')); }
    Object.keys(jobs).forEach(function (id) { jobs[id].reject(new Error('tts failed')); });
    jobs = {};
  }
  function onMessage(e) {
    var m = e.data || {};
    if (m.type === 'progress') { status('Warming up my voice... ' + m.pct + '%'); }
    else if (m.type === 'ready') {
      ready = true; status(''); if (warmResolve) { warmResolve(); }
      FILLERS.forEach(function (f) { synth(f, 1); });
      readyFns.forEach(function (fn) { try { fn(); } catch (err) {} });
    } else if (m.type === 'failed') { fail(new Error(m.error)); }
    else if (m.type === 'audio' || m.type === 'error') {
      var job = jobs[m.id]; delete jobs[m.id];
      if (!job) { return; }
      if (m.type === 'audio') {
        job.entry.data = m.data; job.entry.rate = m.rate; job.resolve(job.entry);
        stats.push({ chars: job.entry.text.length, ms: m.ms, sec: +(m.data.length / m.rate).toFixed(2), prio: job.entry.prio });
        if (stats.length > 200) { stats.shift(); }
      }
      else { cache.delete(job.entry.key); job.reject(new Error(m.error)); }
    }
  }
  function warm() {
    if (ready) { return Promise.resolve(); }
    if (failed || !supported()) { return Promise.reject(new Error('unsupported')); }
    if (warming) { return warming; }
    status('Warming up my voice (first time only, about 90 MB)...');
    warming = new Promise(function (resolve, reject) { warmResolve = resolve; warmReject = reject; });
    try {
      worker = new Worker('tts-worker.js', { type: 'module' });
      worker.onmessage = onMessage;
      worker.onerror = function (e) { fail(new Error((e && e.message) || 'worker error')); };
      worker.postMessage({ type: 'warm' });
    } catch (err) { fail(err); }
    return warming;
  }

  /* ---------- synthesis cache: one entry per (voice, text) piece ---------- */
  function synth(text, prio) {
    var key = voiceId + '|' + text, entry = cache.get(key);
    if (entry) {
      cache.delete(key); cache.set(key, entry);                     // most recently used goes to the end
      if (!entry.data && entry.id && prio < entry.prio) { entry.prio = prio; worker.postMessage({ type: 'prio', id: entry.id, prio: prio }); }
      return entry;
    }
    entry = { key: key, text: text, prio: prio, id: nextId++, data: null, rate: 24000 };
    entry.promise = new Promise(function (resolve, reject) { jobs[entry.id] = { entry: entry, resolve: resolve, reject: reject }; });
    entry.promise.catch(function () {});
    cache.set(key, entry);
    while (cache.size > CACHE_MAX) { cache.delete(cache.keys().next().value); }
    worker.postMessage({ type: 'gen', id: entry.id, text: text, voice: voiceId, prio: prio });
    return entry;
  }

  function chunks(text) {
    // First piece: a few words, so it synthesizes fast. Then growing pieces (70, 110, then 160 chars), each small enough
    // to be finished before the piece in front of it stops playing. Splits prefer sentence and clause boundaries.
    var clauses = String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?;:,])\s+/).filter(Boolean);
    var out = [], buf = '';
    function limit() { return [40, 70, 110][out.length] || 160; }
    clauses.forEach(function (c) {
      if (buf && (buf + ' ' + c).length > limit()) { out.push(buf); buf = c; } else { buf = (buf + ' ' + c).trim(); }
      while (out.length === 0 && buf.length > 60) {                  // a long opening clause: cut it at a word boundary
        var words = buf.split(' '), head = '';
        while (words.length > 3 && (head + ' ' + words[0]).trim().length <= 40) { head = (head + ' ' + words.shift()).trim(); }
        if (!head || !words.length) { break; }
        out.push(head); buf = words.join(' ');
      }
    });
    if (buf) { out.push(buf); }
    return out;
  }

  /* ---------- playback: scheduled on the audio clock, so pieces join without gaps ---------- */
  function ctx() {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') { actx.resume(); }
    return actx;
  }
  function schedule(entry, at) {
    var ac = ctx(), buf = ac.createBuffer(1, entry.data.length, entry.rate);
    buf.copyToChannel(entry.data, 0);
    var src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination);
    src.onended = function () { sources = sources.filter(function (s) { return s !== src; }); };
    sources.push(src); src.start(at);
    return { src: src, end: at + buf.duration };
  }
  function stop(keepFiller) {
    token++;
    if (!keepFiller) { fillerEnd = 0; }
    sources.filter(function (s) { return !keepFiller || !s.isFiller; }).forEach(function (s) { try { s.onended = null; s.stop(); } catch (e) {} });
    sources = keepFiller ? sources.filter(function (s) { return s.isFiller; }) : [];
    var pending = liveIds.filter(function (id) { return jobs[id]; });
    if (pending.length && worker) { worker.postMessage({ type: 'drop', ids: pending }); }
    liveIds = [];
  }
  function speak(text, opts) {
    opts = opts || {};
    stop(true);                                   // a filler already playing is allowed to finish
    var my = token;
    return warm().then(function () {
      if (token !== my) { return; }
      var entries = chunks(text).map(function (c) { return synth(c, 0); });   // queue every piece now: built in the background
      liveIds = entries.map(function (e) { return e.id; });
      var ac = ctx(), at = Math.max(ac.currentTime + 0.02, fillerEnd + 0.05), last = null;
      if (fillerEnd > ac.currentTime) { opts.filler = false; }
      var start = Promise.resolve();
      if (opts.filler && entries.length && !entries[0].data) {
        start = Promise.race([entries[0].promise, new Promise(function (r) { setTimeout(r, FILLER_WAIT_MS); })]).then(function () {
          if (token !== my || entries[0].data) { return; }
          var f = cache.get(voiceId + '|' + FILLERS[fillerTurn++ % FILLERS.length]);
          if (f && f.data) { last = schedule(f, ac.currentTime + 0.01); last.src.isFiller = true; at = last.end + 0.05; }
        });
      }
      var chain = start;
      entries.forEach(function (entry) {
        chain = chain.then(function () {
          return entry.promise.catch(function (err) { if (token === my) { throw err; } });   // dropped by stop(): not an error
        }).then(function () {
          if (token !== my) { return; }
          last = schedule(entry, Math.max(at, ac.currentTime + 0.01)); at = last.end;
        });
      });
      return chain.then(function () {
        if (token !== my || !last) { return; }
        return new Promise(function (resolve) {
          var src = last.src, done = false;
          function fin() { if (!done) { done = true; resolve(); } }
          var prev = src.onended; src.onended = function () { if (prev) { prev(); } fin(); };
          setTimeout(fin, Math.max(0, (last.end - ac.currentTime) * 1000) + 500);   // also resolves if stop() detached onended
        });
      });
    });
  }
  // Play one pre-made filler now ("Sure.") while the answer is still being looked up. Returns false if none is ready.
  var fillerEnd = 0;
  function filler() {
    if (!ready) { return false; }
    var f = cache.get(voiceId + '|' + FILLERS[fillerTurn++ % FILLERS.length]);
    if (!f || !f.data) { return false; }
    var ac = ctx(), s = schedule(f, ac.currentTime + 0.01); s.src.isFiller = true; fillerEnd = s.end; return true;
  }
  function prefetch(text, pieces, prio) {
    if (!ready) { return; }
    chunks(text).slice(0, pieces || 2).forEach(function (c) { synth(c, prio == null ? 2 : prio); });
  }

  window.PORTFOLIO_TTS = {
    warm: warm, speak: speak, stop: function () { stop(false); }, filler: filler, prefetch: prefetch, chunks: chunks, stats: function () { return stats.slice(); },
    ready: function () { return ready; }, failed: function () { return failed; }, supported: supported,
    cached: function (text) { var e = cache.get(voiceId + '|' + text); return !!(e && e.data); },
    voices: function () { return VOICES.slice(); },
    voiceName: function () { return voiceId; },
    setVoice: function (id) {
      if (!VOICES.some(function (v) { return v.id === id; }) || id === voiceId) { return; }
      voiceId = id; try { localStorage.setItem(VOICE_KEY, id); } catch (e) {}
      if (ready) { FILLERS.forEach(function (f) { synth(f, 1); }); readyFns.forEach(function (fn) { try { fn(); } catch (err) {} }); }
    },
    onStatus: function (fn) { onStatus = fn; },
    onReady: function (fn) { readyFns.push(fn); if (ready) { fn(); } }
  };
})();
