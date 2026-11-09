import * as THREE from 'three';
import { mulberry32 } from '../textures.js';

/**
 * The continuous NEXT GEN "world" the story camera travels through.
 *
 *   floor     infinite dark studio floor (GLSL): perspective grid that
 *             scrolls with travel, warm horizon glow, light pools, fade-out
 *   gates     glowing ring gates spaced down a corridor (InstancedMesh)
 *   slabs     dark monolith slabs lining the corridor + emissive edge strips
 *   shards    floating octahedral shards for mid-air depth
 *
 * update(time, { travel, presence, glow }) — travel 0→1 moves the whole
 * corridor toward the camera (≈ LENGTH units), so every section sits in a
 * different place of the same world; presence fades it in after the hero.
 * Everything is instanced: five draw calls for the whole environment.
 */
const LENGTH = 420;
export const WORLD_FLOOR_Y = -0.85; // matches the coffee-spill floor

export function createWorld() {
  const group = new THREE.Group();
  group.name = 'world';
  const track = new THREE.Group(); // moves with travel
  group.add(track);
  const rand = mulberry32(1337);

  /* Floor ------------------------------------------------------------- */
  const floorU = {
    uTime: { value: 0 },
    uTravel: { value: 0 },
    uPresence: { value: 0 },
    uGlow: { value: 0.5 },
  };
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 700, 1, 1),
    new THREE.ShaderMaterial({
      uniforms: floorU,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime, uTravel, uPresence, uGlow;
        varying vec3 vWorld;
        float grid(vec2 p, float size, float width) {
          vec2 g = abs(fract(p / size - 0.5) - 0.5) / fwidth(p / size);
          return 1.0 - min(min(g.x, g.y) / width, 1.0);
        }
        void main() {
          vec2 p = vWorld.xz + vec2(0.0, uTravel * ${LENGTH.toFixed(1)});
          float d = length(vWorld.xz - vec2(0.0, 0.0));
          float fade = exp(-pow(d / 150.0, 2.0));          // fall off into the void
          float minor = grid(p, 4.0, 1.0) * 0.18;
          float major = grid(p, 20.0, 1.4) * 0.55;
          vec3 base = vec3(0.035, 0.016, 0.008);
          // warm light pool under the stage + far horizon glow
          float pool = exp(-pow(length(vWorld.xz - vec2(0.0, 0.0)) / 22.0, 2.0));
          float horizon = smoothstep(60.0, 170.0, -vWorld.z) * smoothstep(260.0, 170.0, -vWorld.z);
          vec3 col = base + vec3(0.9, 0.32, 0.06) * (major + minor) * (0.35 + uGlow * 0.65);
          col += vec3(0.55, 0.2, 0.05) * pool * (0.35 + uGlow * 0.5);
          col += vec3(0.6, 0.18, 0.04) * horizon * 0.35 * uGlow;
          // travelling scan line
          float scan = smoothstep(1.5, 0.0, abs(fract((p.y + uTime * 6.0) / 90.0) - 0.5) * 90.0);
          col += vec3(1.0, 0.45, 0.1) * scan * 0.25 * uGlow;
          gl_FragColor = vec4(col, fade * uPresence);
        }
      `,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = WORLD_FLOOR_Y;
  floor.renderOrder = -10;
  group.add(floor); // floor itself stays; its grid scrolls via uTravel

  /* Gates (glowing rings down the corridor) ---------------------------- */
  const GATES = 12;
  const gateMat = new THREE.MeshBasicMaterial({ color: '#ff6a1f', toneMapped: false, transparent: true });
  const gates = new THREE.InstancedMesh(new THREE.TorusGeometry(11, 0.07, 8, 160), gateMat, GATES);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  for (let i = 0; i < GATES; i++) {
    e.set(0, 0, rand() * Math.PI);
    q.setFromEuler(e);
    p.set((rand() - 0.5) * 6, 9, -20 - i * (LENGTH / GATES));
    s.setScalar(0.8 + rand() * 0.6);
    m.compose(p, q, s);
    gates.setMatrixAt(i, m);
  }
  gates.frustumCulled = false;
  track.add(gates);

  /* Monolith slabs + emissive edge strips ------------------------------- */
  const SLABS = 40;
  const slabMat = new THREE.MeshStandardMaterial({ color: '#160c07', roughness: 0.35, metalness: 0.7 });
  const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), slabMat, SLABS);
  const stripMat = new THREE.MeshBasicMaterial({ color: '#ff5a1a', toneMapped: false });
  const strips = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), stripMat, SLABS);
  for (let i = 0; i < SLABS; i++) {
    const side = i % 2 ? 1 : -1;
    const h = 10 + rand() * 22;
    const w = 1.2 + rand() * 2.8;
    const x = side * (22 + rand() * 26);
    const z = -10 - (i / SLABS) * LENGTH - rand() * 8;
    e.set(0, (rand() - 0.5) * 0.6, 0);
    q.setFromEuler(e);
    p.set(x, WORLD_FLOOR_Y + h / 2, z);
    s.set(w, h, 3 + rand() * 4);
    m.compose(p, q, s);
    slabs.setMatrixAt(i, m);
    // thin glowing strip down the slab's inner edge
    p.x -= side * (w / 2 + 0.05);
    s.set(0.06, h * (0.4 + rand() * 0.5), 0.06);
    m.compose(p, q, s);
    strips.setMatrixAt(i, m);
  }
  slabs.frustumCulled = false;
  strips.frustumCulled = false;
  track.add(slabs, strips);

  /* Floating shards ----------------------------------------------------- */
  const SHARDS = 90;
  const shardMat = new THREE.MeshStandardMaterial({ color: '#2a1a10', roughness: 0.3, metalness: 0.8, emissive: '#3a1004' });
  const shards = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), shardMat, SHARDS);
  const shardData = Array.from({ length: SHARDS }, () => ({
    base: new THREE.Vector3((rand() - 0.5) * 70, 2 + rand() * 22, -rand() * LENGTH),
    size: 0.25 + Math.pow(rand(), 2) * 1.2,
    spin: rand() * 2,
    phase: rand() * 6.28,
  }));
  shards.frustumCulled = false;
  track.add(shards);

  const allMats = [gateMat, slabMat, stripMat, shardMat];
  for (const mat of allMats) mat.transparent = true;

  return {
    object: group,
    update(time, { travel = 0, presence = 0, glow = 0.5 }) {
      group.visible = presence > 0.01;
      if (!group.visible) return;
      floorU.uTime.value = time;
      floorU.uTravel.value = travel;
      floorU.uPresence.value = presence;
      floorU.uGlow.value = glow;
      track.position.z = travel * LENGTH;
      for (const mat of allMats) mat.opacity = presence;
      gateMat.color.setRGB(1, 0.42 + glow * 0.1, 0.12).multiplyScalar(0.8 + glow * 1.6);
      for (let i = 0; i < SHARDS; i++) {
        const d = shardData[i];
        p.copy(d.base);
        p.y += Math.sin(time * 0.4 + d.phase) * 0.8;
        e.set(time * d.spin * 0.3, time * d.spin * 0.5, 0);
        q.setFromEuler(e);
        s.setScalar(d.size);
        m.compose(p, q, s);
        shards.setMatrixAt(i, m);
      }
      shards.instanceMatrix.needsUpdate = true;
    },
  };
}
