'use strict';
// Sistema di coordinate: mapping 2D gioco → 3D mondo
APP.coords = (function() {
  'use strict';
  var cfg = APP.config;

  function gameToWorld(gameX, gameY, thicknessY) {
    return {
      wx: gameX - cfg.arena.width / 2,
      wy: thicknessY || 0,
      wz: -gameY
    };
  }

  function gameToWorldScale(gameW, gameH, thicknessY) {
    return {
      sx: gameW / 2,
      sy: thicknessY || cfg.ball.radius,
      sz: gameH / 2
    };
  }

  return {
    gameToWorld: gameToWorld,
    gameToWorldScale: gameToWorldScale
  };
})();
