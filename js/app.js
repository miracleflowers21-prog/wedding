'use strict';

// Global state
var D = {};
var selAmt = null;
var selQty = 1;
var _payMethod = null;

// ── Init ──────────────────────────────────────────────────────────────────
window.addEventListener('load', function () {
  var sdEl = document.getElementById('siteData');
  if (sdEl) D = JSON.parse(sdEl.textContent);

  applyDataToPage();
  buildCerts();

  // Load petals module if enabled
  if (window.landingConfig && window.landingConfig.effects && window.landingConfig.effects.petals) {
    var s = document.createElement('script');
    s.src = 'js/modules/petals.js';
    document.head.appendChild(s);
  }

  var loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 500);
  }
});

document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'е' || e.key === 'У')) {
    e.preventDefault();
    openLogin();
  }
});

// ── Data helpers ──────────────────────────────────────────────────────────
function saveD() {
  var el = document.getElementById('siteData');
  if (el) el.textContent = JSON.stringify(D, null, 2);
}

function applyDataToPage() {
  setText('heroTitle1', D.title1);
  setText('heroTitle2', D.title2);
  setText('heroNames', D.names ? D.names.replace('&amp;', '&') : '');
  setText('heroText', D.text);
  setText('heroCta', D.cta);
  setSrc('heroPhoto', D.heroPhoto);
  setSrc('heroLogo', D.heroLogo);
  setSrc('footerLogo', D.footerLogo);

  var pl = document.getElementById('phoneLink');
  if (pl) { pl.textContent = D.phone; pl.href = 'tel:' + D.phoneLink; }
  setText('footerAddr', D.address);
  var fw = document.getElementById('footerWeb');
  if (fw) { fw.textContent = D.website; fw.href = 'https://' + D.website; }
  var fi = document.getElementById('footerIg');
  if (fi) { fi.textContent = D.instagram; fi.href = 'https://instagram.com/' + (D.instagram || '').replace('@', ''); }

  document.documentElement.style.setProperty('--leaf-green', D.colorGreen);
  document.documentElement.style.setProperty('--gold', D.colorGold);
  document.documentElement.style.setProperty('--cream', D.colorBg);

  setFontSize('heroTitle', D.titleSize);
  setFontSize('heroNames', D.namesSize);
  setFontSize('heroText', D.textSize);
  document.querySelectorAll('.cert-price').forEach(function (el) { el.style.fontSize = D.priceSize + 'px'; });
}

function setText(id, val) { var el = document.getElementById(id); if (el && val !== undefined) el.textContent = val; }
function setSrc(id, val)  { var el = document.getElementById(id); if (el && val) el.src = val; }
function setFontSize(id, val) { var el = document.getElementById(id); if (el && val) el.style.fontSize = val + 'px'; }

// ── Cert cards ────────────────────────────────────────────────────────────
function buildCerts() {
  var grid = document.getElementById('certsGrid');
  var sel  = document.getElementById('certAmt');
  if (!grid || !D.certs) return;
  grid.innerHTML = '';
  if (sel) sel.innerHTML = '<option value="">— выберите сертификат —</option>';

  D.certs.forEach(function (c, i) {
    var fmt = parseInt(c.amount).toLocaleString('ru-RU');
    var card = document.createElement('div');
    card.className = 'cert-card';
    card.dataset.amount = c.amount;
    card.onclick = function () { selectCert(this); };
    card.innerHTML =
      '<div class="cert-img-wrap"><img class="cert-img" id="certImg' + i + '" src="' + (c.img || 'assets/cert-1.jpg') + '" alt=""/></div>' +
      '<div class="cert-price" id="certPrice' + i + '" style="font-size:' + (D.priceSize || 34) + 'px">' + fmt + ' ₽</div>' +
      '<div class="cert-sublabel">Сертификат</div>' +
      '<div><span class="cert-tag" id="certTag' + i + '">' + c.tag + '</span></div>' +
      '<div class="qty-wrap" onclick="event.stopPropagation()">' +
        '<button class="qty-btn" onclick="chQty(this,-1)">−</button>' +
        '<div class="qty-val">1</div>' +
        '<button class="qty-btn" onclick="chQty(this,1)">+</button>' +
      '</div>';
    grid.appendChild(card);
    if (sel) sel.innerHTML += '<option value="' + c.amount + '">' + fmt + ' ₽</option>';
  });
}

// ── Cert selection ─────────────────────────────────────────────────────────
function selectCert(el) {
  document.querySelectorAll('.cert-card').forEach(function (c) { c.classList.remove('selected'); });
  el.classList.add('selected');
  selAmt = el.dataset.amount;
  selQty = parseInt(el.querySelector('.qty-val').textContent) || 1;
  var sel = document.getElementById('certAmt');
  if (sel) sel.value = selAmt;
  updateSum();
  var form = document.getElementById('order-form');
  if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function chQty(btn, d) {
  var w = btn.parentElement, v = w.querySelector('.qty-val');
  var n = Math.max(1, (parseInt(v.textContent) || 1) + d);
  v.textContent = n;
  var card = w.closest('.cert-card');
  if (card && card.classList.contains('selected')) { selQty = n; updateSum(); }
}

function updateSum() {
  if (!selAmt) return;
  var t = parseInt(selAmt) * selQty;
  var lbl = document.getElementById('selLabel');
  var price = document.getElementById('selPrice');
  var disp = document.getElementById('selDisplay');
  if (lbl) lbl.textContent = selQty > 1 ? selQty + ' × ' + parseInt(selAmt).toLocaleString('ru-RU') + ' ₽' : 'Сертификат';
  if (price) price.textContent = t.toLocaleString('ru-RU') + ' ₽';
  if (disp) disp.style.display = 'flex';
}

function syncSel(s) {
  selAmt = s.value || null;
  if (!selAmt) return;
  document.querySelectorAll('.cert-card').forEach(function (c) {
    var match = c.dataset.amount === selAmt;
    c.classList.toggle('selected', match);
    if (match) selQty = parseInt(c.querySelector('.qty-val').textContent) || 1;
  });
  updateSum();
}

// ── Payment flow ──────────────────────────────────────────────────────────
function submitForm() {
  var name  = (document.getElementById('gName')  || {}).value || '';
  var phone = (document.getElementById('gPhone') || {}).value || '';
  var amt   = (document.getElementById('certAmt') || {}).value || '';
  var trap  = (document.getElementById('_trap')  || {}).value || '';

  if (trap) return; // honeypot triggered
  if (!name.trim() || !phone.trim() || !amt) {
    alert('Пожалуйста, заполните имя, телефон и выберите сумму депозита.');
    return;
  }
  openPayModal();
}

function openPayModal() {
  var total = selAmt ? parseInt(selAmt) * selQty : 0;
  var amtEl = document.getElementById('payModalAmount');
  if (amtEl) amtEl.innerHTML = '<strong>' + (total > 0 ? total.toLocaleString('ru-RU') + ' ₽' : '—') + '</strong>';
  _payMethod = null;
  var note = document.getElementById('payTransferNote');
  var btn  = document.getElementById('payConfirmBtn');
  if (note) note.style.display = 'none';
  if (btn)  btn.style.display  = 'none';
  document.querySelectorAll('.pay-method-btn').forEach(function (b) { b.classList.remove('active'); });
  var overlay = document.getElementById('payModalOverlay');
  if (overlay) overlay.classList.add('visible');
}

function closePayModal() {
  var overlay = document.getElementById('payModalOverlay');
  if (overlay) overlay.classList.remove('visible');
}

function selectPayment(method) {
  _payMethod = method;
  document.querySelectorAll('.pay-method-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.method === method);
  });
  var note = document.getElementById('payTransferNote');
  var btn  = document.getElementById('payConfirmBtn');
  if (method === 'transfer') {
    if (note) note.style.display = 'block';
    if (btn)  { btn.style.display = 'block'; btn.textContent = 'Подтвердить заявку'; }
  } else if (method === 'card') {
    if (note) note.style.display = 'none';
    if (btn)  { btn.style.display = 'block'; btn.textContent = 'Перейти к оплате'; }
  }
}

function confirmPayment() {
  if (!_payMethod) return;
  if (_payMethod === 'transfer') {
    _submitToFormspree('Перевод на карту');
  } else if (_payMethod === 'card') {
    if (window.landingConfig && window.landingConfig.payment && window.landingConfig.payment.robokassaEnabled) {
      _redirectRobokassa();
    } else {
      _submitToFormspree('Оплата картой (ожидает настройки)');
    }
  }
}

function _submitToFormspree(paymentMethod) {
  var btn = document.getElementById('payConfirmBtn');
  if (btn) { btn.textContent = 'Отправляем…'; btn.disabled = true; }

  var name    = (document.getElementById('gName')  || {}).value || '—';
  var phone   = (document.getElementById('gPhone') || {}).value || '—';
  var email   = (document.getElementById('gEmail') || {}).value || '—';
  var msg     = (document.getElementById('gMsg')   || {}).value || '—';
  var total   = selAmt ? parseInt(selAmt) * selQty : 0;

  var url = (window.landingConfig && window.landingConfig.formspreeUrl) || 'https://formspree.io/f/xeewabvz';

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      _subject: 'Депозит ' + total.toLocaleString('ru-RU') + ' ₽ — ' + paymentMethod,
      Имя: name,
      Телефон: phone,
      Email: email,
      Итого: total.toLocaleString('ru-RU') + ' ₽',
      'Способ оплаты': paymentMethod,
      Пожелание: msg
    })
  })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    closePayModal();
    if (data.ok) {
      var form = document.getElementById('order-form');
      var ok   = document.getElementById('okMsg');
      var subBtn = document.getElementById('subBtn');
      if (_payMethod === 'transfer') {
        if (ok) { ok.innerHTML = '<h3>Заявка принята ✦</h3><p>Наш менеджер свяжется с вами в течение 15 минут для оформления перевода.</p>'; ok.classList.add('visible'); }
      } else {
        if (ok) { ok.classList.add('visible'); }
      }
      if (subBtn) subBtn.style.display = 'none';
    } else {
      alert('Ошибка отправки. Позвоните нам: ' + (D.phone || ''));
      if (btn) { btn.textContent = 'Подтвердить'; btn.disabled = false; }
    }
  })
  .catch(function () {
    closePayModal();
    alert('Ошибка сети. Позвоните нам: ' + (D.phone || ''));
    if (btn) { btn.textContent = 'Подтвердить'; btn.disabled = false; }
  });
}

function _redirectRobokassa() {
  // Placeholder: integrate Robokassa when credentials are provided
  var cfg = window.landingConfig.payment;
  var total = selAmt ? parseInt(selAmt) * selQty : 0;
  var url = 'https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=' +
    encodeURIComponent(cfg.merchantLogin) + '&OutSum=' + total + '&InvId=0&IsTest=1';
  window.location.href = url;
}

// ── Callback form ─────────────────────────────────────────────────────────
function submitCb() {
  var phone = (document.getElementById('cbPhone') || {}).value || '';
  if (!phone.trim()) { alert('Введите номер телефона'); return; }
  var btn = document.querySelector('.callback-btn');
  if (btn) { btn.textContent = 'Отправляем…'; btn.disabled = true; }
  var url = (window.landingConfig && window.landingConfig.formspreeUrl) || 'https://formspree.io/f/xeewabvz';
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      _subject: 'Обратный звонок — Miracle Flowers',
      Имя: (document.getElementById('cbName') || {}).value || '—',
      Телефон: phone
    })
  })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    if (data.ok) {
      var ok = document.getElementById('cbOk');
      if (ok) ok.classList.add('visible');
      if (btn) btn.style.display = 'none';
    } else {
      if (btn) { btn.textContent = 'Перезвоните мне'; btn.disabled = false; }
    }
  })
  .catch(function () {
    if (btn) { btn.textContent = 'Перезвоните мне'; btn.disabled = false; }
  });
}
