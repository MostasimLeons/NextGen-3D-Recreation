import * as THREE from 'three';
import { roundedRect, enableShadows } from './shapes.js';

/**
 * Orange snap-off utility knife lying flat, built along +X with the blade at +X.
 */
export function createUtilityKnife({ length = 10, width = 1.8, height = 0.8 } = {}) {
  const group = new THREE.Group();

  const orange = new THREE.MeshPhysicalMaterial({
    color: '#f07a1a',
    roughness: 0.38,
    clearcoat: 0.8,
    clearcoatRoughness: 0.25,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: '#5d5a57', roughness: 0.75 });
  const darkRubber = new THREE.MeshStandardMaterial({ color: '#3c3a38', roughness: 0.8 });
  const steel = new THREE.MeshStandardMaterial({ color: '#d8d8dc', roughness: 0.22, metalness: 1 });
  const scoreMat = new THREE.MeshStandardMaterial({ color: '#7d7f86', roughness: 0.4, metalness: 0.8 });

  // Orange body.
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(length, width, width * 0.32), {
    depth: height - 0.24,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelSegments: 4,
    curveSegments: 8,
  });
  bodyGeo.rotateX(-Math.PI / 2);
  bodyGeo.translate(0, 0.12, 0);
  group.add(new THREE.Mesh(bodyGeo, orange));

  // Rubber grip channel running along the top.
  const channel = new THREE.Mesh(new THREE.BoxGeometry(length * 0.78, 0.06, width * 0.52), darkRubber);
  channel.position.set(-length * 0.06, height + 0.01, 0);
  group.add(channel);

  // Ridged slider rail.
  const ridgeGeo = new THREE.BoxGeometry(0.16, 0.14, width * 0.5);
  for (let i = 0; i < 26; i++) {
    const ridge = new THREE.Mesh(ridgeGeo, rubber);
    ridge.position.set(-length * 0.42 + i * 0.3, height + 0.07, 0);
    group.add(ridge);
  }

  // Slider button near the front.
  const slider = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.26, width * 0.62), rubber);
  slider.position.set(length * 0.3, height + 0.1, 0);
  group.add(slider);

  // Steel nose guide.
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.5, height * 0.7, width * 0.86), steel);
  nose.position.set(length / 2 + 0.05, height * 0.4, 0);
  group.add(nose);

  // Snap-off blade with an angled tip.
  const bladeLen = 2.4;
  const bw = width * 0.55;
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, -bw / 2);
  bladeShape.lineTo(bladeLen - 0.9, -bw / 2);
  bladeShape.lineTo(bladeLen, bw / 2);
  bladeShape.lineTo(0, bw / 2);
  bladeShape.closePath();
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.04, bevelEnabled: false });
  bladeGeo.rotateX(-Math.PI / 2);
  const blade = new THREE.Mesh(bladeGeo, steel);
  blade.position.set(length / 2 + 0.2, height * 0.38, 0);
  group.add(blade);

  // Snap lines on the blade.
  for (let i = 0; i < 3; i++) {
    const score = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, bw * 1.15), scoreMat);
    score.position.set(length / 2 + 0.55 + i * 0.5, height * 0.38 + 0.045, 0);
    score.rotation.y = -0.6;
    group.add(score);
  }

  enableShadows(group);
  group.name = 'utilityKnife';
  return group;
}
