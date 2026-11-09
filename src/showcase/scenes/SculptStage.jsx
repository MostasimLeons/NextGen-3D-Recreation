import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { createVrHeadset } from '../../three/objects/vrHeadset.js';
import { C } from './common.jsx';

/** The procedural VR headset from the main scene, reused as an R3F primitive. */
export function Headset(props) {
  const obj = useMemo(() => createVrHeadset(), []);
  return <primitive object={obj} {...props} />;
}

/**
 * 3D Art & VR stage: a live-sculpted glaze blob (distortion shader) inside a
 * rotating topology cage, with the VR headset orbiting it.
 */
export default function SculptStage() {
  const cage = useRef();
  const orbit = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (cage.current) cage.current.rotation.set(t * 0.12, t * 0.18, 0);
    if (orbit.current) orbit.current.rotation.y = t * 0.35;
  });

  return (
    <group>
      <Float speed={1.4} floatIntensity={0.5}>
        <mesh>
          <icosahedronGeometry args={[1.35, 48]} />
          <MeshDistortMaterial color={C.cream} roughness={0.25} metalness={0.05} distort={0.38} speed={1.6} clearcoat={1} />
        </mesh>
      </Float>
      <mesh ref={cage}>
        <icosahedronGeometry args={[2.1, 1]} />
        <meshBasicMaterial color={C.glow} wireframe transparent opacity={0.35} />
      </mesh>
      <group ref={orbit}>
        <Headset position={[3.1, 0.4, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.26} />
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.1, 0.012, 8, 160]} />
        <meshBasicMaterial color={C.glow} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
