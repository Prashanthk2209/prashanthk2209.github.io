/* chat.js - the "Talk to me" panel for the portfolio. It opens by itself the first time a visitor scrolls.
   Typing: static answers composed in the browser from kb.js (no server, no quota). Voice chat button: a live voice
   conversation with Gemini (live.js), transcribed into the same log.
   Knowledge: window.PORTFOLIO_KB (kb.js, generated from the master resume and story). Nothing else.
   Answers are composed in the browser as first-person sentences from the matching passages (no server, no keys).
   window.PORTFOLIO_CHAT.endpoint is the Apps Script relay (chat-relay/) that hands out the Gemini Live passes. */
(function () {
  'use strict';
  var KB = window.PORTFOLIO_KB || [];
  var CFG = window.PORTFOLIO_CHAT || {};
  if (!KB.length || !document.body) { return; }

  /* ---------- text tools ---------- */
  var STOP = {};
  'a an the and or of to in on at for with by from as is are was were be been i my me you your he she it we they this that these those do does did have has had what which who whom whose how when where why can could would should will shall about tell say give show list some any much many more most very really please thanks thank familiar know ever'
    .split(' ').forEach(function (w) { STOP[w] = 1; });
  var SYN = {
    experience: ['years', 'worked', 'background', 'career', 'history'], years: ['experience', 'long'],
    email: ['contact', 'reach', 'mail'], contact: ['email', 'phone', 'reach', 'linkedin'], phone: ['contact', 'number', 'call'],
    degree: ['education', 'university', 'school', 'masters', 'bachelor'], education: ['degree', 'university', 'school', 'fiu', 'studied'],
    certification: ['certified', 'certs', 'certificate', 'aws', 'security'], certifications: ['certified', 'certs', 'certificate'],
    skills: ['stack', 'tools', 'technologies', 'languages'], stack: ['skills', 'tools', 'technologies'],
    job: ['role', 'position', 'work', 'company'], role: ['job', 'position', 'title'], current: ['present', 'now', 'today', 'latest'],
    company: ['employer', 'worked', 'role'], project: ['projects', 'built', 'side', 'jobhub'], projects: ['project', 'built', 'jobhub'],
    achievement: ['achievements', 'proud', 'impact', 'result', 'results', 'improved', 'cut'], biggest: ['achievement', 'impact', 'proud'],
    remote: ['hybrid', 'relocate', 'relocation', 'onsite', 'location'], location: ['based', 'live', 'miami', 'remote'],
    available: ['availability', 'start', 'notice', 'join'], start: ['available', 'availability', 'notice'],
    snowflake: ['warehouse'], aws: ['cloud', 'glue', 'lambda', 'step'], python: ['pyspark', 'languages', 'programming'], sql: ['database', 'queries'],
    streaming: ['kafka', 'kinesis', 'event'], ai: ['llm', 'llms', 'claude', 'genai', 'chatbot', 'mcp', 'agents', 'models'], llm: ['ai', 'claude', 'genai'], llms: ['ai', 'claude', 'genai', 'llm'],
    model: ['models', 'ai', 'llm'], models: ['ai', 'llm', 'claude'],
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
    var t = tokens(c.text + ' ' + c.role + ' ' + c.section), tf = {};
    t.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
    return { c: c, tf: tf, len: t.length };
  });
  var DF = {};
  DOCS.forEach(function (d) { Object.keys(d.tf).forEach(function (w) { DF[w] = (DF[w] || 0) + 1; }); });
  var AVG = DOCS.reduce(function (a, d) { return a + d.len; }, 0) / DOCS.length;
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
    var out = {};
    tokens(q).forEach(function (w) {
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
  var OUTCOME = /%|\d+B-row|billion|\d+ hours to \d+|from \d+ hours|450M|50\+|10-year/;
  var KIND_W = { bullet: 1.0, project: 1.0, story: 0.9, role: 0.6, fact: 0.6, skills: 0.4, goals: 0.4, availability: 0.4, contact: 0.3, years: 0.5, certs: 0.6, education: 0.6 };
  function rerank(list) {
    list.forEach(function (h) {
      h.s *= (KIND_W[h.c.kind] || 0.8);
      if (OUTCOME.test(h.c.text)) { h.s *= 2.0; } else if (/\d/.test(h.c.text) && h.c.kind !== 'skills') { h.s *= 1.15; }
    });
    list.sort(function (a, b) { return b.s - a.s; });
    return list;
  }
  function byKind(kind) { return KB.filter(function (c) { return c.kind === kind; }); }
  function dedupe(list) {
    var out = [];
    list.forEach(function (c) {
      var body = c.text.replace(/^At [^:]+: /, '');
      if (!out.some(function (o) { return similar(o.text.replace(/^At [^:]+: /, ''), body) > 0.45; })) { out.push(c); }
    });
    return out;
  }

  /* ---------- turning passages into first-person sentences ---------- */
  var COMPANY_SHORT = { 'Tech Detectives Inc.': 'Tech Detectives', 'Triangulum Insights': 'Triangulum', 'Mindtree': 'Mindtree' };
  var PRESENT = /^(Own|Write|Maintain|Manage|Monitor|Run|Support|Build|Handle|Lead|Design|Develop|Operate|Provision|Release)\b/;
  function sentence(c, withCompany) {
    var m = /^At ([^:]+): (.*)$/.exec(c.text), company = m ? (COMPANY_SHORT[m[1]] || m[1]) : '', body = m ? m[2] : c.text;
    body = body.replace(/\s+/g, ' ').trim().replace(/\.$/, '');
    var first = body.split(' ')[0], rest = body.slice(first.length);
    var verb = /^[A-Z][a-z]+$/.test(first) ? first.toLowerCase() : first;   // "Cut query time" -> "cut query time"; "SQL ..." stays
    var s = 'I ' + verb + rest;
    if (withCompany && company) { s = 'At ' + company + ' ' + s; }
    return s + '.';
  }
  function similar(a, b) {
    var ta = {}, n = 0, u = 0; tokens(a).forEach(function (w) { ta[w] = 1; });
    var tb = {}; tokens(b).forEach(function (w) { tb[w] = 1; });
    Object.keys(ta).forEach(function (w) { u++; if (tb[w]) { n++; } });
    Object.keys(tb).forEach(function (w) { if (!ta[w]) { u++; } });
    return u ? n / u : 0;
  }
  function skillsSentence(c) {
    var m = /^([^:]+): (.*)$/.exec(c.text); if (!m) { return c.text; }
    var cat = m[1], items = m[2].replace(/\.$/, '');
    var lead = /AWS/i.test(cat) ? 'On AWS I have worked with ' : /GenAI|LLM/i.test(cat) ? 'On the AI side I have built with ' : /Stream/i.test(cat) ? 'For streaming and integration I have used ' :
      /Platform|Warehous/i.test(cat) ? 'The platforms I have run are ' : /Infra|DevOps/i.test(cat) ? 'For infrastructure and delivery I use ' : /Security|Govern/i.test(cat) ? 'For security and governance I have applied ' :
      /defend/i.test(cat) ? 'Tools I can speak to in depth include ' : 'My ' + cat.toLowerCase() + ' work covers ';
    return lead + items + '.';
  }
  function joinProse(chunks, withCompany) {
    var last = '';
    return dedupe(chunks).slice(0, 2).map(function (c) {
      if (c.kind === 'skills') { return skillsSentence(c); }
      var co = companyOf(c), s = sentence(c, withCompany && co !== last); last = co; return s;
    }).join(' ');
  }
  function lowerFirst(s) { return /^I\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1); }
  function companyOf(c) { var m = /^At ([^:]+):/.exec(c.text); return m ? (COMPANY_SHORT[m[1]] || m[1]) : ''; }

  function roleSentence(r, lead) {
    // "Data Engineer at Tech Detectives Inc., Miami, FL, February 2025 – Present." -> "I'm a Data Engineer at Tech Detectives in Miami, since February 2025."
    var m = /^(.+?) at (.+?)(?:, ([^,]+, [A-Z]{2}|Remote|India))?, (\w+ \d{4}) – (\w+ \d{4}|Present)\.?$/.exec(r.text);
    if (!m) { return lead + ' ' + r.text; }
    var art = /^[aeiou]/i.test(m[1]) || /^SSIS/.test(m[1]) ? 'an' : 'a', co = COMPANY_SHORT[m[2]] || m[2];
    var where = m[3] ? (m[3] === 'Remote' ? ', fully remote' : ' in ' + m[3].replace(/, [A-Z]{2}$/, '')) : '';
    var when = m[5] === 'Present' ? ', since ' + m[4] : ', from ' + m[4] + ' to ' + m[5];
    return lead + ' ' + art + ' ' + m[1] + ' at ' + co + where + when + '.';
  }

  /* ---------- intents ---------- */
  var YESNO = /^(are|do|did|have|has|can|could|would|is|were|was)\b/i;
  var SMALLTALK = [
    { rx: /^(hello|hi|hey|hallo|good (morning|afternoon|evening)|yo|hiya)(\s+(there|prashanth|prashant))?[!.,?\s]*$/i, text: "Hi, I'm Prashanth. Ask me anything about my work, the Snowflake and AWS platforms, JobHub, or how to reach me." },
    { rx: /\b(how are you|how('s| is) it going|how are things|how do you do|what's up|whats up|how have you been)\b/i, text: "Doing well, thanks for asking. I'm a data engineer in Miami, and I'm happy to talk through anything on my resume. What would you like to know?" },
    { rx: /\b(are you there|can you hear me|you there|hear me|is this working|testing|test test|hello\?)\b/i, text: "I'm here and I can hear you. Go ahead and ask." },
    { rx: /\b(who (is this|am i (talking|speaking) (to|with))|what are you|are you (a bot|an ai|a robot|real|human))\b/i, text: "I'm a voice assistant on Prashanth Kumar Sirusala's portfolio, speaking for him from his resume and work history. Nothing I say goes beyond what is on record." },
    { rx: /\b(what can you (do|tell me|answer)|help me|how does this work|what should i ask)\b/i, text: "Ask me about my roles at Tech Detectives, Triangulum and Mindtree, the 17 billion row Snowflake work, the AWS pipelines, how I use AI, JobHub, my education and certifications, or how to contact me." },
    { rx: /\b(thank you|thanks|thank u|appreciate it|cheers)\b/i, text: "You're welcome. If you want to take this further, my email is prashanthsirusala2209@gmail.com." },
    { rx: /\b(bye|goodbye|see you|talk later|that's all|thats all|i'm done|im done|stop)\b/i, text: "Thanks for stopping by. My email and LinkedIn are at the bottom of the page whenever you're ready." },
    { rx: /\b(nice to meet you|pleasure|good to meet)\b/i, text: "Likewise. What would you like to know about my work?" }
  ];
  var INTENTS = [
    { rx: /\b(ai|llm|llms|genai|gen ai|language models?|machine learning|ml|claude|gpt|openai|agents?|chatbot|mcp)\b/i, topic: 'my AI work', run: function (q) {
        var b = KB.filter(function (c) { return c.kind === 'bullet' && /Claude|MCP|AI-assisted/.test(c.text); }).slice(0, 2);
        var p = byKind('project')[0];
        var open = YESNO.test(q) ? 'Yes, hands-on, in production rather than as a demo. ' : '';
        return open + joinProse(b, true) + ' Outside work I built JobHub, where parallel Claude browser agents fill application forms and a hiring-manager agent reviews each tailored resume. I also use Snowflake Cortex and the Claude and GPT APIs for data-quality and documentation work.' + (p ? '' : '');
      } },
    { rx: /\b(who are you|about you|introduce|yourself|what do you do|tell me about you)\b/i, topic: 'my background', run: function () {
        // A spoken pitch, not a resume readout: who, what, three results, what sets him apart. Every fact is in kb.js.
        return "I'm Prashanth, a data engineer in Miami with about five years of building data platforms on AWS and Snowflake. " +
          'At Tech Detectives, I made a 17 billion row Snowflake workload 70 to 80 percent faster, and cut an 18 hour reporting refresh down to 2 hours. ' +
          'I also put Claude into our pull request checks, so data-loss gaps get caught before release. ' +
          "And with a master's in cybersecurity, security is built into how I design pipelines.";
      } },
    { rx: /\b(how (many|much) years|years of experience|how long|experience do you have|how experienced)\b/i, run: function () { return byKind('years')[0].text; } },
    { rx: /\b(email|phone|contact|reach you|linkedin|get in touch|hire you how|talk to you)\b/i, run: function () { return byKind('contact')[0].text; } },
    { rx: /\b(available|availability|notice|when can you (start|join)|start date)\b/i, run: function () { return byKind('availability')[0].text; } },
    { rx: /\b(where (are you )?(located|based|living)|where do you live|current(ly)? (locat|based|liv)|which city|what city|where in the (us|states|country))/i, run: function () { return "I'm based in Miami, Florida. I work remote or hybrid and I'm open to relocation for the right role."; } },
    { rx: /\b(remote|hybrid|onsite|on-site|relocat\w*|work from home)\b/i, run: function () { return byKind('availability')[0].text; } },
    { rx: /\b(looking for|open to|what roles|kind of role|next role|ideal role|what are you after)\b/i, run: function () { return byKind('goals')[0].text; } },
    { rx: /certif|security\+|solutions architect/i, topic: 'my certifications', run: function () {
        var all = byKind('certs')[0].text.replace(/^Certifications: /, '').replace(/\.$/, '').split(/ and |, /);
        var held = all.filter(function (c) { return !/in progress/i.test(c); }), prog = all.filter(function (c) { return /in progress/i.test(c); }).map(function (c) { return c.replace(/\s*\(in progress\)/i, ''); });
        return 'I hold ' + held.join(' and ') + '. The security one is not decoration; it is how I approach pipeline design.' + (prog.length ? ' I am currently working toward ' + prog.join(' and ') + '.' : '');
      } },
    { rx: /\b(education|degree|university|college|school|master|bachelor|study|studied)\b/i, topic: 'my education', run: function () {
        var e = byKind('education'); return 'I have ' + e.map(function (c) { return c.text.replace(/\.$/, ''); }).join(', and before that ') + '. The master\'s is why security shows up in how I design pipelines.';
      } },
    { rx: /\b(current (role|job|company|position)|where do you work|work now|present role|right now)\b/i, topic: 'my current role at Tech Detectives', run: function () {
        var r = byKind('role')[0], b = KB.filter(function (c) { return c.kind === 'bullet' && c.role === r.role; }).slice(0, 2);
        return roleSentence(r, "I'm") + ' ' + joinProse(b, false);
      } },
    { rx: /\b(jobhub|side project|projects?|built for yourself)\b/i, topic: 'JobHub', run: function () { return byKind('project')[0].text; } },
    { rx: /\b(why (should we|hire)|strengths?|pitch|sell yourself|what makes you|stand out|best at|good at)\b/i, run: function () {
        return 'Three things. I ship measurable results: I made a 17 billion row Snowflake workload 70 to 80 percent faster, and cut an 18 hour reporting refresh to 2 hours. I bring security with me, with an M.S. in Cybersecurity, Security+ and the AWS Solutions Architect certification. And I use AI where it earns its place, from Claude-based checks in CI to the agents that run JobHub.';
      } },
    { rx: /\b(tech detectives|triangulum|mindtree)\b/i, run: function (q) {
        var name = /tech detectives/i.test(q) ? 'Tech Detectives' : /triangulum/i.test(q) ? 'Triangulum' : 'Mindtree';
        var role = KB.filter(function (c) { return c.kind === 'role' && c.role.indexOf(name) === 0; })[0];
        var bullets = KB.filter(function (c) { return c.kind === 'bullet' && c.role.indexOf(name) === 0; });
        bullets.sort(function (a, b) { return (OUTCOME.test(b.text) ? 1 : 0) - (OUTCOME.test(a.text) ? 1 : 0); });
        memory.entity = name; return (role ? roleSentence(role, name === 'Tech Detectives' ? "I'm" : 'I was') + ' ' : '') + joinProse(bullets.slice(0, 3), false);
      } }
  ];
  var OFF_LIMITS = /\b(visa|sponsor|sponsorship|h-?1b|salary|compensation|pay|rate|how much do you (make|earn)|date of birth|birthday|age|home address|ssn|social security)\b/i;
  function contactEmail() { var m = /([\w.+-]+@[\w-]+\.[\w.]+)/.exec((byKind('contact')[0] || {}).text || ''); return m ? m[1] : 'prashanthsirusala2209@gmail.com'; }

  var memory = { topic: '', entity: '' };
  var ENTITY_RX = /\b(jobhub|snowflake|redshift|aws|kafka|kinesis|dbt|airflow|terraform|glue|athena|iceberg|ssis|sql server|tableau|mindtree|triangulum|tech detectives|fiu|cybersecurity|claude|mcp|chatbot|hipaa|healthcare)\b/i;
  function remember(q, text, topic) {
    var m = ENTITY_RX.exec(q);
    memory.entity = topic || (m ? m[0] : (ENTITY_RX.exec(text) || [memory.entity])[0]) || '';
    memory.topic = q;
  }
  function resolve(q) {
    // "what is it?" / "tell me more" / "and that?" -> attach the last entity so the question stands on its own
    var content = tokens(q).filter(function (w) { return !/^(it|that|this|those|these|there|more|one|thing|mean|again|explain|elaborate|detail|details)$/.test(w); });
    if (content.length === 0 && memory.entity) { return q + ' ' + memory.entity; }
    if (/\b(it|that|this)\b/i.test(q) && content.length <= 2 && memory.entity && !ENTITY_RX.test(q)) { return q + ' ' + memory.entity; }
    return q;
  }
  function answer(q0) {
    var q = resolve(q0);
    var a = answerCore(q);
    if (!a.miss) { remember(q, a.text, a.topic); }
    return a;
  }
  function answerCore(q) {
    var hasTool = tokens(q).some(function (w) { return TOOLS[w]; });
    if (!hasTool && tokens(q).length <= 6) { for (var s = 0; s < SMALLTALK.length; s++) { if (SMALLTALK[s].rx.test(q.trim())) { return { text: SMALLTALK[s].text, refs: [], topic: memory.entity }; } } }
    if (OFF_LIMITS.test(q)) {
      return { text: "Those are things I'd rather cover directly than on a web page. Email me at " + contactEmail() + ' and I will answer the same day.', refs: [] };
    }
    for (var i = 0; i < INTENTS.length; i++) {
      if (INTENTS[i].rx.test(q)) {
        var t = INTENTS[i].run(q);
        if (t) { return { text: t, refs: [], topic: INTENTS[i].topic || '' }; }
      }
    }
    var miss = { text: "Honestly, that is not something in my work history, and I would rather say so than guess. Ask me about the Snowflake and AWS work, the pipelines I run, JobHub, my background, or how to reach me.", refs: [], miss: true };
    var unclear = { text: "I'm not sure I followed that" + (memory.entity ? '. Do you mean something about ' + memory.entity + ', or ' : '. ') + "could you put it another way?", refs: [], miss: true };
    var content = tokens(q).filter(function (w) { return !/^(it|that|this|those|these|there|more|one|thing|mean|again|look|going)$/.test(w); });
    if (content.length === 0) { return unclear; }
    var toolTerms = tokens(q).filter(function (w) { return TOOLS[w]; });
    if (toolTerms.length) {
      var holders = DOCS.filter(function (d) { return toolTerms.some(function (w) { return d.tf[w]; }); });
      if (!holders.length) { return miss; }
      var names = toolTerms.map(function (w) { return TOOLS[w]; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' and ');
      if (holders.every(function (d) { return d.c.kind === 'skills'; })) {
        return { text: 'I know ' + names + ' and can talk through it, but none of my roles had a project built around it, so I will not oversell that. If it is central to the role, ask me about it directly and I will tell you exactly how far my experience goes.', refs: [] };
      }
      var base = {};
      search(q, 40).forEach(function (h) { base[h.c.id] = h.s; });
      var ranked = rerank(holders.filter(function (d) { return d.c.kind !== 'skills'; }).map(function (d) { return { s: 1 + 0.25 * (base[d.c.id] || 0), c: d.c }; }));
      var pick = dedupe(ranked.map(function (h) { return h.c; })).slice(0, 3);
      var open = YESNO.test(q) ? 'Yes. ' : '';
      var companies = pick.map(companyOf).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
      var intro = open + (companies.length > 1 ? 'I have used ' + names + ' at ' + companies.join(' and ') + '. ' : '');
      return { text: intro + joinProse(pick, companies.length <= 1), refs: [], topic: names };
    }
    var hits = search(q, 6);
    if (!hits.length || hits[0].s < 1.2) { return (toolTerms.length || /\b(know|use|used|experience|familiar|worked)\b/i.test(q)) ? miss : unclear; }
    rerank(hits);
    var top = dedupe(hits.filter(function (h) { return h.s >= hits[0].s * 0.45; }).map(function (h) { return h.c; })).slice(0, 3);
    return { text: (YESNO.test(q) ? 'Yes. ' : '') + joinProse(top, true), refs: [] };
  }
  window.PORTFOLIO_CHAT_DEBUG = { tokens: tokens, DF: DF, search: search, answer: answer, memory: memory };

  /* ---------- optional worker ---------- */
  var turns = [];
  /* ---------- gate: decide in the browser what may use the free Gemini quota ---------- */
  // Personal and off-topic questions are refused here, before any request is made. Exact facts (contact, availability,
  // location, years, certifications, education) come from the built-in answers: exact, instant and free.
  // Only real career and interview questions go to the relay.
  var OFF_TOPIC = /\b(wife|girlfriend|boyfriend|married|marriage|dating|single|kids?|children|family|parents?|mom|dad|siblings?|religion|religious|god|caste|politic\w*|vote|election|weather|movies?|films?|songs?|music|cricket|football|soccer|nba|recipes?|cook\w*|jokes?|poems?|horoscope|zodiac|health|sick|illness|medical|weight|height|sex\w*|drugs?|alcohol|drink|bitcoin|crypto|stocks?|homework|capital of|translate|ignore (all|the|your|previous|prior)\b|system prompt|jailbreak|pretend|role ?play|hobb(y|ies)|girlfriends?|address|ssn|religion)\b|\bwrite\b.{0,40}\b(code|program|script|essay|function|story|email|letter|poem|sql query)\b|\b(leetcode|fizzbuzz|reverse a string)\b/i;
  var LOCAL_FACT = /\b(how (many|much) years|years of experience|email|phone|contact|reach you|get in touch|available|availability|notice period|start date|when can you (start|join)|located|based|where do you live|relocat\w*|remote|hybrid|onsite|on-site|certif\w*|degree|education|university|college|master'?s|bachelor'?s|who are you|about you|yourself|introduce|what do you do|why (should we|hire)|sell yourself|pitch)\b/i;   // incl. the reviewed pitch answers
  var CAREER = {};
  ('work worked working job jobs role roles career experience experienced project projects skill skills strength strengths weakness weaknesses team ' +
   'teams manager managers lead led leadership hire hiring interview challenge challenges challenging conflict failure failed fail mistake mistakes achievement ' +
   'achievements proud goal goals learn learned learning tool tools stack pipeline pipelines data engineer engineering cloud company companies client clients ' +
   'resume background deadline deadlines pressure feedback motivate motivation fit culture design architecture debug debugging problem problems decision ' +
   'impact result results built build building scale performance security ai llm model models agent agents automation stakeholder stakeholders').split(' ')
    .forEach(function (w) { CAREER[w] = 1; });
  var REJECT = "I'd rather keep this to my work. Ask me about my projects, the tools I use, or how I'd fit your team.";
  function route(q) {
    var t = q.trim();
    if (OFF_LIMITS.test(t)) { return 'local'; }                       // visa, salary, age...: the built-in redirect to email
    if (OFF_TOPIC.test(t)) { return 'reject'; }
    var words = tokens(t);
    if (words.length <= 6 && SMALLTALK.some(function (s) { return s.rx.test(t); })) { return 'local'; }
    if (LOCAL_FACT.test(t)) { return 'local'; }
    var r = tokens(resolve(t));                                       // "how did you do that?" picks up the last topic
    if (r.some(function (w) { return CAREER[w] || TOOLS[w] || (DF[w] && DF[w] <= DOCS.length * 0.3); })) { return 'remote'; }
    if (turns.length && words.length <= 4) { return 'remote'; }      // a short follow-up inside a conversation
    return 'reject';
  }
  function warmRelay() { if (CFG.endpoint) { fetch(CFG.endpoint).catch(function () {}); } }   // Apps Script cold starts take seconds

  /* ---------- UI ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var SUGGEST = ['What have you done with Snowflake?', 'Are you familiar with LLMs and AI models?', 'Why should we hire you?', 'What is JobHub?', 'How can I reach you?'];
  var MIC_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
  var root = document.createElement('div');
  root.id = 'askme';
  root.innerHTML =
    '<button id="askme-open" type="button" class="askme-fab" aria-haspopup="dialog" aria-expanded="false" aria-controls="askme-panel">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<span>Talk to me</span></button>' +
    '<section id="askme-panel" class="askme-panel card" role="dialog" aria-modal="false" aria-labelledby="askme-title" hidden>' +
      '<header class="askme-head"><h2 id="askme-title">Talk to Prashanth</h2><div class="askme-tools">' +
        '<button id="askme-close" type="button" class="icon-btn" aria-label="Close">&#x2715;</button></div></header>' +
      '<div id="askme-log" class="askme-log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div id="askme-suggest" class="askme-suggest" aria-label="Example questions"></div>' +
      '<form id="askme-form" class="askme-form" autocomplete="off">' +
        '<button id="askme-mic" type="button" class="askme-voicebtn" aria-pressed="false" title="Start a voice conversation">' + MIC_SVG + '<span>Voice chat</span></button>' +
        '<label for="askme-input" class="sr-only">Your message</label>' +
        '<input id="askme-input" type="text" maxlength="300" placeholder="Ask me anything about my work" />' +
        '<button type="submit" class="btn btn-primary !py-2 !px-3">Send</button>' +
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
    add('bot', "<p>Hi, I'm Prashanth. What would you like to know?</p>");
    suggest.innerHTML = SUGGEST.map(function (s) { return '<button type="button" class="chip">' + esc(s) + '</button>'; }).join('');
  }
  function open(auto) {
    warmRelay(); panel.hidden = false; openBtn.setAttribute('aria-expanded', 'true'); greet();
    if (!auto) { setTimeout(function () { input.focus(); }, 50); }        // opened by itself: do not pop up a phone keyboard
  }
  function close() {
    panel.hidden = true; openBtn.setAttribute('aria-expanded', 'false');
    try { sessionStorage.setItem(CLOSED_KEY, '1'); } catch (e) {}           // closed by the visitor: do not pop up again this visit
    if (window.PORTFOLIO_LIVE && window.PORTFOLIO_LIVE.active()) { window.PORTFOLIO_LIVE.stop('closed'); }
    openBtn.focus();
  }
  // Opens by itself on the first scroll of every page load, unless the visitor closed it earlier in this visit.
  var CLOSED_KEY = 'talkClosed';
  function firstScroll() {
    if (window.scrollY < 120) { return; }
    window.removeEventListener('scroll', firstScroll);
    var closed = null; try { closed = sessionStorage.getItem(CLOSED_KEY); } catch (e) {}
    if (!closed && panel.hidden) { open(true); }
  }
  window.addEventListener('scroll', firstScroll, { passive: true });
  openBtn.addEventListener('click', function () { panel.hidden ? open() : close(); });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { close(); } });
  suggest.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { ask(b.textContent); } });
  if (location.hash === '#ask') { open(); }
  document.querySelectorAll('a[href="#ask"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); open(); }); });

  function ask(q) {
    q = String(q || '').trim(); if (!q) { return Promise.resolve(''); }
    suggest.innerHTML = '';
    greet();
    add('user', '<p>' + esc(q) + '</p>');
    input.value = '';
    var local = answer(q), way = route(q);
    var el = add('bot', '<p class="askme-thinking">...</p>');
    function show(text) {
      turns.push({ role: 'user', text: q }, { role: 'bot', text: text });
      el.innerHTML = '<p>' + esc(text) + '</p>';
      log.scrollTop = log.scrollHeight;
      return text;
    }
    if (way === 'reject') { return Promise.resolve(show(REJECT)); }
    return Promise.resolve(show(local.text));          // typed chat is static: built-in answers only, no quota
  }
  window.PORTFOLIO_CHAT_API = { answer: answer, ask: ask, warmRelay: warmRelay, route: route, open: open, close: close, isOpen: function () { return !panel.hidden; } };
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value, false); });

  /* ---------- voice chat: a live conversation with Gemini (live.js), transcribed into the log ---------- */
  var liveState = 'off', userEl = null, botEl = null;
  function liveUI() {
    mic.setAttribute('aria-pressed', String(liveState !== 'off'));
    mic.querySelector('span').textContent = liveState === 'off' ? 'Voice chat' : liveState === 'connecting' ? 'Connecting...' : 'End voice chat';
    mic.classList.toggle('askme-voice-on', liveState === 'on');
  }
  function bubble(role, el, text) {
    if (!el) { el = add(role, '<p></p>'); }
    el.firstChild.textContent = text; log.scrollTop = log.scrollHeight; return el;
  }
  function voiceChat() {
    var L = window.PORTFOLIO_LIVE;
    if (liveState !== 'off') { if (L) { L.stop('ended'); } return; }
    if (!L || !L.supported()) { status.textContent = 'Voice chat needs a recent Chrome, Edge or Safari. Typing works everywhere.'; return; }
    greet(); suggest.innerHTML = '';
    liveState = 'connecting'; liveUI(); status.textContent = 'Connecting... allow the microphone if your browser asks.';
    L.prefetch().then(function (p) {
      if (!p) { throw new Error('busy'); }
      return L.start({ on: {
        user: function (t) { if (botEl) { userEl = null; botEl = null; } userEl = bubble('user', userEl, t); status.textContent = 'Listening...'; },
        bot: function (t) { botEl = bubble('bot', botEl, t); },
        turn: function (x) { if (x.user) { turns.push({ role: 'user', text: x.user }); } if (x.bot) { turns.push({ role: 'bot', text: x.bot }); } userEl = null; botEl = null; },
        speaking: function (on) { status.textContent = on ? 'Speaking... talk any time to interrupt.' : 'Listening... just talk.'; },
        end: function (why) {
          liveState = 'off'; userEl = null; botEl = null; liveUI();
          status.textContent = why === 'idle' ? 'Voice chat ended after a quiet moment. Tap Voice chat to talk again.' :
            why === 'limit' ? 'That voice chat reached its time limit. Tap Voice chat to start another.' : '';
        } } });
    }).then(function () {
      liveState = 'on'; liveUI(); status.textContent = "Listening... just talk. Say hi, or ask about my work.";
    }).catch(function () {
      liveState = 'off'; liveUI();
      status.textContent = 'Voice chat is busy right now, so please type. You will still get answers.';
    });
  }
  mic.addEventListener('click', voiceChat);
})();
