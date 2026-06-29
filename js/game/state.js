'use strict';
// Game state machine (fisica delegata a APP.physics)
APP.game = (function() {
  'use strict';
  var cfg = APP.config;
  var curArena = APP.arena;

  function restartGame() {
    cfg.game.score = 0;
    cfg.game.status = 'start';
    document.getElementById('score').innerText = 'SCORE: 0/' + cfg.game.maxScore;
    document.getElementById('result').innerText = '';
    curArena.reset();
    curArena.build();
    APP.physics.reset();
  }

  function launchBall() {
    if (cfg.game.status === 'end') {
      restartGame();
      APP.renderer.start();
    } else if (cfg.game.status === 'start') {
      cfg.game.status = 'play';
    }
  }

  function update(dt) {
    // Delega tutta la fisica al modulo specializzato
    APP.physics.update(dt);

    // Aggiorna UI punteggio
    document.getElementById('score').innerText =
      'SCORE: ' + cfg.game.score + '/' + cfg.game.maxScore;
  }

  return {
    restartGame: restartGame,
    launchBall: launchBall,
    update: update,
    playSound: APP.physics.playSound,
    syncAudioSettings: APP.physics.syncAudioSettings
  };
})();
