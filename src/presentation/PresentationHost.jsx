import { Component, lazy, Suspense } from 'react';
import { closePresentation, usePresentation } from './store.js';

// The whole presentation (UI + its 3D) is a separate chunk, fetched on demand.
export const loadPresentation = () => import('./Presentation.jsx');
const Presentation = lazy(loadPresentation);

/**
 * If anything in the presentation fails (no WebGL, lost context, a shader
 * error), close it and keep the website running instead of unmounting the
 * whole app.
 */
class PresentationBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error('[presentation] closed after an error:', error);
    closePresentation();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Mounts the presentation only while it is open; unmount frees everything. */
export default function PresentationHost({ rig }) {
  const { open } = usePresentation();
  if (!open) return null;
  return (
    <PresentationBoundary>
      <Suspense fallback={null}>
        <Presentation rig={rig} />
      </Suspense>
    </PresentationBoundary>
  );
}
