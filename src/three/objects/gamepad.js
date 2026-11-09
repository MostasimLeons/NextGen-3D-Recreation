import * as THREE from 'three';
import { roundedRect, enableShadows } from './shapes.js';

/**
 * Procedural game controller (Game Development visual).
 * Faces +Z (toward the camera), centred on its origin, ~9 units wide.
 * Warm charcoal shell with restrained burnt-orange accents.
 */
export function createGamepad() {
  const group = new THREE.Group();
  group.name = 'gamepad';

  const shell = new THREE.MeshPhysicalMaterial({
    color: '#221c17',
    roughness: 0.42,
    clearcoat: 0.7,
    clearcoatRoughness: 0.3,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: '#141110', roughness: 0.85 });
  const cream = new THREE.MeshPhysicalMaterial({ color: '#efe3cf', roughness: 0.3, clearcoat: 1 });
  const orange = new THREE.MeshPhysicalMaterial({
    color: '#dc5000',
    emissive: '#dc5000',
    emissiveIntensity: 0.25,
    roughness: 0.3,
    clearcoat: 1,
  });
  const glow = new THREE.MeshBasicMaterial({ color: '#ff7a2a' });

  // Body: rounded slab.
  const depth = 1.2;
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(6.4, 3.3, 1.45), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.45,
    bevelSize: 0.45,
    bevelSegments: 6,
    curveSegments: 16,
  });
  bodyGeo.translate(0, 0.2, -depth / 2);
  group.add(new THREE.Mesh(bodyGeo, shell));
  const front = depth / 2 + 0.45; // z of the front face

  // Grips: angled capsules under each side.
  for (const side of [-1, 1]) {
    const grip = new THREE.Mesh(new THREE.CapsuleGeometry(1.25, 2.1, 8, 20), shell);
    grip.position.set(side * 2.75, -1.35, -0.05);
    grip.rotation.z = side * 0.55;
    grip.scale.set(1, 1, 0.92);
    group.add(grip);
  }

  // D-pad (left).
  const dpadArm = new THREE.BoxGeometry(1.2, 0.38, 0.22);
  for (const r of [0, Math.PI / 2]) {
    const arm = new THREE.Mesh(dpadArm, rubber);
    arm.position.set(-2.15, 0.55, front + 0.05);
    arm.rotation.z = r;
    group.add(arm);
  }

  // Face buttons (right): diamond of four.
  const btnGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.22, 24);
  btnGeo.rotateX(Math.PI / 2);
  [
    [0, 0.48, orange],
    [0.48, 0, cream],
    [0, -0.48, cream],
    [-0.48, 0, cream],
  ].forEach(([x, y, m]) => {
    const b = new THREE.Mesh(btnGeo, m);
    b.position.set(2.15 + x, 0.55 + y, front + 0.06);
    group.add(b);
  });

  // Thumbsticks.
  const stickBase = new THREE.CylinderGeometry(0.62, 0.66, 0.2, 32);
  stickBase.rotateX(Math.PI / 2);
  const stickCap = new THREE.CylinderGeometry(0.5, 0.42, 0.36, 32);
  stickCap.rotateX(Math.PI / 2);
  for (const x of [-1.05, 1.05]) {
    const base = new THREE.Mesh(stickBase, rubber);
    base.position.set(x, -0.75, front + 0.02);
    const cap = new THREE.Mesh(stickCap, rubber);
    cap.position.set(x, -0.75, front + 0.28);
    group.add(base, cap);
  }

  // Centre light bar + small menu buttons.
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.05), glow);
  bar.position.set(0, 1.35, front + 0.02);
  group.add(bar);
  for (const x of [-0.45, 0.45]) {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.22, 4, 8), rubber);
    m.rotation.z = Math.PI / 2;
    m.position.set(x, 0.55, front + 0.02);
    group.add(m);
  }

  // Shoulder bumpers.
  for (const side of [-1, 1]) {
    const bumper = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.5, 6, 12), rubber);
    bumper.rotation.z = Math.PI / 2 + side * 0.12;
    bumper.position.set(side * 2.2, 2.0, -0.1);
    group.add(bumper);
  }

  enableShadows(group);
  return group;
}
