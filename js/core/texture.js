'use strict';
// Utility texture WebGL — estratto da utils.js
APP.texture = (function() {
  'use strict';

  function isPowerOfTwo(x) { return (x & (x - 1)) === 0; }

  function nextHighestPowerOfTwo(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1) { x = x | x >> i; }
    return x + 1;
  }

  function getTexture(context, image_URL) {
    var image = new Image();
    image.webglTexture = false;
    image.isLoaded = false;

    image.onload = function(e) {
      var texture = context.createTexture();
      context.bindTexture(context.TEXTURE_2D, texture);
      context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA,
        context.UNSIGNED_BYTE, image);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST_MIPMAP_LINEAR);
      context.generateMipmap(context.TEXTURE_2D);
      context.bindTexture(context.TEXTURE_2D, null);
      image.webglTexture = texture;
      image.isLoaded = true;
    };
    image.src = image_URL;
    return image;
  }

  return {
    isPowerOfTwo: isPowerOfTwo,
    nextHighestPowerOfTwo: nextHighestPowerOfTwo,
    getTexture: getTexture
  };
})();
