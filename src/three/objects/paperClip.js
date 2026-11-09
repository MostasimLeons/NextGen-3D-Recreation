import * as THREE from 'three';

function pushLine(pts, a, b, steps = 12) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, 0, a[1] + (b[1] - a[1]) * t));
  }
}

function pushArc(pts, cx, cy, r, from, to, steps = 20) {
  for (let i = 1; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    pts.push(new THREE.Vector3(cx + Math.cos(a) * r, 0, cy + Math.sin(a) * r));
  }
}

/** Classic double-loop steel paper clip, lying flat, ~3.3 units long. */
export function createPaperClip({ wire = 0.045 } = {}) {
  const pts = [];
  pushLine(pts, [2.4, 0.4], [0, 0.4]);
  pushArc(pts, 0, 0, 0.4, Math.PI / 2, (3 * Math.PI) / 2);
  pushLine(pts, [0, -0.4], [3.2, -0.4]);
  pushArc(pts, 3.2, -0.1, 0.3, -Math.PI / 2, Math.PI / 2);
  pushLine(pts, [3.2, 0.2], [0.6, 0.2]);
  pushArc(pts, 0.6, 0, 0.2, Math.PI / 2, (3 * Math.PI) / 2);
  pushLine(pts, [0.6, -0.2], [2.4, -0.2]);

  // Drop duplicate joint points so the spline stays smooth.
  const clean = pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 1e-4);
  const curve = new THREE.CatmullRomCurve3(clean, false, 'centripetal');
  const geo = new THREE.TubeGeometry(curve, 600, wire, 10, false);
  geo.translate(-1.6, wire, 0);

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: '#cfd0d4', metalness: 1, roughness: 0.2 }),
  );
  mesh.castShadow = true;
  mesh.name = 'paperClip';
  return mesh;
}
