'use strict';
// Arena construction and management
APP.arena = (function() {
  'use strict';
  var cfg = APP.config;
  var colors = APP.colors;

  var ball = null;
  var paddle = null;
  var walls = null;
  var blocks = null;

  function randomBallAngle() {
    if (Math.random() > 0.5)
      return Math.random() * 30 + 50;
    return Math.random() * 30 + 100;
  }

  function build() {
    var a = cfg.arena;
    var b = cfg.ball;
    var p = cfg.paddle;

    // BALL
    ball = {
      x: a.width / 2,
      y: 0.2,
      radius: b.radius,
      angle: randomBallAngle(),
      speed: cfg.difficulty.ballSpeed,
      points: []
    };
    for (var angle = 0; angle < 2 * Math.PI; angle += 2 * Math.PI / b.numOfPoints) {
      var xc = b.radius * Math.cos(angle);
      if (Math.abs(xc) < 1E-15) xc = 0;
      var yc = b.radius * Math.sin(angle);
      if (Math.abs(yc) < 1E-15) yc = 0;
      ball.points.push({x: xc, y: yc});
    }

    // PADDLE
    paddle = {
      id: 'paddle',
      x: a.width / 2,
      y: p.yPosition,
      width: p.width,
      height: p.height
    };

    // WALLS
    walls = {
      left:  { id: 'left',  x: 0.0,         y: a.height / 2, width: a.wallSize, height: a.height },
      right: { id: 'right', x: a.width,      y: a.height / 2, width: a.wallSize, height: a.height },
      top:   { id: 'top',   x: a.width / 2,  y: a.height,     width: a.width,    height: a.wallSize }
    };

    // BLOCKS
    var leftInnerEdge = a.wallSize / 2;
    var rightInnerEdge = a.width - a.wallSize / 2;
    var w = rightInnerEdge - leftInnerEdge;
    var h = a.height - a.wallSize / 2;
    var lastRowLimit = h * a.lastRowLimitRatio;
    var columnStep = w / a.numOfColumns;
    var rowStep = (h - lastRowLimit) / a.numOfRows;
    var xOffset = leftInnerEdge + columnStep / 2;
    var id = 0;

    blocks = [];
    for (var i = xOffset; i < rightInnerEdge; i += columnStep) {
      for (var j = h - rowStep / 2, rowIndex = 0; j >= lastRowLimit; j -= rowStep, rowIndex++) {
        blocks.push({
          id: id,
          color: colors.getRowColor(rowIndex),
          x: i,
          y: j,
          width: columnStep - a.blocksSpacing,
          height: rowStep - a.blocksSpacing,
          broken: false
        });
        id++;
      }
    }
    cfg.game.maxScore = blocks.length;

    return { ball: ball, paddle: paddle, walls: walls, blocks: blocks };
  }

  function reset() {
    ball = null;
    paddle = null;
    walls = null;
    blocks = null;
  }

  return {
    build: build,
    reset: reset,
    getBall: function() { return ball; },
    getPaddle: function() { return paddle; },
    getWalls: function() { return walls; },
    getBlocks: function() { return blocks; }
  };
})();
