#version 300 es

precision mediump float;

in vec3 fsPosition;
in vec3 fsNormal;
in vec2 fsUV;

out vec4 outColor;

uniform vec3 lightColor; 	//directional light color 
uniform vec3 lightPosition;
uniform float LTarget;		//g parameter
uniform float LDecay;		//β parameter

uniform vec3 mDiffColor; 	//material diffuse color 

uniform vec3 eyePosition;
uniform vec3 specularColor;
uniform float specularShine; 
uniform float textureWeight;

uniform sampler2D diffuseTexture;

void main() {

	vec3 nNormal = normalize(fsNormal);
  	vec3 eyeDirVec = normalize(eyePosition - fsPosition);

	vec3 textureColor = texture(diffuseTexture, fsUV).rgb;
	vec3 ambColor = mDiffColor * (1.0 - textureWeight) + textureColor * textureWeight;

	//POINT LIGHT
	vec3 lightDirectionPoint = normalize(lightPosition - fsPosition);
	vec3 lightColorPoint = lightColor * pow(LTarget / length(lightPosition - fsPosition), LDecay);

	//VAPORWAVE COLOR CORRECTION FILTER
	vec3 vaporwaveColor = vec3(0.15, 0, 0.3);

	//AMBIENT STANDARD
 	vec3 ambientLightColor = vec3(0.6);
	vec3 ambient = ambientLightColor * ambColor;

  	//LAMBERT DIFFUSE
  	vec3 diffuse = ambColor * lightColorPoint * dot(lightDirectionPoint, nNormal);

	//PHONG SPECULAR
	vec3 r = 2.0 * nNormal * dot(lightDirectionPoint, nNormal) - lightDirectionPoint;
  	vec3 specular = pow(clamp(dot(eyeDirVec, r),0.0,1.0), specularShine) * specularColor;

	//outColor = vec4(clamp( ambient + diffuse + specular, 0.0, 1.0).rgb, 1.0);
	outColor = vec4(clamp( vaporwaveColor + ambient + diffuse + specular, 0.0, 1.0).rgb, 1.0);

}