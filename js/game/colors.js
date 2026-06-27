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

  var palette = shuffle(cfg.colors.codes.map(hexToRgb));

  function getColor(index) {
    return palette[index % cfg.arena.numOfRows];
  }

  return {
    getColor: getColor,
    getAll: function() { return palette; },
    reshuffle: function() { palette = shuffle(cfg.colors.codes.map(hexToRgb)); }
  };
})();
