'use strict';
// Fisica: movimento palla, collisioni, rimbalzi con delta-time e sub-stepping
APP.physics = (function() {
  'use strict';
  var cfg = APP.config;
  var curArena = APP.arena;
  var math = APP.math;
  var audioPool = {};

  var prevPaddleX = 0;

  // ---- AUDIO ----
  function playSound(path, volume) {
    if (!audioPool[path]) audioPool[path] = new Audio(path);
    var audio = audioPool[path].cloneNode();
    audio.volume = volume;
    audio.play();
  }

  // ---- SCORE ----
  function addScore() {
    cfg.game.score++;
    document.getElementById('score').innerText =
      'SCORE: ' + cfg.game.score + '/' + cfg.game.maxScore;
  }

  // ---- PADDLE BOUNCE (basato su hit position) ----
  function resolvePaddleBounce(ball, paddle) {
    // hitPos: -1 (sinistra paddle) ... 0 (centro) ... +1 (destra)
    var hitPos = (ball.x - paddle.x) / (paddle.width / 2);
    hitPos = Math.max(-1, Math.min(1, hitPos));

    // Velocità paddle per trasferimento orizzontale
    var paddleVel = paddle.x - prevPaddleX;

    // Sistema angoli: 0°=destra, 90°=giù, 180°=sinistra, 270°=su
    // 270° ± hitPos*maxAngle → da 205° a 335° (su-destra a su-sinistra)
    var maxAngle = cfg.physics.paddleHitMaxAngle;
    var newAngle = 270 - hitPos * maxAngle;
    newAngle = ((newAngle % 360) + 360) % 360;

    // Trasferimento velocità paddle
    var rad = math.degToRad(newAngle);
    var vx = ball.speed * Math.cos(rad);
    var vy = ball.speed * Math.sin(rad);
    vx += paddleVel * cfg.physics.paddleVelocityTransfer;

    // Ricalcola speed dalla nuova direzione
    var newSpeed = Math.sqrt(vx * vx + vy * vy);
    ball.speed = Math.min(newSpeed, cfg.physics.maxBallSpeed);
    ball.angle = Math.atan2(vy, vx) * 180 / Math.PI;
    ball.angle = ((ball.angle % 360) + 360) % 360;

    // Accelerazione progressiva
    ball.speed = Math.min(ball.speed * cfg.physics.speedIncrement, cfg.physics.maxBallSpeed);

    playSound('assets/bounce.wav', 0.2);
  }

  // ---- WALL / BLOCK BOUNCE (semplice riflessione assiale) ----
  function resolveWallBounce(ball, object) {
    // Determina quale lato è stato colpito in base alla posizione relativa
    var overlapX = (ball.x - object.x) / (object.width / 2 + ball.radius);
    var overlapY = (ball.y - object.y) / (object.height / 2 + ball.radius);

    if (Math.abs(overlapX) > Math.abs(overlapY)) {
      // Rimbalzo verticale (sinistra/destra)
      ball.angle = 180 - ball.angle;
    } else {
      // Rimbalzo orizzontale (sopra/sotto)
      ball.angle = 360 - ball.angle;
    }
    ball.angle = ((ball.angle % 360) + 360) % 360;
  }

  // ---- PUNTO vs AABB con raggio ----
  function checkBallVsAABB(ball, obj) {
    var closestX = Math.max(obj.x - obj.width / 2, Math.min(ball.x, obj.x + obj.width / 2));
    var closestY = Math.max(obj.y - obj.height / 2, Math.min(ball.y, obj.y + obj.height / 2));
    var distX = ball.x - closestX;
    var distY = ball.y - closestY;
    return (distX * distX + distY * distY) <= (ball.radius * ball.radius);
  }

  // ---- BALL MOVEMENT (con sub-stepping) ----
  function moveAndDetect(dt) {
    var ball = curArena.getBall();
    if (!ball) return;

    var speed = ball.speed;
    var rad = math.degToRad(ball.angle);

    // Distanza percorsa in questo frame (normalizzato a 60fps)
    var stepX = speed * Math.cos(rad) * dt * 60;
    var stepY = speed * Math.sin(rad) * dt * 60;

    // Sub-stepping: dividi movimento se troppo lungo
    var dist = Math.sqrt(stepX * stepX + stepY * stepY);
    var steps = Math.max(1, Math.ceil(dist / (ball.radius * 0.8)));
    var subX = stepX / steps;
    var subY = stepY / steps;

    var paddle = curArena.getPaddle();
    var walls = curArena.getWalls();
    var blocks = curArena.getBlocks();

    for (var s = 0; s < steps; s++) {
      ball.x += subX;
      ball.y += subY;

      // Paddle
      if (paddle && checkBallVsAABB(ball, paddle)) {
        resolvePaddleBounce(ball, paddle);
        return;
      }

      // Walls
      if (walls) {
        for (var key in walls) {
          if (walls.hasOwnProperty(key) && checkBallVsAABB(ball, walls[key])) {
            resolveWallBounce(ball, walls[key]);
            return;
          }
        }
      }

      // Blocks
      if (blocks) {
        for (var i = 0; i < blocks.length; i++) {
          if (!blocks[i].broken && checkBallVsAABB(ball, blocks[i])) {
            resolveWallBounce(ball, blocks[i]);
            blocks[i].broken = true;
            APP.camera.triggerShake(0.08);
            playSound('assets/break.wav', 0.2);
            addScore();
            return;
          }
        }
      }
    }
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

    // Traccia posizione paddle per calcolo velocità
    if (paddle) prevPaddleX = paddle.x;

    // Muovi palla e rileva collisioni (con sub-stepping)
    moveAndDetect(dt);

    // Game over / Victory
    if (ball && ball.y < -3) {
      cfg.game.status = 'end';
      APP.camera.triggerShake(0.5);
      playSound('assets/death.wav', 0.2);
      document.getElementById('result').innerText = 'GAME OVER';
    }
    if (cfg.game.score >= cfg.game.maxScore) {
      cfg.game.status = 'end';
      APP.camera.triggerShake(0.3);
      playSound('assets/win.wav', 0.2);
      document.getElementById('result').innerText = 'VICTORY';
    }
  }

  function reset() {
    prevPaddleX = 0;
  }

  return {
    update: update,
    reset: reset,
    playSound: playSound
  };
})();