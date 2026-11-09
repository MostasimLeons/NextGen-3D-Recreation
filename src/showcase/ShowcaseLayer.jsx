import { lazy, Suspense, useEffect, useState } from 'react';
import './ShowcaseLayer.css';

// R3F + drei live in a lazily loaded chunk: only fetched near a showcase.
const ShowcaseCanvas = lazy(() => import('./ShowcaseCanvas.jsx'));

/**
 * One React Three Fiber canvas for every interactive showcase on the page.
 * Sections place drei <View> elements in the DOM; their contents render into
 * this single fixed canvas (scissored viewports, one WebGL context).
 *
 * The canvas mounts only while a showcase section is near the viewport, so
 * the rest of the page keeps a single (main-scene) WebGL context.
 */
const DEFAULT_WATCH = ['[data-story="projects"]', '[data-story="process"]'];

export default function ShowcaseLayer({ watch = DEFAULT_WATCH }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const els = watch.map((s) => document.querySelector(s)).filter(Boolean);
    if (!els.length) return undefined;
    const visible = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        setActive(visible.size > 0);
      },
      { rootMargin: '60% 0px 60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [watch]);

  if (!active) return null;
  return (
    <Suspense fallback={null}>
      <ShowcaseCanvas />
    </Suspense>
  );
}
