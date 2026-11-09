import * as THREE from 'three';
import { mulberry32 } from '../textures.js';

/**
 * Fire-like ember particles (GPU-animated THREE.Points, custom GLSL).
 * Particles spawn in a wide cylinder around the stage, rise, swirl and
 * flicker from hot yellow-orange to deep red before fading. Additive and
 * un-tonemapped so the brightest cores feed the bloom pass.
 *
 * update(time, intensity) — intensity 0 hides the system entirely.
 */
export function createEmbers({ count = 900, radius = 16, height = 22, center = new THREE.Vector3(0, 5.9, 0) } = {}) {
  const rand = mulberry32(4242);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4); // speed, phase, size, swirl
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * radius;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = rand() * height;
    pos[i * 3 + 2] = Math.sin(a) * r * 0.7 - 2;
    seed[i * 4] = 0.35 + rand() * 0.9;
    seed[i * 4 + 1] = rand();
    seed[i * 4 + 2] = 0.4 + Math.pow(rand(), 3) * 2.2;
    seed[i * 4 + 3] = (rand() - 0.5) * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uHeight: { value: height },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aSeed;
      uniform float uTime;
      uniform float uHeight;
      uniform float uPixelRatio;
      varying float vLife;
      varying float vFlicker;
      void main() {
        vec3 p = position;
        float t = uTime * aSeed.x;
        float y = mod(p.y + t * 2.2, uHeight);
        vLife = y / uHeight;                       // 0 at birth → 1 at death
        p.y = y - 4.0;
        // Rising swirl, wider as it climbs.
        float sw = aSeed.w * (0.6 + vLife * 2.4);
        p.x += sin(t * 1.3 + aSeed.y * 6.28) * sw;
        p.z += cos(t * 1.1 + aSeed.y * 6.28) * sw * 0.6;
        vFlicker = 0.6 + 0.4 * sin(uTime * (6.0 + aSeed.y * 9.0) + aSeed.y * 30.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSeed.z * uPixelRatio * (34.0 / -mv.z) * (1.0 - vLife * 0.6);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uIntensity;
      varying float vLife;
      varying float vFlicker;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float core = smoothstep(0.5, 0.0, d);
        core *= core;
        vec3 hot = vec3(1.0, 0.72, 0.32);
        vec3 mid = vec3(1.0, 0.33, 0.05);
        vec3 cold = vec3(0.55, 0.06, 0.02);
        vec3 col = mix(hot, mid, smoothstep(0.0, 0.35, vLife));
        col = mix(col, cold, smoothstep(0.35, 0.9, vLife));
        float fade = smoothstep(0.0, 0.08, vLife) * (1.0 - smoothstep(0.7, 1.0, vLife));
        float a = core * fade * vFlicker * uIntensity;
        gl_FragColor = vec4(col * (1.6 + core * 2.2) * a, a);
      }
    `,
  });

  const points = new THREE.Points(geo, material);
  points.position.copy(center);
  points.frustumCulled = false;
  points.renderOrder = 5;
  points.name = 'embers';

  return {
    object: points,
    update(time, intensity) {
      material.uniforms.uTime.value = time;
      material.uniforms.uIntensity.value = intensity;
      points.visible = intensity > 0.005;
    },
  };
}
