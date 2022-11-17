var canvas;
var gl;
var programInfo;

var sphereVao, cubeVao;
var sphereArray, cubeArray;
var sphereUniforms, cubeUniforms;
var sphereBufferInfo, cubeBufferInfo;

var texture;
var objectsToDraw;
var worldMatrix, viewMatrix, perspectiveMatrix, projectionMatrix, viewWorld, normalMatrix, dirLightTransformed;

function main() {

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);


  sphereArray = { inPosition: sphereVertices.flat(), 
                  inNormal: sphereNormals.flat(),
                  indices: sphereIndices
                };
                
  //Create buffer, bind it, and load data inside
  sphereBufferInfo = twgl.createBufferInfoFromArrays(gl, sphereArray);
  sphereVao = twgl.createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo);

  cubeArray = { inPosition: cubeVertices, 
                inNormal: cubeNormals,
                indices: cubeIndices,
                inUV: cubeUV
              };
  cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, cubeArray);
  cubeVao = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo);

  texture = twgl.createTexture(gl, {target: gl.TEXTURE_2D, src: "assets/grid.png", flipY: true, mag: gl.LINEAR, min: gl.LINEAR });

  // Uniforms for each object.
  sphereUniforms = {
    textureWeight: 0.0,
    mDiffColor: [0.5, 0.0, 1.0],
    specularColor: specularColor,
    specularShine: specularShine,
    lightColor: light.lightColor,
    LTarget: light.LTarget,
    LDecay: light.LDecay
  };

  cubeUniforms = {
    textureWeight: 0.0,
    diffuseTexture: texture,
    mDiffColor: [0.0, 0.5, 1.0],
    specularColor: specularColor,
    specularShine: specularShine,
    lightColor: light.lightColor,
    LTarget: light.LTarget,
    LDecay: light.LDecay
  };

  objectsToDraw = [
    {
      type: "BALL",
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVao,
      uniforms: sphereUniforms,
      worldMatrix: utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0)
    },
    {
      type: "PADDLE",
      blockColor: [0.8 , 0.8, 0.8],
      programInfo: programInfo,
      bufferInfo: cubeBufferInfo,
      vertexArray: cubeVao,
      uniforms: { ...cubeUniforms },
      worldMatrix: utils.MakeWorldGeneric(paddle.x, 0.0, -paddle.y, 0.0, 0.0, 0.0, paddle.width/2, ball.radius, paddle.height/2)
    },
    {
      //ARENA RIGHT WALL
      type: "ARENA",
      programInfo: programInfo,
      bufferInfo: cubeBufferInfo,
      vertexArray: cubeVao,
      uniforms: { ...cubeUniforms },
      worldMatrix: utils.MakeWorldGeneric(arena.width/2, 0.0, -arena.height/2, 0.0, 0.0, 0.0, walls['right'].width/2, 0.5, walls['right'].height/2 + walls['top'].height/2 - 0.00001)
    },
    {
      //ARENA RIGHT WALL COVER
      type: "COVER",
      programInfo: programInfo,
      bufferInfo: cubeBufferInfo,
      vertexArray: cubeVao,
      uniforms: { ...cubeUniforms },
      worldMatrix: utils.MakeWorldGeneric(arena.width/2, 0.51, -arena.height/2, 0.0, 0.0, 0.0, walls['right'].width/2, 0.01, walls['right'].height/2 + walls['top'].height/2)
    },
    {
      //ARENA LEFT WALL 
      type: "ARENA",
      programInfo: programInfo,
      bufferInfo: cubeBufferInfo,
      vertexArray: cubeVao,
      uniforms: { ...cubeUniforms },
      worldMatrix: utils.MakeWorldGeneric(-arena.width/2, 0.0, -arena.height/2, 0.0, 0.0, 0.0, walls['left'].width/2, 0.5, walls['left'].height/2 + walls['top'].height/2 - 0.00001)
    },
    {
      //ARENA LEFT WALL COVER
      type: "COVER",
      programInfo: programInfo,
      bufferInfo: cubeBufferInfo,
      vertexArray: cubeVao,
      uniforms: { ...cubeUniforms },
      worldMatrix: utils.MakeWorldGeneric(-arena.width/2, 0.51, -arena.height/2, 0.0, 0.0, 0.0, walls['left'].width/2, 0.01, walls['left'].height/2 + walls['top'].height/2)
    },
    {
      //ARENA TOP WALL
      type: "ARENA",
      programInfo: programInfo,
      bufferInfo: cubeBufferInfo,
      vertexArray: cubeVao,
      uniforms: { ...cubeUniforms },
      worldMatrix: utils.MakeWorldGeneric(0.0, 0.0, -arena.height, 0.0, 0.0, 0.0, walls['top'].width/2 + arena.wallSize/2 - 0.00001, 0.5, walls['top'].height/2)
    },
    {
      //ARENA TOP WALL COVER
      type: "COVER",
      programInfo: programInfo,
      bufferInfo: cubeBufferInfo,
      vertexArray: cubeVao,
      uniforms: { ...cubeUniforms },
      worldMatrix: utils.MakeWorldGeneric(0.0, 0.51, -arena.height, 0.0, 0.0, 0.0, walls['top'].width/2 - arena.wallSize/2, 0.01, walls['top'].height/2)
    },
    {
      //TERRAIN
      type: "ARENA",
      programInfo: programInfo,
      bufferInfo: cubeBufferInfo,
      vertexArray: cubeVao,
      uniforms: { ...cubeUniforms },
      worldMatrix: utils.MakeWorldGeneric(0.0, -1.0, -arena.height/2, 0.0, 0.0, 0.0, arena.width/2 +  walls['right'].width/2 , 0.5, arena.height/2 +  walls['top'].height/2 )
    }    
  ];

  blocks.forEach(block => {
    objectsToDraw.push({
      type: "BLOCK",
      id: block.id,
      blockColor: block.color,
      programInfo: programInfo,
      bufferInfo: cubeBufferInfo,
      vertexArray: cubeVao,
      uniforms: { ...cubeUniforms },
      worldMatrix: utils.MakeWorldGeneric(block.x - arena.width/2, 0.0, -block.y, 0.0, 0.0, 0.0, block.width/2, ball.radius, block.height/2)
    }); 
  });
  
  requestAnimationFrame(drawScene);
}


function drawScene() {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  iteration();

  viewMatrix = utils.MakeView(camera.cx, camera.cy, camera.cz, camera.elevation, camera.angle);
  perspective.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  perspectiveMatrix = utils.MakePerspective(perspective.fieldOfViewDeg, perspective.aspect, perspective.zNear, perspective.zFar);

  objectsToDraw.forEach(function(object) {

    if (object.type == "BLOCK" && blocks[object.id].broken==true)
      object.worldMatrix = utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    
    if (object.type == "PADDLE")                  
      object.worldMatrix = utils.MakeWorldGeneric(paddle.x - arena.width/2, 0.0, -paddle.y, 0.0, 0.0, 0.0, paddle.width/2, ball.radius, paddle.height/2);

    if (object.type == "BALL")
      object.worldMatrix = utils.MakeWorld(ball.x - arena.width/2 + arena.wallSize, 0.0, -ball.y, 0.0, 0.0, 0.0, 1.0);
 
    viewWorld = utils.multiplyMatrices(viewMatrix, object.worldMatrix);
    projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorld);
    
    normalMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorld));
    lightPositionTransformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(viewMatrix), light.lightPosition);

    gl.useProgram(object.programInfo.program);

    // Set the buffers and attributes
    twgl.setBuffersAndAttributes(gl, object.programInfo, object.bufferInfo);

    object.uniforms.matrix = utils.transposeMatrix(projectionMatrix);
    object.uniforms.nMatrix = utils.transposeMatrix(normalMatrix);
    object.uniforms.lightPosition = lightPositionTransformed;
    object.uniforms.eyePosition = [camera.cx, camera.cy, camera.cz];
    
    if (object.type == "ARENA")
      object.uniforms.textureWeight = 0.9;

    if (object.type == "BLOCK" || object.type == "PADDLE"){
      object.uniforms.mDiffColor = object.blockColor;
      object.uniforms.specularColor = object.blockColor;
    }
    // Set the uniforms we just computed
    twgl.setUniforms(object.programInfo, object.uniforms);
    
    twgl.drawBufferInfo(gl, object.bufferInfo);

  });

  requestAnimationFrame(drawScene);
}


async function init(){
  
  playSound('assets/song.mp3', 0.1);
  
  path = window.location.pathname;
  page = path.split("/").pop();
  baseDir = window.location.href.replace(page, '');
  shaderDir = baseDir + "shaders/";

  canvas = document.getElementById("scene");
  canvas.addEventListener("mousedown", launchBall, false);
  canvas.addEventListener("mousemove", doMouseMove, false);
 	canvas.addEventListener("mousewheel", doMouseWheel, false);  
  window.addEventListener("keydown", keyFunction, false);

  gl = canvas.getContext("webgl2");
  if (!gl) {
      document.write("GL context not opened");
      return;
  }
  utils.resizeCanvasToDisplaySize(gl.canvas);

  await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {  
    //Crate program info, loading the two shaders, and get the locations of attributes and uniforms
    programInfo = twgl.createProgramInfo(gl, [shaderText[0], shaderText[1]]);    
  });

}
 
window.onload = init; 
