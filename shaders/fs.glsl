#version 300 es

precision mediump float;

in vec3 fsPosition;
in vec3 fsNormal;
in vec2 fsUV;

out vec4 outColor;

uniform vec3 lightColor;
uniform vec3 lightPosition;
uniform float LTarget;
uniform float LDecay;

uniform vec3 mDiffColor;

uniform vec3 eyePosition;
uniform vec3 specularColor;
uniform float specularShine; 
uniform float textureWeight;

uniform sampler2D diffuseTexture;

uniform float uTime;
uniform vec3  uVaporwaveColor;
uniform float uFillStrength;
uniform float uRimPower;
uniform float uRimStrength;
uniform vec3  uEmissiveColor;
uniform float uEmissiveStrength;
uniform float uNeonGrid;

void main() {
  vec3 nNormal = normalize(fsNormal);
  vec3 viewDir = normalize(eyePosition - fsPosition);

  vec3 textureColor = texture(diffuseTexture, fsUV).rgb;
  float textureEnergy = max(max(textureColor.r, textureColor.g), textureColor.b);
  if (uNeonGrid > 0.5) {
    textureColor = mix(textureColor, vec3(textureEnergy) * uEmissiveColor, 0.82);
  }
  vec3 baseColor = mDiffColor * (1.0 - textureWeight) + textureColor * textureWeight;

  // POINT LIGHT
  vec3 lightDir = normalize(lightPosition - fsPosition);
  float dist = length(lightPosition - fsPosition);
  vec3 lightIntensity = lightColor * pow(LTarget / dist, LDecay);

  // AMBIENT
  float ambientStrength = 0.55;
  vec3 ambient = baseColor * ambientStrength;

  // DIFFUSE (Lambert)
  float NdotL = max(0.0, dot(nNormal, lightDir));
  vec3 diffuse = baseColor * lightIntensity * NdotL;

  // FILL LIGHT
  vec3 fillDir = normalize(-lightDir + vec3(0.0, 0.5, 0.0));
  float NdotFill = max(0.0, dot(nNormal, fillDir));
  vec3 fill = baseColor * uFillStrength * NdotFill;

  float NdotV = max(0.0, dot(nNormal, viewDir));

  // SPECULAR (Blinn-Phong, light-gated to avoid camera-driven reflections)
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(0.0, dot(nNormal, halfDir)), specularShine) * NdotL;
  vec3 specular = spec * specularColor * lightIntensity * 0.35;

  // RIM LIGHT — neon edge glow
  float rim = 1.0 - NdotV;
  rim = pow(rim, uRimPower);
  vec3 rimColor = vec3(1.0, 0.2, 0.8) * rim * uRimStrength;

  // VAPORWAVE TINT
  vec3 vaporwaveTint = uVaporwaveColor;

  // ---- EMISSIVE GLOW (neon from inside the object) ----
  float pulse = sin(uTime * 0.7) * 0.2 + 0.9;
  vec3 emissive = uEmissiveColor * uEmissiveStrength * pulse;

  // ---- NEON GRID PATTERN on floor/walls ----
  vec3 neonGridColor = vec3(0.0);
  if (uNeonGrid > 0.5) {
    float gridMask = smoothstep(0.35, 0.92, textureEnergy);
    float gridPulse = sin(uTime * 0.45 + fsUV.x * 1.7 + fsUV.y * 1.3) * 0.18 + 0.82;
    neonGridColor = uEmissiveColor * gridMask * 1.35 * gridPulse;
  }

  // FINAL COMPOSITE
  vec3 finalColor = ambient + diffuse + specular;
  finalColor += fill;
  finalColor += rimColor;
  finalColor += vaporwaveTint;
  finalColor += emissive;
  finalColor += neonGridColor;

  outColor = vec4(clamp(finalColor, 0.0, 1.0).rgb, 1.0);
}
