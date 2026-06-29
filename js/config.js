// Centralized game configuration
(function () {
  'use strict';

  window.APP = window.APP || {};

  APP.config = {
    game: {
      status: 'start',
      mode: 'runner',
      score: 0.0,
      maxScore: 0.0
    },

    difficulty: {
      ballSpeed: 0.13,
      levels: {
        rookie: {
          label: 'Rookie',
          ballSpeed: 0.1,
          numOfRows: 4,
          numOfColumns: 7,
          blockGroupHeightRatio: 0.34,
          paddleWidth: 3.0
        },
        runner: {
          label: 'Runner',
          ballSpeed: 0.13,
          numOfRows: 5,
          numOfColumns: 8,
          blockGroupHeightRatio: 0.4,
          paddleWidth: 2.45
        },
        hacker: {
          label: 'Hacker',
          ballSpeed: 0.16,
          numOfRows: 6,
          numOfColumns: 9,
          blockGroupHeightRatio: 0.48,
          paddleWidth: 2.0
        },
        glitch: {
          label: 'Glitch',
          ballSpeed: 0.2,
          numOfRows: 7,
          numOfColumns: 10,
          blockGroupHeightRatio: 0.53,
          paddleWidth: 1.75
        },
        overdrive: {
          label: 'Overdrive',
          ballSpeed: 0.23,
          numOfRows: 8,
          numOfColumns: 11,
          blockGroupHeightRatio: 0.58,
          paddleWidth: 1.5
        },
        blackout: {
          label: 'Blackout',
          ballSpeed: 0.28,
          numOfRows: 10,
          numOfColumns: 13,
          blockGroupHeightRatio: 0.66,
          paddleWidth: 1.2
        },
        singularity: {
          label: 'Singularity',
          ballSpeed: 0.34,
          numOfRows: 12,
          numOfColumns: 14,
          blockGroupHeightRatio: 0.72,
          paddleWidth: 1.0
        }
      },
      order: ['rookie', 'runner', 'hacker', 'glitch', 'overdrive', 'blackout', 'singularity']
    },

    arena: {
      width: 10.0,
      height: 10.0,
      wallSize: 0.25,
      numOfRows: 5,
      numOfColumns: 8,
      blocksSpacing: 0.08,
      lastRowLimitRatio: 0.6
    },

    ball: {
      radius: 0.2,
      numOfPoints: 8
    },

    paddle: {
      width: 2.45,
      height: 0.25,
      yPosition: -0.25,
      color: [0.8, 0.8, 0.8]
    },

    camera: {
      cx: 0.0,
      cy: 10.0,
      cz: 5.0,
      elevation: -45.0,
      angle: 0.0,
      minElevation: -89.0,
      maxElevation: -1.0
    },

    rendering: {
      aspect: null,
      zNear: 0.1,
      zFar: 100.0,
      fieldOfViewDeg: 60.0,
      topDownOrthographic: true,
      topDownOrthoMargin: 1.0,
      topDownOrthoZoom: 1.0,
      arenaTextureTileDensity: .5,
      disableAssetCache: true,
      bloomEnabled: true,
      bloomScale: 0.25,
      bloomThreshold: 0.66,
      bloomStrength: 0.82,
      fxaaEnabled: true,
      fxaaStrength: 0.65,
      specularColor: [1.0, 1.0, 1.0],
      specularShine: 100.0
    },

    light: {
      type: 'point',
      lightColor: [1.0, 1.0, 1.0],
      lightPosition: [0.0, 8.0, -8.0],
      LTarget: 8.0,
      LDecay: 0.8
    },

    input: {
      mouseRatio: 2.0
    },

    audio: {
      musicEnabled: true,
      sfxEnabled: true,
      musicVolume: 100,
      sfxVolume: 100
    },

    physics: {
      collisionEpsilon: 0.1,
      fixedDt: 0.0083,       // 1/120s = fixed physics timestep
      maxSubSteps: 5,         // max sub-steps per frame
      paddleHitMaxAngle: 65,  // max bounce angle from paddle center
      paddleVelocityTransfer: 0.5, // % of paddle velocity transferred to ball
      speedIncrement: 1.01,   // speed multiplier per paddle bounce
      maxBallSpeed: 0.5,      // maximum ball speed
      lookAhead: 2.0         // anticipazione traiettoria per dynamic camera
    },

    colors: {
      codes: [
        'FF5E00', 'E68E36', 'FF7A00', 'FF9F1C', 'FFB000',
        'F2D649', 'E6FF4A', 'B6F23A', '8FEC2F', '7AD151',
        '39FF14', '05FFA1', '22E6B8', '2EE6A6', '00F5D4',
        '00D4FF', '4CC9F0', '65B8BF', '00B8D9', '2AD4C5'
      ]
    }
  };

  APP.difficulty = (function() {
    var legacyModes = {
      easy: 'rookie',
      low: 'rookie',
      medium: 'runner',
      normal: 'runner',
      hard: 'hacker',
      high: 'hacker',
      insane: 'blackout'
    };

    function getPreset(level) {
      return APP.config.difficulty.levels[level] || null;
    }

    function round(value) {
      return Math.round(value * 1000) / 1000;
    }

    function getBlockGroupHeightRatio() {
      return round(1 - APP.config.arena.lastRowLimitRatio);
    }

    function applyPreset(level) {
      var preset = getPreset(level) || getPreset('runner');
      var cfg = APP.config;

      cfg.game.mode = getPreset(level) ? level : 'runner';
      cfg.difficulty.ballSpeed = preset.ballSpeed;
      cfg.arena.numOfRows = preset.numOfRows;
      cfg.arena.numOfColumns = preset.numOfColumns;
      cfg.arena.lastRowLimitRatio = round(1 - preset.blockGroupHeightRatio);
      cfg.paddle.width = preset.paddleWidth;
    }

    function markCustom() {
      APP.config.game.mode = 'custom';
    }

    function valuesMatchPreset(preset) {
      var cfg = APP.config;
      return round(cfg.difficulty.ballSpeed) === round(preset.ballSpeed) &&
        cfg.arena.numOfRows === preset.numOfRows &&
        cfg.arena.numOfColumns === preset.numOfColumns &&
        getBlockGroupHeightRatio() === round(preset.blockGroupHeightRatio) &&
        round(cfg.paddle.width) === round(preset.paddleWidth);
    }

    function getDisplayLabel() {
      var cfg = APP.config;
      var preset = getPreset(cfg.game.mode);
      if (preset && valuesMatchPreset(preset)) return preset.label;
      if (cfg.game.mode !== 'custom') cfg.game.mode = 'custom';
      return 'Custom';
    }

    function normalizeLoadedSettings() {
      var cfg = APP.config;
      if (legacyModes[cfg.game.mode]) cfg.game.mode = legacyModes[cfg.game.mode];

      if (cfg.game.mode === 'custom') {
        var fallback = getPreset('runner');
        cfg.difficulty.ballSpeed = Number(cfg.difficulty.ballSpeed) || fallback.ballSpeed;
        cfg.arena.numOfRows = Number(cfg.arena.numOfRows) || fallback.numOfRows;
        cfg.arena.numOfColumns = Number(cfg.arena.numOfColumns) || fallback.numOfColumns;
        cfg.arena.lastRowLimitRatio = Number(cfg.arena.lastRowLimitRatio) || round(1 - fallback.blockGroupHeightRatio);
        cfg.paddle.width = Number(cfg.paddle.width) || fallback.paddleWidth;
        return;
      }

      applyPreset(getPreset(cfg.game.mode) ? cfg.game.mode : 'runner');
    }

    return {
      applyPreset: applyPreset,
      getPreset: getPreset,
      getDisplayLabel: getDisplayLabel,
      getBlockGroupHeightRatio: getBlockGroupHeightRatio,
      markCustom: markCustom,
      normalizeLoadedSettings: normalizeLoadedSettings
    };
  })();
})();
