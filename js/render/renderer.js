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
  var sphereVao, cubeVao;
  var sphereBufferInfo, cubeBufferInfo;
  var sphereUniforms, cubeUniforms;
  var texture;
  var objectsToDraw = [];
  var animationId = null;
  var initialized = false;

  function webglSetup() {
    canvas = document.getElementById('scene');
    gl = canvas.getContext('webgl2');
    if (!gl) { document.write('WebGL 2.0 not supported'); return false; }
    shaders.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    return true;
  }

  function createGeometries() {
    var sphereGeo = geom.createSphere(cfg.ball.radius, 30);
    var cubeGeo = geom.createCube();

    sphereBufferInfo = twgl.createBufferInfoFromArrays(gl, {
      inPosition: { data: sphereGeo.vertices.flat(), numComponents: 3 },
      inNormal: { data: sphereGeo.normals.flat(), numComponents: 3 },
      inUV: { data: new Array(sphereGeo.vertices.length * 2).fill(0), numComponents: 2 },
      indices: sphereGeo.indices
    });
    cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, {
      inPosition: { data: cubeGeo.vertices, numComponents: 3 },
      inNormal: { data: cubeGeo.normals, numComponents: 3 },
      inUV: { data: cubeGeo.uvs, numComponents: 2 },
      indices: cubeGeo.indices
    });
    sphereVao = twgl.createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo);
    cubeVao = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo);
  }

  function createUniforms() {
    texture = twgl.createTexture(gl, {
      target: gl.TEXTURE_2D,
      src: 'assets/grid.png',
      flipY: true,
      mag: gl.LINEAR,
      min: gl.LINEAR
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
      LDecay: l.LDecay
    };
    cubeUniforms = {
      textureWeight: 0.0,
      diffuseTexture: texture,
      mDiffColor: [0.0, 0.5, 1.0],
      specularColor: s.specularColor,
      specularShine: s.specularShine,
      lightColor: l.lightColor,
      LTarget: l.LTarget,
      LDecay: l.LDecay
    };
  }

  function buildScene() {
    objectsToDraw = [];
    var a = cfg.arena;
    var paddle = curArena.getPaddle();
    var walls = curArena.getWalls();
    var blocks = curArena.getBlocks();

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
      programInfo: programInfo, bufferInfo: cubeBufferInfo, vertexArray: cubeVao,
      uniforms: Object.assign({}, cubeUniforms),
      worldMatrix: pw
    });

    // WALLS
    var wallDefs = [
      {type: 'ARENA', x: a.width/2, y: 0, z: -a.height/2, sx: walls.right.width/2, sy: 0.5, sz: walls.right.height/2 + walls.top.height/2 - 0.00001},
      {type: 'COVER', x: a.width/2, y: 0.51, z: -a.height/2, sx: walls.right.width/2, sy: 0.01, sz: walls.right.height/2 + walls.top.height/2},
      {type: 'ARENA', x: -a.width/2, y: 0, z: -a.height/2, sx: walls.left.width/2, sy: 0.5, sz: walls.left.height/2 + walls.top.height/2 - 0.00001},
      {type: 'COVER', x: -a.width/2, y: 0.51, z: -a.height/2, sx: walls.left.width/2, sy: 0.01, sz: walls.left.height/2 + walls.top.height/2},
      {type: 'ARENA', x: 0, y: 0, z: -a.height, sx: walls.top.width/2 + a.wallSize/2 - 0.00001, sy: 0.5, sz: walls.top.height/2},
      {type: 'COVER', x: 0, y: 0.51, z: -a.height, sx: walls.top.width/2 - a.wallSize/2, sy: 0.01, sz: walls.top.height/2},
      {type: 'ARENA', x: 0, y: -1.0, z: -a.height/2, sx: a.width/2 + walls.right.width/2, sy: 0.5, sz: a.height/2 + walls.top.height/2}
    ];
    for (var d = 0; d < wallDefs.length; d++) {
      var w = wallDefs[d];
      objectsToDraw.push({
        type: w.type,
        programInfo: programInfo, bufferInfo: cubeBufferInfo, vertexArray: cubeVao,
        uniforms: Object.assign({}, cubeUniforms),
        worldMatrix: math.MakeWorldGeneric(w.x, w.y, w.z, 0,0,0, w.sx, w.sy, w.sz)
      });
    }

    // BLOCKS
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      objectsToDraw.push({
        type: 'BLOCK', id: b.id, blockColor: b.color, visible: true,
        programInfo: programInfo, bufferInfo: cubeBufferInfo, vertexArray: cubeVao,
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

    var viewMatrix = math.MakeView(cfg.camera.cx, cfg.camera.cy, cfg.camera.cz,
                                    cfg.camera.elevation, cfg.camera.angle);
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

      if (obj.type === 'ARENA') obj.uniforms.textureWeight = 0.9;
      if (obj.type === 'BLOCK' || obj.type === 'PADDLE') {
        obj.uniforms.mDiffColor = obj.blockColor;
        obj.uniforms.specularColor = obj.blockColor;
      }

      twgl.setUniforms(obj.programInfo, obj.uniforms);
      twgl.drawBufferInfo(gl, obj.bufferInfo);
    }
  }

  function gameLoop() {
    curGame.update();
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
      shaders.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function(shaderText) {
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
