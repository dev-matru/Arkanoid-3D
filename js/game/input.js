'use strict';
// Gestione input utente (mouse, tastiera semplificata)
APP.input = (function() {
  'use strict';
  var cfg = APP.config;
  var curArena = APP.arena;
  var curGame = APP.game;

  function init(canvas, gl) {
    // Mouse move -> paddle
    canvas.addEventListener('mousemove', function(event) {
      var paddle = curArena.getPaddle();
      if (!paddle) return;

      var rect = gl.canvas.getBoundingClientRect();
      var useVerticalAxis = APP.camera.getCurrentPreset() === 3;
      var pointerRatio = useVerticalAxis
        ? (event.clientY - rect.top) / rect.height
        : (event.clientX - rect.left) / rect.width;

      var wallInnerEdge = cfg.arena.wallSize / 2;
      var minX = wallInnerEdge + paddle.width / 2;
      var maxX = cfg.arena.width - wallInnerEdge - paddle.width / 2;
      var x = pointerRatio * cfg.arena.width;
      x = Math.max(minX, Math.min(maxX, x));
      paddle.x = x;
    });

    // Mouse click → launch ball
    canvas.addEventListener('mousedown', function() { curGame.launchBall(); });

    // Mouse wheel -> camera zoom
    canvas.addEventListener('wheel', function(event) {
      event.preventDefault();
      var amount = event.deltaY / 100.0;
      APP.camera.zoom(amount);
      APP.storage.save();
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
