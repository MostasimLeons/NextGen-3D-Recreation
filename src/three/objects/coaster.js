import * as THREE from 'three';
import { createCorkTextures } from '../textures.js';

/** Round cork coaster with a raised, softly rounded rim (lathe profile). */
export function createCoaster({ radius = 3.5, height = 0.55 } = {}) {
  const R = radius;
  const floor = height * 0.55;
  const profile = [
    [0, 0],
    [R - 0.12, 0],
    [R - 0.02, 0.05],
    [R, 0.14],
    [R, height - 0.14],
    [R - 0.05, height - 0.04],
    [R - 0.16, height],
    [R - 0.36, height],
    [R - 0.47, height - 0.05],
    [R - 0.55, floor + 0.1],
    [R - 0.62, floor + 0.01],
    [R - 0.75, floor],
    [0, floor],
  ].map(([x, y]) => new THREE.Vector2(x, y));

  const geo = new THREE.LatheGeometry(profile, 160);
  // Planar (top-down) UVs: cork granules read correctly on the visible faces.
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / (R * 2.2) + 0.5, pos.getZ(i) / (R * 2.2) + 0.5);
  }
  geo.computeVertexNormals();

  const { map, bumpMap } = createCorkTextures();
  const mat = new THREE.MeshStandardMaterial({
    map,
    bumpMap,
    bumpScale: 1.4,
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'coaster';
  return mesh;
}
