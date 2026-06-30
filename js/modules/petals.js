(function () {
  if (!window.landingConfig || !window.landingConfig.effects || !window.landingConfig.effects.petals) return;

  var SPAWN_DURATION = 2400;
  var TOTAL_DURATION = 5000;
  var SPAWN_INTERVAL = 60;

  // Rose petal border-radius shapes — wide, rounded, organic
  var SHAPES = [
    '42% 58% 52% 48% / 62% 54% 46% 38%',
    '55% 45% 38% 62% / 50% 60% 40% 50%',
    '48% 52% 60% 40% / 44% 56% 44% 56%',
    '38% 62% 48% 52% / 58% 42% 58% 42%',
    '50% 50% 44% 56% / 60% 40% 60% 40%'
  ];

  var container = document.createElement('div');
  container.id = 'petals-container';
  document.body.appendChild(container);

  var petals = [];
  var raf = null;
  var startTime = Date.now();
  var lastSpawn = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }

  function spawnPetal() {
    var isNear = Math.random() < 0.38;
    var w, h, opacity, vy, wobbleAmp, wobbleSpeed, rotSpeed;
    var shape = SHAPES[randInt(0, SHAPES.length - 1)];

    if (isNear) {
      // Large foreground petals — slow, very visible
      w = rand(52, 82);
      h = rand(44, 70);
      opacity = rand(0.90, 0.98);
      vy = rand(1.0, 1.8);
      wobbleAmp = rand(0.4, 1.0);
      wobbleSpeed = rand(0.010, 0.022);
      rotSpeed = rand(-0.9, 0.9);
    } else {
      // Small background petals — faster, translucent
      w = rand(14, 30);
      h = rand(12, 26);
      opacity = rand(0.38, 0.62);
      vy = rand(2.2, 3.8);
      wobbleAmp = rand(0.8, 2.0);
      wobbleSpeed = rand(0.025, 0.050);
      rotSpeed = rand(-2.0, 2.0);
    }

    var el = document.createElement('div');
    el.className = isNear ? 'petal petal-near' : 'petal petal-far';
    el.style.width  = w + 'px';
    el.style.height = h + 'px';
    el.style.borderRadius = shape;

    var startX = rand(-30, window.innerWidth + 30);
    el.style.left = startX + 'px';
    el.style.top  = '-90px';
    container.appendChild(el);

    petals.push({
      el: el,
      x: startX,
      y: -90,
      vy: vy,
      vx: rand(-0.35, 0.35),
      rot: rand(0, 360),
      rotV: rotSpeed,
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: wobbleSpeed,
      wobbleAmp: wobbleAmp,
      opacity: opacity,
      maxOpacity: opacity,
      isNear: isNear
    });
  }

  function tick() {
    var now = Date.now();
    var elapsed = now - startTime;

    if (elapsed < SPAWN_DURATION && now - lastSpawn > SPAWN_INTERVAL) {
      spawnPetal();
      lastSpawn = now;
    }

    var fadeStart = TOTAL_DURATION - 1400;
    var surviving = [];

    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.wobble += p.wobbleSpeed;
      p.x += p.vx + Math.sin(p.wobble) * p.wobbleAmp;
      p.y += p.vy;
      p.rot += p.rotV;

      if (elapsed > fadeStart) {
        var fadeProgress = (elapsed - fadeStart) / 1400;
        p.opacity = Math.max(0, p.maxOpacity * (1 - fadeProgress));
      }

      if (p.y > window.innerHeight + 60 || p.opacity <= 0.01) {
        if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
        continue;
      }

      var dx = p.x - parseFloat(p.el.style.left);
      p.el.style.transform = 'translate(' + dx + 'px,' + p.y + 'px) rotate(' + p.rot + 'deg)';
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
