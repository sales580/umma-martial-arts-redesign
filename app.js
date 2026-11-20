
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
      if (ph) { ph.className = 'mp-photo' + (ce.photo ? '' : ' is-empty'); ph.innerHTML = (ce.photo ? '<img src="' + ce.photo + '" alt="' + esc(ce.alt) + '" width="900" height="1125">' : '') + (ce.logo ? '<span class="mp-logo ' + (ce.logoCls || '') + '"><img src="' + ce.logo + '" alt="' + esc(ce.short) + ' logo" width="160" height="160"></span>' : (ce.photo ? '' : '<img src="umma-logo-white.png" alt="" width="300" height="259">')); }
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
