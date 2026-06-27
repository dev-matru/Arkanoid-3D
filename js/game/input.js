'use strict';
// Gestione input utente (mouse, tastiera semplificata)
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
      if (newFov < 180 && newFov > 0) {
        cfg.rendering.fieldOfViewDeg = newFov;
        APP.storage.save();
      }
    }, {passive: false});

    // Keyboard → camera preset (1-5) + debug info
    window.addEventListener('keydown', function(e) {
      var key = e.keyCode;
      if (key >= 49 && key <= 53) { // tasti 1-5
        APP.camera.setPreset(key - 48);
      }
    });
  }

  return { init: init };
})();