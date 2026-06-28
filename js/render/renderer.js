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
  var brightProgramInfo, blurProgramInfo, compositeProgramInfo;
  var sphereVao;
  var sphereBufferInfo;
  var fullscreenBufferInfo;
  var cubeMeshes = {};
  var sphereUniforms, cubeUniforms;
  var texture;
  var sceneTarget = null;
  var bloomTargetA = null;
  var bloomTargetB = null;
  var bloomSize = { width: 0, height: 0 };
  var objectsToDraw = [];
  var animationId = null;
  var initialized = false;

  var fullscreenVs = '#version 300 es\n' +
    'in vec2 position;\n' +
    'out vec2 vUv;\n' +
    'void main() {\n' +
    '  vUv = position * 0.5 + 0.5;\n' +
    '  gl_Position = vec4(position, 0.0, 1.0);\n' +
    '}\n';

  var brightFs = '#version 300 es\n' +
    'precision mediump float;\n' +
    'in vec2 vUv;\n' +
    'out vec4 outColor;\n' +
    'uniform sampler2D sceneTexture;\n' +
    'uniform float threshold;\n' +
    'void main() {\n' +
    '  vec3 color = texture(sceneTexture, vUv).rgb;\n' +
    '  float luma = max(max(color.r, color.g), color.b);\n' +
    '  float chroma = luma - min(min(color.r, color.g), color.b);\n' +
    '  float mask = smoothstep(threshold, threshold + 0.18, luma) * smoothstep(0.12, 0.34, chroma);\n' +
    '  outColor = vec4(color * mask, 1.0);\n' +
    '}\n';

  var blurFs = '#version 300 es\n' +
    'precision mediump float;\n' +
    'in vec2 vUv;\n' +
    'out vec4 outColor;\n' +
    'uniform sampler2D image;\n' +
    'uniform vec2 texelSize;\n' +
    'uniform vec2 direction;\n' +
    'void main() {\n' +
    '  vec3 color = texture(image, vUv).rgb * 0.227027;\n' +
    '  color += texture(image, vUv + direction * texelSize * 1.384615).rgb * 0.316216;\n' +
    '  color += texture(image, vUv - direction * texelSize * 1.384615).rgb * 0.316216;\n' +
    '  color += texture(image, vUv + direction * texelSize * 3.230769).rgb * 0.070270;\n' +
    '  color += texture(image, vUv - direction * texelSize * 3.230769).rgb * 0.070270;\n' +
    '  outColor = vec4(color, 1.0);\n' +
    '}\n';

  var compositeFs = '#version 300 es\n' +
    'precision mediump float;\n' +
    'in vec2 vUv;\n' +
    'out vec4 outColor;\n' +
    'uniform sampler2D sceneTexture;\n' +
    'uniform sampler2D bloomTexture;\n' +
    'uniform float bloomStrength;\n' +
    'uniform float fxaaEnabled;\n' +
    'uniform vec2 texelSize;\n' +
    'uniform float fxaaStrength;\n' +
    'void main() {\n' +
    '  vec4 sceneSample = texture(sceneTexture, vUv);\n' +
    '  vec3 scene = sceneSample.rgb;\n' +
    '  if (fxaaEnabled > 0.5) {\n' +
    '    vec3 luma = vec3(0.299, 0.587, 0.114);\n' +
    '    vec3 north = texture(sceneTexture, vUv + vec2(0.0, -1.0) * texelSize).rgb;\n' +
    '    vec3 south = texture(sceneTexture, vUv + vec2(0.0,  1.0) * texelSize).rgb;\n' +
    '    vec3 west = texture(sceneTexture, vUv + vec2(-1.0, 0.0) * texelSize).rgb;\n' +
    '    vec3 east = texture(sceneTexture, vUv + vec2( 1.0, 0.0) * texelSize).rgb;\n' +
    '    float centerLum = dot(scene, luma);\n' +
    '    float edge = max(abs(centerLum - dot(north, luma)), abs(centerLum - dot(south, luma)));\n' +
    '    edge = max(edge, max(abs(centerLum - dot(west, luma)), abs(centerLum - dot(east, luma))));\n' +
    '    vec3 smoothed = scene * 0.5 + (north + south + west + east) * 0.125;\n' +
    '    scene = mix(scene, smoothed, smoothstep(0.08, 0.32, edge) * fxaaStrength);\n' +
    '  }\n' +
    '  vec3 bloom = texture(bloomTexture, vUv).rgb * bloomStrength;\n' +
    '  vec3 color = scene + bloom;\n' +
    '  outColor = vec4(clamp(color, 0.0, 1.0), sceneSample.a);\n' +
    '}\n';

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

  function neonColor(color) {
    var minChannel = Math.min(color[0], color[1], color[2]);
    var chroma = [
      Math.max(0, color[0] - minChannel),
      Math.max(0, color[1] - minChannel),
      Math.max(0, color[2] - minChannel)
    ];
    var maxChannel = Math.max(chroma[0], chroma[1], chroma[2], 0.001);
    return [
      Math.min(1, chroma[0] / maxChannel),
      Math.min(1, chroma[1] / maxChannel),
      Math.min(1, chroma[2] / maxChannel)
    ];
  }

  function createRenderTarget(width, height, withDepth) {
    var color = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, color);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);

    var depth = null;
    if (withDepth) {
      depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { framebuffer: framebuffer, color: color, depth: depth, width: width, height: height };
  }

  function deleteRenderTarget(target) {
    if (!target) return;
    if (target.depth) gl.deleteRenderbuffer(target.depth);
    if (target.color) gl.deleteTexture(target.color);
    if (target.framebuffer) gl.deleteFramebuffer(target.framebuffer);
  }

  function resizePostTargets() {
    if (!cfg.rendering.bloomEnabled) return;

    var width = gl.canvas.width;
    var height = gl.canvas.height;
    var bloomWidth = Math.max(1, Math.floor(width * cfg.rendering.bloomScale));
    var bloomHeight = Math.max(1, Math.floor(height * cfg.rendering.bloomScale));

    if (sceneTarget && sceneTarget.width === width && sceneTarget.height === height &&
        bloomSize.width === bloomWidth && bloomSize.height === bloomHeight) {
      return;
    }

    deleteRenderTarget(sceneTarget);
    deleteRenderTarget(bloomTargetA);
    deleteRenderTarget(bloomTargetB);

    sceneTarget = createRenderTarget(width, height, true);
    bloomTargetA = createRenderTarget(bloomWidth, bloomHeight, false);
    bloomTargetB = createRenderTarget(bloomWidth, bloomHeight, false);
    bloomSize.width = bloomWidth;
    bloomSize.height = bloomHeight;
  }

  function drawFullscreen(program, target, width, height, uniforms) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(program.program);
    twgl.setBuffersAndAttributes(gl, program, fullscreenBufferInfo);
    twgl.setUniforms(program, uniforms);
    twgl.drawBufferInfo(gl, fullscreenBufferInfo);
  }

  function applyBloom() {
    drawFullscreen(brightProgramInfo, bloomTargetA, bloomTargetA.width, bloomTargetA.height, {
      sceneTexture: sceneTarget.color,
      threshold: cfg.rendering.bloomThreshold
    });

    drawFullscreen(blurProgramInfo, bloomTargetB, bloomTargetB.width, bloomTargetB.height, {
      image: bloomTargetA.color,
      texelSize: [1 / bloomTargetA.width, 1 / bloomTargetA.height],
      direction: [1.0, 0.0]
    });

    drawFullscreen(blurProgramInfo, bloomTargetA, bloomTargetA.width, bloomTargetA.height, {
      image: bloomTargetB.color,
      texelSize: [1 / bloomTargetB.width, 1 / bloomTargetB.height],
      direction: [0.0, 1.0]
    });

    drawFullscreen(compositeProgramInfo, null, gl.canvas.width, gl.canvas.height, {
      sceneTexture: sceneTarget.color,
      bloomTexture: bloomTargetA.color,
      bloomStrength: cfg.rendering.bloomStrength,
      fxaaEnabled: cfg.rendering.fxaaEnabled ? 1.0 : 0.0,
      texelSize: [1 / gl.canvas.width, 1 / gl.canvas.height],
      fxaaStrength: cfg.rendering.fxaaStrength
    });

    gl.enable(gl.DEPTH_TEST);
  }

  function createUniforms() {
    texture = twgl.createTexture(gl, {
      target: gl.TEXTURE_2D,
      src: cacheBustUrl('assets/textures/grid.png'),
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
    if (cfg.rendering.bloomEnabled) resizePostTargets();

    if (cfg.rendering.bloomEnabled && sceneTarget) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneTarget.framebuffer);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Use camera module (includes orbital, shake, lerp)
    var viewMatrix = APP.camera.getViewMatrix();
    cfg.rendering.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrixBase;
    if (APP.camera.getProjectionMode() === 'orthographic' && cfg.rendering.topDownOrthographic) {
      var margin = cfg.rendering.topDownOrthoMargin;
      var viewHeight = (cfg.arena.height + cfg.arena.wallSize * 2 + margin * 2) * cfg.rendering.topDownOrthoZoom;
      var minWidth = cfg.arena.width + cfg.arena.wallSize * 2 + margin * 2;
      if (viewHeight * cfg.rendering.aspect < minWidth) {
        viewHeight = minWidth / cfg.rendering.aspect;
      }
      projectionMatrixBase = math.MakeOrthographic(
        viewHeight * cfg.rendering.aspect,
        viewHeight,
        cfg.rendering.zNear,
        cfg.rendering.zFar
      );
    } else {
      projectionMatrixBase = math.MakePerspective(
        cfg.rendering.fieldOfViewDeg, cfg.rendering.aspect,
        cfg.rendering.zNear, cfg.rendering.zFar
      );
    }

    function drawSceneObject(obj) {
      if (obj.visible === false) return;

      var viewWorld = math.multiplyMatrices(viewMatrix, obj.worldMatrix);
      var projectionMatrix = math.multiplyMatrices(projectionMatrixBase, viewWorld);
      var normalMatrix = math.invertMatrix(math.transposeMatrix(viewWorld));
      var lightPosView = math.multiplyMatrixVector(
        viewMatrix,
        [cfg.light.lightPosition[0], cfg.light.lightPosition[1], cfg.light.lightPosition[2], 1.0]
      );

      gl.useProgram(obj.programInfo.program);
      twgl.setBuffersAndAttributes(gl, obj.programInfo, obj.bufferInfo);

      obj.uniforms.matrix = math.transposeMatrix(projectionMatrix);
      obj.uniforms.modelViewMatrix = math.transposeMatrix(viewWorld);
      obj.uniforms.nMatrix = math.transposeMatrix(normalMatrix);
      obj.uniforms.lightPosition = [lightPosView[0], lightPosView[1], lightPosView[2]];
      obj.uniforms.eyePosition = [0.0, 0.0, 0.0];
      obj.uniforms.uTime = elapsedTime;

      if (obj.type === 'ARENA' || obj.type === 'COVER' || obj.type === 'FLOOR') {
        obj.uniforms.textureWeight = obj.type === 'FLOOR' ? 0.42 : 0.58;
        obj.uniforms.uVaporwaveColor = [0.05, 0.0, 0.11];
        obj.uniforms.uEmissiveColor = [1.0, 0.0, 0.95];
        obj.uniforms.uEmissiveStrength = obj.type === 'COVER' ? 0.21 : 0.135;
        obj.uniforms.uNeonGrid = 1.0;
        obj.uniforms.uRimStrength = obj.type === 'FLOOR' ? 0.27 : 0.42;

        if (obj.type === 'FLOOR') {
          obj.uniforms.mDiffColor = [0.035, 0.008, 0.07];
          obj.uniforms.specularColor = [0.22, 0.04, 0.28];
        } else if (obj.type === 'COVER') {
          obj.uniforms.mDiffColor = [0.08, 0.012, 0.10];
          obj.uniforms.specularColor = [0.22, 0.04, 0.28];
        } else {
          obj.uniforms.mDiffColor = [0.045, 0.01, 0.075];
          obj.uniforms.specularColor = [0.18, 0.035, 0.24];
        }
      } else {
        obj.uniforms.textureWeight = 0.0;
        obj.uniforms.uNeonGrid = 0.0;
        obj.uniforms.uVaporwaveColor = [0.045, 0.0, 0.075];
        obj.uniforms.uRimStrength = 0.16;
      }
      if (obj.type === 'BALL') {
        obj.uniforms.mDiffColor = [0.95, 0.05, 1.0];
        obj.uniforms.uEmissiveColor = [1.0, 0.0, 0.95];
        obj.uniforms.uEmissiveStrength = 0.38;
        obj.uniforms.uRimStrength = 0.5;
      }
      if (obj.type === 'BLOCK') {
        var blockNeonColor = neonColor(obj.blockColor);
        obj.uniforms.mDiffColor = [
          obj.blockColor[0] * 0.16 + blockNeonColor[0] * 0.38,
          obj.blockColor[1] * 0.16 + blockNeonColor[1] * 0.38,
          obj.blockColor[2] * 0.16 + blockNeonColor[2] * 0.38
        ];
        obj.uniforms.uVaporwaveColor = [0.0, 0.0, 0.0];
        obj.uniforms.uEmissiveColor = blockNeonColor;
        obj.uniforms.uEmissiveStrength = 0.3;
        obj.uniforms.uRimStrength = 0.3;
        obj.uniforms.specularColor = [
          blockNeonColor[0] * 0.06,
          blockNeonColor[1] * 0.06,
          blockNeonColor[2] * 0.06
        ];
      }
      if (obj.type === 'PADDLE') {
        obj.uniforms.mDiffColor = obj.blockColor;
        obj.uniforms.uEmissiveColor = obj.blockColor;
        obj.uniforms.uEmissiveStrength = 0.0;
        obj.uniforms.specularColor = [
          obj.blockColor[0] * 0.35,
          obj.blockColor[1] * 0.35,
          obj.blockColor[2] * 0.35
        ];
      }

      twgl.setUniforms(obj.programInfo, obj.uniforms);
      twgl.drawBufferInfo(gl, obj.bufferInfo);
    }

    var ballObject = null;
    for (var i = 0; i < objectsToDraw.length; i++) {
      var obj = objectsToDraw[i];
      if (obj.type === 'BALL') {
        ballObject = obj;
        continue;
      }
      drawSceneObject(obj);
    }

    if (ballObject) drawSceneObject(ballObject);

    if (cfg.rendering.bloomEnabled && sceneTarget) applyBloom();
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
    curGame.playSound('assets/audio/song.mp3', 0.1);
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
        brightProgramInfo = twgl.createProgramInfo(gl, [fullscreenVs, brightFs]);
        blurProgramInfo = twgl.createProgramInfo(gl, [fullscreenVs, blurFs]);
        compositeProgramInfo = twgl.createProgramInfo(gl, [fullscreenVs, compositeFs]);
        fullscreenBufferInfo = twgl.createBufferInfoFromArrays(gl, {
          position: {
            numComponents: 2,
            data: [-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]
          }
        });
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
