import * as THREE from 'three';

/**
 * Full-screen GLSL backdrop drawn behind everything (replaces the CSS glow).
 * Warm near-black base → optional deep-red tint, a soft burnt-orange glow at
 * a scroll-animated screen position, drifting smoke-like fbm and fine grain.
 *
 * Uniforms are driven from rig.state: glow, gx, gy, tint.
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0); // clip space, far plane
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform float uGlow;
  uniform vec2 uGlowPos;
  uniform float uTint;
  uniform vec3 uBase;
  uniform vec3 uTintColor;
  uniform vec3 uGlowColor;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);

    // Base: near-black brown, warming toward deep red with uTint.
    vec3 col = mix(uBase, uTintColor, uTint * 0.85);
    // Floor bounce: slightly lighter toward the bottom.
    col += vec3(0.05, 0.022, 0.008) * smoothstep(0.6, 0.0, uv.y);

    // Smoke: slow domain-warped fbm, warm and very subtle.
    vec2 q = p * 2.2 + vec2(0.0, -uTime * 0.03);
    float s = fbm(q + fbm(q * 1.7 + uTime * 0.02) * 1.4);
    col += vec3(0.09, 0.04, 0.015) * smoothstep(0.45, 0.95, s) * (0.4 + uGlow);

    // Glow.
    vec2 g = vec2((uGlowPos.x - 0.5) * uAspect, uGlowPos.y - 0.5);
    float d = length(p - g);
    col += uGlowColor * uGlow * (exp(-d * d * 6.0) * 0.55 + exp(-d * 2.8) * 0.16);

    // Vignette + grain (post grain adds more on top).
    col *= mix(1.0, 0.55, smoothstep(0.35, 1.1, length(p)));
    col += (hash(uv * 900.0 + uTime) - 0.5) * 0.012;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createBackdrop() {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uGlow: { value: 0 },
      uGlowPos: { value: new THREE.Vector2(0.5, 0.4) },
      uTint: { value: 0 },
      uBase: { value: new THREE.Color('#100904').convertSRGBToLinear() },
      uTintColor: { value: new THREE.Color('#2a0904').convertSRGBToLinear() },
      uGlowColor: { value: new THREE.Color('#dc5000').convertSRGBToLinear() },
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.name = 'backdrop';
  return mesh;
}
