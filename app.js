/* app.js - renders index.html from window.PORTFOLIO (data.js). No frameworks. */
(function () {
  'use strict';
  var D = window.PORTFOLIO;
  if (!D) { return; }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }
  function set(id, html) { var el = $(id); if (el) { el.innerHTML = html; } }
  function text(id, value) { var el = $(id); if (el) { el.textContent = value; } }
  /* Lucide dropped brand logos, so LinkedIn and GitHub are inline SVGs. */
  var BRAND = {
    linkedin: '<path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/>',
    github: '<path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"/>'
  };
  function icon(name, cls) {
    cls = esc(cls || 'h-4 w-4');
    if (BRAND[name]) { return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' + BRAND[name] + '</svg>'; }
    return '<i data-lucide="' + esc(name) + '" class="' + cls + '" aria-hidden="true"></i>';
  }
  function chips(items, cls) {
    return items.map(function (s) { return '<li class="' + (cls || 'chip') + '">' + esc(s) + '</li>'; }).join('');
  }
  function list(items, cls) {
    return items.map(function (s) { return '<li class="' + (cls || '') + '">' + esc(s) + '</li>'; }).join('');
  }
  function mailto() {
    return 'mailto:' + D.person.email + '?subject=' + encodeURIComponent(D.contact.mailSubject || '');
  }

  /* ---------- head / meta ---------- */
  if (D.meta && D.meta.siteTitle) { document.title = D.meta.siteTitle; }

  /* ---------- brand / nav ---------- */
  text('brand-name', D.person.name);
  text('brand-initials', D.person.initials);
  ['nav-resume', 'hero-resume', 'resume-download', 'resume-view'].forEach(function (id) {
    var a = $(id); if (a) { a.setAttribute('href', D.person.resumeFile); }
  });
  var mobileResume = document.querySelector('#mobile-menu a[download]');
  if (mobileResume) { mobileResume.setAttribute('href', D.person.resumeFile); }

  /* ---------- hero ---------- */
  text('hero-eyebrow', D.person.role + ' / ' + D.person.location);
  text('hero-heading', D.person.name);
  text('hero-headline', D.person.headline);
  set('hero-intro', D.person.intro.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''));
  set('hero-skills', chips(D.person.topSkills, 'chip chip-accent'));

  var links = [];
  if (D.person.linkedin) {
    links.push('<a class="inline-flex items-center gap-1.5 font-medium hover:text-brand-700 dark:hover:text-brand-300" href="' + esc(D.person.linkedin) + '" target="_blank" rel="noopener me">' + icon('linkedin') + '<span>LinkedIn</span></a>');
  }
  if (D.person.github) {
    links.push('<a class="inline-flex items-center gap-1.5 font-medium hover:text-brand-700 dark:hover:text-brand-300" href="' + esc(D.person.github) + '" target="_blank" rel="noopener me">' + icon('github') + '<span>GitHub</span></a>');
  }
  links.push('<a class="inline-flex items-center gap-1.5 font-medium hover:text-brand-700 dark:hover:text-brand-300" href="' + esc(mailto()) + '">' + icon('mail') + '<span>' + esc(D.person.email) + '</span></a>');
  set('hero-links', links.join('<span class="text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>'));

  set('hero-facts', D.about.facts.map(function (f) {
    return '<div class="flex items-start gap-3">' +
      '<span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">' + icon(f.icon) + '</span>' +
      '<div><dt class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">' + esc(f.label) + '</dt>' +
      '<dd class="text-sm font-medium text-slate-900 dark:text-slate-100">' + esc(f.value) + '</dd></div></div>';
  }).join(''));
  set('hero-open-to', '<span class="font-semibold text-slate-900 dark:text-slate-100">Open to:</span> ' + esc(D.person.openTo));

  /* ---------- about ---------- */
  text('about-heading', D.about.heading);
  set('about-body', D.about.paragraphs.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''));

  /* ---------- skills ---------- */
  text('skills-heading', D.skills.heading);
  text('skills-intro', D.skills.intro);
  set('skills-grid', D.skills.groups.map(function (g, i) {
    /* 7 groups in a 3-column grid: widen the 1st and 6th so no card sits alone. */
    var span = (i === 0 || i === 5) ? ' lg:col-span-2' : '';
    return '<article class="card reveal p-5' + span + '" style="transition-delay:' + (i % 3) * 0.08 + 's">' +
      '<h3 class="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">' +
      '<span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">' + icon(g.icon) + '</span>' + esc(g.name) + '</h3>' +
      '<ul class="mt-4 flex flex-wrap gap-2" aria-label="' + esc(g.name) + ' skills">' + chips(g.items) + '</ul></article>';
  }).join(''));

  /* ---------- projects ---------- */
  text('projects-heading', D.projects.heading);
  text('projects-intro', D.projects.intro);
  function caseStep(title, body) {
    var inner = Array.isArray(body)
      ? '<ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">' + list(body) + '</ul>'
      : '<p class="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">' + esc(body) + '</p>';
    return '<div class="case-step"><h4>' + esc(title) + '</h4>' + inner + '</div>';
  }
  set('projects-grid', D.projects.items.map(function (p, i) {
    var cs = p.caseStudy || {};
    var linkBits = [];
    if (p.links && p.links.live) { linkBits.push('<a class="btn btn-secondary !py-1.5 !px-3 text-sm" href="' + esc(p.links.live) + '" target="_blank" rel="noopener">' + icon('external-link') + '<span>Live</span></a>'); }
    if (p.links && p.links.repo) { linkBits.push('<a class="btn btn-secondary !py-1.5 !px-3 text-sm" href="' + esc(p.links.repo) + '" target="_blank" rel="noopener">' + icon('github') + '<span>Code</span></a>'); }
    if (p.links && p.links.note) { linkBits.push('<span class="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">' + icon('lock') + esc(p.links.note) + '</span>'); }
    var metrics = (p.metrics || []).map(function (m) {
      return '<div><div class="metric-value">' + esc(m.value) + '</div><div class="text-xs text-slate-600 dark:text-slate-400">' + esc(m.label) + '</div></div>';
    }).join('');
    return '<article class="card reveal flex flex-col p-6' + (p.featured && i === 0 ? ' lg:col-span-2' : '') + '" id="project-' + esc(p.id) + '" aria-labelledby="project-' + esc(p.id) + '-title">' +
      '<div class="flex items-start justify-between gap-4">' +
      '<h3 id="project-' + esc(p.id) + '-title" class="text-xl font-bold leading-snug text-slate-900 dark:text-white">' + esc(p.title) + '</h3>' +
      (i === 0 ? '<span class="chip chip-accent shrink-0 !text-xs">Flagship</span>' : '') +
      '</div>' +
      '<p class="mt-2 text-slate-600 dark:text-slate-400">' + esc(p.tagline) + '</p>' +
      (metrics ? '<div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">' + metrics + '</div>' : '') +
      '<ul class="mt-5 flex flex-wrap gap-1.5" aria-label="Technologies">' + chips(p.tags, 'tag') + '</ul>' +
      (linkBits.length ? '<div class="mt-4 flex flex-wrap items-center gap-3">' + linkBits.join('') + '</div>' : '') +
      '<details class="case mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">' +
      '<summary class="flex items-center justify-between gap-2 rounded-md font-semibold text-brand-700 dark:text-brand-300"><span>Read the case study</span>' + icon('chevron-down', 'chev h-4 w-4') + '</summary>' +
      '<div class="mt-4 space-y-5">' +
      (cs.problem ? caseStep('Problem', cs.problem) : '') +
      (cs.approach ? caseStep('Approach', cs.approach) : '') +
      (cs.implementation ? caseStep('Implementation', cs.implementation) : '') +
      (cs.results ? caseStep('Results', cs.results) : '') +
      (cs.learnings ? caseStep('Key learnings', cs.learnings) : '') +
      '</div></details></article>';
  }).join(''));

  /* ---------- experience ---------- */
  text('experience-heading', D.experience.heading);
  text('experience-intro', D.experience.intro);
  set('experience-list', D.experience.roles.map(function (r, i) {
    var when = esc(r.start) + ' to ' + esc(r.end);
    var where = [r.company, r.location].filter(Boolean).map(esc).join(', ');
    var bullets = r.bullets || [];
    var shown = bullets.slice(0, 4), more = bullets.slice(4);
    var moreHtml = more.length
      ? '<details class="case mt-2"><summary class="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-brand-700 dark:text-brand-300"><span>' + more.length + ' more</span>' + icon('chevron-down', 'chev h-4 w-4') + '</summary>' +
        '<ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">' + list(more) + '</ul></details>'
      : '';
    return '<li class="timeline-item reveal" style="transition-delay:' + (i * 0.06) + 's">' +
      '<span class="timeline-dot" aria-hidden="true"></span>' +
      '<div class="timeline-when"><time class="eyebrow block">' + when + '</time></div>' +
      '<div class="card p-5 sm:p-6">' +
      '<h3 class="text-lg font-bold text-slate-900 dark:text-white">' + esc(r.title) + ' <span class="font-medium text-slate-500 dark:text-slate-400">at</span> ' + where + '</h3>' +
      (r.summary ? '<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">' + esc(r.summary) + '</p>' : '') +
      '<ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">' + list(shown) + '</ul>' +
      moreHtml +
      (r.stack && r.stack.length ? '<ul class="mt-4 flex flex-wrap gap-1.5" aria-label="Stack">' + chips(r.stack, 'tag') + '</ul>' : '') +
      '</div></li>';
  }).join(''));

  /* ---------- education & certifications ---------- */
  text('education-heading', D.education.heading);
  set('education-list', D.education.degrees.map(function (e) {
    var when = [e.start, e.end].filter(Boolean).join(' to ');
    return '<li class="card reveal p-5"><h4 class="font-semibold text-slate-900 dark:text-white">' + esc(e.degree) + '</h4>' +
      '<p class="text-sm text-slate-700 dark:text-slate-300">' + esc(e.school) + (e.location ? ', ' + esc(e.location) : '') + '</p>' +
      (when ? '<p class="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">' + esc(when) + '</p>' : '') + '</li>';
  }).join(''));
  set('certification-list', D.education.certifications.map(function (c) {
    return '<li class="card reveal flex items-center gap-4 p-5">' +
      '<span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">' + icon(c.icon, 'h-5 w-5') + '</span>' +
      '<div><h4 class="font-semibold text-slate-900 dark:text-white">' + esc(c.name) + '</h4><p class="text-sm text-slate-600 dark:text-slate-400">' + esc(c.issuer) + '</p></div></li>';
  }).join(''));

  /* ---------- achievements ---------- */
  text('achievements-heading', D.achievements.heading);
  text('achievements-intro', D.achievements.intro);
  var certTiles = D.education.certifications.map(function (c) {
    return '<li class="card reveal p-5"><div class="flex items-center gap-3">' +
      '<span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">' + icon(c.icon, 'h-5 w-5') + '</span>' +
      '<div><p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Certification</p>' +
      '<p class="font-semibold text-slate-900 dark:text-white">' + esc(c.name) + '</p></div></div></li>';
  });
  var resultTiles = D.achievements.results.map(function (r) {
    return '<li class="card reveal p-5"><div class="flex items-start justify-between gap-3">' +
      '<div><p class="stat-value">' + esc(r.value) + '</p><p class="mt-2 text-sm leading-snug text-slate-600 dark:text-slate-400">' + esc(r.label) + '</p></div>' +
      '<span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">' + icon(r.icon, 'h-5 w-5') + '</span>' +
      '</div></li>';
  });
  set('achievements-grid', resultTiles.concat(certTiles).join(''));

  /* ---------- contact ---------- */
  text('contact-heading', D.contact.heading);
  text('contact-intro', D.contact.intro);
  var cta = ['<a class="btn btn-primary" href="' + esc(mailto()) + '">' + icon('mail') + '<span>Email me</span></a>'];
  if (D.person.linkedin) { cta.push('<a class="btn btn-secondary" href="' + esc(D.person.linkedin) + '" target="_blank" rel="noopener">' + icon('linkedin') + '<span>Connect on LinkedIn</span></a>'); }
  cta.push('<button type="button" id="copy-email" class="btn btn-ghost" aria-label="Copy email address to clipboard">' + icon('copy') + '<span>Copy email</span></button>');
  set('contact-cta', cta.join(''));
  var copyBtn = $('copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var label = copyBtn.querySelector('span');
      function done(ok) {
        label.textContent = ok ? 'Copied' : 'Copy failed';
        setTimeout(function () { label.textContent = 'Copy email'; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(D.person.email).then(function () { done(true); }, function () { done(false); });
      } else {
        try {
          var ta = document.createElement('textarea'); ta.value = D.person.email; ta.setAttribute('readonly', '');
          ta.style.position = 'absolute'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select();
          var ok = document.execCommand('copy'); document.body.removeChild(ta); done(ok);
        } catch (e) { done(false); }
      }
    });
  }
  var rows = [
    { icon: 'mail', label: 'Email', value: D.person.email, href: mailto() },
    { icon: 'phone', label: 'Phone', value: D.person.phone, href: D.person.phoneHref },
    { icon: 'linkedin', label: 'LinkedIn', value: D.person.linkedin.replace(/^https?:\/\/(www\.)?/, ''), href: D.person.linkedin, external: true },
    { icon: 'map-pin', label: 'Location', value: D.person.location + '. ' + D.person.workMode + '.' }
  ];
  if (D.person.github) { rows.splice(3, 0, { icon: 'github', label: 'GitHub', value: D.person.github.replace(/^https?:\/\/(www\.)?/, ''), href: D.person.github, external: true }); }
  set('contact-list', rows.map(function (r) {
    var v = r.href
      ? '<a class="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-white break-all" href="' + esc(r.href) + '"' + (r.external ? ' target="_blank" rel="noopener"' : '') + '>' + esc(r.value) + '</a>'
      : '<span class="font-medium text-slate-900 dark:text-white">' + esc(r.value) + '</span>';
    return '<li class="card flex items-center gap-4 p-4">' +
      '<span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">' + icon(r.icon, 'h-5 w-5') + '</span>' +
      '<div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">' + esc(r.label) + '</p>' + v + '</div></li>';
  }).join(''));

  /* ---------- footer ---------- */
  text('footer-copy', '© ' + new Date().getFullYear() + ' ' + D.person.name + '. ' + D.person.location + '.');
  text('footer-note', D.footer.note);

  /* ---------- theme toggle ---------- */
  var root = document.documentElement;
  var toggle = $('theme-toggle');
  function syncToggle() {
    var dark = root.classList.contains('dark');
    if (!toggle) { return; }
    toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var dark = !root.classList.contains('dark');
      root.classList.toggle('dark', dark);
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) { /* storage unavailable */ }
      syncToggle();
    });
  }
  syncToggle();
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      var stored = null;
      try { stored = localStorage.getItem('theme'); } catch (err) { stored = null; }
      if (!stored) { root.classList.toggle('dark', e.matches); syncToggle(); }
    });
  } catch (e) { /* older browsers */ }

  /* ---------- mobile menu ---------- */
  var menuBtn = $('menu-toggle'), menu = $('mobile-menu');
  function closeMenu() {
    if (!menu) { return; }
    menu.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var open = menu.classList.toggle('hidden') === false;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) { closeMenu(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); } });
  }

  /* ---------- active nav section ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link[href^="#"]'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var current = null;
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { current = en.target.id; } });
      navLinks.forEach(function (a) {
        if (a.getAttribute('href') === '#' + current) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach(function (el) {
      // anything already in the first viewport shows at once; the observer handles the rest
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) { el.classList.add('is-visible'); } else { obs.observe(el); }
    });
    // safety net: nothing stays hidden for more than ~1.5 s, whatever the observer does (crawlers, print, slow devices)
    setTimeout(function () { reveals.forEach(function (el) { el.classList.add('is-visible'); }); }, 1500);
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- icons ---------- */
  function drawIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') { window.lucide.createIcons(); return true; }
    return false;
  }
  if (!drawIcons()) {
    var tries = 0;
    var t = setInterval(function () { if (drawIcons() || ++tries > 50) { clearInterval(t); } }, 100);
  }
})();
