import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance, Float, RoundedBox } from '@react-three/drei';
import { C } from './common.jsx';
import { mulberry32 } from '../../three/textures.js';

/**
 * Game Development stage: a floating low-poly "level prototype" island with
 * instanced trees, spinning coins, floating platforms and a hopping player.
 */
export default function GameIsland({ detail = 1 }) {
  const player = useRef();
  const coins = useRef();

  const trees = useMemo(() => {
    const rand = mulberry32(31);
    return Array.from({ length: Math.round(14 * detail) }, () => {
      const a = rand() * Math.PI * 2;
      const r = 1.2 + rand() * 1.5;
      return { p: [Math.cos(a) * r, 0, Math.sin(a) * r], s: 0.6 + rand() * 0.6 };
    });
  }, [detail]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (player.current) {
      const a = t * 0.8;
      player.current.position.set(Math.cos(a) * 1.0, 0.34 + Math.abs(Math.sin(t * 4)) * 0.45, Math.sin(a) * 1.0);
      player.current.rotation.y = -a;
    }
    if (coins.current) coins.current.children.forEach((c, i) => (c.rotation.y = t * 3 + i));
  });

  return (
    <group>
      {/* Island: grass cap + dirt cone */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[3, 3, 0.3, 7]} />
        <meshStandardMaterial color={C.olive} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, -1.25, 0]}>
        <coneGeometry args={[3, 2.1, 7]} />
        <meshStandardMaterial color={C.dirt} roughness={0.9} flatShading />
      </mesh>

      {/* Instanced trees (two draw calls for all of them) */}
      <Instances limit={trees.length} frustumCulled={false}>
        <coneGeometry args={[0.3, 0.8, 6]} />
        <meshStandardMaterial color="#3d4d30" flatShading roughness={0.8} />
        {trees.map((tr, i) => (
          <Instance key={i} position={[tr.p[0], 0.55 * tr.s + 0.1, tr.p[2]]} scale={tr.s} />
        ))}
      </Instances>
      <Instances limit={trees.length} frustumCulled={false}>
        <cylinderGeometry args={[0.06, 0.08, 0.3, 5]} />
        <meshStandardMaterial color={C.dirt} />
        {trees.map((tr, i) => (
          <Instance key={i} position={[tr.p[0], 0.15, tr.p[2]]} scale={tr.s} />
        ))}
      </Instances>

      {/* Coins */}
      <group ref={coins}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 2.1, 0.75, Math.sin(a) * 2.1]}>
              <cylinderGeometry args={[0.18, 0.18, 0.05, 20]} />
              <meshStandardMaterial color={C.glow} emissive={C.orange} emissiveIntensity={1.2} metalness={0.6} roughness={0.25} />
            </mesh>
          );
        })}
      </group>

      {/* Player */}
      <RoundedBox ref={player} args={[0.34, 0.5, 0.34]} radius={0.08}>
        <meshStandardMaterial color={C.cream} roughness={0.4} />
      </RoundedBox>

      {/* Floating platforms */}
      {[
        [3.6, 1.0, -0.6],
        [-3.4, 1.6, 0.4],
        [0.6, 2.4, -2.6],
      ].map((p, i) => (
        <Float key={i} speed={1.6} floatIntensity={0.6} rotationIntensity={0.2}>
          <RoundedBox args={[1, 0.22, 1]} radius={0.05} position={p}>
            <meshStandardMaterial color={i === 1 ? C.orange : C.charcoal} roughness={0.5} />
          </RoundedBox>
        </Float>
      ))}
    </group>
  );
}
