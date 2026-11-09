import { useEffect, useState } from 'react';
import gsap from 'gsap';
import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const copy = content.story.interactive;

/**
 * "Interactive by default" (≈ oryzo's flip-encryption toy): type a message,
 * flip it — the text turns upside down and so does the 3D mug.
 */
export default function InteractiveSection({ rig }) {
  const [message, setMessage] = useState(copy.initial);
  const [flipped, setFlipped] = useState(false);

  function setFlip(next) {
    setFlipped(next);
    if (!rig) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // userFlip is never written by the scroll timeline, so no conflicts.
    gsap.to(rig.state, { userFlip: next ? 1 : 0, duration: reduced ? 0 : 1.1, ease: 'power3.inOut' });
  }

  // Leaving the section (either direction) flips everything back upright.
  useEffect(() => {
    if (!rig) return undefined;
    const el = document.querySelector('[data-story="interactive"]');
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setFlip(false);
    });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig]);

  return (
    <StorySection id="interactive" label="Interactive">
      <div className="interactive">
        <p className="story-eyebrow story-eyebrow--accent" data-reveal>
          {copy.eyebrow}
        </p>
        <h2 className="interactive__title" data-reveal>
          {copy.title.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
        <p className="interactive__body" data-reveal>
          {copy.body}
        </p>
        <div className="flip-toy" data-reveal>
          <label className="flip-toy__field">
            <span className="visually-hidden">{copy.placeholder}</span>
            <input
              type="text"
              value={message}
              maxLength={40}
              placeholder={copy.placeholder}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <p className={`flip-toy__output${flipped ? ' is-flipped' : ''}`} aria-live="polite">
            {message || copy.placeholder}
          </p>
          <button type="button" className="flip-toy__button" onClick={() => setFlip(!flipped)} aria-pressed={flipped}>
            <span className="flip-toy__dot" aria-hidden="true" />
            {flipped ? copy.unflip : copy.flip}
          </button>
        </div>
      </div>
    </StorySection>
  );
}
