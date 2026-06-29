'use strict';
// Responsive procedural starfield. Keeps the old scattered look without fixed 2000px bounds.
(function() {
  var resizeTimer = null;

  function seededRandom(seed) {
    var state = seed >>> 0;
    return function() {
      state += 0x6D2B79F5;
      var value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function pickColor(random, palette) {
    var color = palette[Math.floor(random() * palette.length)];
    var alpha = color[1] + random() * (color[2] - color[1]);
    return color[0].replace('{a}', alpha.toFixed(2));
  }

  function buildStars(count, width, height, seed, palette) {
    var random = seededRandom(seed);
    var shadows = [];

    for (var i = 0; i < count; i++) {
      var x = Math.floor(random() * width);
      var y = Math.floor(random() * height * 2);
      shadows.push(x + 'px ' + y + 'px ' + pickColor(random, palette));
    }

    return shadows.join(', ');
  }

  function renderStars() {
    var root = document.documentElement;
    var width = Math.max(window.innerWidth, 1);
    var height = Math.max(window.innerHeight, 1);
    var areaFactor = Math.min(4.8, Math.max(1, (width * height) / (1280 * 720)));
    var density = Math.sqrt(areaFactor);
    var seedBase = width * 73856093 ^ height * 19349663;

    var white = [
      ['rgba(255, 255, 255, {a})', 0.58, 0.95],
      ['rgba(0, 245, 212, {a})', 0.24, 0.58],
      ['rgba(255, 0, 255, {a})', 0.18, 0.38]
    ];
    var bright = [
      ['rgba(255, 255, 255, {a})', 0.52, 0.9],
      ['rgba(5, 255, 161, {a})', 0.2, 0.44],
      ['rgba(255, 0, 255, {a})', 0.16, 0.3]
    ];
    var glow = [
      ['rgba(255, 255, 255, {a})', 0.42, 0.78],
      ['rgba(0, 245, 212, {a})', 0.16, 0.3],
      ['rgba(255, 0, 255, {a})', 0.14, 0.34]
    ];

    root.style.setProperty('--stars-small', buildStars(Math.round(320 * density), width, height, seedBase ^ 11, white));
    root.style.setProperty('--stars-medium', buildStars(Math.round(120 * density), width, height, seedBase ^ 29, bright));
    root.style.setProperty('--stars-large', buildStars(Math.round(54 * density), width, height, seedBase ^ 47, glow));
  }

  function scheduleRender() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderStars, 120);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderStars);
  } else {
    renderStars();
  }

  window.addEventListener('resize', scheduleRender);
})();
