/* tts.js - natural voice for the portfolio, in the browser.
   Kokoro-82M (open source, Apache-2.0) through kokoro-js runs on the visitor's device: downloaded once (about 90 MB,
   cached by the browser), then every answer is synthesized locally, sentence by sentence, and played while the next
   sentence is still being generated. Nothing leaves the page. If the model cannot load, chat.js falls back to the
   browser's built-in voice. Exposes window.PORTFOLIO_TTS = { warm, speak, stop, ready, voices, setVoice, voiceName }. */
(function () {
  'use strict';
  var MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
  var VOICE_KEY = 'ttsVoice';
  var VOICES = [
    { id: 'am_michael', label: 'Michael (US)' }, { id: 'am_adam', label: 'Adam (US)' }, { id: 'am_eric', label: 'Eric (US)' },
    { id: 'am_liam', label: 'Liam (US)' }, { id: 'am_onyx', label: 'Onyx (US, deep)' }, { id: 'am_puck', label: 'Puck (US)' },
    { id: 'bm_george', label: 'George (UK)' }, { id: 'bm_lewis', label: 'Lewis (UK)' }, { id: 'bm_daniel', label: 'Daniel (UK)' }, { id: 'bm_fable', label: 'Fable (UK)' }
  ];
  var tts = null, loading = null, failed = false, actx = null, playing = [], cancelled = 0, onStatus = null;
  var voiceId = null;
  try { voiceId = localStorage.getItem(VOICE_KEY); } catch (e) { voiceId = null; }
  if (!voiceId || !VOICES.some(function (v) { return v.id === voiceId; })) { voiceId = 'am_michael'; }

  function status(msg) { if (onStatus) { try { onStatus(msg); } catch (e) {} } }
  function supported() { return typeof WebAssembly === 'object' && !!(window.AudioContext || window.webkitAudioContext); }

  function warm() {
    if (tts) { return Promise.resolve(tts); }
    if (failed || !supported()) { return Promise.reject(new Error('unsupported')); }
    if (loading) { return loading; }
    status('Warming up my voice (first time only, about 90 MB)...');
    loading = import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm').then(function (mod) {
      var device = 'wasm', dtype = 'q8';
      return mod.KokoroTTS.from_pretrained(MODEL, {
        dtype: dtype, device: device,
        progress_callback: function (p) {
          if (p && p.status === 'progress' && p.file && /onnx/.test(p.file)) { status('Warming up my voice... ' + Math.round(p.progress || 0) + '%'); }
        }
      });
    }).then(function (t) { tts = t; loading = null; status(''); return t; })
      .catch(function (err) { failed = true; loading = null; status(''); throw err; });
    return loading;
  }

  function ctx() {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') { actx.resume(); }
    return actx;
  }
  function sentences(text) {
    // Clause-sized chunks: the first one short so the voice starts within a couple of seconds, the rest 50-110 chars.
    var pieces = String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?;:,])\s+/).filter(Boolean);
    var out = [], buf = '';
    pieces.forEach(function (p) {
      var limit = out.length === 0 ? 55 : 110;
      if (buf && (buf + ' ' + p).length > limit) { out.push(buf); buf = p; } else { buf = (buf + ' ' + p).trim(); }
    });
    if (buf) { out.push(buf); }
    return out;
  }
  function play(audio) {
    return new Promise(function (resolve) {
      var ac = ctx(), data = audio.audio, sr = audio.sampling_rate || 24000;
      var buf = ac.createBuffer(1, data.length, sr); buf.copyToChannel(data instanceof Float32Array ? data : Float32Array.from(data), 0);
      var src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination);
      src.onended = function () { playing = playing.filter(function (s) { return s !== src; }); resolve(); };
      playing.push(src); src.start();
    });
  }
  function stop() {
    cancelled++;
    playing.forEach(function (s) { try { s.stop(); } catch (e) {} });
    playing = [];
  }
  function speak(text) {
    var my = ++cancelled;                       // any newer speak()/stop() cancels this one
    return warm().then(function (t) {
      var parts = sentences(text), chain = Promise.resolve(), next = null;
      function gen(i) { return i < parts.length ? t.generate(parts[i], { voice: voiceId, speed: 1.0 }) : null; }
      next = gen(0);
      parts.forEach(function (_, i) {
        chain = chain.then(function () {
          if (cancelled !== my) { return; }
          return next.then(function (audio) {
            if (cancelled !== my) { return; }
            next = gen(i + 1);                 // generate the next sentence while this one plays
            return play(audio);
          });
        });
      });
      return chain;
    });
  }
  window.PORTFOLIO_TTS = {
    warm: warm, speak: speak, stop: stop,
    ready: function () { return !!tts; }, failed: function () { return failed; }, supported: supported,
    voices: function () { return VOICES.slice(); },
    voiceName: function () { return voiceId; },
    setVoice: function (id) { if (VOICES.some(function (v) { return v.id === id; })) { voiceId = id; try { localStorage.setItem(VOICE_KEY, id); } catch (e) {} } },
    onStatus: function (fn) { onStatus = fn; }
  };
})();
