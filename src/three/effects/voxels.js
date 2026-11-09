import * as THREE from 'three';
import { mulberry32 } from '../textures.js';

/**
 * Floating "voxels" — a nod to game-dev building blocks — as one
 * InstancedMesh (single draw call). Cubes drift in a loose shell around
 * the stage and fill the empty space without competing with the hero.
 * A handful glow burnt-orange (instance colours + emissive-ish material).
 *
 * update(time, intensity) — intensity scales them in/out.
 */
export function createVoxels({ count = 70, center = new THREE.Vector3(0, 5.9, 0) } = {}) {
  const rand = mulberry32(2025);
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1, vertexColors: false });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.name = 'voxels';

  const dark = new THREE.Color('#2a1d14');
  const cream = new THREE.Color('#e8d9c2');
  const hot = new THREE.Color('#ff6a1f').multiplyScalar(2.2); // > 1 → blooms
  const items = [];
  for (let i = 0; i < count; i++) {
    // Shell 11–24 units out, flattened, biased behind/around the stage.
    const a = rand() * Math.PI * 2;
    const r = 11 + rand() * 13;
    items.push({
      base: new THREE.Vector3(Math.cos(a) * r, (rand() - 0.45) * 16, Math.sin(a) * r * 0.6 - 6),
      size: 0.16 + Math.pow(rand(), 2.5) * 0.55,
      spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(1.2),
      phase: rand() * Math.PI * 2,
    });
    const roll = rand();
    mesh.setColorAt(i, roll > 0.88 ? hot : roll > 0.55 ? cream : dark);
  }
  mesh.instanceColor.needsUpdate = true;

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();

  const group = new THREE.Group();
  group.position.copy(center);
  group.add(mesh);

  return {
    object: group,
    update(time, intensity) {
      group.visible = intensity > 0.005;
      if (!group.visible) return;
      for (let i = 0; i < count; i++) {
        const it = items[i];
        p.copy(it.base);
        p.y += Math.sin(time * 0.35 + it.phase) * 0.8;
        e.set(it.spin.x * time, it.spin.y * time, it.spin.z * time);
        q.setFromEuler(e);
        s.setScalar(it.size * intensity);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
      group.rotation.y = time * 0.02;
    },
  };
}
