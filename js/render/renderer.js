'use strict';
// Renderer WebGL: init, scene setup, draw loop
APP.renderer = (function() {
  'use strict';
  var cfg = APP.config;
  var math = APP.math;
  var geom = APP.geometry;
  var shaders = APP.shaders;
  var curArena = APP.arena;
  var curGame = APP.game;

  var canvas, gl, programInfo;
  var sphereVao;
  var sphereBufferInfo;
  var cubeMeshes = {};
  var sphereUniforms, cubeUniforms;
  var texture;
  var objectsToDraw = [];
  var animationId = null;
  var initialized = false;

  function cacheBustUrl(url) {
    if (!cfg.rendering.disableAssetCache) return url;

    var separator = url.indexOf('?') === -1 ? '?' : '&';
    return url + separator + 'v=' + Date.now();
  }

  function webglSetup() {
    canvas = document.getElementById('scene');
    gl = canvas.getContext('webgl2');
    if (!gl) { document.write('WebGL 2.0 not supported'); return false; }
    shaders.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.enable(gl.DEPTH_TEST);
    return true;
  }

  function createGeometries() {
    var sphereGeo = geom.createSphere(cfg.ball.radius, 30);

    sphereBufferInfo = twgl.createBufferInfoFromArrays(gl, {
      inPosition: { data: sphereGeo.vertices.flat(), numComponents: 3 },
      inNormal: { data: sphereGeo.normals.flat(), numComponents: 3 },
      inUV: { data: new Array(sphereGeo.vertices.length * 2).fill(0), numComponents: 2 },
      indices: sphereGeo.indices
    });
    sphereVao = twgl.createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo);

    createCubeMesh('solid');
    createCubeMesh('wall', { uvMode: 'wall' });
    createCubeMesh('floor', { uvMode: 'floor' });
    createCubeMesh('cover', { uvMode: 'cover' });
  }

  function createCubeMesh(role, options) {
    var cubeGeo = geom.createCube(options);
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      inPosition: { data: cubeGeo.vertices, numComponents: 3 },
      inNormal: { data: cubeGeo.normals, numComponents: 3 },
      inUV: { data: cubeGeo.uvs, numComponents: 2 },
      indices: cubeGeo.indices
    });

    cubeMeshes[role] = {
      bufferInfo: bufferInfo,
      vertexArray: twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo)
    };
  }

  function cubeMesh(role) {
    return cubeMeshes[role] || cubeMeshes.solid;
  }

  function createUniforms() {
    texture = twgl.createTexture(gl, {
      target: gl.TEXTURE_2D,
      src: cacheBustUrl('assets/grid.png'),
      flipY: true,
      mag: gl.LINEAR,
      min: gl.LINEAR_MIPMAP_LINEAR,
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT
    });

    var s = cfg.rendering;
    var l = cfg.light;

    sphereUniforms = {
      textureWeight: 0.0,
      mDiffColor: [0.5, 0.0, 1.0],
      specularColor: s.specularColor,
      specularShine: s.specularShine,
      lightColor: l.lightColor,
      LTarget: l.LTarget,
      LDecay: l.LDecay,
      uvScale: [1.0, 1.0],
      uvOffset: [0.0, 0.0],
      uvWorldScale: [1.0, 1.0, 1.0],
      uvTileDensity: 1.0,
      uvMappingMode: 0.0,
      uTime: 0,
      uVaporwaveColor: [0.15, 0.0, 0.3],
      uFillStrength: 0.12,
      uRimPower: 2.5,
      uRimStrength: 0.25,
      uEmissiveColor: [0.0, 0.0, 0.0],
      uEmissiveStrength: 0.0,
      uNeonGrid: 0.0
    };
    cubeUniforms = {
      textureWeight: 0.0,
      diffuseTexture: texture,
      mDiffColor: [0.0, 0.5, 1.0],
      specularColor: s.specularColor,
      specularShine: s.specularShine,
      lightColor: l.lightColor,
      LTarget: l.LTarget,
      LDecay: l.LDecay,
      uvScale: [1.0, 1.0],
      uvOffset: [0.0, 0.0],
      uvWorldScale: [1.0, 1.0, 1.0],
      uvTileDensity: 1.0,
      uvMappingMode: 0.0,
      uTime: 0,
      uVaporwaveColor: [0.15, 0.0, 0.3],
      uFillStrength: 0.12,
      uRimPower: 2.5,
      uRimStrength: 0.25,
      uEmissiveColor: [0.0, 0.0, 0.0],
      uEmissiveStrength: 0.0,
      uNeonGrid: 0.0
    };
  }

  function buildScene() {
    objectsToDraw = [];
    var a = cfg.arena;
    var paddle = curArena.getPaddle();
    var walls = curArena.getWalls();
    var blocks = curArena.getBlocks();
    var solidMesh = cubeMesh('solid');

    objectsToDraw.push({
      type: 'BALL', cutType: 'sphere',
      programInfo: programInfo, bufferInfo: sphereBufferInfo, vertexArray: sphereVao,
      uniforms: Object.assign({}, sphereUniforms),
      worldMatrix: math.MakeWorld(0,0,0, 0,0,0, 1.0)
    });

    var pw = math.MakeWorldGeneric(
      paddle.x - a.width/2, 0, -paddle.y,
      0,0,0, paddle.width/2, cfg.ball.radius, paddle.height/2
    );
    objectsToDraw.push({
      type: 'PADDLE', blockColor: cfg.paddle.color,
      programInfo: programInfo, bufferInfo: solidMesh.bufferInfo, vertexArray: solidMesh.vertexArray,
      uniforms: Object.assign({}, cubeUniforms, { uvScale: [1.8, 1.0] }),
      worldMatrix: pw
    });

    // WALLS
    var wallDefs = [
      {type: 'ARENA', role: 'wall', x: a.width/2, y: 0, z: -a.height/2, sx: walls.right.width/2, sy: 0.5, sz: walls.right.height/2 + walls.top.height/2 - 0.00001},
      {type: 'COVER', role: 'cover', x: a.width/2, y: 0.51, z: -a.height/2, sx: walls.right.width/2, sy: 0.01, sz: walls.right.height/2 + walls.top.height/2, uvOffset: [0.12, 0.08]},
      {type: 'ARENA', role: 'wall', x: -a.width/2, y: 0, z: -a.height/2, sx: walls.left.width/2, sy: 0.5, sz: walls.left.height/2 + walls.top.height/2 - 0.00001},
      {type: 'COVER', role: 'cover', x: -a.width/2, y: 0.51, z: -a.height/2, sx: walls.left.width/2, sy: 0.01, sz: walls.left.height/2 + walls.top.height/2, uvOffset: [0.12, 0.08]},
      {type: 'ARENA', role: 'wall', x: 0, y: 0, z: -a.height, sx: walls.top.width/2 + a.wallSize/2 - 0.00001, sy: 0.5, sz: walls.top.height/2},
      {type: 'COVER', role: 'cover', x: 0, y: 0.51, z: -a.height, sx: walls.top.width/2 - a.wallSize/2, sy: 0.01, sz: walls.top.height/2, uvOffset: [0.12, 0.08]},
      {type: 'FLOOR', role: 'floor', x: 0, y: -1.0, z: -a.height/2, sx: a.width/2 + walls.right.width/2, sy: 0.5, sz: a.height/2 + walls.top.height/2}
    ];
    for (var d = 0; d < wallDefs.length; d++) {
      var w = wallDefs[d];
      var mesh = cubeMesh(w.role);
      var arenaUniforms = Object.assign({}, cubeUniforms, {
        uvScale: w.uvScale || [1.0, 1.0],
        uvOffset: w.uvOffset || [0.0, 0.0],
        uvWorldScale: [w.sx, w.sy, w.sz],
        uvTileDensity: cfg.rendering.arenaTextureTileDensity,
        uvMappingMode: 1.0
      });

      if (w.type === 'FLOOR') {
        arenaUniforms.mDiffColor = [0.04, 0.12, 0.16];
        arenaUniforms.specularColor = [0.15, 0.45, 0.55];
      } else if (w.type === 'COVER') {
        arenaUniforms.mDiffColor = [0.32, 0.04, 0.42];
        arenaUniforms.specularColor = [0.9, 0.2, 1.0];
      } else {
        arenaUniforms.mDiffColor = [0.10, 0.04, 0.18];
        arenaUniforms.specularColor = [0.45, 0.12, 0.8];
      }

      objectsToDraw.push({
        type: w.type,
        programInfo: programInfo, bufferInfo: mesh.bufferInfo, vertexArray: mesh.vertexArray,
        uniforms: arenaUniforms,
        worldMatrix: math.MakeWorldGeneric(w.x, w.y, w.z, 0,0,0, w.sx, w.sy, w.sz)
      });
    }

    // BLOCKS
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      objectsToDraw.push({
        type: 'BLOCK', id: b.id, blockColor: b.color, visible: true,
        programInfo: programInfo, bufferInfo: solidMesh.bufferInfo, vertexArray: solidMesh.vertexArray,
        uniforms: Object.assign({}, cubeUniforms),
        worldMatrix: math.MakeWorldGeneric(b.x - a.width/2, 0, -b.y, 0,0,0, b.width/2, cfg.ball.radius, b.height/2)
      });
    }
  }

  function updateObjectMatrices() {
    var a = cfg.arena;
    var ball = curArena.getBall();
    var paddle = curArena.getPaddle();
    var blocks = curArena.getBlocks();

    for (var i = 0; i < objectsToDraw.length; i++) {
      var obj = objectsToDraw[i];
      if (obj.type === 'BLOCK') {
        if (blocks[obj.id].broken) { obj.visible = false; continue; }
        obj.visible = true;
        obj.worldMatrix = math.MakeWorldGeneric(
          blocks[obj.id].x - a.width/2, 0, -blocks[obj.id].y,
          0,0,0, blocks[obj.id].width/2, cfg.ball.radius, blocks[obj.id].height/2
        );
      } else if (obj.type === 'PADDLE') {
        obj.worldMatrix = math.MakeWorldGeneric(
          paddle.x - a.width/2, 0, -paddle.y,
          0,0,0, paddle.width/2, cfg.ball.radius, paddle.height/2
        );
      } else if (obj.type === 'BALL') {
        obj.worldMatrix = math.MakeWorld(
          ball.x - a.width/2, 0, -ball.y,
          0,0,0, 1.0
        );
      }
    }
  }

  function renderFrame() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Use camera module (includes orbital, shake, lerp)
    var viewMatrix = APP.camera.getViewMatrix();
    cfg.rendering.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var perspectiveMatrix = math.MakePerspective(
      cfg.rendering.fieldOfViewDeg, cfg.rendering.aspect,
      cfg.rendering.zNear, cfg.rendering.zFar
    );

    for (var i = 0; i < objectsToDraw.length; i++) {
      var obj = objectsToDraw[i];
      if (obj.visible === false) continue;

      var viewWorld = math.multiplyMatrices(viewMatrix, obj.worldMatrix);
      var projectionMatrix = math.multiplyMatrices(perspectiveMatrix, viewWorld);
      var normalMatrix = math.invertMatrix(math.transposeMatrix(viewWorld));
      var lightPosTransformed = math.multiplyMatrix3Vector3(
        math.sub3x3from4x4(viewMatrix), cfg.light.lightPosition
      );

      gl.useProgram(obj.programInfo.program);
      twgl.setBuffersAndAttributes(gl, obj.programInfo, obj.bufferInfo);

      obj.uniforms.matrix = math.transposeMatrix(projectionMatrix);
      obj.uniforms.nMatrix = math.transposeMatrix(normalMatrix);
      obj.uniforms.lightPosition = lightPosTransformed;
      obj.uniforms.eyePosition = [0.0, 0.0, 0.0];
      obj.uniforms.uTime = elapsedTime;

      if (obj.type === 'ARENA' || obj.type === 'COVER' || obj.type === 'FLOOR') {
        obj.uniforms.textureWeight = obj.type === 'FLOOR' ? 0.75 : 0.9;
        obj.uniforms.uEmissiveColor = obj.type === 'FLOOR' ? [0.0, 0.35, 0.45] : [0.3, 0.05, 0.5];
        obj.uniforms.uEmissiveStrength = obj.type === 'COVER' ? 0.45 : 0.25;
        obj.uniforms.uNeonGrid = 1.0;
        obj.uniforms.uRimStrength = obj.type === 'FLOOR' ? 0.18 : 0.4;
      } else {
        obj.uniforms.textureWeight = 0.0;
        obj.uniforms.uEmissiveStrength = 0.0;
        obj.uniforms.uNeonGrid = 0.0;
        obj.uniforms.uRimStrength = 0.25;
      }
      if (obj.type === 'BLOCK' || obj.type === 'PADDLE') {
        obj.uniforms.mDiffColor = obj.blockColor;
        obj.uniforms.specularColor = obj.blockColor;
      }

      twgl.setUniforms(obj.programInfo, obj.uniforms);
      twgl.drawBufferInfo(gl, obj.bufferInfo);
    }
  }

  function updateCameraLegend() {
    var currentPreset = APP.camera.getCurrentPreset();
    var cameraDisplay = document.getElementById('cameraPreset');
    if (cameraDisplay) cameraDisplay.textContent = APP.camera.getPresetName();

    var options = document.querySelectorAll('.camera-option');
    for (var i = 0; i < options.length; i++) {
      var isActive = options[i].getAttribute('data-camera') === String(currentPreset);
      options[i].classList.toggle('active', isActive);
    }
  }

  var lastTimestamp = 0;
  var accumulator = 0;
  var FIXED_DT = cfg.physics.fixedDt;
  var elapsedTime = 0;
  var startTime = 0;

  function gameLoop(timestamp) {
    if (startTime === 0) startTime = timestamp;
    elapsedTime = (timestamp - startTime) / 1000;

    // Delta-time in secondi, clamp per tab-switch
    var deltaTime = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : FIXED_DT;
    lastTimestamp = timestamp;
    deltaTime = Math.min(deltaTime, 0.05); // max 50ms per frame

    // Fixed timestep accumulator
    accumulator += deltaTime;
    while (accumulator >= FIXED_DT) {
      curGame.update(FIXED_DT);
      accumulator -= FIXED_DT;
    }

    // Camera cinematic update (ogni frame, non fixed)
    APP.camera.update(deltaTime);

    updateCameraLegend();

    updateObjectMatrices();
    renderFrame();
    if (cfg.game.status !== 'end') animationId = requestAnimationFrame(gameLoop);
  }

  function start() {
    if (animationId) cancelAnimationFrame(animationId);
    curGame.restartGame();
    buildScene();
    animationId = requestAnimationFrame(gameLoop);
  }

  function init(callback) {
    if (!webglSetup()) return;
    var path = window.location.pathname;
    var page = path.split('/').pop();
    var baseDir = window.location.href.replace(page, '');
    var shaderDir = baseDir + 'shaders/';
    console.log('Arkanoid 3D: loading shaders from', shaderDir);
    curGame.playSound('assets/song.mp3', 0.1);
    try {
      shaders.loadFiles([
        cacheBustUrl(shaderDir + 'vs.glsl'),
        cacheBustUrl(shaderDir + 'fs.glsl')
      ], function(shaderText) {
        console.log('Arkanoid 3D: shaders loaded, creating program...');
        programInfo = twgl.createProgramInfo(gl, [shaderText[0], shaderText[1]]);
        if (!programInfo) {
          console.error('Arkanoid 3D: failed to create program info');
          return;
        }
        createGeometries();
        createUniforms();
        APP.input.init(canvas, gl);
        initialized = true;
        console.log('Arkanoid 3D: renderer initialized successfully');
        if (callback) callback();
      });
    } catch (e) {
      console.error('Arkanoid 3D: init error:', e);
    }
  }

  function isInitialized() { return initialized; }

  return { init: init, start: start, buildScene: buildScene, isInitialized: isInitialized };
})();
