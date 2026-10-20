/* voice.js - "Hello" hands-free mode for the portfolio.
   The page asks for the microphone when it opens. While idle it listens only for the wake word using the browser's
   continuous speech recognizer (the one thing a browser can run all day for free). On "Hey Prashanth" the viewport
   gets an animated border, a short chime plays, the next sentence is taken as the question, the answer comes back
   through chat.js (same knowledge, same voice) with live captions, and the page keeps listening for follow-ups until
   there has been silence for a while. Everything stays in the browser. Whisper remains behind the mic button. */
(function () {
  'use strict';
  var API = window.PORTFOLIO_CHAT_API;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!API || !document.body) { return; }

  var PREF_KEY = 'voiceMode';            // "on" | "off" (per browser)
  var state = 'off';                      // off | idle | waking | listening | thinking | speaking
  var rec = null, recWanted = false, restartTimer = null, followTimer = null, captionTimer = null, lastInterim = '';
  var FOLLOW_MS = 14000;                  // keep the conversation open this long after an answer
  var ask = API.ask, speak = API.speak;

  /* ---------- wake word: tolerant of how recognizers mangle the name ---------- */
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 1; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) { for (j = 1; j <= n; j++) { d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); } }
    return d[m][n];
  }
  var NAME_RX = /^(pra|per|pre|pro|bra|fra)sh?[aeiou]*n[td]h?[aeiou]?$/;
  function isName(w) {
    w = w.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) { return false; }
    return NAME_RX.test(w) || lev(w, 'prashanth') <= 3 || lev(w, 'prashant') <= 2 || w === 'present' || w === 'percent';
  }
  function wakeIndex(text) {
    // returns the index (in words) just after the wake phrase, or -1
    var words = text.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
    // Primary wake phrase (user's choice, 2026-10-19): "hello", on its own or followed by the name.
    for (var h = 0; h < words.length; h++) {
      if (/^(hello|hallo|hullo|helo|allo)$/.test(words[h])) {
        if (h + 1 < words.length && isName(words[h + 1])) { return h + 2; }
        if (h + 2 < words.length && isName(words[h + 1] + words[h + 2])) { return h + 3; }
        return h + 1;
      }
    }
    for (var i = 0; i < words.length; i++) {
      var greet = /^(hey|hi|ok|okay|yo|hay|hate|he)$/.test(words[i]);
      if (greet && i + 1 < words.length && isName(words[i + 1])) { return i + 2; }
      if (greet && i + 2 < words.length && isName(words[i + 1] + words[i + 2])) { return i + 3; }
    }
    return -1;
  }
  function afterWake(text) {
    var words = text.trim().split(/\s+/), idx = wakeIndex(text);
    return idx < 0 ? null : words.slice(idx).join(' ').replace(/^[,.!?\s]+/, '');
  }

  /* ---------- UI: border, captions, status pill ---------- */
  var ui = document.createElement('div');
  ui.id = 'heyp';
  ui.innerHTML =
    '<div id="heyp-border" class="heyp-border" aria-hidden="true"></div>' +
    '<div id="heyp-caption" class="heyp-caption" aria-live="polite" hidden><div class="heyp-q"></div><div class="heyp-a"></div></div>' +
    '<button id="heyp-pill" type="button" class="heyp-pill" aria-pressed="false">' +
      '<span class="heyp-dot" aria-hidden="true"></span><span id="heyp-pill-text">Turn on voice: say "Hello"</span></button>' +
    '<div id="heyp-debug" class="heyp-debug" hidden></div>';
  document.body.appendChild(ui);
  var border = document.getElementById('heyp-border'), caption = document.getElementById('heyp-caption'), pill = document.getElementById('heyp-pill'), pillText = document.getElementById('heyp-pill-text');
  var capQ = caption.querySelector('.heyp-q'), capA = caption.querySelector('.heyp-a');
  var dbg = document.getElementById('heyp-debug'), DEBUG = /voicedebug/.test(location.hash + location.search);
  if (DEBUG) { dbg.hidden = false; }
  function log(msg) {
    if (!DEBUG) { return; }
    var line = document.createElement('div'); line.textContent = new Date().toTimeString().slice(0, 8) + '  ' + msg;
    dbg.appendChild(line); while (dbg.children.length > 14) { dbg.removeChild(dbg.firstChild); }
  }

  function setState(s) {
    if (s !== state) { log('state -> ' + s); }
    state = s;
    document.documentElement.setAttribute('data-voice', s);
    var text = { off: 'Turn on voice: say "Hello"', idle: 'Listening for "Hello"', waking: 'Yes?', listening: 'Listening...', thinking: 'Thinking...', speaking: 'Speaking... say "Hello" to interrupt' }[s];
    pillText.textContent = text; pill.setAttribute('aria-pressed', String(s !== 'off'));
  }
  function showCaption(q, a) {
    caption.hidden = false; capQ.textContent = q || ''; capA.textContent = a || '';
    capQ.hidden = !q; capA.hidden = !a;
    clearTimeout(captionTimer);
  }
  function hideCaptionSoon(ms) { clearTimeout(captionTimer); captionTimer = setTimeout(function () { caption.hidden = true; }, ms || 6000); }

  /* ---------- chime: two soft tones, synthesized (no asset) ---------- */
  var actx = null;
  function chime(up) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var now = actx.currentTime, notes = up ? [523.25, 783.99] : [783.99, 523.25];
      notes.forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(actx.destination);
        var t = now + i * 0.12; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.start(t); o.stop(t + 0.3);
      });
    } catch (e) {}
  }

  /* ---------- recognizer lifecycle ---------- */
  function startRec() {
    if (!SR || rec || !recWanted) { return; }
    var r = new SR(); rec = r;
    r.lang = 'en-US'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
    r.onresult = function (e) {
      var finalText = '', interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) { (e.results[i].isFinal ? (finalText += ' ') : (interim += ' ')); (e.results[i].isFinal ? (finalText += e.results[i][0].transcript) : (interim += e.results[i][0].transcript)); }
      if (finalText.trim()) { log('heard (final): ' + finalText.trim()); } else if (interim.trim()) { log('hearing: ' + interim.trim()); }
      handle(finalText.trim(), interim.trim());
    };
    r.onstart = function () { log('recognizer started, state ' + state); };
    r.onerror = function (e) {
      log('recognizer error: ' + e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { recWanted = false; rec = null; setState('off'); pillText.textContent = 'Microphone blocked. Allow it in the address bar, then click here.'; return; }
      // 'no-speech', 'network', 'aborted' -> restart below via onend
    };
    r.onend = function () { rec = null; if (recWanted) { clearTimeout(restartTimer); restartTimer = setTimeout(startRec, 250); } };
    try { r.start(); } catch (err) { rec = null; setTimeout(startRec, 1000); }
  }
  function stopRec() { recWanted = false; clearTimeout(restartTimer); if (rec) { try { rec.onend = null; rec.stop(); } catch (e) {} rec = null; } }
  function pauseRecWhileSpeaking() { if (rec) { try { rec.onend = null; rec.abort(); } catch (e) {} rec = null; } }
  function resumeRec() { if (recWanted && !rec) { startRec(); } }

  var pendingQ = '';
  function handle(finalText, interim) {
    var text = finalText || interim;
    if (!text) { return; }
    if (state === 'idle' || state === 'speaking') {
      var idx = wakeIndex(text);
      if (idx >= 0) {
        if (state === 'speaking') { API.stopSpeaking(); }
        var rest = afterWake(text);
        wake();
        if (rest && rest.split(/\s+/).length >= 3 && finalText) { question(rest); }
        else if (rest && rest.split(/\s+/).length >= 3) { pendingQ = rest; }
      }
      return;
    }
    if (state === 'waking' || state === 'listening') {
      setState('listening');
      if (interim) { showCaption(interim, ''); lastInterim = interim; }
      if (finalText) {
        var q = finalText;
        if (wakeIndex(q) >= 0) { q = afterWake(q) || ''; }
        if (q.split(/\s+/).length < 2) { return; }        // a stray word; keep listening
        question(q);
      }
    }
  }
  function wake() {
    clearTimeout(followTimer);
    setState('waking'); chime(true); showCaption('', '');
    pendingQ = '';
    followTimer = setTimeout(function () { if (state === 'waking' || state === 'listening') { sleep(); } }, 9000);
  }
  function sleep() { clearTimeout(followTimer); setState('idle'); hideCaptionSoon(1500); }
  function question(q) {
    clearTimeout(followTimer);
    setState('thinking'); showCaption(q, '');
    pauseRecWhileSpeaking();
    log('question: ' + q);
    ask(q, true, true).then(function (text) {
      log('answer: ' + text.slice(0, 80));
      showCaption(q, text); setState('speaking');
      return speak(text);
    }).then(function () {
      setState('listening'); resumeRec(); hideCaptionSoon(FOLLOW_MS);
      followTimer = setTimeout(function () { if (state === 'listening') { chime(false); sleep(); } }, FOLLOW_MS);
    }).catch(function () { setState('listening'); resumeRec(); });
  }

  /* ---------- enabling: ask for the mic when the page opens, remember the choice ---------- */
  function enable(fromClick) {
    if (!SR) { pillText.textContent = 'Voice needs Chrome, Edge or Safari. The chat still works by typing.'; return; }
    var ask = navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? navigator.mediaDevices.getUserMedia({ audio: true }) : Promise.resolve(null);
    ask.then(function (stream) {
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); }   // permission is what we wanted; the recognizer opens its own
      try { localStorage.setItem(PREF_KEY, 'on'); } catch (e) {}
      recWanted = true; setState('idle'); startRec(); pill.classList.remove('heyp-pill-invite');
      if (API.warmVoice) { API.warmVoice(); }          // start downloading the natural voice now, not at the first answer
      if (fromClick) {
        chime(true);
        var hello = 'Voice is on. Say hello, then ask me anything.';
        showCaption('', hello); hideCaptionSoon(6000);
        pauseRecWhileSpeaking(); setState('speaking');
        speak(hello).then(function () { setState('idle'); resumeRec(); });     // first utterance unlocks speech for the session
      }
    }).catch(function () {
      setState('off');
      pillText.textContent = fromClick ? 'Microphone blocked. Allow it in the address bar, then click here.' : 'Enable voice: say "Hey Prashanth"';
    });
  }
  function disable() { stopRec(); API.stopSpeaking(); setState('off'); try { localStorage.setItem(PREF_KEY, 'off'); } catch (e) {} caption.hidden = true; }
  pill.addEventListener('click', function () { if (state === 'off') { enable(true); } else { disable(); } });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { pauseRecWhileSpeaking(); } else { resumeRec(); } });

  window.PORTFOLIO_VOICE_DEBUG = { wakeIndex: wakeIndex, afterWake: afterWake, setState: setState, showCaption: showCaption, state: function () { return state; } };
  var stored = null;
  try { stored = localStorage.getItem(PREF_KEY); } catch (e) { stored = null; }
  setState('off');
  // Browsers block sound and speech until the visitor has clicked something, so the mode starts from a click.
  // The pill does the asking; it is big and animated on the first visit so nobody misses it.
  if (SR && stored !== 'off') { pill.classList.add('heyp-pill-invite'); }
  // any first click anywhere also counts: if they already allowed the mic earlier, start listening on that click
  document.addEventListener('pointerdown', function first() {
    document.removeEventListener('pointerdown', first);
    if (state === 'off' && SR && stored === 'on') { enable(false); }
  }, true);
})();
