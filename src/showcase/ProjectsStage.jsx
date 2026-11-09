import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { View, PresentationControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { StudioLights, ViewCamera } from './scenes/common.jsx';
import GameIsland from './scenes/GameIsland.jsx';
import SculptStage from './scenes/SculptStage.jsx';
import DesignBoard from './scenes/DesignBoard.jsx';

const STAGES = { game: GameIsland, art: SculptStage, design: DesignBoard };

/** Scales its children in whenever it mounts (category switch). */
function Appear({ children }) {
  const g = useRef();
  useFrame((_, dt) => {
    const s = g.current.scale.x;
    g.current.scale.setScalar(THREE.MathUtils.damp(s, 1, 6, dt));
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, 0, 4, dt);
  });
  return (
    <group ref={g} scale={0.001} rotation={[0, -0.8, 0]}>
      {children}
    </group>
  );
}

/** Large drag-to-rotate stage for the active category (drei View). */
export default function ProjectsStage({ activeId }) {
  const Stage = STAGES[activeId];
  return (
    <View className="explore__view">
      <ViewCamera position={[0, 2.2, 10.5]} fov={34} />
      <StudioLights />
      <PresentationControls global={false} cursor snap speed={1.4} polar={[-0.2, 0.3]} azimuth={[-0.9, 0.9]}>
        <Appear key={activeId}>
          <Stage />
        </Appear>
      </PresentationControls>
      <ContactShadows position={[0, -2.6, 0]} opacity={0.5} scale={12} blur={2.6} far={5} color="#000" />
    </View>
  );
}
