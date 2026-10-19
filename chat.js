/* chat.js - "Ask me" box for the portfolio.
   Answers come ONLY from window.PORTFOLIO_KB (kb.js, generated from the master resume and story).
   Retrieval runs in the browser (no server, no keys, no cost). Voice input uses Whisper (open source) in the
   browser through transformers.js; if that cannot load, the browser's own speech recognition is offered.
   Optional: set window.PORTFOLIO_CHAT.endpoint to a Cloudflare Worker (see chat-worker/) and the same
   retrieved passages are sent to an open model there to phrase the answer; the local answer is the fallback. */
(function () {
  'use strict';
  var KB = window.PORTFOLIO_KB || [];
  var CFG = window.PORTFOLIO_CHAT || {};
  if (!KB.length || !document.body) { return; }

  /* ---------- tiny text tools ---------- */
  var STOP = {};
  'a an the and or of to in on at for with by from as is are was were be been i my me you your he she it we they this that these those do does did have has had what which who whom whose how when where why can could would should will shall about tell say give show list some any much many more most very really please thanks thank'
    .split(' ').forEach(function (w) { STOP[w] = 1; });
  var SYN = {
    experience: ['years', 'worked', 'background', 'career', 'history'], years: ['experience', 'long'],
    email: ['contact', 'reach', 'mail'], contact: ['email', 'phone', 'reach', 'linkedin'], phone: ['contact', 'number', 'call'],
    degree: ['education', 'university', 'school', 'masters', 'bachelor'], education: ['degree', 'university', 'school', 'fiu', 'studied'],
    certification: ['certified', 'certs', 'certificate', 'aws', 'security'], certifications: ['certified', 'certs', 'certificate'],
    skills: ['stack', 'tools', 'technologies', 'know', 'languages'], stack: ['skills', 'tools', 'technologies'],
    job: ['role', 'position', 'work', 'company'], role: ['job', 'position', 'title'], current: ['present', 'now', 'today', 'latest'],
    company: ['employer', 'worked', 'role'], project: ['projects', 'built', 'side', 'jobhub'], projects: ['project', 'built', 'jobhub'],
    achievement: ['achievements', 'proud', 'impact', 'result', 'results', 'improved', 'cut'], biggest: ['achievement', 'impact', 'proud'],
    remote: ['hybrid', 'relocate', 'relocation', 'onsite', 'location', 'where'], location: ['based', 'live', 'miami', 'remote', 'where'],
    available: ['availability', 'start', 'notice', 'join'], start: ['available', 'availability', 'notice'],
    snowflake: ['warehouse'], aws: ['cloud', 'glue', 'lambda', 'step'], python: ['pyspark', 'languages', 'programming'], sql: ['database', 'queries'],
    streaming: ['kafka', 'kinesis', 'event'], ai: ['llm', 'claude', 'genai', 'chatbot', 'mcp', 'agents'], llm: ['ai', 'claude', 'genai'],
    healthcare: ['hipaa', 'phi', 'mindtree'], security: ['cybersecurity', 'hipaa', 'iam', 'kms', 'rbac', 'masking'],
    performance: ['faster', 'optimized', 'query', 'bottleneck', 'slow'], migration: ['modernized', 'legacy', 'ssis', 'iceberg'],
    pipeline: ['pipelines', 'etl', 'glue', 'airflow', 'dbt'], etl: ['pipeline', 'ssis', 'glue', 'dbt']
  };
  function tokens(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9+#./ -]/g, ' ').split(/[\s/]+/)
      .map(function (w) { return w.replace(/^[.-]+|[.-]+$/g, ''); })
      .filter(function (w) { return w && !STOP[w]; })
      .map(function (w) { return w.length > 4 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w; });
  }
  var DOCS = KB.map(function (c) {
    var t = tokens(c.text + ' ' + c.role + ' ' + c.section);
    var tf = {};
    t.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
    return { c: c, tf: tf, len: t.length };
  });
  var DF = {};
  DOCS.forEach(function (d) { Object.keys(d.tf).forEach(function (w) { DF[w] = (DF[w] || 0) + 1; }); });
  var AVG = DOCS.reduce(function (a, d) { return a + d.len; }, 0) / DOCS.length;
  // Tool names = every token on the skills lists, minus generic words. Maps token -> display name.
  var GENERIC = {};
  'data pipeline pipelines engineering modeling model models check checks quality access monitoring integration platform platforms warehousing warehouse cloud security governance analytics streaming batch event driven incremental patterns ingestion api apis rest saas handling masking lineage freshness functions encryption least privilege control controls catalog server servers window skill skills defend interview can and with for the of in'
    .split(' ').forEach(function (w) { GENERIC[w] = 1; });
  var TOOLS = {};
  KB.filter(function (c) { return c.kind === 'skills'; }).forEach(function (c) {
    c.text.split(/[:,]/).slice(1).forEach(function (item) {
      var name = item.replace(/\(.*?\)/g, '').trim(); if (!name) { return; }
      tokens(name).forEach(function (w) { if (w.length >= 3 && !GENERIC[w] && !/^\d+$/.test(w)) { TOOLS[w] = TOOLS[w] || name; } });
    });
  });
  function expand(q) {
    var base = tokens(q), out = {};
    base.forEach(function (w) {
      out[w] = Math.max(out[w] || 0, 1);
      (SYN[w] || []).forEach(function (s) { out[s] = Math.max(out[s] || 0, 0.55); });
    });
    return out;
  }
  function search(q, k) {
    var terms = expand(q), scored = [];
    DOCS.forEach(function (d) {
      var s = 0;
      Object.keys(terms).forEach(function (w) {
        var f = d.tf[w]; if (!f) { return; }
        var idf = Math.log(1 + (DOCS.length - (DF[w] || 0) + 0.5) / ((DF[w] || 0) + 0.5));
        s += terms[w] * idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * d.len / AVG));
      });
      if (s > 0) { scored.push({ s: s, c: d.c }); }
    });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, k || 4);
  }

  /* ---------- intents: crisp first sentence for the common questions ---------- */
  function byKind(kind) { return KB.filter(function (c) { return c.kind === kind; }); }
  var INTENTS = [
    { rx: /\b(who are you|about you|introduce|yourself|what do you do)\b/i, kind: 'profile', pick: function () { return byKind('fact').slice(0, 1).concat(byKind('years')); } },
    { rx: /\b(how (many|much) years|years of experience|how long|experience do you have)\b/i, pick: function () { return byKind('years'); } },
    { rx: /\b(email|phone|contact|reach you|linkedin|get in touch)\b/i, pick: function () { return byKind('contact'); } },
    { rx: /\b(available|availability|notice|when can you (start|join)|start date)\b/i, pick: function () { return byKind('availability'); } },
    { rx: /\b(remote|hybrid|onsite|on-site|relocat|where (are you|do you live)|based)\b/i, pick: function () { return byKind('availability').concat(byKind('fact').slice(0, 1)); } },
    { rx: /\b(looking for|open to|what roles|kind of role|next role|ideal role)\b/i, pick: function () { return byKind('goals'); } },
    { rx: /\b(certif|certified|security\+|solutions architect)\b/i, pick: function () { return byKind('certs'); } },
    { rx: /\b(which|what|list) (aws|cloud) (services|tools|products)\b/i, pick: function () { return KB.filter(function (c) { return c.kind === 'skills' && /^AWS/.test(c.text); }).slice(0, 1); } },
    { rx: /\b(education|degree|university|college|school|master|bachelor|study|studied)\b/i, pick: function () { return byKind('education'); } },
    { rx: /\b(current (role|job|company|position)|where do you work|work now|present role)\b/i, pick: function () { return KB.filter(function (c) { return c.kind === 'role'; }).slice(0, 1); } },
    { rx: /\b(jobhub|side project|projects?)\b/i, pick: function () { return byKind('project'); } },
    { rx: /\b(why (should we|hire)|strengths?|pitch|sell yourself|what makes you|stand out|best at)\b/i, pick: function () {
        var hero = KB.filter(function (c) { return /17B|18 hours/.test(c.text) && c.kind === 'bullet'; }).slice(0, 2);
        return byKind('fact').slice(0, 1).concat(hero, byKind('certs'));
      } },
    { rx: /\b(tech detectives|triangulum|mindtree)\b/i, pick: function (q) {
        var name = /tech detectives/i.test(q) ? 'Tech Detectives' : /triangulum/i.test(q) ? 'Triangulum' : 'Mindtree';
        var role = KB.filter(function (c) { return c.kind === 'role' && c.role.indexOf(name) === 0; }).slice(0, 1);
        var bullets = KB.filter(function (c) { return c.kind === 'bullet' && c.role.indexOf(name) === 0; });
        bullets.sort(function (a, b) { return (/\d/.test(b.text) ? 1 : 0) - (/\d/.test(a.text) ? 1 : 0); });
        return role.concat(bullets.slice(0, 2));
      } }
  ];
  var OFF_LIMITS = /\b(visa|sponsor|sponsorship|h-?1b|salary|compensation|pay|rate|how much do you (make|earn)|date of birth|birthday|age|home address|ssn|social security)\b/i;

  function answer(q) {
    if (OFF_LIMITS.test(q)) {
      return { text: 'I keep work authorization and compensation for a direct conversation. Email me at ' + contact().email + ' and I will answer quickly.', refs: [] };
    }
    for (var i = 0; i < INTENTS.length; i++) {
      if (INTENTS[i].rx.test(q)) {
        var picked = INTENTS[i].pick(q);
        if (picked.length) {
          var extra = search(q, 3).filter(function (r) { return picked.indexOf(r.c) < 0 && r.s > 1.5; }).slice(0, 2);
          return { text: picked.map(function (c) { return c.text; }).join(' '), refs: extra.map(function (r) { return r.c; }) };
        }
      }
    }
    var miss = { text: "That is not in my resume or story, so I will not guess. Ask me about my roles, the Snowflake and AWS work, skills, education, certifications, JobHub, or how to contact me.", refs: [], miss: true };
    var OUTCOME = /%|\d+B-row|billion|\d+ hours to \d+|from \d+ hours|450M|50\+|10-year/;
    var KIND_W = { bullet: 1.0, project: 1.0, story: 0.9, role: 0.6, fact: 0.6, skills: 0.4, goals: 0.4, availability: 0.4, contact: 0.3, years: 0.5, certs: 0.6, education: 0.6 };
    function rerank(list) {
      list.forEach(function (h) {
        h.s *= (KIND_W[h.c.kind] || 0.8);
        if (OUTCOME.test(h.c.text)) { h.s *= 2.0; }                 // measured outcomes first
        else if (/\d/.test(h.c.text) && h.c.kind !== 'skills') { h.s *= 1.15; }
      });
      list.sort(function (a, b) { return b.s - a.s; });
      return list;
    }
    // A question that names a tool (anything on the skills lists) is answered only from passages that mention
    // that tool. "Kubernetes in production" is then never answered with a passage that merely says "production".
    var toolTerms = tokens(q).filter(function (w) { return TOOLS[w]; });
    if (toolTerms.length) {
      var holders = DOCS.filter(function (d) { return toolTerms.some(function (w) { return d.tf[w]; }); });
      if (!holders.length) { return miss; }
      if (holders.every(function (d) { return d.c.kind === 'skills'; })) {
        var names = toolTerms.map(function (w) { return TOOLS[w]; }).join(' or ');
        return { text: holders[0].c.text + ' My story does not describe a project built around ' + names + ' specifically, so ask me about it directly if that matters for the role.', refs: [] };
      }
      var base = {};
      search(q, 40).forEach(function (h) { base[h.c.id] = h.s; });
      // keyword score matters less than the kind of passage here: the tool is already guaranteed to be present
      var ranked = rerank(holders.map(function (d) { return { s: 1 + 0.25 * (base[d.c.id] || 0), c: d.c }; }));
      return { text: ranked[0].c.text, refs: ranked.slice(1, 3).map(function (h) { return h.c; }) };
    }
    var hits = search(q, 6);
    if (!hits.length || hits[0].s < 1.2) { return miss; }
    rerank(hits);
    var top = hits.filter(function (h) { return h.s >= hits[0].s * 0.45; }).slice(0, 3);
    return { text: top[0].c.text, refs: top.slice(1).map(function (h) { return h.c; }) };
  }
  window.PORTFOLIO_CHAT_DEBUG = { tokens: tokens, DF: DF, search: search, answer: answer };   // for tests only
  function contact() {
    var c = byKind('contact')[0] || { text: '' };
    var m = /([\w.+-]+@[\w-]+\.[\w.]+)/.exec(c.text);
    return { email: m ? m[1] : 'prashanthsirusala2209@gmail.com' };
  }

  /* ---------- optional worker (open model phrases the answer from the same passages) ---------- */
  function remoteAnswer(q, local) {
    if (!CFG.endpoint) { return Promise.reject(new Error('no endpoint')); }
    var ctx = [local.text].concat(local.refs.map(function (c) { return c.text; })).concat(search(q, 6).map(function (h) { return h.c.text; }));
    var seen = {}, passages = ctx.filter(function (t) { if (seen[t]) { return false; } seen[t] = 1; return true; }).slice(0, 8);
    var ctrl = new AbortController(); setTimeout(function () { ctrl.abort(); }, 12000);
    return fetch(CFG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, passages: passages }), signal: ctrl.signal })
      .then(function (r) { if (!r.ok) { throw new Error('worker ' + r.status); } return r.json(); })
      .then(function (d) { if (!d || !d.answer) { throw new Error('empty'); } return String(d.answer).slice(0, 1200); });
  }

  /* ---------- UI ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var SUGGEST = ['What did you do with Snowflake?', 'How many years of experience do you have?', 'What is JobHub?', 'Which AWS services have you used?', 'What certifications do you hold?', 'How can I contact you?'];
  var root = document.createElement('div');
  root.id = 'askme';
  root.innerHTML =
    '<button id="askme-open" type="button" class="askme-fab" aria-haspopup="dialog" aria-expanded="false" aria-controls="askme-panel">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<span>Ask me</span></button>' +
    '<section id="askme-panel" class="askme-panel card" role="dialog" aria-modal="false" aria-labelledby="askme-title" hidden>' +
      '<header class="askme-head"><div><h2 id="askme-title">Ask me about my work</h2>' +
        '<p>Answers come only from my resume and story. Type, or hold the mic and talk.</p></div>' +
        '<button id="askme-close" type="button" class="icon-btn" aria-label="Close">&#x2715;</button></header>' +
      '<div id="askme-log" class="askme-log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div id="askme-suggest" class="askme-suggest" aria-label="Example questions"></div>' +
      '<form id="askme-form" class="askme-form" autocomplete="off">' +
        '<label for="askme-input" class="sr-only">Your question</label>' +
        '<input id="askme-input" type="text" maxlength="300" placeholder="Ask about Snowflake, AWS, JobHub, education..." />' +
        '<button id="askme-mic" type="button" class="icon-btn" aria-label="Hold to talk" aria-pressed="false" title="Hold to talk (Whisper, runs in your browser)">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></button>' +
        '<button type="submit" class="btn btn-primary !py-2 !px-3">Ask</button>' +
      '</form>' +
      '<p id="askme-status" class="askme-status" aria-live="polite"></p>' +
    '</section>';
  document.body.appendChild(root);
  var openBtn = document.getElementById('askme-open'), panel = document.getElementById('askme-panel'), closeBtn = document.getElementById('askme-close');
  var log = document.getElementById('askme-log'), form = document.getElementById('askme-form'), input = document.getElementById('askme-input');
  var mic = document.getElementById('askme-mic'), status = document.getElementById('askme-status'), suggest = document.getElementById('askme-suggest');

  function add(role, html) {
    var el = document.createElement('div'); el.className = 'askme-msg askme-' + role; el.innerHTML = html;
    log.appendChild(el); log.scrollTop = log.scrollHeight; return el;
  }
  function greet() {
    if (log.children.length) { return; }
    add('bot', '<p>Hi, I am Prashanth. Ask me anything that is on my resume or in my story: the 17B-row Snowflake work, the AWS platforms, JobHub, my education, or how to reach me.</p>');
    suggest.innerHTML = SUGGEST.map(function (s) { return '<button type="button" class="chip">' + esc(s) + '</button>'; }).join('');
  }
  function open() { panel.hidden = false; openBtn.setAttribute('aria-expanded', 'true'); greet(); setTimeout(function () { input.focus(); }, 50); }
  function close() { panel.hidden = true; openBtn.setAttribute('aria-expanded', 'false'); openBtn.focus(); }
  openBtn.addEventListener('click', function () { panel.hidden ? open() : close(); });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { close(); } });
  suggest.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { input.value = b.textContent; form.requestSubmit ? form.requestSubmit() : ask(b.textContent); } });
  if (location.hash === '#ask') { open(); }
  document.querySelectorAll('a[href="#ask"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); open(); }); });

  function render(a, q) {
    var html = '<p>' + esc(a.text) + '</p>';
    if (a.refs && a.refs.length) { html += '<details><summary>More from my story</summary><ul>' + a.refs.map(function (c) { return '<li>' + esc(c.text) + '</li>'; }).join('') + '</ul></details>'; }
    return html;
  }
  function ask(q) {
    q = String(q || '').trim(); if (!q) { return; }
    suggest.innerHTML = '';
    add('user', '<p>' + esc(q) + '</p>');
    input.value = '';
    var local = answer(q);
    var el = add('bot', '<p class="askme-thinking">Looking through my story...</p>');
    remoteAnswer(q, local).then(function (text) {
      el.innerHTML = '<p>' + esc(text) + '</p>' + (local.refs.length ? '<details><summary>From my story</summary><ul>' + local.refs.map(function (c) { return '<li>' + esc(c.text) + '</li>'; }).join('') + '</ul></details>' : '');
    }).catch(function () { el.innerHTML = render(local, q); });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });

  /* ---------- voice: Whisper in the browser (open source), browser speech API as the fallback ---------- */
  var asr = null, asrLoading = null, rec = null, chunks = [], stream = null;
  var MODEL = CFG.whisperModel || 'Xenova/whisper-tiny.en';
  function loadWhisper() {
    if (asr) { return Promise.resolve(asr); }
    if (asrLoading) { return asrLoading; }
    status.textContent = 'Loading the speech model (one time, about 40 MB)...';
    asrLoading = import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js').then(function (T) {
      T.env.allowLocalModels = false;
      return T.pipeline('automatic-speech-recognition', MODEL, {
        progress_callback: function (p) { if (p && p.status === 'progress' && p.file && /onnx/.test(p.file)) { status.textContent = 'Loading the speech model... ' + Math.round(p.progress || 0) + '%'; } }
      });
    }).then(function (p) { asr = p; status.textContent = ''; return p; })
      .catch(function (err) { asrLoading = null; status.textContent = 'Could not load Whisper here; using the browser speech recognizer if it has one.'; throw err; });
  }
  function toPCM16k(blob) {
    return blob.arrayBuffer().then(function (buf) {
      var AC = window.AudioContext || window.webkitAudioContext; var ac = new AC();
      return ac.decodeAudioData(buf).then(function (audio) {
        var frames = Math.ceil(audio.duration * 16000);
        var off = new OfflineAudioContext(1, frames, 16000);
        var src = off.createBufferSource(); src.buffer = audio; src.connect(off.destination); src.start();
        return off.startRendering();
      }).then(function (rendered) { try { ac.close(); } catch (e) {} return rendered.getChannelData(0); });
    });
  }
  function browserSpeech() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { status.textContent = 'No speech recognition is available in this browser. Please type your question.'; return; }
    var r = new SR(); r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1;
    status.textContent = 'Listening (browser recognizer)...';
    r.onresult = function (e) { var t = e.results[0][0].transcript; input.value = t; status.textContent = ''; ask(t); };
    r.onerror = function () { status.textContent = 'Did not catch that. Try again or type.'; };
    r.onend = function () { mic.setAttribute('aria-pressed', 'false'); };
    r.start();
  }
  function startRec() {
    if (rec) { return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { browserSpeech(); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
      stream = s; chunks = []; rec = new MediaRecorder(s);
      rec.ondataavailable = function (e) { if (e.data && e.data.size) { chunks.push(e.data); } };
      rec.onstop = function () {
        var blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); rec = null;
        s.getTracks().forEach(function (t) { t.stop(); });
        if (blob.size < 2000) { status.textContent = 'Too short. Hold the mic while you speak.'; return; }
        status.textContent = 'Transcribing...';
        loadWhisper().then(function (p) { return toPCM16k(blob).then(function (pcm) { return p(pcm); }); })
          .then(function (out) { var t = (out && out.text || '').trim(); status.textContent = ''; if (!t) { status.textContent = 'Did not catch that. Try again or type.'; return; } input.value = t; ask(t); })
          .catch(function () { browserSpeech(); });
      };
      rec.start(); mic.setAttribute('aria-pressed', 'true'); status.textContent = 'Listening... release to send.';
      loadWhisper().catch(function () {});
    }).catch(function () { status.textContent = 'Microphone access was refused, so please type your question.'; });
  }
  function stopRec() { if (rec && rec.state === 'recording') { rec.stop(); } mic.setAttribute('aria-pressed', 'false'); }
  mic.addEventListener('pointerdown', function (e) { e.preventDefault(); startRec(); });
  mic.addEventListener('pointerup', stopRec);
  mic.addEventListener('pointerleave', stopRec);
  mic.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (rec) { stopRec(); } else { startRec(); } } });
})();
