import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import SceneLayer from './components/SceneLayer.jsx';
import Header from './components/Header.jsx';
import PortalOverlay from './components/PortalOverlay.jsx';
import PresentationHost from './presentation/PresentationHost.jsx';
import ShowcaseLayer from './showcase/ShowcaseLayer.jsx';
import HomePage from './pages/HomePage.jsx';
import { installLinkInterception, useRoute } from './router/navigation.js';
import './styles/hud.css';

// Deep pages share one lazily loaded shell (home stays in the main bundle).
const CategoryPage = lazy(() => import('./pages/CategoryPage.jsx'));

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, key, name] = selector.match(/\[(name|property)="([^"]+)"\]/);
    el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/**
 * App shell. Everything 3D lives here, above the router, and survives page
 * changes: the main scene (SceneLayer), the R3F showcase canvas, and the
 * portal transition. Only the <main> page content swaps per route.
 */
export default function App() {
  const route = useRoute();
  const [rig, setRig] = useState(null);
  const onSceneReady = useCallback((r) => {
    if (import.meta.env.DEV) window.__nextgenRig = r; // debugging aid (dev only)
    setRig(r);
  }, []);

  useEffect(() => installLinkInterception(), []);

  // Per-route document metadata.
  useEffect(() => {
    document.title = route.title;
    setMeta('meta[name="description"]', 'content', route.description);
    setMeta('meta[property="og:title"]', 'content', route.title);
    setMeta('meta[property="og:description"]', 'content', route.description);
    document.documentElement.dataset.page = route.id;
  }, [route]);

  return (
    <>
      <SceneLayer onSceneReady={onSceneReady} />
      <Header />
      {route.id === 'home' ? (
        <HomePage rig={rig} />
      ) : (
        <Suspense fallback={null}>
          <CategoryPage key={route.id} rig={rig} routeId={route.id} />
        </Suspense>
      )}
      <ShowcaseLayer routeKey={route.id} />
      {/* Fixed story HUD (filled by useScrollStory, no React re-renders) */}
      <div className="story-hud" aria-hidden="true">
        <span className="story-hud__index" data-hud-index>
          01
        </span>
        <span className="story-hud__label" data-hud-label>
          Intro
        </span>
        <span className="story-hud__bar">
          <i data-hud-bar />
        </span>
      </div>
      <PortalOverlay rig={rig} />
      <PresentationHost rig={rig} />
    </>
  );
}
