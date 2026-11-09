import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../../three/textures.js';

/**
 * The NEXT GEN wordmark as a particle field. The real brand font (Outfit,
 * already loaded by the page) is drawn to an offscreen canvas and sampled,
 * so the logo is exact without shipping a 3D font file. A GLSL shader flies
 * every particle from a swirling shell into its letter (`form`), heats the
 * ones still in flight to orange, and sweeps a bright scan across the word.
 *
 * Shown in the opening (scene "logo") and the finale (scene "final").
 */
function sampleWordmark(text, count, rand) {
  const W = 1400;
  const H = 300;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(H * 0.78)}px Outfit, "Hanken Grotesk", sans-serif`;
  ctx.fillText(text, W / 2, H / 2 + H * 0.04);
  const { data } = ctx.getImageData(0, 0, W, H);
  const pts = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 140) pts.push(x, y);
  }
  const n = pts.length / 2;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const k = Math.floor(rand() * n);
    out[i * 3] = (pts[k * 2] / W - 0.5) * 13;
    out[i * 3 + 1] = -(pts[k * 2 + 1] / H - 0.5) * (13 * H) / W;
    out[i * 3 + 2] = (rand() - 0.5) * 0.25;
  }
  return out;
}

const vertexShader = /* glsl */ `
  attribute vec3 aTarget;
  attribute vec3 aSeed;
  uniform float uTime, uForm, uSweep, uPixelRatio, uSize, uFade;
  varying float vHot;
  varying float vScan;
  varying float vAlpha;

  void main() {
    // staggered arrival: each particle has its own delay
    float delay = aSeed.x * 0.4;
    float f = clamp((uForm - delay) / 0.6, 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);

    float a = uTime * (0.25 + aSeed.y * 0.5) + aSeed.z * 6.283;
    vec3 swirl = vec3(cos(a), sin(a * 1.3), sin(a)) * (0.6 + aSeed.y);
    vec3 settled = aTarget + swirl * 0.025;
    vec3 p = mix(position + swirl * 2.2, settled, f);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * mix(1.6, 0.9 + aSeed.z * 0.5, f) * uPixelRatio * (16.0 / -mv.z);

    vHot = 1.0 - f;
    vScan = exp(-pow(aTarget.x - uSweep, 2.0) * 1.4) * f;
    vAlpha = uFade * mix(0.45, 1.0, f);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vHot;
  varying float vScan;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 cream = vec3(1.0, 0.9, 0.78);
    vec3 orange = vec3(1.0, 0.36, 0.08) * 2.2;     // > 1 blooms
    vec3 col = mix(cream, orange, vHot) + vec3(1.0, 0.72, 0.45) * vScan * 2.4;
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

export default function LogoParticles({ seq, count = 7000, text = 'NEXT GEN' }) {
  const points = useRef();
  // portrait screens: shrink the 13-unit-wide word so it fits the width
  const fitScale = useThree((s) => THREE.MathUtils.clamp((s.size.width / Math.max(1, s.size.height)) * 1.25, 0.45, 1));
  const { geometry, material } = useMemo(() => {
    const rand = mulberry32(2048);
    const target = sampleWordmark(text, count, rand);
    const start = new Float32Array(count * 3);
    const seed = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // a wide, flattened shell around the word
      const u = rand() * Math.PI * 2;
      const v = Math.acos(2 * rand() - 1);
      const r = 9 + rand() * 12;
      start[i * 3] = Math.sin(v) * Math.cos(u) * r * 1.4;
      start[i * 3 + 1] = Math.cos(v) * r * 0.6;
      start[i * 3 + 2] = Math.sin(v) * Math.sin(u) * r - 4;
      seed[i * 3] = rand();
      seed[i * 3 + 1] = rand();
      seed[i * 3 + 2] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(start, 3));
    g.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);
    const m = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uForm: { value: 0 },
        uSweep: { value: -10 },
        uFade: { value: 1 },
        uSize: { value: 2.2 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
    });
    return { geometry: g, material: m };
  }, [count, text]);

  useFrame(() => {
    const { active, u } = seq;
    const show = active === 'logo' || active === 'final';
    points.current.visible = show;
    if (!show) return;
    const m = material.uniforms;
    m.uTime.value = seq.t;
    const s = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
    if (active === 'logo') {
      m.uForm.value = seq.reduced ? 1 : s(0.05, 0.7, u);
      m.uSweep.value = THREE.MathUtils.lerp(-9, 9, s(0.62, 0.95, u));
      m.uFade.value = 1 - s(0.93, 1, u) * 0.6;
    } else {
      m.uForm.value = seq.reduced ? 1 : s(0.0, 0.5, u);
      m.uSweep.value = THREE.MathUtils.lerp(-9, 9, s(0.5, 0.8, u));
      m.uFade.value = 1;
    }
  });

  return (
    <points ref={points} geometry={geometry} material={material} position={[0, 0.9, 0]} scale={fitScale} frustumCulled={false} />
  );
}
