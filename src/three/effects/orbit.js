import * as THREE from 'three';

/**
 * Capability orbit (toolkit section): four glowing nodes circling the stage
 * on tilted rings — one per discipline. Their world positions are exposed as
 * `anchors`, so the DOM can pin labels to them every frame.
 *
 * update(time, intensity, fit = 1) — fit shrinks the orbit on portrait screens
 */
export function createOrbit({ center = new THREE.Vector3(0, 5.9, 0), radius = 9 } = {}) {
  const group = new THREE.Group();
  group.name = 'capabilityOrbit';
  group.position.copy(center);

  const defs = [
    { tilt: [0.35, 0, 0.15], speed: 0.22, phase: 0.0 },
    { tilt: [-0.25, 0, -0.4], speed: 0.18, phase: 1.6 },
    { tilt: [0.55, 0, -0.1], speed: 0.26, phase: 3.1 },
    { tilt: [-0.45, 0, 0.35], speed: 0.2, phase: 4.6 },
  ];
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: 0.35, toneMapped: false });
  const nodeMat = new THREE.MeshBasicMaterial({ color: '#ffb066', toneMapped: false, transparent: true });
  const haloMat = new THREE.MeshBasicMaterial({ color: '#ff5a1a', transparent: true, opacity: 0.25, toneMapped: false, depthWrite: false });

  const pivots = defs.map((d, i) => {
    const pivot = new THREE.Group();
    pivot.rotation.set(...d.tilt);
    const r = radius * (0.9 + i * 0.08);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 6, 200), ringMat);
    ring.rotation.x = Math.PI / 2;
    pivot.add(ring);
    const node = new THREE.Group();
    node.add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), nodeMat));
    node.add(new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 24), haloMat));
    pivot.add(node);
    group.add(pivot);
    return { pivot, node, r, ...d };
  });

  const anchors = defs.map(() => new THREE.Vector3());
  const materials = [ringMat, nodeMat, haloMat];
  const base = materials.map((m) => m.opacity);

  return {
    object: group,
    anchors,
    update(time, intensity, fit = 1) {
      group.visible = intensity > 0.01;
      materials.forEach((m, i) => (m.opacity = base[i] * intensity));
      const s = (0.6 + intensity * 0.4) * fit;
      group.scale.setScalar(s);
      pivots.forEach((pv, i) => {
        const a = time * pv.speed + pv.phase;
        pv.node.position.set(Math.cos(a) * pv.r, 0, Math.sin(a) * pv.r);
        pv.node.scale.setScalar(1 + Math.sin(time * 3 + i) * 0.12);
        pv.node.getWorldPosition(anchors[i]);
      });
    },
  };
}
