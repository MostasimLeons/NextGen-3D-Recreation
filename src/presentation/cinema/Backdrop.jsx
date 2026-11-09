import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Full-screen GLSL backdrop drawn behind every scene (clip-space quad, no
 * camera dependence): warm near-black, drifting fbm smoke, a radial heat
 * glow whose position/strength each scene sets, and diagonal light trails
 * sweeping across. Values are linear (bloom + ACES happen in PostFX).
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime, uGlow, uTint, uTrails, uAspect;
  uniform vec2 uGlowPos;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 p = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);
    vec3 deep = vec3(0.012, 0.005, 0.002);
    vec3 ember = vec3(0.22, 0.035, 0.012);
    vec3 heat = vec3(1.0, 0.32, 0.06);

    // drifting smoke, two layers at different speeds
    float s1 = fbm(p * 1.8 + vec2(uTime * 0.025, -uTime * 0.045));
    float s2 = fbm(p * 3.6 - vec2(uTime * 0.05, uTime * 0.02) + s1);
    float smoke = smoothstep(0.42, 0.95, s1 * 0.6 + s2 * 0.5);

    vec2 g = vec2((uGlowPos.x - 0.5) * uAspect, uGlowPos.y - 0.5);
    float d = length(p - g);
    float glow = exp(-d * d * 4.5) * uGlow;

    vec3 col = deep + ember * (0.35 + uTint) * smoke * 0.9;
    col += heat * glow * (0.08 + smoke * 0.22);

    // light trails: thin diagonal streaks with travelling bright heads
    float trails = 0.0;
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      vec2 q = p;
      float lane = (fi - 2.0) * 0.21 + sin(fi * 7.1) * 0.05;
      float y = q.y - q.x * (0.28 + fi * 0.03) - lane;
      float line = exp(-y * y * 90000.0);           // ~2px thin
      float head = fract(q.x * 0.35 - uTime * (0.16 + fi * 0.045) + fi * 0.37);
      // a short bright streak with a fading tail, mostly dark lane otherwise
      trails += line * pow(smoothstep(0.55, 0.97, head), 3.0) * smoothstep(1.0, 0.975, head);
    }
    col += heat * trails * uTrails * 1.4;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Backdrop({ seq }) {
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uGlow: { value: 0.6 },
          uTint: { value: 0.3 },
          uTrails: { value: 0.6 },
          uAspect: { value: 1 },
          uGlowPos: { value: new THREE.Vector2(0.5, 0.5) },
        },
      }),
    [],
  );

  useFrame(() => {
    const u = material.uniforms;
    u.uTime.value = seq.t;
    u.uAspect.value = aspect;
    // eased per-scene look (set by the Director)
    const k = 0.06;
    u.uGlow.value += (seq.look.glow - u.uGlow.value) * k;
    u.uTint.value += (seq.look.tint - u.uTint.value) * k;
    u.uTrails.value += (seq.look.trails - u.uTrails.value) * k;
    u.uGlowPos.value.lerp(seq.look.glowPos, k);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-10} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
