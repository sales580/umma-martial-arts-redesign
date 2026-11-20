
(function () {
  'use strict';
  var DATA = null;
  try { var de = document.getElementById('umma-data'); if (de) DATA = JSON.parse(de.textContent); } catch (e) { DATA = null; }
  var WA = (DATA && DATA.wa) || '16477993664';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- Toronto time (classes run on Toronto time wherever the visitor is)
  function torontoNow() {
    try {
      var f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
      var p = {};
      f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var map = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
      return { y: +p.year, m: +p.month, d: +p.day, dow: map[p.weekday], min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
    } catch (e) {
      var n = new Date();
      return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), dow: ((n.getDay() + 6) % 7) + 1, min: n.getHours() * 60 + n.getMinutes() };
    }
  }
  function addDays(y, m, d, k) { var t = new Date(Date.UTC(y, m - 1, d + k)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toMin(t) { var p = t.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function fmt12(t) { var p = t.split(':'), h = parseInt(p[0], 10); return ((h % 12) || 12) + ':' + p[1] + (h < 12 ? ' am' : ' pm'); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ---------- reveal on scroll (movement only, content is always visible)
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 }) : null;
  $$('.rv').forEach(function (el) { if (io && !reduce) io.observe(el); else el.classList.add('in'); });

  // ---------- count up
  $$('[data-count]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduce || !io) return;
    var started = false;
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || started) return;
        started = true; o.disconnect();
        var t0 = performance.now(), dur = 1100;
        (function step(t) {
          var k = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - k, 3)));
          el.textContent = v;
          if (k < 1) requestAnimationFrame(step); else el.textContent = target;
        })(t0);
      });
    }, { threshold: 0.4 });
    o.observe(el);
  });

  // ---------- hero slideshow
  $$('[data-slides]').forEach(function (box) {
    var slides = $$('.slide', box);
    if (slides.length < 2 || reduce) return;
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, 5400);
  });

  // ---------- animated student (faceless outline, side view, facing right)
  var BELT_COLS = ['#FFFFFF', '#F2C230', '#1E8A47', '#2F6DB5', '#C8402F', '#2A3A31'];
  var POSES = {
    ready: { t: 6, hd: 0, nua: 50, nfa: 165, fua: 25, ffa: 150, nt: 28, ns: -6, nf: 90, ft: -26, fs: -8, ff: 90 },
    punch: { t: 16, hd: 0, nua: 92, nfa: 92, fua: 10, ffa: 122, nt: 40, ns: -8, nf: 90, ft: -36, fs: -30, ff: 90 },
    kick: { t: -5, hd: 0, nua: 58, nfa: 160, fua: 32, ffa: 145, nt: 4, ns: 0, nf: 90, ft: 78, fs: 92, ff: 125 },
    block: { t: 4, hd: 0, nua: 125, nfa: 178, fua: 12, ffa: 105, nt: 36, ns: -10, nf: 90, ft: -34, fs: -28, ff: 90 }
  };
  var SEQ = [['ready', 0.55, 0.25], ['punch', 0.3, 0.32], ['ready', 0.5, 0.15], ['kick', 0.42, 0.36], ['ready', 0.55, 0.15], ['block', 0.38, 0.34], ['ready', 0.5, 0.7]];
  var KEYS = ['t', 'hd', 'nua', 'nfa', 'fua', 'ffa', 'nt', 'ns', 'nf', 'ft', 'fs', 'ff'];
  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function v(len, a) { var r = a * Math.PI / 180; return [len * Math.sin(r), len * Math.cos(r)]; }
  function up(len, a) { var r = a * Math.PI / 180; return [len * Math.sin(r), -len * Math.cos(r)]; }
  function add(p, q) { return [p[0] + q[0], p[1] + q[1]]; }
  function fk(p) {
    var P = [104, 150], N = add(P, up(60, p.t)), H = add(N, up(22, p.t * 0.5 + p.hd)), S = add(P, up(50, p.t));
    var nE = add(S, v(33, p.nua)), nF = add(nE, v(30, p.nfa)), fE = add(S, v(33, p.fua)), fF = add(fE, v(30, p.ffa));
    var nK = add(P, v(50, p.nt)), nA = add(nK, v(50, p.ns)), nT = add(nA, v(22, p.nf));
    var fK = add(P, v(50, p.ft)), fA = add(fK, v(50, p.fs)), fT = add(fA, v(22, p.ff));
    var maxY = Math.max(nA[1], nT[1], fA[1], fT[1]) + 6, dy = 252 - maxY, pts = { P: P, N: N, H: H, S: S, nE: nE, nF: nF, fE: fE, fF: fF, nK: nK, nA: nA, nT: nT, fK: fK, fA: fA, fT: fT };
    for (var k in pts) pts[k] = [pts[k][0], pts[k][1] + dy];
    return pts;
  }
  function pl(a) { return a.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); }
  function initKata(svg) {
    var NS = 'http://www.w3.org/2000/svg', hijab = svg.getAttribute('data-kata') === 'sister';
    function mk(tag, cls, parent) { var e = document.createElementNS(NS, tag); e.setAttribute('class', cls); parent.appendChild(e); return e; }
    var farG = $('.k-far', svg), bodyG = $('.k-body', svg), nearG = $('.k-near', svg), ghG = $('.k-ghosts', svg);
    var fArm = mk('polyline', 'k-seg arm far', farG), fLeg = mk('polyline', 'k-seg leg far', farG);
    var drape = hijab ? mk('line', 'k-seg drape', bodyG) : null, torso = mk('line', 'k-seg torso', bodyG), head = mk('circle', 'k-head', bodyG);
    var belt = mk('line', 'k-belt', bodyG), knot = mk('circle', 'k-knot', bodyG), t1 = mk('line', 'k-tail', bodyG), t2 = mk('line', 'k-tail', bodyG);
    var nLeg = mk('polyline', 'k-seg leg', nearG), nArm = mk('polyline', 'k-seg arm', nearG);
    head.setAttribute('r', hijab ? 15 : 14); knot.setAttribute('r', 4);
    var ghosts = [0.13, 0.08, 0.04].map(function (o) {
      var g = mk('g', 'k-gh', ghG); g.style.opacity = o;
      return { g: g, a: mk('polyline', 'k-ghost', g), b: mk('polyline', 'k-ghost', g), c: mk('polyline', 'k-ghost', g), d: mk('polyline', 'k-ghost', g), e: mk('line', 'k-ghost', g) };
    });
    ghosts.forEach(function (o) { ['a', 'b', 'c', 'd'].forEach(function (k) { o[k].style.strokeWidth = k === 'a' || k === 'c' ? 10 : 12; }); o.e.style.strokeWidth = 22; });
    var snaps = [], beltIdx = 0;
    function draw(pts) {
      fArm.setAttribute('points', pl([pts.S, pts.fE, pts.fF]));
      fLeg.setAttribute('points', pl([pts.P, pts.fK, pts.fA, pts.fT]));
      nLeg.setAttribute('points', pl([pts.P, pts.nK, pts.nA, pts.nT]));
      nArm.setAttribute('points', pl([pts.S, pts.nE, pts.nF]));
      torso.setAttribute('x1', pts.P[0]); torso.setAttribute('y1', pts.P[1]); torso.setAttribute('x2', pts.S[0]); torso.setAttribute('y2', pts.S[1]);
      head.setAttribute('cx', pts.H[0]); head.setAttribute('cy', pts.H[1]);
      if (drape) { drape.setAttribute('x1', pts.H[0]); drape.setAttribute('y1', pts.H[1] + 2); drape.setAttribute('x2', pts.S[0]); drape.setAttribute('y2', pts.S[1] + 6); }
      var dx = pts.S[0] - pts.P[0], dy = pts.S[1] - pts.P[1], L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, wx = uy, wy = -ux;
      var cx = pts.P[0] + ux * 6, cy = pts.P[1] + uy * 6;
      belt.setAttribute('x1', cx - wx * 13); belt.setAttribute('y1', cy - wy * 13); belt.setAttribute('x2', cx + wx * 13); belt.setAttribute('y2', cy + wy * 13);
      knot.setAttribute('cx', cx + 6); knot.setAttribute('cy', cy + 1);
      t1.setAttribute('x1', cx + 6); t1.setAttribute('y1', cy + 3); t1.setAttribute('x2', cx + 4); t1.setAttribute('y2', cy + 17);
      t2.setAttribute('x1', cx + 6); t2.setAttribute('y1', cy + 3); t2.setAttribute('x2', cx + 12); t2.setAttribute('y2', cy + 15);
      var col = BELT_COLS[beltIdx % BELT_COLS.length];
      belt.style.stroke = col; knot.style.fill = col; t1.style.stroke = col; t2.style.stroke = col;
    }
    function drawGhost(o, pts) {
      o.a.setAttribute('points', pl([pts.S, pts.nE, pts.nF])); o.b.setAttribute('points', pl([pts.P, pts.nK, pts.nA, pts.nT]));
      o.c.setAttribute('points', pl([pts.S, pts.fE, pts.fF])); o.d.setAttribute('points', pl([pts.P, pts.fK, pts.fA, pts.fT]));
      o.e.setAttribute('x1', pts.P[0]); o.e.setAttribute('y1', pts.P[1]); o.e.setAttribute('x2', pts.S[0]); o.e.setAttribute('y2', pts.S[1]);
    }
    function mix(a, b, k) { var o = {}; KEYS.forEach(function (key) { o[key] = a[key] + (b[key] - a[key]) * k; }); return o; }
    var total = SEQ.reduce(function (s, x) { return s + x[1] + x[2]; }, 0);
    draw(fk(POSES.ready));
    var frz = /[?&]kata=(\w+)/.exec(location.search), fp = svg.getAttribute('data-pose');
    if (fp && POSES[fp]) { draw(fk(POSES[fp])); return; }
    if (frz && POSES[frz[1]]) { draw(fk(POSES[frz[1]])); return; }
    if (reduce) return;
    var t0 = null, lastSnap = 0, lastLoop = 0, running = true;
    var vis = new IntersectionObserver(function (es) { running = es[0].isIntersecting; }, { threshold: 0.05 });
    vis.observe(svg);
    function frame(ts) {
      requestAnimationFrame(frame);
      if (!running) return;
      if (t0 === null) t0 = ts;
      var sec = (ts - t0) / 1000, loop = Math.floor(sec / total), t = sec % total;
      if (loop !== lastLoop) { lastLoop = loop; beltIdx = loop; }
      var acc = 0, prev = SEQ[SEQ.length - 1][0], pose = POSES.ready;
      for (var i = 0; i < SEQ.length; i++) {
        var s = SEQ[i];
        if (t < acc + s[1]) { var k = (t - acc) / s[1]; k = (s[0] === 'punch' || s[0] === 'kick') ? easeOut(k) : ease(k); pose = mix(POSES[prev], POSES[s[0]], k); break; }
        acc += s[1];
        if (t < acc + s[2]) { pose = POSES[s[0]]; break; }
        acc += s[2]; prev = s[0];
      }
      var pts = fk(pose);
      draw(pts);
      if (ts - lastSnap > 70) { lastSnap = ts; snaps.unshift(pts); if (snaps.length > 4) snaps.pop(); ghosts.forEach(function (o, j) { if (snaps[j + 1]) drawGhost(o, snaps[j + 1]); }); }
    }
    requestAnimationFrame(frame);
  }
  $$('.kata').forEach(initKata);

  // ---------- weekly calendar
  var classesById = {}, centresById = {};
  if (DATA) { DATA.classes.forEach(function (c) { classesById[c.id] = c; }); DATA.centres.forEach(function (c) { centresById[c.id] = c; }); }
  function nextDate(c) {
    var now = torontoNow(), delta = (c.day - now.dow + 7) % 7;
    if (delta === 0 && now.min > toMin(c.end)) delta = 7;
    return addDays(now.y, now.m, now.d, delta);
  }
  function stamp(d, t) { var p = t.split(':'); return d.y + pad(d.m) + pad(d.d) + 'T' + pad(+p[0]) + pad(+p[1]) + '00'; }
  function gcalUrl(c, ce) {
    var d = nextDate(c);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('UMMA class: ' + c.label + ' at ' + ce.short) +
      '&dates=' + stamp(d, c.start) + '/' + stamp(d, c.end) + '&details=' + encodeURIComponent('Weekly UMMA Martial Arts class. Directions: ' + ce.map) +
      '&location=' + encodeURIComponent(ce.name + ', ' + ce.addr) + '&recur=RRULE%3AFREQ%3DWEEKLY&ctz=America%2FToronto';
  }
  function icsUrl(c, ce) {
    var d = nextDate(c), n = new Date(), z = n.getUTCFullYear() + pad(n.getUTCMonth() + 1) + pad(n.getUTCDate()) + 'T' + pad(n.getUTCHours()) + pad(n.getUTCMinutes()) + '00Z';
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UMMA Martial Arts//Classes//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VTIMEZONE', 'TZID:America/Toronto', 'BEGIN:STANDARD', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'TZOFFSETFROM:-0400', 'TZOFFSETTO:-0500', 'TZNAME:EST', 'END:STANDARD',
      'BEGIN:DAYLIGHT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0400', 'TZNAME:EDT', 'END:DAYLIGHT', 'END:VTIMEZONE',
      'BEGIN:VEVENT', 'UID:umma-' + c.id + '@ummamartialarts', 'DTSTAMP:' + z, 'DTSTART;TZID=America/Toronto:' + stamp(d, c.start), 'DTEND;TZID=America/Toronto:' + stamp(d, c.end),
      'RRULE:FREQ=WEEKLY', 'SUMMARY:UMMA class: ' + c.label + ' at ' + ce.short, 'LOCATION:' + (ce.name + ', ' + ce.addr).replace(/,/g, '\\,'), 'END:VEVENT', 'END:VCALENDAR'];
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(L.join('\r\n'));
  }
  function initCal(root) {
    if (!DATA) return;
    var evs = $$('.ev', root), slots = $$('.slot', root), days = $$('.day', root), detail = $('#cal-detail', root);
    var chips = $$('[data-who-chip]', root), area = $('#area-filter', root), bar = $('[data-filters]', root), empty = $('#week-empty', root);
    var tabs = $$('[data-view]', root), vGrid = $('#view-grid', root), vList = $('#view-list', root), who = 'any';
    function apply() {
      var a = area ? area.value : '', shown = 0;
      function ok(el) { return (who === 'any' || el.getAttribute('data-who').split(' ').indexOf(who) > -1) && (!a || el.getAttribute('data-area') === a); }
      evs.forEach(function (b) { var k = ok(b); b.hidden = !k; if (k) shown++; });
      slots.forEach(function (s) { s.hidden = !ok(s); });
      days.forEach(function (d) { d.hidden = !d.querySelector('.slot:not([hidden])'); });
      if (empty) empty.hidden = shown > 0;
    }
    function setWho(next) { who = next; chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-who-chip') === who ? 'true' : 'false'); }); apply(); }
    chips.forEach(function (c) { c.addEventListener('click', function () { setWho(c.getAttribute('data-who-chip')); }); });
    if (area) area.addEventListener('change', apply);
    if (bar) bar.hidden = false;
    function setView(name) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-view') === name ? 'true' : 'false'); });
      if (vGrid) vGrid.hidden = name !== 'grid'; if (vList) vList.hidden = name !== 'list';
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { setView(t.getAttribute('data-view')); }); });
    setView(window.innerWidth < 900 ? 'list' : 'grid');

    // dates, today, now line
    var now = torontoNow(), mon = addDays(now.y, now.m, now.d, 1 - now.dow), sun = addDays(mon.y, mon.m, mon.d, 6);
    $$('.cal-day', root).forEach(function (h) {
      var n = parseInt(h.getAttribute('data-day'), 10), d = addDays(mon.y, mon.m, mon.d, n - 1);
      var el = $('.date', h); if (el) el.textContent = d.d;
      if (n === now.dow) h.classList.add('is-today');
    });
    $$('.cal-col', root).forEach(function (c) { if (parseInt(c.getAttribute('data-day'), 10) === now.dow) c.classList.add('is-today'); });
    days.forEach(function (d) { if (parseInt(d.getAttribute('data-day'), 10) === now.dow) { d.classList.add('is-today'); var b = $('.today-badge', d); if (b) b.hidden = false; } });
    var wr = $('[data-week-range]', root);
    if (wr) wr.textContent = 'This week: ' + MONTHS[mon.m - 1] + ' ' + mon.d + ' to ' + (sun.m !== mon.m ? MONTHS[sun.m - 1] + ' ' : '') + sun.d + ' (Toronto time)';
    var nowLine = $('.cal-now', root);
    function placeNow() {
      var cur = torontoNow(), H0 = 11 * 60, H1 = 21 * 60;
      if (!nowLine || cur.min < H0 || cur.min > H1) { if (nowLine) nowLine.hidden = true; return; }
      nowLine.hidden = false; nowLine.style.top = ((cur.min - H0) / (H1 - H0) * 100) + '%';
    }
    placeNow(); setInterval(placeNow, 60000);

    // details
    function set(k, html) { var el = $('[data-cd="' + k + '"]', detail); if (el) el.innerHTML = html; }
    function select(id) {
      var c = classesById[id]; if (!c || !detail) return; var ce = centresById[c.centre], day = DATA.days[c.day - 1];
      evs.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-id') === id ? 'true' : 'false'); });
      set('time', fmt12(c.start) + ' to ' + fmt12(c.end)); set('day', day + 's, every week');
      set('tag', '<span class="tag tag-' + c.kind + '">' + esc(c.label) + '</span>'); set('centre', esc(ce.name)); set('addr', esc(ce.addr) + ' (' + esc(ce.area) + ')');
      $('[data-cd="dir"]', detail).href = ce.map;
      $('[data-cd="wa"]', detail).href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent("Salaam, I'd like to join the " + c.label + ' at ' + ce.name + ' on ' + day + ' at ' + fmt12(c.start) + '.');
      $('[data-cd="gcal"]', detail).href = gcalUrl(c, ce);
      $('[data-cd="ics"]', detail).href = icsUrl(c, ce);
    }
    evs.forEach(function (b) { b.addEventListener('click', function () { select(b.getAttribute('data-id')); }); });
    var cur = torontoNow(), best = null, bestD = 1e9;
    DATA.classes.forEach(function (c) { var d = ((c.day - cur.dow + 7) % 7) * 1440 + toMin(c.start) - cur.min; if (d < 0) d += 7 * 1440; if (d < bestD) { bestD = d; best = c; } });
    if (best) select(best.id);
    var m = /^#who-(kids|sisters|brothers|all)$/.exec(location.hash); if (m) setWho(m[1]);
  }
  $$('[data-cal]').forEach(initCal);

  // ---------- map
  function initMap(root) {
    if (!DATA) return;
    var pins = $$('.pin', root), panel = $('[data-panel]', root), picks = $$('[data-pick]');
    var todayDow = torontoNow().dow;
    pins.forEach(function (p) {
      var id = p.getAttribute('data-id');
      if (DATA.classes.some(function (c) { return c.centre === id && c.day === todayDow; })) p.classList.add('today');
    });
    function f(k) { return $('[data-mp="' + k + '"]', panel); }
    function select(id, scroll) {
      var ce = centresById[id]; if (!ce) return;
      pins.forEach(function (p) { p.classList.toggle('is-sel', p.getAttribute('data-id') === id); });
      picks.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pick') === id ? 'true' : 'false'); });
      var ph = f('photo');
      if (ph) { ph.className = 'mp-photo' + (ce.photo ? '' : ' is-empty'); ph.innerHTML = '<img src="' + (ce.photo || 'umma-logo-white.png') + '" alt="' + esc(ce.photo ? ce.alt : '') + '" width="900" height="675">'; }
      f('area').textContent = ce.area; f('name').textContent = ce.name; f('addr').textContent = ce.addr; f('dir').href = ce.map;
      f('wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent("Salaam, I'd like to try UMMA at " + ce.short);
      var list = DATA.classes.filter(function (c) { return c.centre === id; }).sort(function (a, b) { return a.day - b.day || (a.start < b.start ? -1 : 1); });
      f('classes').innerHTML = list.map(function (c) { return '<li><b>' + DATA.days[c.day - 1].slice(0, 3) + '</b><span>' + fmt12(c.start).replace(' ', '') + '–' + fmt12(c.end) + ' &middot; ' + esc(c.label) + '</span></li>'; }).join('');
    }
    pins.forEach(function (p) {
      p.addEventListener('click', function () { select(p.getAttribute('data-id')); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(p.getAttribute('data-id')); } });
    });
    picks.forEach(function (b) { b.addEventListener('click', function () { select(b.getAttribute('data-pick')); }); });
    var near = $('[data-near]', root), msg = $('[data-near-msg]', root);
    if (near) near.addEventListener('click', function () {
      if (!navigator.geolocation) { msg.textContent = 'Location is not available here. Pick a pin instead.'; return; }
      msg.textContent = 'Finding you...';
      navigator.geolocation.getCurrentPosition(function (pos) {
        var best = null, bd = 1e9, la = pos.coords.latitude, lo = pos.coords.longitude;
        DATA.centres.forEach(function (c) {
          var dx = (c.lng - lo) * Math.cos(la * Math.PI / 180) * 111.2, dy = (c.lat - la) * 111.2, d = Math.sqrt(dx * dx + dy * dy);
          if (d < bd) { bd = d; best = c; }
        });
        if (best) { select(best.id); msg.textContent = best.short + ' is about ' + Math.round(bd) + ' km away.'; }
      }, function () { msg.textContent = 'Location is off or not available here. Pick a pin instead.'; }, { timeout: 8000 });
    });
    var h = location.hash.replace('#', '');
    select(centresById[h] ? h : (pins[0] && pins[0].getAttribute('data-id')));
  }
  $$('[data-map]').forEach(initMap);

  // ---------- WhatsApp message builders
  function lines(form) {
    var fd = new FormData(form), out = [];
    $$('[data-wa-field]', form).forEach(function (el) {
      var val = (fd.get(el.name) || '').toString().trim();
      if (val) out.push(el.getAttribute('data-wa-field') + ': ' + val);
    });
    return out;
  }
  $$('form[data-wa]').forEach(function (form) {
    var link = $('[data-wa-link]', form), preview = $('[data-wa-preview]', form), copy = $('[data-copy-from]', form), intro = form.getAttribute('data-wa');
    function build() {
      var text = intro + '\n' + lines(form).join('\n');
      if (link) link.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
      if (preview) preview.textContent = text;
      if (copy) copy.setAttribute('data-copy', text);
    }
    form.addEventListener('input', build); form.addEventListener('change', build);
    form.addEventListener('submit', function (e) { e.preventDefault(); build(); });
    build();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-copy]') : null; if (!b) return;
    var text = b.getAttribute('data-copy'), label = b.getAttribute('data-label') || b.textContent;
    b.setAttribute('data-label', label);
    function done() { b.textContent = 'Copied'; setTimeout(function () { b.textContent = label; }, 1600); }
    function fallback() {
      var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (err) { /* nothing else to try */ } document.body.removeChild(t);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  });
  var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
