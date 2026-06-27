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

    // Sincronizza UI settings con i valori caricati da localStorage
    syncUiWithConfig();
  }

  function syncUiWithConfig() {
    // Difficulty radio button
    var diffRadios = document.getElementsByName('difficulty');
    for (var i = 0; i < diffRadios.length; i++) {
      if (diffRadios[i].value === cfg.game.mode) {
        diffRadios[i].checked = true;
        break;
      }
    }

    // Rows select
    var rowsSelect = document.getElementById('rowsSelect');
    if (rowsSelect) rowsSelect.value = String(cfg.arena.numOfRows);

    // Columns select
    var colsSelect = document.getElementById('columnsSelect');
    if (colsSelect) colsSelect.value = String(cfg.arena.numOfColumns);
  }

  return { init: init, playGame: playGame, openNav: openNav, closeNav: closeNav };
})();
