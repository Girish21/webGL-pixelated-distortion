uniform float uTime;
uniform vec4 uResolution;
uniform sampler2D uTexture;
uniform sampler2D uDataTexture;

varying vec2 vUv;

void main() {
  vec2 newUV = (vUv - vec2(0.5)) * uResolution.zw + vec2(0.5);
  vec4 offset = texture2D(uDataTexture, vUv);
  vec4 map = texture2D(uTexture, newUV - 0.2 * offset.rg);
  gl_FragColor = map;
  // gl_FragColor = vec4(offset.r, 0., 0., 1.);
}
