import { lazy, Suspense, useEffect, useState } from 'react';
import './ShowcaseLayer.css';

// R3F + drei live in a lazily loaded chunk, prefetched once the page is idle.
const loadCanvas = () => import('./ShowcaseCanvas.jsx');
const ShowcaseCanvas = lazy(loadCanvas);

/**
 * One React Three Fiber canvas for every interactive showcase on the page.
 * Sections place drei <View> elements in the DOM; their contents render into
 * this single fixed canvas (scissored viewports, one WebGL context).
 *
 * The canvas mounts the first time a showcase section nears the viewport and
 * then stays mounted: away from the showcases its render loop is paused and
 * it is hidden. (Unmounting it cost a 200–300 ms stall on every return,
 * because the context and every shader had to be rebuilt.)
 */
const DEFAULT_WATCH = ['[data-story="projects"]', '[data-story="process"]'];

export default function ShowcaseLayer({ watch = DEFAULT_WATCH }) {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (active) setMounted(true);
  }, [active]);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 2000));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const id = idle(() => loadCanvas().catch(() => {}));
    return () => cancel(id);
  }, []);

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

  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <ShowcaseCanvas active={active} />
    </Suspense>
  );
}
