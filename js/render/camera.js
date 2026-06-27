'use strict';
// Camera 3D cinematica: orbita automatica, preset views, dynamic follow, screen shake
APP.camera = (function() {
  'use strict';
  var cfg = APP.config;
  var curArena = APP.arena;
  var cam = cfg.camera;

  // Stato camera
  var currentPreset = 1;

  // Screen shake
  var shakeIntensity = 0;
  var shakeDecay = 0.92;
  var shakeOffsetX = 0;
  var shakeOffsetY = 0;

  // Target dinamico per lerp
  var target = { cx: cam.cx, cy: cam.cy, cz: cam.cz, elev: cam.elevation, angle: cam.angle };
  var lerpSpeed = 0.04;

  // Preset camera con inquadrature ottimizzate
  var presets = {
    1: { name: 'Default',       radius: 14, theta: 0,   phi: 45, targetMode: 'arena',  lerp: 0.06 },
    2: { name: 'Top-Down',      radius: 18, theta: 0,   phi: 85, targetMode: 'arena',  lerp: 0.05 },
    3: { name: 'Side View',     radius: 12, theta: 90,  phi: 35, targetMode: 'arena',  lerp: 0.05 },
    4: { name: 'POV Paddle',    radius: 5,  theta: 0,   phi: 30, targetMode: 'paddle', lerp: 0.06 },
    5: { name: 'Dynamic View',  radius: 12, theta: 45,  phi: 35, targetMode: 'ball',   lerp: 0.07 }
  };


  // ---- PRESET ----
  function setPreset(num) {
    if (presets[num]) {
      currentPreset = num;
      lerpSpeed = presets[num].lerp;
    }
  }

  function getCurrentPreset() { return currentPreset; }
  function getPresetName() { return presets[currentPreset] ? presets[currentPreset].name : 'Unknown'; }

  // ---- UPDATE (chiamato ogni frame) ----
  function update(dt) {
    var preset = presets[currentPreset];
    if (!preset) return;

    // Calcola target center (cosa guardare)
    var targetX = 0, targetY = 0, targetZ = 0;
    var arena = curArena;
    var ball = arena.getBall();
    var paddle = arena.getPaddle();

    if (preset.targetMode === 'arena') {
      targetX = 0;
      targetY = 0;
      targetZ = -cfg.arena.height / 2;
    } else if (preset.targetMode === 'paddle' && paddle) {
      targetX = paddle.x - cfg.arena.width / 2;
      targetY = 0;
      targetZ = -paddle.y;
    } else if (preset.targetMode === 'ball' && ball) {
      targetX = ball.x - cfg.arena.width / 2;
      targetY = 0;
      targetZ = -ball.y;
    }

    // Angolo theta (orizzontale) — sempre dal preset
    var theta = preset.theta;

    var thetaRad = Math.PI * theta / 180;
    var phiRad = Math.PI * preset.phi / 180;

    // Calcola posizione target della camera (sferica → cartesiana)
    target.cx = targetX + preset.radius * Math.sin(thetaRad) * Math.cos(phiRad);
    target.cy = targetY + preset.radius * Math.sin(phiRad);
    target.cz = targetZ + preset.radius * Math.cos(thetaRad) * Math.cos(phiRad);

    // Elevazione: -phi per guardare verso il target
    // phi=45 → -45° (default 3/4 view)  ✓
    // phi=85 → -85° (quasi top-down)     ✓
    // phi=30 → -30° (leggera inclinazione) ✓
    target.elevation = -preset.phi;
    // Angolo = opposto alla posizione rispetto al target
    target.angle = -theta;

    // Lerp smooth verso il target
    cam.cx += (target.cx - cam.cx) * lerpSpeed;
    cam.cy += (target.cy - cam.cy) * lerpSpeed;
    cam.cz += (target.cz - cam.cz) * lerpSpeed;
    cam.elevation += (target.elevation - cam.elevation) * lerpSpeed;
    cam.angle += (target.angle - cam.angle) * lerpSpeed;

    // Screen shake (smorza gradualmente)
    if (shakeIntensity > 0.01) {
      shakeOffsetX = (Math.random() - 0.5) * shakeIntensity;
      shakeOffsetY = (Math.random() - 0.5) * shakeIntensity;
      shakeIntensity *= shakeDecay;
    } else {
      shakeOffsetX = 0;
      shakeOffsetY = 0;
    }
  }

  // ---- SCREEN SHAKE ----
  function triggerShake(intensity) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
  }

  // ---- GET VIEW MATRIX (con shake) ----
  function getViewMatrix() {
    return APP.math.MakeView(
      cam.cx + shakeOffsetX,
      cam.cy + shakeOffsetY,
      cam.cz,
      cam.elevation,
      cam.angle
    );
  }

  function getEyePosition() { return [0.0, 0.0, 0.0]; }

  function zoom(delta) {
    cfg.rendering.fieldOfViewDeg -= delta;
    if (cfg.rendering.fieldOfViewDeg > 170) cfg.rendering.fieldOfViewDeg = 170;
    if (cfg.rendering.fieldOfViewDeg < 5) cfg.rendering.fieldOfViewDeg = 5;
  }

  return {
    getViewMatrix: getViewMatrix,
    getEyePosition: getEyePosition,
    update: update,
    zoom: zoom,
    setPreset: setPreset,
    getCurrentPreset: getCurrentPreset,
    getPresetName: getPresetName,
    triggerShake: triggerShake
  };
})();