import * as THREE from 'three';
import { createMatTexture } from '../textures.js';
import { roundedRect } from './shapes.js';

export const MAT = { cols: 32, rows: 22, border: 1.2, thickness: 0.16, radius: 0.7 };

/** Green self-healing cutting mat with a printed grid and ruler edges. */
export function createCuttingMat() {
  const { cols, rows, border, thickness, radius } = MAT;
  const w = cols + border * 2;
  const h = rows + border * 2;

  const geo = new THREE.ExtrudeGeometry(roundedRect(w, h, radius), {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.04,
    bevelSegments: 2,
    curveSegments: 10,
  });
  // Planar UVs so the printed grid maps 1:1 onto the top face.
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  }
  geo.rotateX(-Math.PI / 2);

  const top = new THREE.MeshStandardMaterial({
    map: createMatTexture({ cols, rows, border }),
    roughness: 0.82,
    metalness: 0,
  });
  const side = new THREE.MeshStandardMaterial({ color: '#2b3526', roughness: 0.9 });

  const mesh = new THREE.Mesh(geo, [top, side]);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.name = 'cuttingMat';
  mesh.userData.topY = thickness + 0.03;
  mesh.userData.size = { w, h };
  return mesh;
}
