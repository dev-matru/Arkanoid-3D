'use strict';
// Persistenza settings via localStorage
APP.storage = (function() {
  'use strict';

  var STORAGE_KEY = 'arkanoid3d_settings';

  // Chiavi da persistere (mapping config → localStorage)
  var KEYS = {
    gameMode:     { path: ['game', 'mode'],                    type: 'string' },
    numOfRows:    { path: ['arena', 'numOfRows'],              type: 'number' },
    numOfColumns: { path: ['arena', 'numOfColumns'],           type: 'number' },
    fieldOfView:  { path: ['rendering', 'fieldOfViewDeg'],     type: 'number' }
  };

  // Legge un valore annidato da APP.config dato un path array
  function getConfigValue(pathArr) {
    var val = APP.config;
    for (var i = 0; i < pathArr.length; i++) {
      if (val == null) return undefined;
      val = val[pathArr[i]];
    }
    return val;
  }

  // Scrive un valore annidato in APP.config dato un path array
  function setConfigValue(pathArr, value) {
    var obj = APP.config;
    for (var i = 0; i < pathArr.length - 1; i++) {
      if (obj[pathArr[i]] == null) obj[pathArr[i]] = {};
      obj = obj[pathArr[i]];
    }
    obj[pathArr[pathArr.length - 1]] = value;
  }

  // Salva le impostazioni correnti in localStorage
  function save() {
    try {
      var data = {};
      for (var key in KEYS) {
        if (KEYS.hasOwnProperty(key)) {
          var val = getConfigValue(KEYS[key].path);
          if (val !== undefined) data[key] = val;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage potrebbe non essere disponibile (es. Safari private mode)
      console.warn('Arkanoid 3D: cannot save settings', e);
    }
  }

  // Carica le impostazioni da localStorage e le applica al config
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      for (var key in KEYS) {
        if (KEYS.hasOwnProperty(key) && data[key] !== undefined) {
          var expectedType = KEYS[key].type;
          var value = data[key];
          // Type coercion per sicurezza
          if (expectedType === 'number') value = Number(value);
          else if (expectedType === 'string') value = String(value);
          setConfigValue(KEYS[key].path, value);
        }
      }
    } catch (e) {
      console.warn('Arkanoid 3D: cannot load settings', e);
    }
  }

  // Reset ai default (rimuove da localStorage)
  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  return {
    save: save,
    load: load,
    clear: clear
  };
})();

// Carica impostazioni salvate (sovrascrive i default di config.js)
APP.storage.load();