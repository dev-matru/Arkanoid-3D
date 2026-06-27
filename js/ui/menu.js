'use strict';
// UI: menu principale e settings
APP.ui = (function() {
  'use strict';
  var cfg = APP.config;
  var curRenderer = APP.renderer;

  function openNav() { document.getElementById('mySidenav').style.width = '400px'; }
  function closeNav() { document.getElementById('mySidenav').style.width = '0'; }

  function setDifficulty(value) {
    cfg.game.mode = value;
    APP.storage.save();
  }
  function setRowsNumber(value) {
    cfg.arena.numOfRows = parseInt(value, 10);
    APP.storage.save();
  }
  function setColumnsNumber(value) {
    cfg.arena.numOfColumns = parseInt(value, 10);
    APP.storage.save();
  }

  function playGame() {
    closeNav();
    document.getElementById('mainArea').style.display = 'none';
    document.getElementById('legend').style.display = 'block';
    document.getElementById('score').style.display = 'block';

    if (!curRenderer.isInitialized()) {
      curRenderer.init(function() {
        curRenderer.start();
      });
    } else {
      curRenderer.start();
    }
  }

  function init() {
    window.playGame = playGame;
    window.openNav = openNav;
    window.closeNav = closeNav;
    window.setDifficulty = setDifficulty;
    window.setRowsNumber = setRowsNumber;
    window.setColumnsNumber = setColumnsNumber;
    window.launchBall = function() { APP.game.launchBall(); };
  }

  return { init: init, playGame: playGame, openNav: openNav, closeNav: closeNav };
})();
