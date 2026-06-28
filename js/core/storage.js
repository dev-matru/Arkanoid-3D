'use strict';
// Settings persistence via localStorage
APP.storage = (function() {
  'use strict';

  var STORAGE_KEY = 'arkanoid3d_settings';

  // Keys to persist (config → localStorage mapping)
  var KEYS = {
    gameMode:     { path: ['game', 'mode'],                    type: 'string' },
    numOfRows:    { path: ['arena', 'numOfRows'],              type: 'number' },
    numOfColumns: { path: ['arena', 'numOfColumns'],           type: 'number' },
    fieldOfView:  { path: ['rendering', 'fieldOfViewDeg'],     type: 'number' }
  };

  // Read a nested value from APP.config given a path array
  function getConfigValue(pathArr) {
    var val = APP.config;
    for (var i = 0; i < pathArr.length; i++) {
      if (val == null) return undefined;
      val = val[pathArr[i]];
    }
    return val;
  }

  // Write a nested value into APP.config given a path array
  function setConfigValue(pathArr, value) {
    var obj = APP.config;
    for (var i = 0; i < pathArr.length - 1; i++) {
      if (obj[pathArr[i]] == null) obj[pathArr[i]] = {};
      obj = obj[pathArr[i]];
    }
    obj[pathArr[pathArr.length - 1]] = value;
  }

  // Save current settings to localStorage
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
      console.log('[STORAGE] salvato:', JSON.stringify(data));
    } catch (e) {
      // localStorage might be unavailable (e.g. Safari private mode)
      console.warn('Arkanoid 3D: cannot save settings', e);
    }
  }

  // Load settings from localStorage and apply to config
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        console.log('[STORAGE] nessun dato salvato, uso default');
        return;
      }
      var data = JSON.parse(raw);
      console.log('[STORAGE] caricato:', raw);
      for (var key in KEYS) {
        if (KEYS.hasOwnProperty(key) && data[key] !== undefined) {
          var expectedType = KEYS[key].type;
          var value = data[key];
          // Type coercion for safety
          if (expectedType === 'number') value = Number(value);
          else if (expectedType === 'string') value = String(value);
          setConfigValue(KEYS[key].path, value);
        }
      }
    } catch (e) {
      console.warn('Arkanoid 3D: cannot load settings', e);
    }
  }

  // Reset to defaults (removes from localStorage)
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

// Load saved settings (overrides config.js defaults)
APP.storage.load();