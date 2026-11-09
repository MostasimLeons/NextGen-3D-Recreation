import * as THREE from 'three';
import { enableShadows } from './shapes.js';

/**
 * Hexagonal pencil lying flat, built along +X with the sharpened tip at +X.
 * Origin is the pencil's centre, resting on y = 0.
 */
export function createPencil({
  length = 12,
  radius = 0.36,
  bodyColor = '#e8c79c',
  woodColor = '#dcb487',
  graphiteColor = '#2b2b2d',
  endColor,
} = {}) {
  const group = new THREE.Group();
  const coneLen = radius * 4.2;
  const leadLen = radius * 1.1;
  const bodyLen = length - coneLen;
  const apothem = radius * Math.cos(Math.PI / 6);

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    roughness: 0.42,
    clearcoat: 0.6,
    clearcoatRoughness: 0.35,
  });
  const woodMat = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.85 });
  const leadMat = new THREE.MeshStandardMaterial({ color: graphiteColor, roughness: 0.35, metalness: 0.4 });

  // Body (hex prism). Built along Y, rotated onto the table below.
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, bodyLen, 6, 1), bodyMat);
  body.position.y = -length / 2 + bodyLen / 2;
  group.add(body);

  // Painted end cap.
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.98, radius * 0.98, 0.02, 6),
    new THREE.MeshStandardMaterial({ color: endColor ?? woodColor, roughness: 0.7 }),
  );
  cap.position.y = -length / 2 - 0.005;
  group.add(cap);

  // Sharpened wood cone.
  const woodCone = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.32, apothem, coneLen - leadLen, 24, 1),
    woodMat,
  );
  woodCone.position.y = -length / 2 + bodyLen + (coneLen - leadLen) / 2;
  group.add(woodCone);

  // Graphite lead.
  const lead = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.32, leadLen, 18), leadMat);
  lead.position.y = length / 2 - leadLen / 2;
  group.add(lead);

  enableShadows(group);

  // Lay it down along +X. Three's hex cylinder has a flat face on the X axis,
  // so after this rotation a flat face rests on the table.
  group.rotation.z = -Math.PI / 2;
  group.position.y = apothem;

  const wrapper = new THREE.Group();
  wrapper.add(group);
  wrapper.name = 'pencil';
  return wrapper;
}
