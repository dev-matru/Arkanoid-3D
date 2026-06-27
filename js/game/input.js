'use strict';
// Gestione input utente (mouse, tastiera, wheel)
APP.input = (function() {
  'use strict';
  var cfg = APP.config;
  var curArena = APP.arena;
  var curGame = APP.game;

  function init(canvas, gl) {
    // Mouse move → paddle
    canvas.addEventListener('mousemove', function(event) {
      var normX = (2 * event.pageX / gl.canvas.width) - 1;
      var x = (normX * cfg.input.mouseRatio) * cfg.arena.width / 2 + cfg.arena.width / 2;
      var paddle = curArena.getPaddle();
      if (paddle && x > 0 + paddle.width / 2 && x < cfg.arena.width - paddle.width / 2)
        paddle.x = x;
    });

    // Mouse click → launch ball
    canvas.addEventListener('mousedown', function() { curGame.launchBall(); });

    // Mouse wheel → FOV zoom
    canvas.addEventListener('wheel', function(event) {
      event.preventDefault();
      var amount = event.deltaY / 100.0;
      var newFov = cfg.rendering.fieldOfViewDeg - amount;
      if (newFov < 180 && newFov > 0) cfg.rendering.fieldOfViewDeg = newFov;
    }, {passive: false});

    // Keyboard → camera
    window.addEventListener('keydown', function(e) {
      var cam = cfg.camera;
      switch(e.keyCode) {
        case 38: cam.elevation += cam.rotateSpeed; break;
        case 40: cam.elevation -= cam.rotateSpeed; break;
        case 37: cam.angle -= cam.rotateSpeed; break;
        case 39: cam.angle += cam.rotateSpeed; break;
        case 81: cam.cy -= cam.moveSpeed; break;
        case 69: cam.cy += cam.moveSpeed; break;
        case 65: cam.cx -= cam.moveSpeed; break;
        case 68: cam.cx += cam.moveSpeed; break;
        case 87: cam.cz -= cam.moveSpeed; break;
        case 83: cam.cz += cam.moveSpeed; break;
      }
    });
  }

  return { init: init };
})();
