'use strict';
// Gestione palette colori
APP.colors = (function() {
  'use strict';
  var cfg = APP.config;

  function hexToRgb(hex) {
    return [
      parseInt(hex.slice(0,2), 16) / 255,
      parseInt(hex.slice(2,4), 16) / 255,
      parseInt(hex.slice(4,6), 16) / 255
    ];
  }

  function hueFromRgb(color) {
    var r = color[0], g = color[1], b = color[2];
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    if (delta === 0) return 0;

    var hue;
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * (((b - r) / delta) + 2);
    else hue = 60 * (((r - g) / delta) + 4);

    return hue < 0 ? hue + 360 : hue;
  }

  function collidesWithNeonPurple(color) {
    var max = Math.max(color[0], color[1], color[2]);
    var min = Math.min(color[0], color[1], color[2]);
    var saturation = max === 0 ? 0 : (max - min) / max;
    var hue = hueFromRgb(color);
    return saturation > 0.25 && hue >= 230 && hue <= 345;
  }

  function colorDistance(a, b) {
    var dr = a[0] - b[0];
    var dg = a[1] - b[1];
    var db = a[2] - b[2];
    return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11);
  }

  function isWarm(color) {
    var hue = hueFromRgb(color);
    return hue < 85 || hue > 345;
  }

  function shuffle(array) {
    var shuffled = array.slice();
    var currentIndex = shuffled.length, randomIndex, temp;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      temp = shuffled[currentIndex];
      shuffled[currentIndex] = shuffled[randomIndex];
      shuffled[randomIndex] = temp;
    }
    return shuffled;
  }

  function buildPalette() {
    var filtered = cfg.colors.codes
      .map(hexToRgb)
      .filter(function(color) { return !collidesWithNeonPurple(color); });

    return shuffle(filtered.length ? filtered : cfg.colors.codes.map(hexToRgb));
  }

  function buildRowPalette(sourcePalette) {
    var available = sourcePalette.slice();
    var rows = cfg.arena.numOfRows;
    var result = [];
    var preferWarm = Math.random() >= 0.5;

    while (available.length && result.length < rows) {
      var bestIndex = 0;
      var bestScore = -Infinity;

      for (var i = 0; i < available.length; i++) {
        var color = available[i];
        var score = Math.random() * 0.03;

        if (result.length > 0) {
          score += colorDistance(color, result[result.length - 1]) * 2.2;
        }
        if (result.length > 1) {
          score += colorDistance(color, result[result.length - 2]) * 0.7;
        }
        if (isWarm(color) === preferWarm) {
          score += 0.22;
        }

        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      result.push(available.splice(bestIndex, 1)[0]);
      preferWarm = !preferWarm;
    }

    return result.length ? result : sourcePalette.slice();
  }

  var palette = buildPalette();
  var rowPalette = buildRowPalette(palette);

  function getColor(index) {
    return palette[index % palette.length];
  }

  function getRowColor(rowIndex) {
    return rowPalette[rowIndex % rowPalette.length];
  }

  return {
    getColor: getColor,
    getRowColor: getRowColor,
    getAll: function() { return palette; },
    reshuffle: function() {
      palette = buildPalette();
      rowPalette = buildRowPalette(palette);
    }
  };
})();
