/**
 * docs.js — Comportamiento de la página de documentación de LAVO.
 *
 *  - Sidebar: grupos desplegables, sección activa (scrollspy) y drawer en móvil.
 *  - TOC derecho: subtítulos (h3) de la sección actual.
 *  - Barra de progreso de lectura y botón "volver al inicio".
 *  - Bloques de código: botón copiar y resaltado simple.
 *  - Lightbox para las imágenes de Resultados.
 */
(function () {
  'use strict';

  var sidebar   = document.getElementById('sidebar');
  var scrim     = document.getElementById('scrim');
  var toggleBtn = document.getElementById('menu-toggle');
  var closeBtn  = document.getElementById('sidebar-close');
  var nav       = document.getElementById('doc-nav');
  var sections  = Array.prototype.slice.call(document.querySelectorAll('.doc-section[id]'));
  var navLinks  = Array.prototype.slice.call(nav.querySelectorAll('.nav-sub a'));
  var groups    = Array.prototype.slice.call(nav.querySelectorAll('.nav-group'));
  var mobileMQ  = window.matchMedia('(max-width: 960px)');

  // ── Drawer (móvil / tablet) ─────────────────────────────────
  function openDrawer() {
    sidebar.classList.add('is-open');
    scrim.classList.add('is-visible');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
  }
  function closeDrawer() {
    sidebar.classList.remove('is-open');
    scrim.classList.remove('is-visible');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  }
  toggleBtn.addEventListener('click', function () {
    sidebar.classList.contains('is-open') ? closeDrawer() : openDrawer();
  });
  closeBtn.addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  sidebar.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="#"]') && mobileMQ.matches) closeDrawer();
  });
  mobileMQ.addEventListener('change', function (e) { if (!e.matches) closeDrawer(); });

  // ── Grupos desplegables ─────────────────────────────────────
  function setGroupOpen(group, open) {
    group.classList.toggle('is-open', open);
    group.querySelector('.nav-group-btn').setAttribute('aria-expanded', String(open));
  }
  groups.forEach(function (group) {
    group.querySelector('.nav-group-btn').addEventListener('click', function () {
      setGroupOpen(group, !group.classList.contains('is-open'));
    });
  });

  // ── TOC derecho ─────────────────────────────────────────────
  var tocCurrent = document.getElementById('toc-current');
  var tocList    = document.getElementById('toc-list');

  function slug(text) {
    return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // Ids para los h3 (prefijados con la sección para que no choquen)
  sections.forEach(function (sec) {
    sec.querySelectorAll('h3').forEach(function (h) {
      if (!h.id) h.id = sec.id + '-' + slug(h.textContent);
    });
  });

  function renderToc(sec) {
    if (!tocList) return;
    if (!sec) {
      tocCurrent.textContent = 'Inicio';
      tocList.innerHTML = '';
      return;
    }
    tocCurrent.textContent = sec.querySelector('.section-num').textContent + ' · ' + sec.querySelector('h2').textContent;
    var heads = sec.querySelectorAll('h3');
    tocList.innerHTML = '';
    if (!heads.length) {
      tocList.innerHTML = '<li class="toc-empty">Sin subsecciones</li>';
      return;
    }
    heads.forEach(function (h) {
      var li = document.createElement('li');
      var a  = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      tocList.appendChild(li);
    });
  }

  // ── Scrollspy ───────────────────────────────────────────────
  var currentId = null;

  function setActive(id) {
    if (id === currentId) return;
    currentId = id;
    var sec = id ? document.getElementById(id) : null;
    var activeGroup = sec ? sec.getAttribute('data-group') : null;

    navLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    groups.forEach(function (g) {
      var on = g.getAttribute('data-group') === activeGroup;
      g.classList.toggle('is-active', on);
      if (on) setGroupOpen(g, true);
    });

    // Mantener visible el enlace activo dentro del sidebar
    var link = nav.querySelector('.nav-sub a.is-active');
    if (link && !mobileMQ.matches) {
      var r = link.getBoundingClientRect(), s = sidebar.getBoundingClientRect();
      if (r.top < s.top + 60 || r.bottom > s.bottom - 20) {
        sidebar.scrollTop += r.top - s.top - s.height / 3;
      }
    }
    renderToc(sec);
  }

  var headerH = 64;
  function computeActive() {
    var line = headerH + window.innerHeight * 0.25;
    var id = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) id = sections[i].id;
      else break;
    }
    // Al final de la página, marcar la última sección
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 4) {
      id = sections[sections.length - 1].id;
    }
    setActive(id);
  }

  // ── Progreso y botón volver arriba ──────────────────────────
  var bar   = document.getElementById('progress-bar');
  var toTop = document.getElementById('to-top');

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    toTop.classList.toggle('is-visible', window.scrollY > 600);
    computeActive();
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', onScroll);

  toTop.addEventListener('click', function () {
    var top = document.getElementById('inicio');
    if (history.replaceState) history.replaceState(null, '', '#inicio');
    top.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ── Bloques de código ───────────────────────────────────────
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  document.querySelectorAll('.code-block').forEach(function (block) {
    var pre  = block.querySelector('pre');
    var code = pre.querySelector('code');
    var raw  = code.textContent;
    var lang = pre.getAttribute('data-lang');

    if (lang === 'json') {
      code.innerHTML = escapeHtml(raw)
        .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span class="tok-key">$1</span>$2')
        .replace(/(:\s*)("(?:[^"\\]|\\.)*")/g, '$1<span class="tok-str">$2</span>')
        .replace(/\b(true|false|null)\b/g, '<span class="tok-lit">$1</span>');
    } else if (lang === 'flow') {
      code.innerHTML = escapeHtml(raw).replace(/→/g, '<span class="tok-arrow">→</span>');
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar';
    btn.addEventListener('click', function () {
      var done = function () {
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
        setTimeout(function () { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar'; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(raw).then(done, function () {});
      }
    });
    block.querySelector('.code-head').appendChild(btn);
  });

  // ── Lightbox ────────────────────────────────────────────────
  var lb      = document.getElementById('lightbox');
  var lbImg   = document.getElementById('lightbox-img');
  var lbCap   = document.getElementById('lightbox-caption');
  var lbClose = document.getElementById('lightbox-close');
  var lastFocus = null;

  function openLightbox(img) {
    var fig = img.closest('figure');
    var p   = fig ? fig.querySelector('figcaption p') : null;
    var num = fig ? fig.querySelector('.fig-num') : null;
    lastFocus = document.activeElement;
    lbImg.src = img.src;
    lbImg.alt = img.alt || 'Imagen ampliada';
    lbCap.textContent = (num ? num.textContent + '. ' : '') + (p ? p.textContent : '');
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    lbClose.focus();
  }
  function closeLightbox() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    lbImg.src = '';
    document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll('#resultados .figure-media img').forEach(function (img) {
    img.setAttribute('tabindex', '0');
    img.addEventListener('click', function () { openLightbox(img); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(img); }
    });
  });
  lb.addEventListener('click', function (e) { if (e.target !== lbImg) closeLightbox(); });
  lbClose.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (lb.classList.contains('is-open')) closeLightbox();
    else if (sidebar.classList.contains('is-open')) closeDrawer();
  });

  // ── Inicio ──────────────────────────────────────────────────
  onScroll();
  if (!currentId) setGroupOpen(groups[0], true);
})();
