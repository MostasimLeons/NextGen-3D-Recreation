import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Grid, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import { C } from './common.jsx';
import { Headset } from './SculptStage.jsx';
import { mulberry32 } from '../../three/textures.js';

/* Six technology scenes for "Runs on the edge of play". Each is cheap:
   instanced meshes or a single shader, animated in useFrame. */

const useSmall = () => useThree((s) => s.size.width < 700);

/* 01 Unity — modular cubes assemble into one component block, with
   transform-gizmo rings orbiting. */
export function UnityAssembly() {
  const mesh = useRef();
  const rings = useRef();
  const cells = useMemo(() => {
    const r = mulberry32(3);
    const out = [];
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          const home = new THREE.Vector3(x, y, z).multiplyScalar(0.62);
          const away = home.clone().normalize().multiplyScalar(2.2 + r() * 1.6);
          if (home.lengthSq() === 0) away.set(0, 0, 0);
          away.y += (r() - 0.5) * 1.2;
          out.push({ home, away, spin: new THREE.Vector3(r(), r(), r()).multiplyScalar(3), d: r() * 0.4 });
        }
    return out;
  }, []);
  const colors = useMemo(() => {
    const a = new Float32Array(cells.length * 3);
    const hot = new THREE.Color(C.glow);
    const cream = new THREE.Color(C.cream);
    const dark = new THREE.Color('#2a211a');
    cells.forEach((_, i) => (i === 13 ? hot : i % 4 === 0 ? cream : dark).toArray(a, i * 3));
    return a;
  }, [cells]);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3(0.56, 0.56, 0.56) }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    cells.forEach((c, i) => {
      // 0 = exploded, 1 = assembled; each cube lags a little (c.d).
      const k = THREE.MathUtils.smoothstep(Math.sin(t * 0.7 - c.d * 3) * 0.6 + 0.5, 0, 1);
      tmp.p.lerpVectors(c.away, c.home, k);
      tmp.e.set(c.spin.x * (1 - k) * t, c.spin.y * (1 - k) * t, 0);
      tmp.q.setFromEuler(tmp.e);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      mesh.current.setMatrixAt(i, tmp.m);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.rotation.y = t * 0.25;
    if (rings.current) rings.current.children.forEach((r, i) => (r.rotation.z = t * (0.4 + i * 0.25) * (i % 2 ? -1 : 1)));
  });
  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, cells.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]}>
          <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </boxGeometry>
        <meshStandardMaterial vertexColors roughness={0.35} metalness={0.2} />
      </instancedMesh>
      <group ref={rings}>
        {[
          [2.3, [Math.PI / 2, 0, 0], C.glow],
          [2.6, [0, Math.PI / 2, 0], C.cream],
          [2.9, [0, 0, 0], C.sand],
        ].map(([r, rot, col], i) => (
          <group key={i} rotation={rot}>
            <mesh>
              <torusGeometry args={[r, 0.012, 8, 160]} />
              <meshBasicMaterial color={col} toneMapped={false} transparent opacity={0.85} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* 02 Unreal Engine — a real-time heightfield world with a sweeping light. */
export function UnrealTerrain() {
  const small = useSmall();
  const n = small ? 18 : 26;
  const mesh = useRef();
  const sweep = useRef();
  const base = useMemo(() => {
    const r = mulberry32(12);
    const h = [];
    for (let i = 0; i < n * n; i++) h.push(r());
    return h;
  }, [n]);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4() }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let x = 0; x < n; x++)
      for (let z = 0; z < n; z++) {
        const i = x * n + z;
        const fx = x / n - 0.5;
        const fz = z / n - 0.5;
        const ridge = Math.sin(fx * 7 + 1.3) * Math.cos(fz * 6 - 0.4) * 0.9 + base[i] * 0.35;
        const h = Math.max(0.08, 0.6 + ridge + Math.sin(t * 0.8 + fx * 4) * 0.08);
        tmp.m.makeScale(0.26, h, 0.26).setPosition(fx * 8, h / 2 - 1.8, fz * 8);
        mesh.current.setMatrixAt(i, tmp.m);
      }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (sweep.current) sweep.current.position.set(Math.sin(t * 0.5) * 4.5, 1.6, Math.cos(t * 0.5) * 3);
  });
  return (
    <group rotation={[0.18, 0.4, 0]} scale={0.62} position={[0, -0.4, 0]}>
      <instancedMesh ref={mesh} args={[undefined, undefined, n * n]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3a2c22" roughness={0.8} metalness={0.05} />
      </instancedMesh>
      <pointLight ref={sweep} color={C.glow} intensity={28} distance={9} decay={1.6} />
      <mesh position={[-3.2, 2.6, -3.2]}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshBasicMaterial color="#ffb066" toneMapped={false} />
      </mesh>
    </group>
  );
}

/* 03 Blender — low-poly wireframe ⇄ smooth sculpt, with edit-mode vertex dots. */
export function BlenderSculpt() {
  const low = useRef();
  const smooth = useRef();
  const dots = useRef();
  const lowGeo = useMemo(() => new THREE.IcosahedronGeometry(1.5, 1), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const k = THREE.MathUtils.smoothstep(Math.sin(t * 0.8) * 0.5 + 0.5, 0.2, 0.8); // 0 low → 1 smooth
    smooth.current.scale.setScalar(Math.max(k, 0.001) * 1.02);
    low.current.material.opacity = 1 - k * 0.85;
    dots.current.material.opacity = 1 - k;
    [low.current, smooth.current, dots.current].forEach((o) => (o.rotation.y = t * 0.35));
  });
  return (
    <Float speed={1.2} floatIntensity={0.4}>
      <mesh ref={low} geometry={lowGeo}>
        <meshBasicMaterial color={C.glow} wireframe transparent toneMapped={false} />
      </mesh>
      <points ref={dots} geometry={lowGeo}>
        <pointsMaterial color={C.cream} size={0.09} transparent sizeAttenuation />
      </points>
      <mesh ref={smooth}>
        <icosahedronGeometry args={[1.5, 32]} />
        <MeshDistortMaterial color={C.cream} roughness={0.28} distort={0.32} speed={1.4} clearcoat={1} />
      </mesh>
    </Float>
  );
}

/* 04 Three.js — a scene-graph node network with light pulses on its edges. */
export function ThreeGraph() {
  const g = useRef();
  const pulses = useRef();
  const { nodes, edges, lineGeo } = useMemo(() => {
    const r = mulberry32(44);
    const ns = Array.from({ length: 14 }, (_, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 14);
      const th = Math.PI * (1 + Math.sqrt(5)) * i;
      return new THREE.Vector3(Math.cos(th) * Math.sin(phi), Math.cos(phi), Math.sin(th) * Math.sin(phi)).multiplyScalar(2.2 + r() * 0.4);
    });
    const es = [];
    ns.forEach((a, i) => {
      const near = ns.map((b, j) => [j, a.distanceTo(b)]).filter(([j]) => j !== i).sort((x, y) => x[1] - y[1]).slice(0, 2);
      near.forEach(([j]) => i < j && es.push([i, j]));
    });
    const pos = [];
    es.forEach(([a, b]) => pos.push(...ns[a].toArray(), ...ns[b].toArray()));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return { nodes: ns, edges: es, lineGeo: geo };
  }, []);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3() }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    g.current.rotation.y = t * 0.2;
    g.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    edges.forEach(([a, b], i) => {
      const k = (t * 0.6 + i * 0.37) % 1;
      tmp.p.lerpVectors(nodes[a], nodes[b], k);
      tmp.m.makeScale(0.07, 0.07, 0.07).setPosition(tmp.p);
      pulses.current.setMatrixAt(i, tmp.m);
    });
    pulses.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group ref={g}>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color={C.cream} transparent opacity={0.35} />
      </lineSegments>
      {nodes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[i === 0 ? 0.26 : 0.13, 20, 20]} />
          <meshStandardMaterial color={i === 0 ? C.glow : C.cream} emissive={i === 0 ? C.orange : '#000'} emissiveIntensity={1.2} roughness={0.3} />
        </mesh>
      ))}
      <instancedMesh ref={pulses} args={[undefined, undefined, edges.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color="#ffb066" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* 05 WebGL — a GPU-displaced fire surface (custom vertex + fragment shader). */
export function WebGLSurface() {
  const small = useSmall();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => (uniforms.uTime.value = clock.elapsedTime));
  return (
    <mesh rotation={[-1.05, 0, 0.25]} position={[0, -0.8, 0]} scale={0.58}>
      <planeGeometry args={[9, 9, small ? 80 : 140, small ? 80 : 140]} />
      <shaderMaterial
        uniforms={uniforms}
        toneMapped={false}
        side={THREE.DoubleSide}
        vertexShader={/* glsl */ `
          uniform float uTime;
          varying float vH;
          varying vec2 vUv;
          float h(vec2 p){ return fract(sin(dot(p, vec2(12.99, 78.23))) * 43758.55); }
          float n(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
            return mix(mix(h(i),h(i+vec2(1,0)),u.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x), u.y); }
          float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*n(p); p*=2.03; a*=0.5; } return v; }
          void main() {
            vUv = uv;
            vec3 p = position;
            float f = fbm(p.xy * 0.55 + vec2(0.0, -uTime * 0.35)) ;
            vH = f;
            p.z += (f - 0.45) * 2.4;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          varying float vH;
          varying vec2 vUv;
          void main() {
            float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x) * smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
            vec3 col = mix(vec3(0.05, 0.015, 0.005), vec3(0.86, 0.31, 0.0), smoothstep(0.3, 0.7, vH));
            col = mix(col, vec3(1.0, 0.8, 0.5), smoothstep(0.72, 0.92, vH));
            // contour lines — a "shader debug" look
            float lines = smoothstep(0.92, 1.0, fract(vH * 14.0)) * 0.35;
            gl_FragColor = vec4((col + lines) * edge, edge);
          }
        `}
        transparent
      />
    </mesh>
  );
}

/* 06 VR — the headset inside a glowing portal ring over a grid room,
   with two pointer rays. */
export function VRPortal() {
  const ring = useRef();
  const hs = useRef();
  const rays = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ring.current.rotation.z = t * 0.3;
    ring.current.scale.setScalar(1 + Math.sin(t * 2) * 0.015);
    hs.current.rotation.y = Math.sin(t * 0.5) * 0.6;
    hs.current.position.y = 0.3 + Math.sin(t * 0.9) * 0.15;
    rays.current.children.forEach((r, i) => (r.rotation.z = Math.sin(t * 0.8 + i * 1.7) * 0.25 + (i ? -0.35 : 0.35)));
  });
  return (
    <group>
      <Grid position={[0, -2.4, 0]} args={[30, 30]} cellSize={0.5} cellColor="#4a3a30" sectionSize={2.5} sectionColor="#ff7a2a" fadeDistance={16} fadeStrength={1.5} infiniteGrid />
      <group ref={ring}>
        <mesh>
          <torusGeometry args={[2.6, 0.05, 16, 200]} />
          <meshBasicMaterial color={C.glow} toneMapped={false} />
        </mesh>
        <mesh>
          <torusGeometry args={[2.85, 0.012, 8, 200]} />
          <meshBasicMaterial color="#ffb066" toneMapped={false} transparent opacity={0.6} />
        </mesh>
      </group>
      <mesh position={[0, 0, -0.2]}>
        <circleGeometry args={[2.55, 64]} />
        <meshBasicMaterial color="#3a0d04" transparent opacity={0.55} />
      </mesh>
      <group ref={hs}>
        <Headset scale={0.36} />
      </group>
      <group ref={rays}>
        {[-1.4, 1.4].map((x, i) => (
          <group key={i} position={[x, -2.3, 1.2]}>
            <mesh position={[0, 1.4, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 2.8, 6]} />
              <meshBasicMaterial color={C.glow} toneMapped={false} transparent opacity={0.8} />
            </mesh>
            <mesh>
              <capsuleGeometry args={[0.12, 0.3, 4, 10]} />
              <meshStandardMaterial color="#2a231d" roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export const TECH_SCENES = {
  unity: UnityAssembly,
  unreal: UnrealTerrain,
  blender: BlenderSculpt,
  three: ThreeGraph,
  webgl: WebGLSurface,
  vr: VRPortal,
};

/** Per-chapter camera framing for the tech stage. */
// Targets are offset (x −, y −) so each subject sits centre-right and a
// little high, keeping the lower-left free for the giant tech name.
export const TECH_CAMERAS = {
  unity: { pos: [2.2, 2.0, 9.4], target: [-1.6, -0.7, 0] },
  unreal: { pos: [-1.2, 5.0, 11.6], target: [-1.8, -1.4, 0] },
  blender: { pos: [-3.2, 1.0, 9.2], target: [-1.5, -0.7, 0] },
  three: { pos: [-1.2, 0.6, 10.4], target: [-1.7, -0.6, 0] },
  webgl: { pos: [-1.4, 4.0, 10.4], target: [-1.8, -1.5, 0] },
  vr: { pos: [0.4, 0.4, 10.0], target: [-1.6, -0.5, 0] },
};
