import * as THREE from 'three';
import { createGlazeTexture, createGlazeBumpTexture, createMugDecalTexture, createCoffeeTexture } from '../textures.js';
import { enableShadows } from './shapes.js';

/**
 * Glazed stoneware coffee mug, modelled procedurally:
 * - body: one lathe profile (foot ring → outer wall → rounded lip → inner wall)
 * - handle: tube swept along a C-shaped spline, attached on +X
 * - printed decal on the +Z face (toward the camera)
 * - coffee surface with a crema ring
 * Origin = centre of the foot, resting on y = 0.
 */
export function createMug({
  radius = 2.45,
  height = 5.4,
  wall = 0.16,
  mark = 'NEXT GEN',
  decalAngle = 0, // where the printed mark sits around the body (radians, 0 = +Z)
  fill = 0.86,
} = {}) {
  const R = radius;
  const H = height;
  const group = new THREE.Group();
  group.name = 'mug';

  /* Body ------------------------------------------------------------- */
  const profile = [
    [0, 0.16], // recessed base
    [R - 0.62, 0.16],
    [R - 0.55, 0.04],
    [R - 0.45, 0], // foot ring
    [R - 0.2, 0.01],
    [R - 0.05, 0.12],
    [R, 0.34],
    [R, H - 0.18], // straight outer wall
    [R - 0.01, H - 0.06],
    [R - wall * 0.35, H], // rounded lip
    [R - wall * 0.75, H - 0.02],
    [R - wall, H - 0.14],
    [R - wall, 0.62], // inner wall
    [R - wall - 0.22, 0.42],
    [0, 0.38],
  ].map(([x, y]) => new THREE.Vector2(x, y));

  const bumpMap = createGlazeBumpTexture();
  bumpMap.repeat.set(10, 5);
  const glaze = new THREE.MeshPhysicalMaterial({
    map: createGlazeTexture(),
    bumpMap,
    bumpScale: 0.35,
    color: '#ffffff',
    roughness: 0.28,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    sheen: 0.2,
    sheenColor: new THREE.Color('#fff4e6'),
    envMapIntensity: 1.1,
  });

  const bodyGeo = new THREE.LatheGeometry(profile, 128);
  // Keep the lathe's seam-safe u (angle), but map v to height so the
  // speckle isn't stretched along the tall outer wall.
  const pos = bodyGeo.attributes.position;
  const uv = bodyGeo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setY(i, pos.getY(i) / H);
  const body = new THREE.Mesh(bodyGeo, glaze);
  body.name = 'mugBody';
  group.add(body);

  /* Handle ----------------------------------------------------------- */
  const handleCurve = new THREE.CatmullRomCurve3(
    [
      [R - 0.15, H * 0.8],
      [R + 0.7, H * 0.83],
      [R + 1.45, H * 0.7],
      [R + 1.55, H * 0.45],
      [R + 1.1, H * 0.27],
      [R - 0.15, H * 0.24],
    ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    false,
    'centripetal',
  );
  const handleGeo = new THREE.TubeGeometry(handleCurve, 80, 0.3, 20, false);
  // Flatten the tube sideways for an oval, hand-pulled cross-section.
  handleGeo.scale(1, 1, 0.72);
  const handle = new THREE.Mesh(handleGeo, glaze);
  handle.name = 'mugHandle';
  group.add(handle);

  /* Printed decal (faces +Z, i.e. toward the camera) ------------------ */
  const arc = 1.25; // radians of wall covered
  const decalH = 1.9;
  const decal = new THREE.Mesh(
    new THREE.CylinderGeometry(R + 0.006, R + 0.006, decalH, 48, 1, true, decalAngle - arc / 2, arc),
    new THREE.MeshPhysicalMaterial({
      map: createMugDecalTexture(mark),
      transparent: true,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      depthWrite: false,
    }),
  );
  decal.position.y = H * 0.5;
  decal.name = 'mugDecal';
  group.add(decal);

  /* Coffee ------------------------------------------------------------ */
  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(R - wall - 0.005, 96),
    new THREE.MeshPhysicalMaterial({
      map: createCoffeeTexture(),
      roughness: 0.06,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
    }),
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.4 + (H - 0.55) * fill;
  coffee.name = 'mugCoffee';
  coffee.receiveShadow = true;
  group.add(coffee);

  enableShadows(body);
  enableShadows(handle);
  // Exposed so the scene can tint the glaze (variants) at runtime.
  group.userData.glaze = glaze;
  return group;
}
