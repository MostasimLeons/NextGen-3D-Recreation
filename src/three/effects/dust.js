import * as THREE from 'three';
import { mulberry32 } from '../textures.js';

/**
 * Ambient dust + a few embers drifting through the hero's key light.
 *
 * One THREE.Points draw call; all motion runs in the vertex shader (no
 * per-frame CPU work): each mote drifts with a slow wind, meanders on two
 * sines and wraps inside a box over the desk. Motes glow brighter inside a
 * soft "shaft" around the key light's axis — reading as light catching
 * dust — and fade near the box faces so the wrap is never visible.
 * The pointer gently parts the dust (uMouse, desk-plane world point).
 *
 * update(time, { intensity, mouse, mouseOn })
 */
export function createDust({
  count = 420,
  min = new THREE.Vector3(-26, 0.6, -18),
  max = new THREE.Vector3(26, 15, 18),
  lightFrom = new THREE.Vector3(-16, 25, -12),
  lightTo = new THREE.Vector3(0, 0, 0),
} = {}) {
  const rand = mulberry32(4242);
  const pos = new Float32Array(count * 3); // 0–1 inside the box
  const seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = rand();
    pos[i * 3 + 1] = Math.pow(rand(), 1.4); // a little denser near the desk
    pos[i * 3 + 2] = rand();
    seed[i * 3] = rand();
    seed[i * 3 + 1] = rand();
    seed[i * 3 + 2] = rand();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  // Positions are generated in the shader: give culling a box that covers it.
  geo.boundingSphere = new THREE.Sphere(min.clone().add(max).multiplyScalar(0.5), min.distanceTo(max) / 2);

  const box = max.clone().sub(min);
  const dir = lightTo.clone().sub(lightFrom).normalize();

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uMin: { value: min.clone() },
      uBox: { value: box },
      uWind: { value: new THREE.Vector3(0.42, 0.06, 0.16) },
      uLightPos: { value: lightFrom.clone() },
      uLightDir: { value: dir },
      uMouse: { value: new THREE.Vector3(0, 0, 0) },
      uMouseOn: { value: 0 },
      uDust: { value: new THREE.Color('#ffe2c0') },
      uEmber: { value: new THREE.Color('#ff7a2a').multiplyScalar(2.4) }, // > 1 → blooms
    },
    vertexShader: /* glsl */ `
      attribute vec3 aSeed;
      uniform float uTime, uPixelRatio, uIntensity, uMouseOn;
      uniform vec3 uMin, uBox, uWind, uLightPos, uLightDir, uMouse;
      varying float vAlpha;
      varying float vEmber;

      void main() {
        float ember = step(0.9, aSeed.x);            // ~10% are embers
        vec3 p = uMin + position * uBox;
        // wind drift (embers rise faster) + two slow meanders
        p += uWind * uTime * (0.55 + aSeed.y * 0.9);
        p.y += uTime * ember * 0.35;
        p.x += sin(uTime * 0.23 + aSeed.z * 6.283 + p.y * 0.35) * 0.9;
        p.y += sin(uTime * 0.31 + aSeed.y * 6.283) * 0.5;
        p.z += cos(uTime * 0.19 + aSeed.x * 6.283 + p.x * 0.2) * 0.7;
        p = uMin + mod(p - uMin, uBox);              // wrap inside the box

        // the pointer parts the dust (horizontal push, falls off quickly)
        vec2 dm = p.xz - uMouse.xz;
        float dl = length(dm) + 1e-3;
        p.xz += dm / dl * uMouseOn * 2.2 * exp(-dl * dl * 0.06);

        // brighter inside a soft shaft around the key light's axis
        vec3 lp = p - uLightPos;
        float along = dot(lp, uLightDir);
        float perp = length(lp - uLightDir * along);
        float shaft = 0.3 + 0.7 * exp(-perp * perp * 0.0045);

        // fade near the box faces so wrapping never pops
        vec3 q = (p - uMin) / uBox;
        vec3 e = smoothstep(0.0, 0.08, q) * smoothstep(1.0, 0.92, q);
        float edge = e.x * e.y * e.z;

        float twinkle = 0.65 + 0.35 * sin(uTime * (0.8 + aSeed.z * 2.2) + aSeed.x * 40.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float size = mix(0.5 + aSeed.y * 1.1, 1.4 + aSeed.z * 1.2, ember);
        gl_PointSize = size * uPixelRatio * (380.0 / -mv.z);
        vAlpha = uIntensity * shaft * edge * twinkle * mix(0.7, 1.3, ember);
        vEmber = ember;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uDust, uEmber;
      varying float vAlpha;
      varying float vEmber;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a; // soft core
        vec3 c = mix(uDust, uEmber, vEmber);
        gl_FragColor = vec4(c, a * vAlpha);
      }
    `,
  });

  const points = new THREE.Points(geo, material);
  points.name = 'ambientDust';
  points.renderOrder = 3;
  const u = material.uniforms;

  return {
    object: points,
    update(time, { intensity = 0, mouse = null, mouseOn = 0 } = {}) {
      points.visible = intensity > 0.005;
      if (!points.visible) return;
      u.uTime.value = time;
      u.uIntensity.value = intensity;
      if (mouse) u.uMouse.value.copy(mouse);
      u.uMouseOn.value = mouseOn;
    },
    dispose() {
      geo.dispose();
      material.dispose();
    },
  };
}
