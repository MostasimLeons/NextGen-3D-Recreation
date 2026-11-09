import * as THREE from 'three';
import { createWoodTextures } from '../textures.js';

/** Large warm wooden tabletop that fills the frame behind the mat. */
export function createDesk() {
  const { map, roughnessMap } = createWoodTextures();
  const W = 160;
  const D = 110;
  map.repeat.set(W / 52, D / 26);
  roughnessMap.repeat.copy(map.repeat);

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ map, roughnessMap, roughness: 0.62, metalness: 0 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.name = 'desk';
  return mesh;
}
