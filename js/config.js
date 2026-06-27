'use strict';
// Configurazione centralizzata di gioco
(function() {
  if (typeof APP === 'undefined') {
    var APP = window.APP = {};
  }

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
      blocksSpacing: 0.05,
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
      moveSpeed: 0.25,
      rotateSpeed: 2.0,
      minElevation: -89.0,
      maxElevation: -1.0
    },

    rendering: {
      aspect: null,
      zNear: 0.1,
      zFar: 100.0,
      fieldOfViewDeg: 60.0,
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
      collisionEpsilon: 0.1
    },

    colors: {
      codes: [
        '461E52', 'DD517F', 'E68E36', '556DC8', '7998EE',
        'A653F5', '8F8CF2', '65B8BF', 'F96CFF', 'FA92FB', '05ffa1'
      ]
    }
  };
})();