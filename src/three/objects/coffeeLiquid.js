import * as THREE from 'three';
import { createCoffeeTexture } from '../textures.js';

/**
 * Coffee inside the mug (mug-local space):
 *  - a dark liquid body (closed cylinder) whose height follows the level
 *  - a surface disc whose vertex shader adds turbulence (ripples driven by
 *    the mug's angular velocity and the pour rate)
 *  - "slosh": the surface counter-rotates toward world-level on a damped
 *    spring, stretched by 1/cos so its rim stays on the inner wall
 *
 * The shader is injected into MeshPhysicalMaterial (onBeforeCompile), so the
 * liquid keeps full PBR lighting, clearcoat and environment reflections.
 *
 * Two clipping planes (rim + inner floor), re-aimed every frame from the
 * mug's world transform, keep the level surface inside the mug: where it
 * meets the lip it is cut cleanly, exactly where real coffee would spill.
 * (Needs renderer.localClippingEnabled = true; ignored elsewhere.)
 */
export function createCoffeeLiquid({ innerRadius, floorY = 0.4, maxDepth = 4.2, rimY = 5.35 }) {
  const group = new THREE.Group();
  group.name = 'coffeeLiquid';

  const coffeeColor = new THREE.Color('#1c0c05');

  /* Body ------------------------------------------------------------- */
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: coffeeColor,
    roughness: 0.18,
    clearcoat: 0.6,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(innerRadius * 0.995, innerRadius * 0.96, 1, 64), bodyMat);
  body.name = 'coffeeBody';
  group.add(body);

  /* Surface (turbulent, sloshing) ------------------------------------ */
  const uniforms = { uTime: { value: 0 }, uAmp: { value: 0 } };
  const surfaceMat = new THREE.MeshPhysicalMaterial({
    map: createCoffeeTexture(),
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.3,
  });
  surfaceMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uAmp = uniforms.uAmp;
    // Shared wave field: three travelling sines + a radial ring, with its
    // analytic gradient so normals (and therefore highlights) move too.
    const waves = /* glsl */ `
      uniform float uTime;
      uniform float uAmp;
      float wave(vec2 p, out vec2 grad) {
        float r = length(p) + 1e-4;
        float a = sin(p.x * 3.1 + uTime * 4.2);
        float b = sin(p.y * 4.3 - uTime * 5.1);
        float c = sin(r * 5.5 - uTime * 6.3);
        grad = vec2(
          3.1 * cos(p.x * 3.1 + uTime * 4.2) * 0.6 + 5.5 * cos(r * 5.5 - uTime * 6.3) * 0.5 * (p.x / r),
          4.3 * cos(p.y * 4.3 - uTime * 5.1) * 0.4 + 5.5 * cos(r * 5.5 - uTime * 6.3) * 0.5 * (p.y / r)
        );
        return a * 0.6 + b * 0.4 + c * 0.5;
      }
    `;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${waves}`)
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `
          vec2 wGrad;
          float wH = wave(position.xy, wGrad);
          // Pin the meniscus: the wall edge moves less than the middle.
          float pin = 1.0 - smoothstep(${(innerRadius * 0.75).toFixed(3)}, ${innerRadius.toFixed(3)}, length(position.xy)) * 0.6;
          vec3 objectNormal = normalize(vec3(-wGrad * uAmp * pin, 1.0));
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3( tangent.xyz );
          #endif
        `,
      )
      .replace('#include <begin_vertex>', `vec3 transformed = vec3(position);\ntransformed.z += wH * uAmp * pin;`);
  };
  const surface = new THREE.Mesh(new THREE.RingGeometry(0.001, innerRadius * 0.995, 96, 20), surfaceMat);
  surface.name = 'coffeeSurface';
  surface.receiveShadow = true;
  // A pivot so the surface can tilt (slosh) about the liquid's centre line.
  const pivot = new THREE.Group();
  pivot.add(surface);
  surface.rotation.x = -Math.PI / 2;
  group.add(pivot);

  /* Clipping (world-space planes, updated in update()) --------------------- */
  const rimPlane = new THREE.Plane();
  const floorPlane = new THREE.Plane();
  surfaceMat.clippingPlanes = [rimPlane, floorPlane];
  bodyMat.clippingPlanes = [rimPlane];
  const _q = new THREE.Quaternion();
  const _n = new THREE.Vector3();
  const _p = new THREE.Vector3();
  function aimClipPlanes() {
    const parent = group.parent;
    if (!parent) return;
    parent.updateMatrixWorld(true);
    parent.getWorldQuaternion(_q);
    // keep points *below* the rim: normal points down the mug axis
    _n.set(0, -1, 0).applyQuaternion(_q);
    _p.set(0, rimY, 0);
    parent.localToWorld(_p);
    rimPlane.setFromNormalAndCoplanarPoint(_n, _p);
    // keep points *above* the inner floor
    _n.negate();
    _p.set(0, floorY - 0.02, 0);
    parent.localToWorld(_p);
    floorPlane.setFromNormalAndCoplanarPoint(_n, _p);
  }

  /* State ---------------------------------------------------------------- */
  let level = 1; // 0 (empty) … 1 (full)
  const slosh = { angle: 0, vel: 0 }; // surface tilt relative to the mug (rad)
  let amp = 0;

  function applyLevel() {
    const depth = Math.max(level * maxDepth, 0.0001);
    body.scale.set(1, depth, 1);
    body.position.y = floorY + depth / 2;
    pivot.position.y = floorY + depth;
    group.visible = level > 0.004;
  }
  applyLevel();

  return {
    group,
    get level() {
      return level;
    },
    setLevel(v) {
      level = THREE.MathUtils.clamp(v, 0, 1);
      applyLevel();
    },
    /**
     * @param dt        frame delta (s)
     * @param tilt      mug tilt from upright about its local Z (rad)
     * @param angVel    tilt angular velocity (rad/s)
     * @param pour      current pour rate 0–1 (adds turbulence)
     * @param time      seconds (shader clock)
     */
    update(dt, { tilt, angVel, pour, time }) {
      // Damped spring toward world-level (clamped so the disc stays inside).
      // (Clipping handles the lip, so the surface can stay truly level.)
      const target = THREE.MathUtils.clamp(-tilt, -1.25, 1.25);
      const k = 38;
      const c = 5.5;
      slosh.vel += (-(slosh.angle - target) * k - slosh.vel * c - angVel * 1.6) * dt;
      slosh.angle += slosh.vel * dt;
      const a = THREE.MathUtils.clamp(slosh.angle, -1.3, 1.3);
      pivot.rotation.z = a;
      pivot.scale.set(1 / Math.cos(a), 1, 1); // ellipse that meets the wall

      // Ripple amplitude: kicked by rotation speed and pouring, decays.
      const kick = Math.min(Math.abs(angVel) * 0.025 + pour * 0.045 + Math.abs(slosh.vel) * 0.008, 0.08);
      amp += (kick - amp) * Math.min(dt * 8, 1);
      amp *= Math.exp(-dt * 0.8);
      uniforms.uAmp.value = amp + 0.004; // a whisper of motion at rest
      uniforms.uTime.value = time;
      aimClipPlanes();
    },
  };
}
