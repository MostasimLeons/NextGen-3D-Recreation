import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { setTransitionHooks } from '../router/navigation.js';
import './PortalOverlay.css';

/**
 * The page transition. Cover: a heat ring opens from the click point and
 * floods the screen with the brand's burnt orange → dark, its edge wobbling
 * through an SVG heat-haze filter, while the shared 3D camera dives toward
 * its subject (rig.state.userPortal) and the embers flare. The destination
 * name rises in the middle. Reveal: a hole opens from the centre and the
 * camera pulls back out at the new page's preset.
 *
 * Reduced motion: a short cross-fade, no dive.
 */
const COVER = 0.85;
const REVEAL = 0.9;

export default function PortalOverlay({ rig }) {
  const el = useRef(null);
  const label = useRef(null);
  const rigRef = useRef(rig);
  rigRef.current = rig;

  useEffect(() => {
    const node = el.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vars = { r: 0, hole: 0 };
    const paint = () => {
      node.style.setProperty('--r', `${vars.r.toFixed(2)}%`);
      node.style.setProperty('--hole', `${vars.hole.toFixed(2)}%`);
    };

    const portalTo = (value, duration, ease) => {
      const r = rigRef.current;
      if (!r || reduced) return;
      gsap.to(r.state, { userPortal: value, duration, ease, overwrite: true });
    };

    setTransitionHooks({
      cover: ({ origin, to }) =>
        new Promise((resolve) => {
          const x = origin ? (origin.x / window.innerWidth) * 100 : 50;
          const y = origin ? (origin.y / window.innerHeight) * 100 : 50;
          node.style.setProperty('--x', `${x}%`);
          node.style.setProperty('--y', `${y}%`);
          label.current.textContent = to?.label ?? '';
          node.classList.add('is-active');
          vars.r = 0;
          vars.hole = 0;
          paint();
          if (reduced) {
            gsap.fromTo(node, { opacity: 0 }, { opacity: 1, duration: 0.25, onComplete: resolve });
            vars.r = 200;
            paint();
            return;
          }
          gsap.set(node, { opacity: 1 });
          portalTo(1, COVER, 'power2.in');
          gsap
            .timeline({ onComplete: resolve })
            .to(vars, { r: 200, duration: COVER, ease: 'power3.in', onUpdate: paint }, 0)
            .fromTo(label.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, COVER * 0.55);
        }),
      reveal: () =>
        new Promise((resolve) => {
          const done = () => {
            node.classList.remove('is-active');
            resolve();
          };
          if (reduced) {
            gsap.to(node, { opacity: 0, duration: 0.25, onComplete: done });
            return;
          }
          // Come back out of the dive at the new page.
          const r = rigRef.current;
          if (r) r.state.userPortal = 0.85;
          portalTo(0, REVEAL * 1.15, 'power3.out');
          node.style.setProperty('--x', '50%');
          node.style.setProperty('--y', '50%');
          gsap
            .timeline({ onComplete: done })
            .to(label.current, { autoAlpha: 0, y: -18, duration: 0.3, ease: 'power2.in' }, 0)
            .to(vars, { hole: 200, duration: REVEAL, ease: 'power3.inOut', onUpdate: paint }, 0.1);
        }),
    });
  }, []);

  return (
    <div className="portal" ref={el} aria-hidden="true">
      <svg className="portal__defs" width="0" height="0" focusable="false">
        <filter id="portal-haze">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="46" />
        </filter>
      </svg>
      <div className="portal__fill" />
      <p className="portal__label">
        <span className="portal__brand">NEXT GEN</span>
        <span ref={label} className="portal__dest" />
      </p>
    </div>
  );
}
