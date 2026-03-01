precision highp float;

uniform vec2 uMouse;
uniform sampler2D uTexture;
varying vec2 vUv;

const float radius = 0.7;
const float strength = 1.2;

vec2 bulge(vec2 uv, vec2 center) {
  uv -= center;

  float dist = length(uv) / radius; // distance from UVs
  float distPow = pow(dist, 2.); // exponential
  float strengthAmount = strength / (1.0 + distPow); // Invert bulge and add a minimum of 1)
  uv *= strengthAmount;

  uv += center;

  return uv;
}

void main() {
  vec2 center = vec2(0.5, 0.5);
  vec2 bulgeUV = bulge(vUv, uMouse);
  vec4 tex = texture2D(uTexture, bulgeUV);
  gl_FragColor.rgb = tex.rgb;
  gl_FragColor.a = 1.0;
}