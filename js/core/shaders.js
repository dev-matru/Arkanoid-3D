'use strict';
// Utility shader WebGL — estratto da utils.js
APP.shaders = (function() {
  'use strict';

  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }

  function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) return program;
    throw "program failed to link:" + gl.getProgramInfoLog(program);
  }

  function loadFile(url, data, callback, errorCallback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.onreadystatechange = function() {
      if (request.readyState === 4 && request.status === 200)
        callback(request.responseText, data);
    };
    request.send(null);
  }

  function loadFiles(urls, callback, errorCallback) {
    var numUrls = urls.length;
    var numComplete = 0;
    var result = [];
    function partialCallback(text, urlIndex) {
      result[urlIndex] = text;
      numComplete++;
      if (numComplete === numUrls) callback(result);
    }
    for (var i = 0; i < numUrls; i++)
      loadFile(urls[i], i, partialCallback, errorCallback);
  }

  function resizeCanvasToDisplaySize(canvas) {
    function expandFullScreen() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    expandFullScreen();
    window.addEventListener('resize', expandFullScreen);
  }

  return {
    createShader: createShader,
    createProgram: createProgram,
    loadFile: loadFile,
    loadFiles: loadFiles,
    resizeCanvasToDisplaySize: resizeCanvasToDisplaySize
  };
})();
