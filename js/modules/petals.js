(function () {
  if (!window.landingConfig || !window.landingConfig.effects || !window.landingConfig.effects.petals) return;

  var SPAWN_DURATION = 2200;
  var TOTAL_DURATION = 4500;
  var SPAWN_INTERVAL = 70;

  var container = document.createElement('div');
  container.id = 'petals-container';
  document.body.appendChild(container);

  var petals = [];
  var raf = null;
  var startTime = Date.now();
  var lastSpawn = 0;

  function randBetween(a, b) { return a + Math.random() * (b - a); }

  function spawnPetal() {
    var w = randBetween(18, 34);
    var h = randBetween(28, 50);
    var el = document.createElement('div');
    el.className = 'petal';
    el.style.width  = w + 'px';
    el.style.height = h + 'px';
    el.style.opacity = randBetween(0.7, 0.95);
    var startX = randBetween(0, window.innerWidth);
    el.style.left = startX + 'px';
    el.style.top  = '-60px';
    container.appendChild(el);
    petals.push({
      el: el,
      x: startX,
      y: -60,
      vy: randBetween(1.4, 2.6),
      vx: randBetween(-0.5, 0.5),
      rot: randBetween(0, 360),
      rotV: randBetween(-1.8, 1.8),
      wobble: randBetween(0, Math.PI * 2),
      wobbleSpeed: randBetween(0.015, 0.04),
      wobbleAmp: randBetween(0.5, 1.4),
      opacity: randBetween(0.7, 0.95)
    });
  }

  function tick() {
    var now = Date.now();
    var elapsed = now - startTime;

    if (elapsed < SPAWN_DURATION && now - lastSpawn > SPAWN_INTERVAL) {
      spawnPetal();
      lastSpawn = now;
    }

    var surviving = [];
    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.wobble += p.wobbleSpeed;
      p.x += p.vx + Math.sin(p.wobble) * p.wobbleAmp;
      p.y += p.vy;
      p.rot += p.rotV;

      var fadeStart = TOTAL_DURATION - 1200;
      if (elapsed > fadeStart) {
        p.opacity = Math.max(0, p.opacity - 0.012);
      }

      if (p.y > window.innerHeight + 40 || p.opacity <= 0) {
        if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
        continue;
      }

      p.el.style.transform = 'translate(' + (p.x - parseFloat(p.el.style.left)) + 'px, ' + p.y + 'px) rotate(' + p.rot + 'deg)';
      p.el.style.opacity = p.opacity;
      surviving.push(p);
    }
    petals = surviving;

    if (elapsed < TOTAL_DURATION || petals.length > 0) {
      raf = requestAnimationFrame(tick);
    } else {
      destroy();
    }
  }

  function destroy() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (container && container.parentNode) container.parentNode.removeChild(container);
    petals = [];
    container = null;
  }

  raf = requestAnimationFrame(tick);
})();
