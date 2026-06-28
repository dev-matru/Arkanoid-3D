// Centralized game configuration
(function () {
  'use strict';

  window.APP = window.APP || {};

  APP.config = {
    game: {
      status: 'start',
      mode: 'easy',
      score: 0.0,
      maxScore: 0.0
    },

    difficulty: {
      easy: 0.1,
      medium: 0.15,
      hard: 0.2
    },

    arena: {
      width: 10.0,
      height: 10.0,
      wallSize: 0.25,
      numOfRows: 5,
      numOfColumns: 8,
      blocksSpacing: 0.08,
      lastRowLimitRatio: 3 / 5
    },

    ball: {
      radius: 0.2,
      numOfPoints: 8
    },

    paddle: {
      width: 2.5,
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
})();
