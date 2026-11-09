import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { C } from './common.jsx';
import GameIsland from './GameIsland.jsx';
import { Headset } from './SculptStage.jsx';
import { mulberry32 } from '../../three/textures.js';
import { createMug } from '../../three/objects/mug.js';

/* Small looping real-time "video preview" scenes. Each is cheap: a few
   meshes or one InstancedMesh, animated in useFrame. */

function CoinRun() {
  const g = useRef();
  const hero = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      c.rotation.y = t * 4 + i;
      c.position.x = ((i * 1.2 - t * 1.6) % 6 + 6) % 6 - 3;
    });
    hero.current.position.y = -0.6 + Math.abs(Math.sin(t * 3.2)) * 1.1;
    hero.current.rotation.z = Math.sin(t * 3.2) * 0.15;
  });
  return (
    <group>
      <group ref={g}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.07, 24]} />
            <meshStandardMaterial color={C.glow} emissive={C.orange} emissiveIntensity={1.1} metalness={0.6} roughness={0.25} />
          </mesh>
        ))}
      </group>
      <RoundedBox ref={hero} args={[0.6, 0.6, 0.6]} radius={0.1} position={[-1.6, -0.6, 0]}>
        <meshStandardMaterial color={C.cream} />
      </RoundedBox>
      <mesh position={[0, -1.05, 0]}>
        <boxGeometry args={[7, 0.2, 1.4]} />
        <meshStandardMaterial color={C.olive} flatShading />
      </mesh>
    </group>
  );
}

function Sparks({ count = 140 }) {
  const mesh = useRef();
  // Each spark: an outward velocity + a fixed orientation along it.
  const seeds = useMemo(() => {
    const r = mulberry32(9);
    const z = new THREE.Vector3(0, 0, 1);
    return Array.from({ length: count }, () => {
      const dir = new THREE.Vector3(r() - 0.5, r() - 0.3, r() - 0.5).normalize();
      return { v: dir.clone().multiplyScalar(0.6 + r() * 2.2), q: new THREE.Quaternion().setFromUnitVectors(z, dir) };
    });
  }, [count]);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3(), s: new THREE.Vector3() }), []);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime % 1.6) / 1.6; // burst every 1.6s
    const e = 1 - Math.pow(1 - t, 3);
    const k = (1 - t) * 0.09;
    seeds.forEach(({ v, q }, i) => {
      tmp.p.set(v.x * e * 2, v.y * e * 2 - t * t * 1.2, v.z * e * 2);
      tmp.s.set(k, k, k * 5);
      tmp.m.compose(tmp.p, q, tmp.s);
      mesh.current.setMatrixAt(i, tmp.m);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={C.glow} toneMapped={false} />
    </instancedMesh>
  );
}

function LevelOrbit() {
  const g = useRef();
  useFrame(({ clock }) => (g.current.rotation.y = clock.elapsedTime * 0.5));
  return (
    <group ref={g} scale={0.6} rotation={[0.25, 0, 0]}>
      <GameIsland detail={0.6} />
    </group>
  );
}

function Wireframe() {
  const solid = useRef();
  const wire = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const k = (Math.sin(t * 1.2) + 1) / 2;
    solid.current.material.opacity = k;
    wire.current.material.opacity = 1 - k * 0.7;
    solid.current.rotation.y = wire.current.rotation.y = t * 0.5;
  });
  return (
    <group>
      <mesh ref={solid}>
        <torusKnotGeometry args={[0.9, 0.3, 120, 16]} />
        <meshStandardMaterial color={C.cream} roughness={0.35} transparent />
      </mesh>
      <mesh ref={wire} scale={1.01}>
        <torusKnotGeometry args={[0.9, 0.3, 60, 8]} />
        <meshBasicMaterial color={C.glow} wireframe transparent />
      </mesh>
    </group>
  );
}

function RigTest({ links = 9 }) {
  const root = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    let node = root.current;
    let i = 0;
    while (node) {
      node.rotation.z = Math.sin(t * 2 - i * 0.5) * 0.28;
      node = node.children.find((c) => c.isGroup);
      i++;
    }
  });
  // Nested groups = a simple FK chain.
  const build = (i) =>
    i >= links ? null : (
      <group position={[0, i === 0 ? -1.6 : 0.38, 0]}>
        <mesh position={[0, 0.19, 0]}>
          <capsuleGeometry args={[0.11 - i * 0.006, 0.22, 4, 12]} />
          <meshStandardMaterial color={i % 3 === 0 ? C.glow : C.cream} emissive={i % 3 === 0 ? C.orange : '#000'} emissiveIntensity={0.6} />
        </mesh>
        {build(i + 1)}
      </group>
    );
  return <group ref={root}>{build(0)}</group>;
}

function HeadsetTurn() {
  const g = useRef();
  useFrame(({ clock }) => (g.current.rotation.y = clock.elapsedTime * 0.6));
  return (
    <group ref={g}>
      <Headset scale={0.32} />
    </group>
  );
}

function ShapeMorph() {
  const refs = [useRef(), useRef(), useRef()];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.7;
    refs.forEach((r, i) => {
      const phase = (t - i) % 3;
      const k = Math.max(0, Math.sin(Math.min(Math.max(phase, 0), 1) * Math.PI)); // 0→1→0 over 1 unit
      r.current.scale.setScalar(Math.max(k, 0.001));
      r.current.rotation.set(t, t * 1.3, 0);
    });
  });
  return (
    <group>
      <mesh ref={refs[0]}>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshStandardMaterial color={C.cream} />
      </mesh>
      <mesh ref={refs[1]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={C.glow} emissive={C.orange} emissiveIntensity={0.5} flatShading />
      </mesh>
      <mesh ref={refs[2]}>
        <torusGeometry args={[0.8, 0.3, 20, 60]} />
        <meshStandardMaterial color={C.sand} />
      </mesh>
    </group>
  );
}

function InterfaceSlide() {
  const g = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      const k = ((t * 0.6 + i / 3) % 1);
      c.position.x = THREE.MathUtils.lerp(-3.2, 3.2, k);
      c.position.y = Math.sin(k * Math.PI) * 0.4 - 0.2 + i * 0.05;
      c.rotation.y = (k - 0.5) * -0.8;
    });
  });
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => (
        <RoundedBox key={i} args={[1.6, 1.1, 0.05]} radius={0.06}>
          <meshStandardMaterial color={i === 1 ? C.charcoal : C.cream} />
        </RoundedBox>
      ))}
    </group>
  );
}

function KineticBars({ count = 15 }) {
  const g = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    g.current.children.forEach((b, i) => {
      const h = 0.25 + (Math.sin(t * 3 + i * 0.55) * 0.5 + 0.5) * 1.8;
      b.scale.y = h;
      b.position.y = h / 2 - 1;
    });
  });
  return (
    <group ref={g}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[(i - (count - 1) / 2) * 0.3, 0, 0]}>
          <boxGeometry args={[0.18, 1, 0.18]} />
          <meshStandardMaterial color={i % 4 === 0 ? C.glow : C.cream} emissive={i % 4 === 0 ? C.orange : '#000'} emissiveIntensity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** Engine test: a 14×14 InstancedMesh voxel field rippling (one draw call). */
function VoxelWave({ n = 14 }) {
  const mesh = useRef();
  const tmp = useMemo(() => ({ m: new THREE.Matrix4() }), []);
  // Per-instance colours must exist before the material first compiles.
  const colors = useMemo(() => {
    const hot = new THREE.Color(C.glow);
    const cream = new THREE.Color(C.cream);
    const arr = new Float32Array(n * n * 3);
    for (let i = 0; i < n * n; i++) ((i * 7) % 11 === 0 ? hot : cream).toArray(arr, i * 3);
    return arr;
  }, [n]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let x = 0; x < n; x++) {
      for (let z = 0; z < n; z++) {
        const d = Math.hypot(x - n / 2, z - n / 2);
        const h = 0.15 + (Math.sin(d * 0.7 - t * 2.4) * 0.5 + 0.5) * 1.1;
        tmp.m.makeScale(0.28, h, 0.28).setPosition((x - n / 2) * 0.32, h / 2 - 0.8, (z - n / 2) * 0.32);
        mesh.current.setMatrixAt(x * n + z, tmp.m);
      }
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.rotation.y = t * 0.2;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, n * n]} rotation={[0.5, 0, 0]}>
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </boxGeometry>
      <meshStandardMaterial roughness={0.5} vertexColors />
    </instancedMesh>
  );
}

/** GLSL study: animated fire/noise on a plane (custom ShaderMaterial). */
function FireShader() {
  const mat = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => (uniforms.uTime.value = clock.elapsedTime));
  return (
    <mesh scale={[7.4, 4.6, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        toneMapped={false}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `}
        fragmentShader={/* glsl */ `
          varying vec2 vUv;
          uniform float uTime;
          float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          float n(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
            return mix(mix(h(i),h(i+vec2(1,0)),u.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x), u.y); }
          float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.02; a*=0.5; } return v; }
          void main() {
            vec2 uv = vUv;
            vec2 q = vec2(uv.x * 3.0, uv.y * 2.0 - uTime * 0.9);
            float f = fbm(q + fbm(q + uTime * 0.2));
            float flame = smoothstep(0.0, 1.0, f * (1.25 - uv.y) * 1.6 - uv.y * 0.35);
            vec3 col = mix(vec3(0.06, 0.02, 0.01), vec3(0.86, 0.31, 0.0), flame);
            col = mix(col, vec3(1.0, 0.78, 0.45), smoothstep(0.75, 1.0, flame));
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

/** Asset review: the NEXT GEN mug itself (main-scene model) on a turntable. */
function MugTurntable() {
  const mug = useMemo(() => createMug({ mark: 'NEXT GEN', decalAngle: -0.5 }), []);
  const g = useRef();
  useFrame(({ clock }) => (g.current.rotation.y = clock.elapsedTime * 0.6));
  return (
    <group ref={g} position={[0, -1.4, 0]} scale={0.36}>
      <primitive object={mug} />
    </group>
  );
}

/** id → component, referenced from content.js preview ids. */
export const PREVIEWS = {
  coins: CoinRun,
  sparks: Sparks,
  orbit: LevelOrbit,
  wire: Wireframe,
  rig: RigTest,
  vr: HeadsetTurn,
  morph: ShapeMorph,
  ui: InterfaceSlide,
  bars: KineticBars,
  lattice: VoxelWave,
  shader: FireShader,
  turntable: MugTurntable,
};
