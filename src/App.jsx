import { useCallback, useRef, useState } from 'react';
import SceneLayer from './components/SceneLayer.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Story from './components/story/Story.jsx';
import { useScrollStory } from './story/useScrollStory.js';

export default function App() {
  const mainRef = useRef(null);
  const [rig, setRig] = useState(null);
  const onSceneReady = useCallback((r) => {
    if (import.meta.env.DEV) window.__nextgenRig = r; // debugging aid (dev only)
    setRig(r);
  }, []);

  // Wires GSAP/ScrollTrigger once the 3D scene exists. Scroll updates go
  // straight to rig.state and the DOM — React does not re-render on scroll.
  useScrollStory(rig, mainRef);

  return (
    <>
      <SceneLayer onSceneReady={onSceneReady} />
      <Header />
      <main ref={mainRef} className="page">
        <Hero />
        <Story rig={rig} />
      </main>
    </>
  );
}
