import { useRef } from 'react';
import './InfoCard.css';

/**
 * Small translucent specification card, bottom-left of the hero.
 * A soft light pool follows the pointer while hovering (CSS vars --gx/--gy).
 */
export default function InfoCard({ title, body }) {
  const ref = useRef(null);

  function onPointerMove(e) {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
  }

  function onPointerLeave() {
    ref.current?.style.removeProperty('--gx');
    ref.current?.style.removeProperty('--gy');
  }

  return (
    <aside ref={ref} className="info-card" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <span className="info-card__glow" aria-hidden="true" />
      <p className="info-card__title">
        {title.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <div className="info-card__rule" aria-hidden="true" />
      <p className="info-card__body">{body}</p>
    </aside>
  );
}
