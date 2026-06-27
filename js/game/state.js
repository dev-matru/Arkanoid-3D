'use strict';
// Game state machine, fisica, collisioni
APP.game = (function() {
  'use strict';
  var cfg = APP.config;
  var curArena = APP.arena;

  var audioPool = {};

  // ---- AUDIO ----
  function playSound(path, volume) {
    if (!audioPool[path]) audioPool[path] = new Audio(path);
    var audio = audioPool[path].cloneNode();
    audio.volume = volume;
    audio.play();
  }

  // ---- GAME STATE ----
  function startPlay() { cfg.game.status = 'play'; }

  function endGame(won) {
    cfg.game.status = 'end';
    if (won) {
      playSound('assets/win.wav', 0.2);
      document.getElementById('result').innerText = 'VICTORY';
    } else {
      playSound('assets/death.wav', 0.2);
      document.getElementById('result').innerText = 'GAME OVER';
    }
  }

  function restartGame() {
    cfg.game.score = 0;
    cfg.game.status = 'start';
    document.getElementById('score').innerText = 'SCORE: 0/' + cfg.game.maxScore;
    document.getElementById('result').innerText = '';
    curArena.reset();
    curArena.build();
  }

  function launchBall() {
    if (cfg.game.status === 'end') restartGame();
    else cfg.game.status = 'play';
  }

  // ---- SCORE ----
  function addScore() {
    cfg.game.score++;
    document.getElementById('score').innerText =
      'SCORE: ' + cfg.game.score + '/' + cfg.game.maxScore;
  }

  // ---- PHYSICS ----
  function between(x, base, range) {
    return (x >= base - range) && (x <= base + range);
  }

  function changeBallDirection(bounceDirection) {
    var b = curArena.getBall();
    if (!b) return;
    if (bounceDirection === 'vertical')      b.angle = 180.0 - b.angle;
    else if (bounceDirection === 'horizontal') b.angle = 360.0 - b.angle;
  }

  function moveBall() {
    var b = curArena.getBall();
    if (!b) return;
    var math = APP.math;
    b.x += b.speed * Math.cos(math.degToRad(b.angle));
    b.y += b.speed * Math.sin(math.degToRad(b.angle));
  }

  function detectCollision(object) {
    var b = curArena.getBall();
    if (!b || !object) return;
    var epsilon = cfg.physics.collisionEpsilon;
    var points = b.points;
    var i, point;

    for (i = 0; i < points.length; i++) {
      point = points[i];
      if (between(b.x + point.x, object.x, object.width / 2) &&
          (between(b.y + point.y, object.y + object.height / 2, epsilon) ||
           between(b.y + point.y, object.y - object.height / 2, epsilon))) {
        changeBallDirection('horizontal');
        breakBlock(object);
        return;
      }
      if (between(b.y + point.y, object.y, object.height / 2) &&
          (between(b.x + point.x, object.x + object.width / 2, epsilon) ||
           between(b.x + point.x, object.x - object.width / 2, epsilon))) {
        changeBallDirection('vertical');
        breakBlock(object);
        return;
      }
    }
  }

  function breakBlock(object) {
    if (object && 'broken' in object) {
      object.broken = true;
      playSound('assets/break.wav', 0.2);
      addScore();
    }
  }

  // ---- GAME LOOP ----
  function update() {
    var status = cfg.game.status;
    var ball = curArena.getBall();
    var paddle = curArena.getPaddle();

    if (status === 'start') {
      if (ball && paddle) ball.x = paddle.x;
      return;
    }
    if (status !== 'play') return;

    paddle = curArena.getPaddle();
    var walls = curArena.getWalls();
    var blocks = curArena.getBlocks();

    if (paddle) detectCollision(paddle);

    var key;
    if (walls) {
      for (key in walls) {
        if (walls.hasOwnProperty(key)) detectCollision(walls[key]);
      }
    }

    if (blocks) {
      for (key = 0; key < blocks.length; key++) {
        if (!blocks[key].broken) detectCollision(blocks[key]);
      }
    }

    moveBall();

    if (ball && ball.y < -3) endGame(false);
    if (cfg.game.score >= cfg.game.maxScore) endGame(true);
  }

  return {
    startPlay: startPlay,
    endGame: endGame,
    restartGame: restartGame,
    launchBall: launchBall,
    update: update,
    playSound: playSound
  };
})();
