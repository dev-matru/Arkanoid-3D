'use strict';
// Physics: ball movement, collisions, bouncing with delta-time and sub-stepping
//
// ANGLE SYSTEM: 0°=right, 90°=UP, 180°=left, 270°=down
// NOTE: ball.y increases UPWARD (top wall at y=10), decreases DOWNWARD (paddle at y=-0.25)
//
APP.physics = (function() {
  'use strict';
  var cfg = APP.config;
  var curArena = APP.arena;
  var math = APP.math;
  var audioPool = {};
  var currentMusic = null;
  var currentMusicBaseVolume = 0;

  var prevPaddleX = 0;

  // ---- AUDIO ----
  function playSound(path, volume) {
    var type = path.indexOf('song.mp3') !== -1 ? 'music' : 'sfx';
    var audioCfg = cfg.audio || {};
    var enabled = type === 'music' ? audioCfg.musicEnabled !== false : audioCfg.sfxEnabled !== false;
    var level = type === 'music' ? audioCfg.musicVolume : audioCfg.sfxVolume;
    var finalVolume = volume * ((Number(level) || 0) / 100);

    if (type === 'music') {
      if (!currentMusic || currentMusic.src.indexOf(path) === -1) {
        if (currentMusic) currentMusic.pause();
        currentMusic = new Audio(path);
        currentMusic.loop = true;
      }
      currentMusicBaseVolume = volume;
      if (!enabled || finalVolume <= 0) {
        currentMusic.pause();
        return;
      }
      currentMusic.volume = Math.min(1, finalVolume);
      currentMusic.play().catch(function() {});
      return;
    }

    if (!enabled || finalVolume <= 0) return;

    if (!audioPool[path]) audioPool[path] = new Audio(path);
    var audio = audioPool[path].cloneNode();
    audio.volume = Math.min(1, finalVolume);
    audio.play().catch(function() {});
  }

  function syncAudioSettings() {
    if (!currentMusic) return;

    var audioCfg = cfg.audio || {};
    var musicVolume = Number(audioCfg.musicVolume) || 0;
    currentMusic.volume = Math.min(1, currentMusicBaseVolume * (musicVolume / 100));

    if (audioCfg.musicEnabled === false || musicVolume <= 0) {
      currentMusic.pause();
    } else {
      currentMusic.play().catch(function() {});
    }
  }

  // ---- SCORE ----
  function addScore() {
    cfg.game.score++;
    document.getElementById('score').innerText =
      'SCORE: ' + cfg.game.score + '/' + cfg.game.maxScore;
  }

  // ---- PADDLE BOUNCE (based on hit position) ----
  function resolvePaddleBounce(ball, paddle) {
    // hitPos: -1 (paddle left) ... 0 (center) ... +1 (right)
    var hitPos = (ball.x - paddle.x) / (paddle.width / 2);
    hitPos = Math.max(-1, Math.min(1, hitPos));

    // Paddle velocity for horizontal transfer
    var paddleVel = paddle.x - prevPaddleX;

    // EXIT ANGLE: ball must go UPWARD (increasing y)
    // Paddle center (hitPos=0) → 90° (straight up)
    // Left edge (hitPos=-1) → 90+65=155° (up-left)
    // Right edge (hitPos=+1) → 90-65=25° (up-right)
    var maxAngle = cfg.physics.paddleHitMaxAngle; // 65
    var newAngle = 90 - hitPos * maxAngle;
    newAngle = ((newAngle % 360) + 360) % 360;

    // Move ball ABOVE the paddle (paddle y + offset upward)
    // paddle.y = -0.25, paddle.height/2 = 0.125, ball.radius = 0.2
    // ball.y = -0.25 + 0.125 + 0.2 + 0.01 = 0.085 (sopra il paddle) ✓
    ball.y = paddle.y + paddle.height / 2 + ball.radius + 0.01;

    // Apply angle + paddle velocity transfer
    var rad = math.degToRad(newAngle);
    var vx = ball.speed * Math.cos(rad);
    var vy = ball.speed * Math.sin(rad);
    vx += paddleVel * cfg.physics.paddleVelocityTransfer;

    // Recalculate speed and angle
    var newSpeed = Math.sqrt(vx * vx + vy * vy);
    ball.speed = Math.min(newSpeed, cfg.physics.maxBallSpeed);
    ball.angle = Math.atan2(vy, vx) * 180 / Math.PI;
    ball.angle = ((ball.angle % 360) + 360) % 360;

    // Progressive acceleration
    ball.speed = Math.min(ball.speed * cfg.physics.speedIncrement, cfg.physics.maxBallSpeed);

    playSound('assets/audio/bounce.wav', 0.2);
  }

  // ---- WALL / BLOCK BOUNCE (axial reflection + push) ----
  function resolveWallBounce(ball, object) {
    // Determine which face was hit by comparing overlaps
    var overlapX = (ball.x - object.x) / (object.width / 2 + ball.radius);
    var overlapY = (ball.y - object.y) / (object.height / 2 + ball.radius);

    if (Math.abs(overlapX) > Math.abs(overlapY)) {
      // VERTICAL bounce (left or right face of object)
      ball.angle = 180 - ball.angle;
      // Push: if ball is left of center → push left, otherwise push right
      if (ball.x < object.x)
        ball.x = object.x - object.width / 2 - ball.radius - 0.01;
      else
        ball.x = object.x + object.width / 2 + ball.radius + 0.01;
    } else {
      // HORIZONTAL bounce (top or bottom face of object)
      ball.angle = 360 - ball.angle;
      // Push: if ball is below center → push down, otherwise push up
      if (ball.y < object.y)
        ball.y = object.y - object.height / 2 - ball.radius - 0.01;
      else
        ball.y = object.y + object.height / 2 + ball.radius + 0.01;
    }
    ball.angle = ((ball.angle % 360) + 360) % 360;
  }

  // ---- COLLISION CHECK: circle (ball) vs AABB ----
  function checkBallVsAABB(ball, obj) {
    var halfW = obj.width / 2;
    var halfH = obj.height / 2;
    var closestX = Math.max(obj.x - halfW, Math.min(ball.x, obj.x + halfW));
    var closestY = Math.max(obj.y - halfH, Math.min(ball.y, obj.y + halfH));
    var dx = ball.x - closestX;
    var dy = ball.y - closestY;
    return (dx * dx + dy * dy) <= (ball.radius * ball.radius);
  }

  // ---- MOVE BALL AND DETECT COLLISIONS ----
  function moveAndDetect(dt) {
    var ball = curArena.getBall();
    if (!ball) return;

    var speed = ball.speed;
    var rad = math.degToRad(ball.angle);

    // Step movement normalized to 60fps
    var stepX = speed * Math.cos(rad) * dt * 60;
    var stepY = speed * Math.sin(rad) * dt * 60;

    // Sub-stepping: dividi in passi piccoli (max 0.05 unita)
    var dist = Math.sqrt(stepX * stepX + stepY * stepY);
    var steps = Math.max(1, Math.ceil(dist / 0.05));
    var subX = stepX / steps;
    var subY = stepY / steps;

    for (var s = 0; s < steps; s++) {
      ball.x += subX;
      ball.y += subY;
      if (checkAllCollisions()) return;
    }
  }

  // ---- CHECK COLLISIONI CONTRO TUTTI GLI OGGETTI ----
  function checkAllCollisions() {
    var ball = curArena.getBall();
    if (!ball) return false;
    var paddle = curArena.getPaddle();
    var walls = curArena.getWalls();
    var blocks = curArena.getBlocks();

    // 1. Paddle (prioritario)
    if (paddle && checkBallVsAABB(ball, paddle)) {
      resolvePaddleBounce(ball, paddle);
      return true;
    }

    // 2. Walls
    if (walls) {
      for (var key in walls) {
        if (walls.hasOwnProperty(key) && checkBallVsAABB(ball, walls[key])) {
          resolveWallBounce(ball, walls[key]);
          return true;
        }
      }
    }

    // 3. Blocks
    if (blocks) {
      for (var i = 0; i < blocks.length; i++) {
        if (!blocks[i].broken && checkBallVsAABB(ball, blocks[i])) {
          resolveWallBounce(ball, blocks[i]);
          blocks[i].broken = true;
          APP.camera.triggerShake(0.08);
          playSound('assets/audio/break.wav', 0.2);
          addScore();
          return true;
        }
      }
    }

    return false;
  }

  // ---- MAIN UPDATE ----
  function update(dt) {
    var status = cfg.game.status;
    var ball = curArena.getBall();
    var paddle = curArena.getPaddle();

    if (status === 'start') {
      if (ball && paddle) {
        prevPaddleX = paddle.x;
        ball.x = paddle.x;
      }
      return;
    }
    if (status !== 'play') return;

    moveAndDetect(dt);

    if (ball && ball.y < -3) {
      cfg.game.status = 'end';
      APP.camera.triggerShake(0.5);
      playSound('assets/audio/death.wav', 0.2);
      document.getElementById('result').innerText = 'GAME OVER';
    }
    if (cfg.game.score >= cfg.game.maxScore) {
      cfg.game.status = 'end';
      APP.camera.triggerShake(0.3);
      playSound('assets/audio/win.wav', 0.2);
      document.getElementById('result').innerText = 'VICTORY';
    }

    if (paddle) prevPaddleX = paddle.x;
  }

  function reset() {
    prevPaddleX = 0;
  }

  return {
    update: update,
    reset: reset,
    playSound: playSound,
    syncAudioSettings: syncAudioSettings
  };
})();
