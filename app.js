/* Acme Procure — fictional training app for the Agentic Testing lab. Static, no server: state lives in localStorage.
   Automation contract: element ids and names never change between releases, except the submit button in 2.4
   (#submit -> #sendForApproval, on purpose). Values a robot reads (#approvalRoute, #requestStatus, #requestId)
   hold plain text only; icons and avatars are aria-hidden or drawn by CSS. */
(function () {
  'use strict';
  var RELEASE = window.ACME_RELEASE || '2.3';
  var V24 = RELEASE === '2.4';
  // Keyed by folder: every Pages site of the org shares one origin, and so do /acme-procure/ and /acme-procure-demo/.
  var NS = 'acmeProcure:' + location.pathname.replace(/[^\/]*$/, '');
  var KEY = NS + ':requests.v2', ROLE_KEY = NS + ':role';
  var USERS = { Requester: 'Jordan Ortiz', Manager: 'Alex Morgan', Finance: 'Lee Kim' };
  var ROUTES = { auto: 'Auto-approved', manager: 'Manager', finance: 'Manager + Finance', blocked: 'Rejected - blocked vendor' };
  var VENDORS = window.ACME_VENDORS || [];

  var ICON = {
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    store: '<path d="M3 9h18l-1.5-5h-15z"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'
  };
  function icon(n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + '</svg>'; }
  function initials(name) { return name.split(' ').map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase(); }
  var HUES = ['#4F7BE8', '#0E9F6E', '#D97706', '#7C3AED', '#DB2777', '#0891B2'];
  function avatar(name, sm) {
    var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % HUES.length;
    return '<span class="avatar' + (sm ? ' sm' : '') + '" data-initials="' + initials(name) + '" style="background:' + HUES[h] + '" aria-hidden="true"></span>';
  }

  // ---------- storage ----------
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  var memory = null;
  function requests() {
    if (memory) return memory;
    memory = load(KEY, null);
    if (!memory) { memory = seed(); store(KEY, memory); }
    return memory;
  }
  function save() { store(KEY, memory); }
  function role() { var r = load(ROLE_KEY, 'Requester'); return USERS[r] ? r : 'Requester'; }
  // Requesters raise requests; Manager and Finance only approve. A fresh browser starts as Requester.
  function isApprover(r) { return r !== 'Requester'; }
  function homeOf(r) { return isApprover(r) ? 'inbox.html' : 'index.html'; }
  var MENUS = {
    Requester: [['index.html', 'My requests', 'home', 'list'], ['new-request.html', 'New request', 'new', 'plus']],
    Approver: [['inbox.html', 'Approval inbox', 'inbox', 'inbox'], ['history.html', 'Approval history', 'history', 'clock']]
  };
  var PAGE_FOR = { home: 'Requester', new: 'Requester', confirm: 'Requester', inbox: 'Approver', history: 'Approver', request: 'any' };

  function seed() {  // dates are relative to the day the demo data is created
    function h(at, who, r, action) { return { at: at, who: who, role: r, action: action }; }
    function ago(days, hm) { var d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10) + ' ' + hm; }
    return [
      { id: 'PR-10226', title: 'CRM licence renewal', vendorId: 'V-1014', category: 'Software', amount: 58000, costCenter: 'CC-0107', neededBy: plusDays(20), justification: 'Annual renewal for 120 sales seats.', requester: 'Riya Patel', route: 'finance', status: 'Approved', created: ago(14, '10:30'),
        history: [h(ago(14, '10:30'), 'Riya Patel', 'Requester', 'Submitted'), h(ago(13, '09:12'), 'Alex Morgan', 'Manager', 'Approved'), h(ago(12, '16:45'), 'Lee Kim', 'Finance', 'Approved')] },
      { id: 'PR-10227', title: 'Team offsite catering', vendorId: 'V-1013', category: 'Facilities', amount: 6200, costCenter: 'CC-0019', neededBy: plusDays(10), justification: 'Lunch and dinner for the two-day planning offsite.', requester: 'Sam Chen', route: 'manager', status: 'Rejected', created: ago(11, '13:05'),
        history: [h(ago(11, '13:05'), 'Sam Chen', 'Requester', 'Submitted'), h(ago(10, '08:40'), 'Alex Morgan', 'Manager', 'Rejected: Over the events budget for this quarter.')] },
      { id: 'PR-10228', title: 'Toner and paper for Q4', vendorId: 'V-1001', category: 'Office supplies', amount: 3200, costCenter: 'CC-0042', neededBy: plusDays(12), justification: 'Quarterly office restock.', requester: 'Jordan Ortiz', route: 'auto', status: 'Approved', created: ago(9, '10:02'),
        history: [h(ago(9, '10:02'), 'Jordan Ortiz', 'Requester', 'Submitted'), h(ago(9, '10:02'), 'System', 'System', 'Auto-approved')] },
      { id: 'PR-10229', title: 'Forklift replacement', vendorId: 'V-1007', category: 'MRO', amount: 72000, costCenter: 'CC-0019', neededBy: plusDays(30), justification: 'Current forklift failed inspection.', requester: 'Sam Chen', route: 'finance', status: 'Pending finance', created: ago(8, '14:20'),
        history: [h(ago(8, '14:20'), 'Sam Chen', 'Requester', 'Submitted'), h(ago(7, '09:05'), 'Alex Morgan', 'Manager', 'Approved')] },
      { id: 'PR-10231', title: 'Laptops for new hires', vendorId: 'V-1003', category: 'IT hardware', amount: 12000, costCenter: 'CC-0042', neededBy: plusDays(45), justification: 'Five laptops for the new support hires starting in January.', requester: 'Jordan Ortiz', route: 'manager', status: 'Pending manager', created: ago(5, '09:14'),
        history: [h(ago(5, '09:14'), 'Jordan Ortiz', 'Requester', 'Submitted')] },
      { id: 'PR-10233', title: 'Warehouse racking repair', vendorId: 'V-1007', category: 'MRO', amount: 8450, costCenter: 'CC-0019', neededBy: plusDays(21), justification: 'Two racking bays damaged.', requester: 'Sam Chen', route: 'manager', status: 'Pending manager', created: ago(5, '11:40'),
        history: [h(ago(5, '11:40'), 'Sam Chen', 'Requester', 'Submitted')] },
      { id: 'PR-10236', title: 'Annual safety training', vendorId: 'V-1020', category: 'Professional services', amount: 64500, costCenter: 'CC-0107', neededBy: plusDays(60), justification: 'Mandatory safety certification for plant staff.', requester: 'Riya Patel', route: 'finance', status: 'Pending manager', created: ago(4, '08:05'),
        history: [h(ago(4, '08:05'), 'Riya Patel', 'Requester', 'Submitted')] }
    ];
  }

  // ---------- rules ----------
  function vendor(id) { for (var i = 0; i < VENDORS.length; i++) if (VENDORS[i].id === id) return VENDORS[i]; return null; }
  function routeFor(amount, v) {
    if (v && v.status === 'Blocked') return 'blocked';
    if (amount < 5000) return 'auto';
    if (amount > 50000) return 'finance';
    return 'manager';
  }
  function money(n) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function now() { var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function today() { return now().slice(0, 10); }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function nextId() { var m = 10236; requests().forEach(function (r) { var n = parseInt(r.id.slice(3), 10); if (n > m) m = n; }); return 'PR-' + (m + 1); }
  function byId(id) { var rs = requests(); for (var i = 0; i < rs.length; i++) if (rs[i].id === id) return rs[i]; return null; }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function statusChip(s) { return '<span class="status s-' + s.toLowerCase().replace(/\s+/g, '-') + '">' + esc(s) + '</span>'; }
  function waitingFor(r) { var want = r === 'Manager' ? 'Pending manager' : r === 'Finance' ? 'Pending finance' : null; return want ? requests().filter(function (q) { return q.status === want; }).length : 0; }

  // ---------- chrome ----------
  function chrome(page) {
    var r = role(), inboxCount = waitingFor(r);
    var links = MENUS[isApprover(r) ? 'Approver' : 'Requester'];
    var side = document.getElementById('appNav');
    side.className = 'side';
    side.innerHTML = '<a class="logo" href="' + homeOf(r) + '"><span class="mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2 2 21h5l5-10 5 10h5z"/></svg></span><span><b>Acme Procure</b><small>Acme Industries</small></span></a>' +
      '<nav aria-label="Main"><span class="sec">' + (isApprover(r) ? 'Approvals' : 'Purchasing') + '</span>' +
      links.map(function (l) {
        return '<a id="nav-' + l[2] + '" href="' + l[0] + '"' + (l[2] === page ? ' class="on" aria-current="page"' : '') + '>' + icon(l[3]) + '<span>' + l[1] + '</span>' +
          (l[2] === 'inbox' && inboxCount ? '<span class="count" aria-hidden="true">' + inboxCount + '</span>' : '') + '</a>';
      }).join('') + '</nav><div class="foot">Fictional training app · synthetic data only</div>';

    var h = document.getElementById('appHeader');
    h.className = 'top';
    h.innerHTML = '<div class="search" aria-hidden="true">' + icon('search') + '<span>Search requests, vendors…</span></div><span class="spacer"></span>' +
      '<span class="ver" id="appVersion" title="Acme Procure release">Release ' + RELEASE + '</span>' +
      '<span class="bell" aria-hidden="true">' + icon('bell') + (inboxCount ? '<span class="dot"></span>' : '') + '</span>' +
      '<div class="user">' + avatar(USERS[r]) + '<div class="who"><b>' + USERS[r] + '</b>' +
      '<label for="roleSwitch" style="position:absolute;left:-9999px">Role</label><select id="roleSwitch" name="role" aria-label="Role">' +
      Object.keys(USERS).map(function (k) { return '<option value="' + k + '"' + (k === r ? ' selected' : '') + '>' + k + ' · ' + USERS[k] + '</option>'; }).join('') +
      '</select></div></div>';
    document.getElementById('roleSwitch').addEventListener('change', function (e) { store(ROLE_KEY, e.target.value); location.href = homeOf(e.target.value); });

    var f = document.getElementById('appFooter');
    f.className = 'app';
    f.innerHTML = '<span id="appRelease">Acme Procure · Release ' + RELEASE + '</span><span>Fictional training app · synthetic data only</span>' +
      '<button type="button" id="resetData">Reset demo data</button>';
    document.getElementById('resetData').addEventListener('click', function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      memory = null; location.href = homeOf(r);
    });
  }

  // A page opened in the wrong role explains itself instead of redirecting, so a forgotten role switch is obvious.
  function allowed(page) {
    var need = PAGE_FOR[page], r = role();
    if (need === 'any' || (need === 'Approver') === isApprover(r)) return true;
    var names = { home: 'My requests', new: 'New request', confirm: 'This confirmation', inbox: 'Approval inbox', history: 'Approval history' };
    var to = need === 'Requester' ? ['Requester'] : ['Manager', 'Finance'];
    document.getElementById('page').innerHTML = '<div class="card confirm" id="wrongRole"><div class="pad"><div class="badge-ic bad" aria-hidden="true">' + icon('x') + '</div>' +
      '<h1 id="wrongRoleTitle">' + names[page] + ' is for ' + (need === 'Requester' ? 'requesters' : 'approvers') + '</h1>' +
      '<p class="sub">You are signed in as ' + r + ' · ' + USERS[r] + '.</p><div class="actions">' +
      to.map(function (t, i) { return '<button type="button"' + (i ? ' class="secondary"' : '') + ' id="switchTo' + t + '" data-role="' + t + '">Switch to ' + t + '</button>'; }).join('') +
      '</div></div></div>';
    document.querySelectorAll('[data-role]').forEach(function (b) { b.addEventListener('click', function () { store(ROLE_KEY, b.getAttribute('data-role')); location.reload(); }); });
    return false;
  }

  function head(crumb, title, sub, actions) {
    return '<div class="page-head"><div><div class="crumbs">' + crumb + '</div><h1 id="pageTitle">' + title + '</h1>' +
      (sub !== null ? '<p class="sub" id="pageSub">' + sub + '</p>' : '') + '</div>' + (actions || '') + '</div>';
  }

  // ---------- pages ----------
  function home() {
    var rows = requests().filter(function (q) { return q.requester === USERS.Requester; });
    rows.sort(function (a, b) { return a.created < b.created ? 1 : -1; });
    var count = function (f) { return rows.filter(f).length; };
    var total = rows.reduce(function (s, q) { return s + q.amount; }, 0);
    document.getElementById('page').innerHTML =
      head('Purchasing', 'My requests', 'Requests you raised.','<a class="btn" href="new-request.html" id="startNewRequest">' + icon('plus') + 'New request</a>') +
      '<div class="kpis">' +
      kpi('Open', count(function (q) { return /^Pending/.test(q.status); }), '#D97706', 'kpiOpen') +
      kpi('Approved', count(function (q) { return q.status === 'Approved'; }), '#047857', 'kpiApproved') +
      kpi('Rejected', count(function (q) { return q.status === 'Rejected'; }), '#B91C1C', 'kpiRejected') +
      kpi('Total requested (USD)', money(total), '#2B4C9B', 'kpiTotal') + '</div>' +
      '<div class="card"><div class="card-head"><h2>Requests</h2><span class="muted">' + rows.length + ' total</span></div><div id="list">' +
      (rows.length ? table(rows, false) : empty('No requests yet.')) + '</div></div>';
  }
  function kpi(k, v, c, id) { return '<div class="card kpi"><div class="k"><i style="background:' + c + '" aria-hidden="true"></i>' + k + '</div><div class="v" id="' + id + '">' + v + '</div></div>'; }
  function empty(t) { return '<div class="empty">' + icon('doc') + '<p>' + t + '</p></div>'; }

  function table(rows, waiting) {
    return '<div class="table-wrap"><table id="requestsTable"><thead><tr><th scope="col">Request ID</th><th scope="col">Title</th><th scope="col">Requester</th><th scope="col" class="num">Amount (USD)</th><th scope="col">' +
      (waiting ? 'Waiting since' : 'Created') + '</th><th scope="col">Status</th></tr></thead><tbody>' +
      rows.map(function (q) {
        var since = waiting ? q.history[q.history.length - 1].at : q.created;
        return '<tr data-request-id="' + q.id + '"><td><a class="id" href="request.html?id=' + q.id + '">' + q.id + '</a></td><td><span class="t">' + esc(q.title) + '</span></td>' +
          '<td><span class="person">' + avatar(q.requester, true) + '<span>' + esc(q.requester) + '</span></span></td>' +
          '<td class="num">' + money(q.amount) + '</td><td class="muted">' + since + '</td><td>' + statusChip(q.status) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function newRequest() {
    var sel = document.getElementById('vendor');
    sel.innerHTML = '<option value="">Choose a vendor</option>' + VENDORS.map(function (v) {
      return '<option value="' + v.id + '">' + esc(v.name) + ' (' + v.id + ')</option>';
    }).join('');
    var nb = document.getElementById('neededBy'); nb.value = plusDays(14);
    sel.addEventListener('change', function () { var v = vendor(sel.value); if (v) document.getElementById('category').value = v.category; preview(); });
    document.getElementById('amount').addEventListener('input', preview);

    var btn = document.createElement('button');
    btn.type = 'submit';
    if (V24) { btn.id = 'sendForApproval'; btn.name = 'sendForApproval'; btn.innerHTML = icon('check') + '<span>Send for approval</span>'; document.getElementById('formHeadActions').appendChild(btn); }
    else { btn.id = 'submit'; btn.name = 'submit'; btn.textContent = 'Submit'; var a = document.getElementById('formActions'); a.insertBefore(btn, a.firstChild); }
    preview();

    document.getElementById('requestForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = read(), errs = validate(d);
      document.querySelectorAll('.field').forEach(function (f) { f.classList.remove('invalid'); var m = f.querySelector('.err'); if (m) m.textContent = ''; });
      var keys = Object.keys(errs);
      if (keys.length) {
        keys.forEach(function (k) { var f = document.getElementById(k).closest('.field'); f.classList.add('invalid'); f.querySelector('.err').textContent = errs[k]; });
        document.getElementById(keys[0]).focus();
        return;
      }
      var v = vendor(d.vendor), route = routeFor(d.amountValue, v), at = now();
      var q = { id: nextId(), title: d.title, vendorId: d.vendor, category: d.category, amount: d.amountValue, costCenter: d.costCenter, neededBy: d.neededBy,
        justification: d.justification, requester: USERS.Requester, route: route, created: at, history: [{ at: at, who: USERS.Requester, role: 'Requester', action: 'Submitted' }] };
      if (route === 'blocked') { q.status = 'Rejected'; q.history.push({ at: at, who: 'System', role: 'System', action: 'Rejected - blocked vendor' }); }
      else if (route === 'auto') { q.status = 'Approved'; q.history.push({ at: at, who: 'System', role: 'System', action: 'Auto-approved' }); }
      else q.status = 'Pending manager';
      requests().push(q); save();
      location.href = 'confirmation.html?id=' + q.id;
    });
  }

  function read() {
    var g = function (id) { return document.getElementById(id).value.trim(); };
    var d = { title: g('title'), vendor: g('vendor'), category: g('category'), amount: g('amount'), costCenter: g('costCenter'), neededBy: g('neededBy'), justification: g('justification') };
    if (V24) { d.costCenter = d.costCenter.toUpperCase(); document.getElementById('costCenter').value = d.costCenter; }
    d.amountValue = parseFloat(d.amount.replace(/,/g, ''));
    return d;
  }

  function validate(d) {
    var e = {};
    if (!d.title) e.title = 'Enter a title.';
    if (!d.vendor) e.vendor = 'Choose a vendor.';
    if (!d.category) e.category = 'Choose a category.';
    if (!/^\d+(\.\d{1,2})?$/.test(d.amount.replace(/,/g, '')) || !(d.amountValue > 0)) e.amount = 'Enter an amount greater than 0 with up to 2 decimals.';
    if (!/^CC-\d{4}$/.test(d.costCenter)) e.costCenter = 'Use the format CC-0000.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.neededBy)) e.neededBy = 'Use the format YYYY-MM-DD.';
    else if (d.neededBy < today()) e.neededBy = 'Choose today or a later date.';
    if (!d.justification) e.justification = 'Enter a justification.';
    return e;
  }

  function stepsFor(route) {
    if (route === 'auto') return [['ok', 'Auto-approved', 'No approval needed']];
    if (route === 'blocked') return [['bad', 'Rejected', 'Blocked vendor']];
    var s = [['', 'Manager', USERS.Manager]];
    if (route === 'finance') s.push(['', 'Finance', USERS.Finance]);
    return s;
  }

  function preview() {
    var a = parseFloat(document.getElementById('amount').value.replace(/,/g, '')), v = vendor(document.getElementById('vendor').value);
    var box = document.getElementById('previewSteps'), line = document.getElementById('routePreview'), vc = document.getElementById('vendorCard');
    vc.innerHTML = v ? '<div class="vendor-card"><span class="ic" aria-hidden="true">' + icon('store') + '</span><div><b>' + esc(v.name) + '</b><span>' + v.id + ' · ' + esc(v.category) + '</span></div></div>' : '';
    if (!(a > 0)) { box.innerHTML = '<li class="empty-hint">Enter an amount to see who approves.</li>'; line.textContent = ''; return; }
    var route = routeFor(a, v);
    box.innerHTML = stepsFor(route).map(function (s, i) {
      return '<li><span class="n' + (s[0] ? ' ' + s[0] : '') + '" aria-hidden="true">' + (s[0] === 'ok' ? '✓' : s[0] === 'bad' ? '✕' : i + 1) + '</span><div><b>' + s[1] + '</b><span>' + esc(s[2]) + '</span></div></li>';
    }).join('');
    line.textContent = 'Approval route (preview): ' + ROUTES[route];
  }

  function confirmation() {
    var q = byId(qs('id')), box = document.getElementById('result');
    if (!q) { box.innerHTML = '<div class="pad">' + empty('Request not found.') + '</div>'; return; }
    var rejected = q.route === 'blocked';
    box.innerHTML = '<div class="pad"><div class="badge-ic ' + (rejected ? 'bad' : 'ok') + '" aria-hidden="true">' + icon(rejected ? 'x' : 'check') + '</div>' +
      '<h1 id="resultTitle">' + (rejected ? 'Request rejected' : 'Request submitted') + '</h1>' +
      '<p class="sub">' + (rejected ? 'The vendor on this request is blocked in the vendor master.' : q.status === 'Approved' ? 'No approval needed. Procurement can raise the purchase order.' : 'We’ll notify you when the approvers act on it.') + '</p>' +
      (rejected ? '<p class="notice bad" id="resultMessage" role="alert">This vendor is blocked. Choose another vendor.</p>' : '') +
      '<dl class="kv"><dt>Request ID</dt><dd id="requestId">' + q.id + '</dd><dt>Status</dt><dd id="requestStatus">' + esc(q.status) +
      '</dd><dt>Approval route</dt><dd id="approvalRoute">' + ROUTES[q.route] + '</dd><dt>Amount (USD)</dt><dd id="requestAmount">' + money(q.amount) + '</dd></dl>' +
      '<div class="actions"><a class="btn" id="viewRequest" href="request.html?id=' + q.id + '">View request</a><a class="btn secondary" id="newRequest" href="new-request.html">New request</a></div></div>';
  }

  function inbox() {
    var r = role(), want = r === 'Manager' ? 'Pending manager' : 'Pending finance', page = document.getElementById('page');
    var rows = requests().filter(function (q) { return q.status === want; });
    page.innerHTML = head('Approvals', 'Approval inbox', 'Waiting for you (' + rows.length + ').',
      V24 ? '<div class="toolbar"><label for="sortBy">Sort by</label><select id="sortBy" name="sortBy"><option value="id">Request ID</option><option value="waiting">Waiting since</option></select></div>' : '') +
      '<div class="card"><div id="list"></div></div>';
    function draw() {
      var s = V24 ? document.getElementById('sortBy').value : 'id';
      rows.sort(function (a, b) {
        if (s === 'waiting') return a.history[a.history.length - 1].at < b.history[b.history.length - 1].at ? -1 : 1;
        return a.id < b.id ? -1 : 1;
      });
      document.getElementById('list').innerHTML = rows.length ? table(rows, true) : empty('Nothing waiting for you.');
    }
    if (V24) document.getElementById('sortBy').addEventListener('change', draw);
    draw();
  }

  function approvalHistory() {
    var r = role(), me = USERS[r];
    var rows = requests().map(function (q) {
      var d = null;
      q.history.forEach(function (x) { if (x.who === me && x.role === r && /^(Approved|Rejected)/.test(x.action)) d = x; });
      return d ? { q: q, d: d } : null;
    }).filter(Boolean);
    rows.sort(function (a, b) { return a.d.at < b.d.at ? 1 : -1; });
    document.getElementById('page').innerHTML = head('Approvals', 'Approval history', 'Requests you approved or rejected (' + rows.length + ').') +
      '<div class="card"><div id="list">' + (rows.length ?
        '<div class="table-wrap"><table id="requestsTable"><thead><tr><th scope="col">Request ID</th><th scope="col">Title</th><th scope="col">Requester</th><th scope="col" class="num">Amount (USD)</th>' +
        '<th scope="col">Your decision</th><th scope="col">Decided on</th><th scope="col">Status now</th></tr></thead><tbody>' +
        rows.map(function (x) {
          var q = x.q, dec = x.d.action.split(':')[0];
          return '<tr data-request-id="' + q.id + '"><td><a class="id" href="request.html?id=' + q.id + '">' + q.id + '</a></td><td><span class="t">' + esc(q.title) + '</span></td>' +
            '<td><span class="person">' + avatar(q.requester, true) + '<span>' + esc(q.requester) + '</span></span></td><td class="num">' + money(q.amount) + '</td>' +
            '<td>' + statusChip(dec) + '</td><td class="muted">' + x.d.at + '</td><td>' + statusChip(q.status) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : empty('You haven’t approved or rejected anything yet.')) + '</div></div>';
  }

  function detail() {
    var q = byId(qs('id')), box = document.getElementById('page');
    if (!q) { box.innerHTML = '<div class="card">' + empty('Request not found.') + '</div>'; return; }
    var v = vendor(q.vendorId) || { name: q.vendorId }, r = role();
    var steps = q.route === 'auto' ? [['done', 'System', 'Auto-approved']] : q.route === 'blocked' ? [['rej', 'System', 'Rejected - blocked vendor']] : [];
    if (q.route === 'manager' || q.route === 'finance') {
      var mApproved = q.history.some(function (x) { return x.role === 'Manager' && /^Approved/.test(x.action); });
      var mRej = q.status === 'Rejected' && !mApproved;
      steps.push([mRej ? 'rej' : mApproved ? 'done' : 'wait', 'Manager', mRej ? 'Rejected' : mApproved ? 'Approved' : 'Waiting', USERS.Manager]);
      if (q.route === 'finance') {
        var fState = q.status === 'Approved' ? ['done', 'Approved'] : q.status === 'Pending finance' ? ['wait', 'Waiting'] : (q.status === 'Rejected' && mApproved) ? ['rej', 'Rejected'] : ['', 'Next'];
        steps.push([fState[0], 'Finance', fState[1], USERS.Finance]);
      }
    }
    var canAct = (r === 'Manager' && q.status === 'Pending manager') || (r === 'Finance' && q.status === 'Pending finance');
    var mark = { done: icon('check'), rej: icon('x'), wait: icon('clock'), '': '' };
    box.innerHTML = head((isApprover(r) ? '<a href="inbox.html">Approval inbox</a>' : '<a href="index.html">My requests</a>') + ' / ' + q.id, '<span id="requestTitle">' + q.id + ' · ' + esc(q.title) + '</span>',
      'Raised by ' + esc(q.requester) + ' on ' + q.created, statusChip(q.status)) +
      '<div class="cols"><div class="card"><div class="card-head"><h2>Request details</h2></div><div class="pad"><dl class="kv">' +
      '<dt>Vendor</dt><dd id="requestVendor">' + esc(v.name) + '</dd><dt>Category</dt><dd>' + esc(q.category) + '</dd>' +
      '<dt>Amount (USD)</dt><dd id="requestAmount">' + money(q.amount) + '</dd><dt>Cost center</dt><dd>' + esc(q.costCenter) + '</dd>' +
      '<dt>Needed by</dt><dd>' + esc(q.neededBy) + '</dd><dt>Status</dt><dd id="requestStatus">' + statusChip(q.status) + '</dd>' +
      '<dt>Approval route</dt><dd id="approvalRoute">' + ROUTES[q.route] + '</dd><dt>Justification</dt><dd style="font-weight:400">' + esc(q.justification) + '</dd></dl></div>' +
      (canAct ? '<div class="action-box"><label for="comment">Comment <span class="muted" style="font-weight:400">(required to reject)</span></label><textarea id="comment" name="comment"></textarea><p class="err" id="commentErr"></p>' +
        '<div class="actions"><button type="button" id="approve" name="approve">' + icon('check') + '<span>Approve</span></button><button type="button" class="danger" id="reject" name="reject">' + icon('x') + '<span>Reject</span></button></div></div>' : '') +
      '</div><div style="display:grid;gap:20px">' +
      '<div class="card"><div class="card-head"><h2>Approval route</h2></div><div class="pad"><ol class="route" id="routeSteps">' +
      steps.map(function (s) {
        return '<li class="' + s[0] + '"><span class="dotc" aria-hidden="true">' + mark[s[0]] + '</span><div><b>' + s[1] + '</b><span>' + s[2] + (V24 && s[3] ? ' · ' + esc(s[3]) : '') + '</span></div></li>';
      }).join('') + '</ol></div></div>' +
      '<div class="card"><div class="card-head"><h2>History</h2></div><div class="pad" style="padding-top:8px;padding-bottom:8px"><ul class="history" id="history">' +
      q.history.map(function (x) { return '<li>' + avatar(x.who === 'System' ? 'S Y' : x.who, true) + '<div><b>' + esc(x.action) + '</b><small>' + esc(x.who) + ' · ' + esc(x.role) + ' · ' + x.at + '</small></div></li>'; }).join('') +
      '</ul></div></div></div></div>';
    if (canAct) {
      document.getElementById('approve').addEventListener('click', function () { act(q, 'Approved'); });
      document.getElementById('reject').addEventListener('click', function () {
        if (!document.getElementById('comment').value.trim()) { document.getElementById('commentErr').textContent = 'Add a comment to reject.'; return; }
        act(q, 'Rejected');
      });
    }
  }

  function act(q, action) {
    var r = role(), c = document.getElementById('comment').value.trim();
    q.history.push({ at: now(), who: USERS[r], role: r, action: action + (c ? ': ' + c : '') });
    if (action === 'Rejected') q.status = 'Rejected';
    else if (r === 'Manager' && q.route === 'finance') q.status = 'Pending finance';
    else q.status = 'Approved';
    save(); location.reload();
  }

  var page = document.body.getAttribute('data-page');
  chrome(page);
  if (allowed(page)) ({ home: home, new: newRequest, confirm: confirmation, inbox: inbox, history: approvalHistory, request: detail })[page]();
})();
