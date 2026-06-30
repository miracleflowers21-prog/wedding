'use strict';

var imgTarget = null;

// ── Login & panel ──────────────────────────────────────────────────────────
function openLogin() {
  document.getElementById('loginOverlay').classList.add('visible');
  setTimeout(function () { document.getElementById('loginInput').focus(); }, 100);
}
function doLogin() {
  var PASS = atob('bWlyYWNsZTIwMjQ='); // miracle2024
  if (document.getElementById('loginInput').value === PASS) {
    document.getElementById('loginOverlay').classList.remove('visible');
    document.getElementById('loginInput').value = '';
    document.getElementById('editTrigger').classList.add('visible');
  } else {
    document.getElementById('loginErr').style.display = 'block';
    document.getElementById('loginInput').value = '';
  }
}
function openPanel()  { document.getElementById('editPanel').classList.add('open'); document.getElementById('panelOverlay').classList.add('visible'); }
function closePanel() { document.getElementById('editPanel').classList.remove('open'); document.getElementById('panelOverlay').classList.remove('visible'); }

// ── Fill panel inputs from D ───────────────────────────────────────────────
function fillPanel() {
  var fields = ['names','title1','title2','text','cta','phone','phoneLink','address','website','instagram'];
  fields.forEach(function (f) {
    var el = document.getElementById('p_' + f);
    if (el) el.value = D[f] ? D[f].replace('&amp;','&') : '';
  });
  ['colorGreen','colorGold','colorBg'].forEach(function (f) {
    var el = document.getElementById('p_' + f); if (el) el.value = D[f] || '';
  });
  ['titleSize','namesSize','textSize','priceSize'].forEach(function (f) {
    var el = document.getElementById('p_' + f);
    if (el) {
      el.value = D[f] || '';
      var vEl = document.getElementById('v_' + f);
      if (vEl) vEl.textContent = (D[f] || '') + 'px';
    }
  });
  if (D.heroPhoto && D.heroPhoto !== 'photo.jpg') showPreview('prev_heroPhoto', D.heroPhoto);
  if (D.heroLogo  && D.heroLogo  !== 'logo.png')  showPreview('prev_heroLogo',  D.heroLogo);
}

function buildCertsPanel() {
  var panel = document.getElementById('certsPanel');
  if (!panel || !D.certs) return;
  panel.innerHTML = '';
  D.certs.forEach(function (c, i) {
    var div = document.createElement('div');
    div.className = 'cert-panel-item';
    div.innerHTML =
      '<div class="cert-panel-label">Сертификат ' + (i+1) + '</div>' +
      '<div style="margin-bottom:6px"><div class="panel-label" style="font-size:11px">Сумма ₽</div>' +
      '<input class="panel-input" value="' + c.amount + '" data-i="' + i + '" data-f="amount" oninput="onCertField(this)"></div>' +
      '<div style="margin-bottom:6px"><div class="panel-label" style="font-size:11px">Тег</div>' +
      '<input class="panel-input" value="' + c.tag + '" data-i="' + i + '" data-f="tag" oninput="onCertField(this)"></div>' +
      '<div class="panel-img-btn" style="font-size:11px;padding:8px;" onclick="pickCertImg(' + i + ')">📷 Фото</div>' +
      '<img id="certPrev' + i + '" class="panel-img-preview"' +
        (c.img && c.img !== 'certificate.jpg' ? ' src="' + c.img + '" style="display:block"' : '') + '/>';
    panel.appendChild(div);
  });
}

function onCertField(el) {
  var i = parseInt(el.dataset.i), f = el.dataset.f;
  D.certs[i][f] = el.value;
  if (f === 'amount') {
    var fmt = parseInt(el.value).toLocaleString('ru-RU');
    var pr = document.getElementById('certPrice' + i);
    if (pr) pr.textContent = fmt + ' ₽';
    var cards = document.querySelectorAll('.cert-card');
    if (cards[i]) cards[i].dataset.amount = el.value;
    var sel = document.getElementById('certAmt');
    if (sel) {
      sel.innerHTML = '<option value="">— выберите сертификат —</option>';
      D.certs.forEach(function (c) { sel.innerHTML += '<option value="' + c.amount + '">' + parseInt(c.amount).toLocaleString('ru-RU') + ' ₽</option>'; });
    }
  }
  if (f === 'tag') { var tg = document.getElementById('certTag' + i); if (tg) tg.textContent = el.value; }
}

function pickCertImg(i)  { imgTarget = 'cert_' + i; document.getElementById('imgFilePicker').click(); }
function pickImg(target) { imgTarget = target; document.getElementById('imgFilePicker').click(); }

function showPreview(prevId, src) {
  var p = document.getElementById(prevId);
  if (p) { p.src = src; p.classList.add('visible'); }
}

function applyLive() {
  var fields = ['names','title1','title2','text','cta','phone','phoneLink','address','website','instagram'];
  fields.forEach(function (f) { var el = document.getElementById('p_' + f); if (el) D[f] = el.value; });
  ['colorGreen','colorGold','colorBg'].forEach(function (f) { var el = document.getElementById('p_' + f); if (el) D[f] = el.value; });
  ['titleSize','namesSize','textSize','priceSize'].forEach(function (f) { var el = document.getElementById('p_' + f); if (el) D[f] = parseInt(el.value); });
  applyDataToPage();
}

// ── Image upload: canvas → WebP → download ────────────────────────────────
function onImgPicked(e) {
  var file = e.target.files[0];
  if (!file) return;
  e.target.value = '';
  var tmpImg = new Image();
  var objUrl = URL.createObjectURL(file);
  tmpImg.onload = function () {
    var MAX = 1280;
    var w = tmpImg.naturalWidth, h = tmpImg.naturalHeight;
    if (w > MAX || h > MAX) {
      if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
      else { w = Math.round(w * MAX / h); h = MAX; }
    }
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(tmpImg, 0, 0, w, h);
    URL.revokeObjectURL(objUrl);

    var fname;
    if (imgTarget && imgTarget.indexOf('cert_') === 0) {
      fname = 'cert-' + (parseInt(imgTarget.replace('cert_','')) + 1) + '.webp';
    } else if (imgTarget === 'heroLogo') {
      fname = 'logo.webp';
    } else {
      fname = (imgTarget || 'image') + '.webp';
    }
    var assetPath = 'assets/' + fname;

    cv.toBlob(function (blob) {
      var dlUrl = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = dlUrl; a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);

      if (imgTarget && imgTarget.indexOf('cert_') === 0) {
        var idx = parseInt(imgTarget.replace('cert_',''));
        D.certs[idx].img = assetPath;
        var ci = document.getElementById('certImg' + idx); if (ci) ci.src = dlUrl;
        var cp = document.getElementById('certPrev' + idx); if (cp) { cp.src = dlUrl; cp.style.display = 'block'; }
      } else {
        D[imgTarget] = assetPath;
        var el = document.getElementById(imgTarget); if (el) el.src = dlUrl;
        if (imgTarget === 'heroLogo') { D.footerLogo = assetPath; var fl = document.getElementById('footerLogo'); if (fl) fl.src = dlUrl; }
        showPreview('prev_' + imgTarget, dlUrl);
      }
      saveD();
      _showImgNote(fname);
    }, 'image/webp', 0.87);
  };
  tmpImg.src = objUrl;
}

function _showImgNote(fname) {
  var n = document.getElementById('_imgNote');
  if (!n) {
    n = document.createElement('div'); n.id = '_imgNote';
    n.style.cssText = 'position:fixed;bottom:80px;right:24px;background:#1a1410;border:1px solid rgba(184,149,42,0.5);color:#D4AF5A;padding:14px 18px;border-radius:12px;font-family:Jost,sans-serif;font-size:13px;z-index:999999;max-width:300px;line-height:1.6;box-shadow:0 4px 20px rgba(0,0,0,0.4);';
    document.body.appendChild(n);
  }
  n.innerHTML = '⬇️ <strong style="color:#fff">' + fname + '</strong> скачан.<br>Поместите в папку <code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px;">assets/</code> рядом с index.html.<br><span style="opacity:0.55;font-size:11px">Загрузите оба файла на GitHub.</span>';
  n.style.display = 'block';
  clearTimeout(n._t);
  n._t = setTimeout(function () { n.style.display = 'none'; }, 10000);
}

// ── Save & Export ─────────────────────────────────────────────────────────
function doSave() {
  saveD();

  // Restore asset paths from D (blob URLs are session-only)
  ['heroPhoto','heroLogo','footerLogo'].forEach(function (k) {
    var el = document.getElementById(k === 'footerLogo' ? 'footerLogo' : k);
    if (el) el.src = D[k] || '';
  });
  if (D.certs) D.certs.forEach(function (c, i) {
    var ci = document.getElementById('certImg' + i); if (ci) ci.src = c.img || '';
    var cp = document.getElementById('certPrev' + i); if (cp && cp.style.display !== 'none') cp.src = c.img || '';
  });
  var ph = document.getElementById('prev_heroPhoto');
  if (ph && ph.classList.contains('visible')) ph.src = D.heroPhoto || '';
  var pl = document.getElementById('prev_heroLogo');
  if (pl && pl.classList.contains('visible')) pl.src = D.heroLogo || '';

  // Hide editor UI
  var panel = document.getElementById('editPanel');
  var overlay = document.getElementById('panelOverlay');
  var trigger = document.getElementById('editTrigger');
  var login   = document.getElementById('loginOverlay');
  if (panel)   panel.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
  if (trigger) trigger.classList.remove('visible');
  if (login)   login.classList.remove('visible');

  setTimeout(function () {
    var html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    html = html.replace(/class="panel open"/g,           'class="panel"');
    html = html.replace(/class="panel-overlay visible"/g, 'class="panel-overlay"');
    html = html.replace(/class="edit-trigger visible"/g,  'class="edit-trigger"');
    html = html.replace(/class="login-overlay visible"/g, 'class="login-overlay"');
    html = html.replace(/class="pay-modal-overlay visible"/g, 'class="pay-modal-overlay"');

    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'index.html';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    if (trigger) trigger.classList.add('visible');
    setTimeout(function () {
      alert('✅ index.html скачан!\n\nЗагрузи его на GitHub вместо старого файла.\nЕсли меняли фото — также загрузи папку assets/ с новыми изображениями.');
    }, 200);
  }, 400);
}

// ── Init editor on load ───────────────────────────────────────────────────
window.addEventListener('load', function () {
  fillPanel();
  buildCertsPanel();
});
