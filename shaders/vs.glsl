#version 300 es

in vec3 inPosition;
in vec3 inNormal;
in vec2 inUV;

out vec3 fsPosition;
out vec3 fsNormal;
out vec2 fsUV;

uniform mat4 matrix; 
uniform mat4 nMatrix;

void main() {

  fsUV = inUV;
  fsPosition = mat3(matrix) * inPosition;
  fsNormal = mat3(nMatrix) * inNormal; 
  
  gl_Position = matrix * vec4(inPosition, 1.0);

}