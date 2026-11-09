import * as THREE from 'three';

/**
 * Coffee spill: CPU-integrated particles drawn with two InstancedMeshes.
 *
 *  drops   — the pour. Gravity + light drag, per-drop size, stretched along
 *            velocity (reads as a stream when dense, as droplets when sparse).
 *  splash  — spawned where a drop hits the floor plane: short-lived, smaller,
 *            hemispherical burst biased by the drop's horizontal momentum.
 *  puddle  — a glossy disc on the floor that grows with landed volume,
 *            drifts toward recent impacts and fades after the spill ends.
 *
 * All buffers are pre-allocated (ring allocation), so there are no per-frame
 * allocations and the cost is two instanced draw calls + one disc.
 */
export function createCoffeeSpill({ maxDrops = 600, maxSplash = 420, floorY = -0.8, gravity = 42 } = {}) {
  const group = new THREE.Group();
  group.name = 'coffeeSpill';

  // Dark, glossy coffee. Environment reflections are kept low: the studio
  // environment is bright, and at grazing angles it would wash the liquid
  // out to grey. A warm specular tint keeps highlights coffee-coloured.
  const coffee = new THREE.MeshPhysicalMaterial({
    color: '#2a1207',
    roughness: 0.12,
    metalness: 0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.06,
    specularColor: new THREE.Color('#ffb27a'),
    specularIntensity: 0.6,
    envMapIntensity: 0.45,
  });

  /* Particle pools ----------------------------------------------------- */
  function pool(count, geo) {
    const mesh = new THREE.InstancedMesh(geo, coffee, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.count = 0;
    group.add(mesh);
    return {
      mesh,
      p: new Float32Array(count * 3),
      v: new Float32Array(count * 3),
      life: new Float32Array(count), // seconds left (≤ 0 = dead)
      size: new Float32Array(count),
      max: count,
      next: 0,
    };
  }
  const drops = pool(maxDrops, new THREE.SphereGeometry(1, 10, 8));
  const splash = pool(maxSplash, new THREE.SphereGeometry(1, 6, 5));

  function spawn(pl, px, py, pz, vx, vy, vz, size, life) {
    const i = pl.next;
    pl.next = (pl.next + 1) % pl.max;
    pl.p[i * 3] = px;
    pl.p[i * 3 + 1] = py;
    pl.p[i * 3 + 2] = pz;
    pl.v[i * 3] = vx;
    pl.v[i * 3 + 1] = vy;
    pl.v[i * 3 + 2] = vz;
    pl.size[i] = size;
    pl.life[i] = life;
  }

  /* Puddle ------------------------------------------------------------- */
  // Seen at a grazing angle, a mirror-glossy disc goes near-white through
  // Fresnel. A slightly rough, low-specular dark brown reads as wet coffee.
  const puddleMat = new THREE.MeshPhysicalMaterial({
    color: '#120702',
    roughness: 0.42,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
    specularColor: new THREE.Color('#ff8a4a'),
    specularIntensity: 0.12,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    envMapIntensity: 0.08,
  });
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 72), puddleMat);
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.y = floorY + 0.005;
  puddle.scale.set(0.001, 0.001, 1);
  puddle.visible = false;
  group.add(puddle);
  const pd = { volume: 0, x: 0, z: 0, idle: 0, hasCenter: false };

  /* Scratch ------------------------------------------------------------ */
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const rand = Math.random;

  function landed(i) {
    const x = drops.p[i * 3];
    const z = drops.p[i * 3 + 2];
    const vx = drops.v[i * 3];
    const vy = drops.v[i * 3 + 1];
    const vz = drops.v[i * 3 + 2];
    const s = drops.size[i];
    const impact = Math.min(Math.abs(vy) / 18, 1.6);
    // Splash crown: a few fast, small droplets thrown up and out.
    const n = 2 + Math.round(rand() * 3 * impact);
    for (let k = 0; k < n; k++) {
      const a = rand() * Math.PI * 2;
      const out = (1.2 + rand() * 3.2) * impact;
      spawn(
        splash,
        x,
        floorY + 0.02,
        z,
        Math.cos(a) * out + vx * 0.25,
        (2.5 + rand() * 5.5) * impact,
        Math.sin(a) * out + vz * 0.25,
        s * (0.35 + rand() * 0.35),
        0.45 + rand() * 0.45,
      );
    }
    // Feed the puddle.
    pd.volume += s * s * s * 60;
    if (!pd.hasCenter) {
      pd.x = x;
      pd.z = z;
      pd.hasCenter = true;
    } else {
      pd.x += (x - pd.x) * 0.03;
      pd.z += (z - pd.z) * 0.03;
    }
    pd.idle = 0;
  }

  function integrate(pl, dt, isDrop) {
    let alive = 0;
    const drag = isDrop ? 0.35 : 0.9;
    for (let i = 0; i < pl.max; i++) {
      if (pl.life[i] <= 0) continue;
      pl.life[i] -= dt;
      const j = i * 3;
      pl.v[j + 1] -= gravity * dt;
      const d = Math.exp(-drag * dt);
      pl.v[j] *= d;
      pl.v[j + 2] *= d;
      pl.p[j] += pl.v[j] * dt;
      pl.p[j + 1] += pl.v[j + 1] * dt;
      pl.p[j + 2] += pl.v[j + 2] * dt;

      if (pl.p[j + 1] <= floorY) {
        if (isDrop) landed(i);
        pl.life[i] = 0;
        continue;
      }

      // Orient + stretch along velocity.
      vel.set(pl.v[j], pl.v[j + 1], pl.v[j + 2]);
      const speed = vel.length();
      if (speed > 1e-3) q.setFromUnitVectors(zAxis, vel.multiplyScalar(1 / speed));
      const s = pl.size[i] * (isDrop ? 1 : Math.max(pl.life[i] * 1.6, 0.2));
      scl.set(s, s, s * (1 + Math.min(speed * (isDrop ? 0.09 : 0.05), 3.2)));
      pos.set(pl.p[j], pl.p[j + 1], pl.p[j + 2]);
      m.compose(pos, q, scl);
      pl.mesh.setMatrixAt(alive++, m);
    }
    pl.mesh.count = alive;
    pl.mesh.instanceMatrix.needsUpdate = true;
    return alive;
  }

  return {
    object: group,

    /**
     * Emit `count` drops from `origin` (world), heading along `dir` (unit),
     * inheriting `base` velocity (e.g. the spinning rim), with dispersion.
     */
    emit(origin, dir, count, { speed = 5, spread = 1.2, base = null, size = 0.11, jitter = 0.3 } = {}) {
      for (let k = 0; k < count; k++) {
        const sp = speed * (0.75 + rand() * 0.5);
        spawn(
          drops,
          origin.x + (rand() - 0.5) * jitter,
          origin.y + (rand() - 0.5) * jitter * 0.5,
          origin.z + (rand() - 0.5) * jitter,
          dir.x * sp + (rand() - 0.5) * spread + (base?.x ?? 0),
          dir.y * sp + (rand() - 0.5) * spread * 0.5 + (base?.y ?? 0),
          dir.z * sp + (rand() - 0.5) * spread + (base?.z ?? 0),
          size * (0.45 + Math.pow(rand(), 2) * 1.3), // many small, few big
          4,
        );
      }
    },

    update(dt) {
      const nDrops = integrate(drops, dt, true);
      const nSplash = integrate(splash, dt, false);

      // Puddle: radius ∝ sqrt(volume), fades a few seconds after the spill.
      pd.idle += dt;
      if (pd.volume > 0) {
        const r = Math.min(Math.sqrt(pd.volume) * 0.6, 4.2);
        puddle.visible = true;
        puddle.position.x = pd.x;
        puddle.position.z = pd.z;
        const cur = puddle.scale.x;
        const nr = cur + (r - cur) * Math.min(dt * 3, 1);
        puddle.scale.set(nr, nr * 0.92, 1);
        const fade = pd.idle < 3 ? 1 : Math.max(0, 1 - (pd.idle - 3) / 2.5);
        puddleMat.opacity = 0.92 * fade;
        if (fade <= 0) {
          pd.volume = 0;
          pd.hasCenter = false;
          puddle.visible = false;
          puddle.scale.set(0.001, 0.001, 1);
        }
      }
      return nDrops + nSplash;
    },
  };
}
