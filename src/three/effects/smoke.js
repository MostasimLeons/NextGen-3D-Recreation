import * as THREE from 'three';
import { mulberry32 } from '../textures.js';

/**
 * Soft volumetric-looking smoke: a few dozen large GPU sprites whose
 * fragment shader carves a drifting fbm puff out of each point, lit warm
 * from below. Kept to ~40 sprites to bound overdraw.
 *
 * update(time, intensity)
 */
export function createSmoke({ count = 40, center = new THREE.Vector3(0, 4, -3) } = {}) {
  const rand = mulberry32(777);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 3); // phase, size, speed
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rand() - 0.5) * 34;
    pos[i * 3 + 1] = rand() * 14;
    pos[i * 3 + 2] = (rand() - 0.5) * 10 - 4;
    seed[i * 3] = rand();
    seed[i * 3 + 1] = 0.7 + rand() * 0.9;
    seed[i * 3 + 2] = 0.2 + rand() * 0.4;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: true,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aSeed;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vPhase;
      varying float vLift;
      void main() {
        vec3 p = position;
        float t = uTime * aSeed.z;
        p.y = mod(p.y + t * 1.2, 14.0);
        vLift = p.y / 14.0;
        p.x += sin(t * 0.7 + aSeed.x * 6.28) * 1.6;
        vPhase = aSeed.x;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSeed.y * uPixelRatio * (2600.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uIntensity;
      varying float vPhase;
      varying float vLift;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; } return v; }
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float puff = fbm(c * 3.0 + vPhase * 10.0 + vec2(0.0, uTime * 0.05));
        float a = smoothstep(0.5, 0.05, d) * smoothstep(0.35, 0.75, puff);
        a *= smoothstep(0.0, 0.2, vLift) * (1.0 - smoothstep(0.7, 1.0, vLift));
        a *= 0.22 * uIntensity;
        vec3 col = mix(vec3(0.42, 0.16, 0.06), vec3(0.12, 0.07, 0.05), vLift);
        gl_FragColor = vec4(col, a);
      }
    `,
  });

  const points = new THREE.Points(geo, material);
  points.position.copy(center);
  points.frustumCulled = false;
  points.renderOrder = 2;
  points.name = 'smoke';

  return {
    object: points,
    update(time, intensity) {
      material.uniforms.uTime.value = time;
      material.uniforms.uIntensity.value = intensity;
      points.visible = intensity > 0.005;
    },
  };
}
