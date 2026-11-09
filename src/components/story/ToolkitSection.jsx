import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const copy = content.story.toolkit;

/**
 * "Real-time first" (≈ oryzo sustainability). Instead of a card grid, the
 * four disciplines are glowing nodes orbiting the mug in the main 3D scene
 * (three/effects/orbit.js); these labels are pinned to the nodes' projected
 * screen positions every frame while the section is on screen.
 */
export default function ToolkitSection({ rig }) {
  const pinRef = useRef(null);
  const labels = useRef([]);

  useEffect(() => {
    if (!rig?.orbit) return undefined;
    const section = document.querySelector('[data-story="toolkit"]');
    const pin = section?.querySelector('.story-section__pin');
    if (!section || !pin) return undefined;
    const v = new THREE.Vector3();
    let raf = 0;
    let running = false;

    const frame = () => {
      const r = pin.getBoundingClientRect();
      const w = window.innerWidth;
      const h = window.innerHeight;
      const presence = THREE.MathUtils.clamp(rig.state.orbit, 0, 1);
      rig.orbit.anchors.forEach((a, i) => {
        const el = labels.current[i];
        if (!el) return;
        v.copy(a).project(rig.camera);
        const x = (v.x * 0.5 + 0.5) * w - r.left;
        const y = (-v.y * 0.5 + 0.5) * h - r.top;
        const visible = v.z < 1 && presence > 0.05;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        el.style.opacity = visible ? String(presence) : '0';
        // nodes on the far side of the orbit recede a little
        el.classList.toggle('is-far', v.z > 0.985);
        // nodes right of centre put their card on the left so it stays on screen
        el.classList.toggle('is-left', x + r.left > w * 0.55);
      });
      if (running) raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      } else if (!entry.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(section);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [rig]);

  return (
    <StorySection id="toolkit" label="Toolkit">
      <div className="toolkit__head">
        <p className="story-eyebrow" data-reveal>
          {copy.eyebrow}
        </p>
        <h2 className="toolkit__title" data-reveal>
          {copy.title.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
      </div>
      <ul className="orbit-labels" ref={pinRef} aria-label="Disciplines">
        {copy.groups.map((g, i) => (
          <li key={g.name} className="orbit-label" ref={(el) => (labels.current[i] = el)}>
            <span className="orbit-label__dot" aria-hidden="true" />
            <span className="orbit-label__card">
              <span className="orbit-label__index">0{i + 1}</span>
              <span className="orbit-label__name">{g.name}</span>
              <span className="orbit-label__items">{g.items.join(' · ')}</span>
            </span>
          </li>
        ))}
      </ul>
    </StorySection>
  );
}
