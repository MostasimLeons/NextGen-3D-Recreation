import * as THREE from 'three';
import { mulberry32 } from '../textures.js';

/**
 * Volumetric-looking steam rising from the coffee: soft GPU sprites whose
 * fragment shader carves curling fbm wisps. The emitter follows the mug's
 * opening every frame (setOrigin), so steam stays attached while the mug
 * moves through the story. Hidden when the mug tips or empties.
 *
 * update(time, intensity)
 */
export function createSteam({ count = 34 } = {}) {
  const rand = mulberry32(88);
  const seed = new Float32Array(count * 4); // phase, size, drift, speed
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seed[i * 4] = rand();
    seed[i * 4 + 1] = 0.6 + rand() * 0.9;
    seed[i * 4 + 2] = (rand() - 0.5) * 2;
    seed[i * 4 + 3] = 0.35 + rand() * 0.5;
    pos[i * 3] = (rand() - 0.5) * 2.4; // spread across the opening
    pos[i * 3 + 2] = (rand() - 0.5) * 2.4;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aSeed;
      uniform float uTime, uPixelRatio;
      varying float vLife;
      varying float vPhase;
      void main() {
        float life = fract(uTime * aSeed.w * 0.22 + aSeed.x);
        vLife = life;
        vPhase = aSeed.x;
        vec3 p = position;
        p.y += life * 9.0;                                  // rise
        p.x += sin(life * 5.0 + aSeed.x * 6.28) * (0.4 + life * 1.6) + aSeed.z * life * 1.2;
        p.z += cos(life * 4.0 + aSeed.x * 6.28) * (0.3 + life);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSeed.y * (1.0 + life * 2.6) * uPixelRatio * (360.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uIntensity;
      varying float vLife;
      varying float vPhase;
      float h(vec2 p){ return fract(sin(dot(p, vec2(27.1, 61.7))) * 43758.5); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
        return mix(mix(h(i),h(i+vec2(1,0)),u.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x), u.y); }
      float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*n(p); p*=2.1; a*=0.5; } return v; }
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float wisp = fbm(c * 3.2 + vec2(vPhase * 7.0, -uTime * 0.25));
        float a = smoothstep(0.5, 0.1, d) * smoothstep(0.38, 0.8, wisp);
        a *= smoothstep(0.0, 0.15, vLife) * (1.0 - smoothstep(0.55, 1.0, vLife));
        a *= 0.32 * uIntensity;
        vec3 col = mix(vec3(1.0, 0.92, 0.82), vec3(0.95, 0.62, 0.4), vLife); // lit warm from below
        gl_FragColor = vec4(col, a);
      }
    `,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 7;
  points.name = 'steam';

  return {
    object: points,
    setOrigin(v) {
      points.position.copy(v);
    },
    update(time, intensity) {
      material.uniforms.uTime.value = time;
      material.uniforms.uIntensity.value = intensity;
      points.visible = intensity > 0.01;
    },
  };
}
