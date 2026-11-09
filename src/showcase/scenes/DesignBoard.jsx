import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox, CubicBezierLine } from '@react-three/drei';
import { C } from './common.jsx';

/** A floating UI card: rounded panel with "text" bars and a button. */
function Card({ position, rotation, accent = false, rows = 3 }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[2.2, 1.4, 0.06]} radius={0.08}>
        <meshStandardMaterial color={accent ? C.charcoal : C.cream} roughness={0.5} />
      </RoundedBox>
      {Array.from({ length: rows }, (_, i) => (
        <mesh key={i} position={[-0.25 - i * 0.05, 0.35 - i * 0.22, 0.04]}>
          <boxGeometry args={[1.4 - i * 0.25, 0.08, 0.01]} />
          <meshStandardMaterial color={accent ? C.cream : C.charcoal} />
        </mesh>
      ))}
      <mesh position={[0.6, -0.42, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 24]} />
        <meshStandardMaterial color={C.glow} emissive={C.orange} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Creative Design stage: layered interface cards, an animated bezier "pen"
 * curve and a morphing motion-graphics shape.
 */
export default function DesignBoard() {
  const shape = useRef();
  const curve = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (shape.current) {
      shape.current.rotation.set(t * 0.6, t * 0.4, 0);
      const s = 0.7 + Math.sin(t * 1.4) * 0.15;
      shape.current.scale.setScalar(s);
    }
    if (curve.current?.material) curve.current.material.dashOffset = -t * 0.6;
  });

  return (
    <group>
      <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.15}>
        <Card position={[-1.4, 0.7, -0.6]} rotation={[0, 0.35, 0]} />
        <Card position={[0.9, -0.4, 0.3]} rotation={[0, -0.25, 0]} accent rows={4} />
      </Float>
      <CubicBezierLine
        ref={curve}
        start={[-3, -1.6, 0.4]}
        end={[3, 1.8, -0.4]}
        midA={[-0.8, 2.6, 0.8]}
        midB={[0.8, -2.4, 0]}
        color={C.glow}
        lineWidth={2}
        dashed
        dashSize={0.25}
        gapSize={0.12}
      />
      {[
        [-3, -1.6, 0.4],
        [3, 1.8, -0.4],
      ].map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.16, 0.16, 0.16]} />
          <meshBasicMaterial color={C.glow} />
        </mesh>
      ))}
      <mesh ref={shape} position={[2.4, -1.4, 0.6]}>
        <torusKnotGeometry args={[0.45, 0.14, 160, 20]} />
        <meshStandardMaterial color={C.sand} roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  );
}
