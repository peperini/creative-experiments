precision highp float;
 
uniform vec2 uImageSizes;
uniform vec2 uPlaneSizes;
uniform sampler2D tMap;
uniform sampler2D tAlpha;

varying vec2 vUv;

void main() {
  vec2 ratio = vec2(
    min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
    min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
  );

  vec2 uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );


  vec4 color = texture2D(tMap, uv);
  vec4 mask = texture2D(tAlpha, vUv);

  // Combine source image alpha with mask alpha so PNG transparency is preserved.
  float alpha = color.a * (mask.r * mask.a);

  if (alpha < 0.001) discard;

  gl_FragColor = vec4(color.rgb, alpha);
}
