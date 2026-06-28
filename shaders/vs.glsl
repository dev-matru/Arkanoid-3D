#version 300 es

in vec3 inPosition;
in vec3 inNormal;
in vec2 inUV;

out vec3 fsPosition;
out vec3 fsNormal;
out vec2 fsUV;

uniform mat4 matrix; 
uniform mat4 nMatrix;
uniform vec2 uvScale;
uniform vec2 uvOffset;
uniform vec3 uvWorldScale;
uniform float uvTileDensity;
uniform float uvMappingMode;

void main() {

  vec2 mappedUV = inUV;
  if (uvMappingMode > 0.5) {
    vec3 scaledPosition = inPosition * uvWorldScale;
    vec3 axis = abs(inNormal);

    if (axis.x > axis.y && axis.x > axis.z) {
      mappedUV = scaledPosition.zy;
    } else if (axis.y > axis.z) {
      mappedUV = scaledPosition.xz;
    } else {
      mappedUV = scaledPosition.xy;
    }

    mappedUV *= uvTileDensity;
  }

  fsUV = mappedUV * uvScale + uvOffset;
  fsPosition = mat3(matrix) * inPosition;
  fsNormal = mat3(nMatrix) * inNormal; 
  
  gl_Position = matrix * vec4(inPosition, 1.0);

}
