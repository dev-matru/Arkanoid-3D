'use strict';
// UI: menu principale e settings
APP.ui = (function() {
  'use strict';
  var cfg = APP.config;
  var curRenderer = APP.renderer;

  function openNav() { document.getElementById('mySidenav').style.width = '400px'; }
  function closeNav() { document.getElementById('mySidenav').style.width = '0'; }

  function setDifficulty(value) {
    APP.difficulty.applyPreset(value);
    APP.storage.save();
    syncUiWithConfig();
  }

  function setAdvancedSetting(name, value) {
    var numericValue = Number(value);
    if (isNaN(numericValue)) return;

    if (name === 'ballSpeed') {
      cfg.difficulty.ballSpeed = numericValue;
    } else if (name === 'rows') {
      cfg.arena.numOfRows = parseInt(numericValue, 10);
    } else if (name === 'columns') {
      cfg.arena.numOfColumns = parseInt(numericValue, 10);
    } else if (name === 'blockHeight') {
      cfg.arena.lastRowLimitRatio = Math.round((1 - numericValue) * 1000) / 1000;
    } else if (name === 'paddleWidth') {
      cfg.paddle.width = numericValue;
    }

    APP.difficulty.markCustom();
    APP.storage.save();
    syncUiWithConfig();
  }

  function toggleAdvancedMenu(event) {
    if (event) event.preventDefault();
    var summary = event && event.currentTarget;
    var section = summary ? summary.parentElement : document.querySelector('.advanced-section');
    if (section) section.open = !section.open;
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
    window.setAdvancedSetting = setAdvancedSetting;
    window.toggleAdvancedMenu = toggleAdvancedMenu;
    window.launchBall = function() { APP.game.launchBall(); };

    // Sincronizza UI settings con i valori caricati da localStorage
    syncUiWithConfig();
  }

  function syncUiWithConfig() {
    var status = document.getElementById('difficultyStatus');
    if (status) status.innerText = APP.difficulty.getDisplayLabel();

    var isPreset = !!APP.difficulty.getPreset(cfg.game.mode);

    var diffRadios = document.getElementsByName('difficulty');
    for (var i = 0; i < diffRadios.length; i++) {
      diffRadios[i].checked = isPreset && diffRadios[i].value === cfg.game.mode;
    }

    syncAdvancedControl('ballSpeedInput', 'ballSpeedValue', cfg.difficulty.ballSpeed, 2);
    syncAdvancedControl('rowsInput', 'rowsValue', cfg.arena.numOfRows, 0);
    syncAdvancedControl('columnsInput', 'columnsValue', cfg.arena.numOfColumns, 0);
    syncAdvancedControl('blockHeightInput', 'blockHeightValue', APP.difficulty.getBlockGroupHeightRatio(), 2, true);
    syncAdvancedControl('paddleWidthInput', 'paddleWidthValue', cfg.paddle.width, 2);
  }

  function syncAdvancedControl(inputId, valueId, value, decimals, asPercent) {
    var input = document.getElementById(inputId);
    var label = document.getElementById(valueId);
    var displayValue = decimals > 0 ? Number(value).toFixed(decimals) : String(Math.round(value));

    if (input) input.value = displayValue;
    if (label) label.innerText = asPercent ? Math.round(Number(value) * 100) + '%' : displayValue;
  }

  return { init: init, playGame: playGame, openNav: openNav, closeNav: closeNav };
})();
