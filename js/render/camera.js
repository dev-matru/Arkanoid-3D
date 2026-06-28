'use strict';
// Cinematic 3D camera: orbit, preset views, dynamic follow, screen shake
APP.camera = (function() {
  'use strict';
  var cfg = APP.config;
  var curArena = APP.arena;
  var cam = cfg.camera;

  // Camera state
  var currentPreset = 1;

  // Screen shake
  var shakeIntensity = 0;
  var shakeDecay = 0.92;
  var shakeOffsetX = 0;
  var shakeOffsetY = 0;

  // Dynamic target for lerp
  var target = { cx: cam.cx, cy: cam.cy, cz: cam.cz, elev: cam.elevation, angle: cam.angle };
  var lerpSpeed = 0.04;

  // Camera presets with optimized framing
  var presets = {
    1: { name: 'Default',       radius: 14, theta: 0,   phi: 45, targetMode: 'arena',  lerp: 0.06 },
    2: { name: 'Top-Down',      radius: 18, theta: 0,   phi: 85, targetMode: 'arena',  lerp: 0.05 },
    3: { name: 'Side View',     radius: 12, theta: 90,  phi: 35, targetMode: 'arena',  lerp: 0.05 },
    4: { name: 'POV Paddle',    radius: 5,  theta: 0,   phi: 30, targetMode: 'paddle', lerp: 0.06 },
    5: { name: 'Ball POV',      radius: 12, theta: 'follow', phi: 35, targetMode: 'ball',   lerp: 0.07 }
  };

  // Angle tracking for Dynamic View (smooth orbital)
  var followTheta = 0;
  var followLerp = 0.08;


  // ---- PRESET ----
  function setPreset(num) {
    if (presets[num]) {
      currentPreset = num;
      lerpSpeed = presets[num].lerp;
    }
  }

  function getCurrentPreset() { return currentPreset; }
  function getPresetName() { return presets[currentPreset] ? presets[currentPreset].name : 'Unknown'; }

  // ---- UPDATE (called every frame) ----
  function update(dt) {
    var preset = presets[currentPreset];
    if (!preset) return;

    // Calculate target center (what to look at)
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

    // Calculate theta: fixed for numeric presets, smooth orbital for 'follow'
    var theta;
    if (preset.theta === 'follow' && ball) {
      // LIGHT orbit: base theta 0°, ±30° based on ball position
      // Ball at center → theta=0° (centered), ball at edges → ±30°
      var bx_norm = (ball.x - cfg.arena.width / 2) / (cfg.arena.width / 2);
      bx_norm = Math.max(-1, Math.min(1, bx_norm));
      var targetTheta = bx_norm * 15;

      // Smooth tracking
      var diff = targetTheta - followTheta;
      followTheta += diff * followLerp;
      theta = followTheta;
    } else {
      theta = preset.theta;
    }

    var thetaRad = Math.PI * theta / 180;
    var phiRad = Math.PI * preset.phi / 180;

    // Compute camera target position (spherical → cartesian)
    target.cx = targetX + preset.radius * Math.sin(thetaRad) * Math.cos(phiRad);
    target.cy = targetY + preset.radius * Math.sin(phiRad);
    target.cz = targetZ + preset.radius * Math.cos(thetaRad) * Math.cos(phiRad);

    // Elevation: -phi to look toward target
    // phi=45 → -45° (default 3/4 view)  ✓
    // phi=85 → -85° (close to top-down)     ✓
    // phi=30 → -30° (slight tilt) ✓
    target.elevation = -preset.phi;
    // Angle = opposite to position relative to target
    target.angle = -theta;

    // Smooth lerp toward target
    cam.cx += (target.cx - cam.cx) * lerpSpeed;
    cam.cy += (target.cy - cam.cy) * lerpSpeed;
    cam.cz += (target.cz - cam.cz) * lerpSpeed;
    cam.elevation += (target.elevation - cam.elevation) * lerpSpeed;
    cam.angle += (target.angle - cam.angle) * lerpSpeed;

    // Screen shake (gradual decay)
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

  // ---- GET VIEW MATRIX (with shake) ----
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
