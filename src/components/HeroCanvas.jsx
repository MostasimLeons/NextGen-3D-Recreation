import { useEffect, useRef, useState } from 'react';
import { createHeroScene } from '../three/createHeroScene.js';

/**
 * Mounts the Three.js desk scene and fades it in after the first frame.
 * `onSceneReady(rig)` hands the camera / objects / animatable params to a
 * parent — the hook point for future GSAP + ScrollTrigger timelines.
 */
export default function HeroCanvas({ onSceneReady }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const readyCb = useRef(onSceneReady);
  readyCb.current = onSceneReady;

  useEffect(() => {
    let scene;
    let cancelled = false;

    createHeroScene(ref.current, { onReady: () => !cancelled && setReady(true) })
      .then((s) => {
        if (cancelled) return s.dispose();
        scene = s;
        readyCb.current?.(s.rig);
      })
      .catch((err) => console.error('Hero scene failed to start:', err));

    return () => {
      cancelled = true;
      scene?.dispose();
    };
  }, []);

  return <div ref={ref} className={`hero-canvas${ready ? ' is-ready' : ''}`} />;
}
