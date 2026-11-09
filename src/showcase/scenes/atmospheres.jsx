import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Grid, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { C } from './common.jsx';
import { mulberry32 } from '../../three/textures.js';

/** Particle budget scales with the view size (phones get fewer). */
function useBudget(full) {
  const w = useThree((s) => s.size.width);
  return Math.max(12, Math.round(full * (w < 700 ? 0.45 : 1)));
}

/* -------------------------------------------------------------------- */
/* Game Development — "Arcade Ember": rising, flickering pixel embers    */
/* -------------------------------------------------------------------- */
export function PixelEmbers({ count = 110 }) {
  const n = useBudget(count);
  const mesh = useRef();
  const seeds = useMemo(() => {
    const r = mulberry32(77);
    return Array.from({ length: n }, () => ({
      a: r() * Math.PI * 2,
      rad: 1.2 + r() * 4.6,
      y0: r() * 8,
      speed: 0.35 + r() * 0.9,
      size: 0.04 + Math.pow(r(), 2) * 0.12,
      spin: r() * 4,
    }));
  }, [n]);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3() }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seeds.forEach((d, i) => {
      const y = ((d.y0 + t * d.speed) % 8) - 2.8;
      const life = (y + 2.8) / 8;
      tmp.p.set(Math.cos(d.a + t * 0.1) * d.rad, y, Math.sin(d.a + t * 0.1) * d.rad * 0.6 - 0.5);
      tmp.e.set(t * d.spin, t * d.spin * 0.7, 0);
      tmp.q.setFromEuler(tmp.e);
      const flick = 0.75 + Math.sin(t * 9 + i) * 0.25;
      tmp.s.setScalar(d.size * (1 - life * 0.7) * flick);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      mesh.current.setMatrixAt(i, tmp.m);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, n]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ff7a2a" toneMapped={false} />
    </instancedMesh>
  );
}

/* -------------------------------------------------------------------- */
/* 3D Art & VR — "Holo Studio": VR grid floor, dust, wireframe orbiters   */
/* -------------------------------------------------------------------- */
export function HoloRoom() {
  const orbit = useRef();
  const dust = useBudget(70);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!orbit.current) return;
    orbit.current.rotation.y = t * 0.18;
    orbit.current.children.forEach((c, i) => {
      c.rotation.set(t * (0.3 + i * 0.1), t * 0.4, 0);
      c.position.y = Math.sin(t * 0.8 + i * 2) * 0.35 + (i - 1) * 0.6;
    });
  });
  return (
    <group>
      <Grid
        position={[0, -2.55, 0]}
        args={[30, 30]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#5d6670"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#ff7a2a"
        fadeDistance={18}
        fadeStrength={1.6}
        infiniteGrid
      />
      <group ref={orbit}>
        {[
          [4.2, 0, 0, 'oct'],
          [-3.6, 0, 1.6, 'box'],
          [0.6, 0, -4, 'tor'],
        ].map(([x, y, z, kind], i) => (
          <mesh key={i} position={[x, y, z]}>
            {kind === 'oct' && <octahedronGeometry args={[0.55, 0]} />}
            {kind === 'box' && <boxGeometry args={[0.7, 0.7, 0.7]} />}
            {kind === 'tor' && <torusGeometry args={[0.45, 0.14, 10, 32]} />}
            <meshBasicMaterial color={i === 0 ? '#ff7a2a' : '#e6eef5'} wireframe transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      <Sparkles count={dust} scale={[12, 6, 8]} size={2.2} speed={0.25} opacity={0.6} color="#e6eef5" />
    </group>
  );
}

/* -------------------------------------------------------------------- */
/* Creative Design — "Blueprint": dot grid + drifting confetti shapes     */
/* -------------------------------------------------------------------- */
export function BlueprintField({ count = 54 }) {
  const n = useBudget(count);
  const confetti = useRef();
  const dots = useMemo(() => {
    const pts = [];
    for (let x = -9; x <= 9; x++) for (let y = -5; y <= 5; y++) pts.push(x * 0.9, y * 0.9, -3.2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const seeds = useMemo(() => {
    const r = mulberry32(5);
    const palette = [new THREE.Color(C.cream), new THREE.Color(C.glow), new THREE.Color(C.sand), new THREE.Color('#3a2a1d')];
    return Array.from({ length: n }, () => ({
      p: new THREE.Vector3((r() - 0.5) * 11, (r() - 0.5) * 6, (r() - 0.5) * 4 - 0.5),
      spin: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(2),
      size: 0.08 + r() * 0.16,
      phase: r() * 6.28,
      color: palette[Math.floor(r() * palette.length)],
    }));
  }, [n]);
  const colors = useMemo(() => {
    const arr = new Float32Array(n * 3);
    seeds.forEach((s, i) => s.color.toArray(arr, i * 3));
    return arr;
  }, [n, seeds]);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3() }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seeds.forEach((d, i) => {
      tmp.p.copy(d.p);
      tmp.p.y += Math.sin(t * 0.6 + d.phase) * 0.35;
      tmp.p.x += Math.cos(t * 0.4 + d.phase) * 0.2;
      tmp.e.set(d.spin.x * t, d.spin.y * t, d.spin.z * t);
      tmp.q.setFromEuler(tmp.e);
      tmp.s.set(d.size, d.size * (i % 3 === 0 ? 1 : 0.5), 1);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      confetti.current.setMatrixAt(i, tmp.m);
    });
    confetti.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <points geometry={dots}>
        <pointsMaterial color="#d8b48a" size={0.045} transparent opacity={0.35} sizeAttenuation />
      </points>
      <instancedMesh ref={confetti} args={[undefined, undefined, n]} frustumCulled={false}>
        <planeGeometry args={[1, 1]}>
          <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </planeGeometry>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.6} />
      </instancedMesh>
    </group>
  );
}

export const ATMOSPHERES = { game: PixelEmbers, art: HoloRoom, design: BlueprintField };
