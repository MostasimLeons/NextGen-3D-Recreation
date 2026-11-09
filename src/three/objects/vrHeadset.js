import * as THREE from 'three';
import { roundedRect, enableShadows } from './shapes.js';

/**
 * Procedural VR headset (3D Art & VR visual).
 * Visor faces +Z (toward the camera), centred on its origin, ~7.6 units wide.
 * Matte warm-charcoal shell, glossy black front, cream face cushion,
 * strap looping behind, small burnt-orange tracking LEDs.
 */
export function createVrHeadset() {
  const group = new THREE.Group();
  group.name = 'vrHeadset';

  const shell = new THREE.MeshPhysicalMaterial({ color: '#2a231d', roughness: 0.55, clearcoat: 0.4 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#0b0908',
    roughness: 0.06,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.6,
  });
  const cushion = new THREE.MeshStandardMaterial({ color: '#e7d9c2', roughness: 0.95 });
  const strap = new THREE.MeshStandardMaterial({ color: '#3a322b', roughness: 0.8 });
  const led = new THREE.MeshBasicMaterial({ color: '#ff7a2a' });

  // Visor body.
  const W = 6.8;
  const H = 3.5;
  const D = 2.4;
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(W, H, 1.35), {
    depth: D,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.4,
    bevelSegments: 8,
    curveSegments: 18,
  });
  bodyGeo.translate(0, 0, -D / 2);
  group.add(new THREE.Mesh(bodyGeo, shell));

  // Glossy front panel, slightly inset.
  const panelGeo = new THREE.ExtrudeGeometry(roundedRect(W - 0.5, H - 0.5, 1.1), {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 4,
    curveSegments: 18,
  });
  panelGeo.translate(0, 0, D / 2 + 0.38);
  group.add(new THREE.Mesh(panelGeo, glass));

  // Face cushion ring at the back.
  const outer = roundedRect(W - 0.2, H - 0.1, 1.3);
  const hole = roundedRect(W - 1.6, H - 1.5, 0.7);
  outer.holes.push(hole);
  const cushionGeo = new THREE.ExtrudeGeometry(outer, {
    depth: 0.7,
    bevelEnabled: true,
    bevelThickness: 0.25,
    bevelSize: 0.2,
    bevelSegments: 6,
    curveSegments: 16,
  });
  cushionGeo.translate(0, 0, -D / 2 - 1.15);
  group.add(new THREE.Mesh(cushionGeo, cushion));

  // Strap: half-ellipse loop from the temples around the back of the head.
  const strapCurve = new THREE.CatmullRomCurve3(
    [
      [-W / 2 - 0.1, 0, -0.4],
      [-W / 2 - 0.6, 0.1, -3.2],
      [-2.6, 0.2, -6.4],
      [0, 0.25, -7.2],
      [2.6, 0.2, -6.4],
      [W / 2 + 0.6, 0.1, -3.2],
      [W / 2 + 0.1, 0, -0.4],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  );
  const strapGeo = new THREE.TubeGeometry(strapCurve, 80, 0.32, 10, false);
  strapGeo.scale(1, 2.2, 1); // flat, tall band
  group.add(new THREE.Mesh(strapGeo, strap));

  // Tracking LEDs on the front corners.
  const ledGeo = new THREE.SphereGeometry(0.09, 12, 12);
  [
    [-2.6, 1.15],
    [2.6, 1.15],
    [-2.6, -1.15],
    [2.6, -1.15],
  ].forEach(([x, y]) => {
    const l = new THREE.Mesh(ledGeo, led);
    l.position.set(x, y, D / 2 + 0.62);
    group.add(l);
  });

  enableShadows(group);
  return group;
}
