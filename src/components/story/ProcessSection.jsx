import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import StorySection from './StorySection.jsx';
import { PreviewTile, TechStage } from '../../showcase/lazy.js';
import { techProgress, TECH_CHAPTER_EVENT } from '../../story/techChapter.js';
import { content } from '../../content.js';
import './ProcessSection.css';

const copy = content.story.process;
const chapters = copy.chapters;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Giant tech name: outline layer + orange fill layer swept by scroll. */
function TechWord({ text, wordRef }) {
  const letters = [...text].map((ch, i) => (
    <span key={i} className="tech-word__char" data-char>
      {ch === ' ' ? ' ' : ch}
    </span>
  ));
  return (
    <h3 className="tech-word" ref={wordRef} aria-label={text}>
      <span className="tech-word__outline" aria-hidden="true">
        {letters}
      </span>
      <span className="tech-word__fill" aria-hidden="true">
        {text}
      </span>
    </h3>
  );
}

/**
 * "Runs on the edge of play" — six scroll chapters, one per technology.
 * A full-bleed 3D stage swaps scenes with cinematic cuts; the tech name
 * fills the screen as giant type (letters stagger in, an orange fill sweeps
 * through it as you scroll); a live preview, progress rail and a kinetic
 * principle caption complete each chapter. Scroll is read by useScrollStory
 * (single ScrollTrigger) and reaches here via techChapter.js.
 */
export default function ProcessSection() {
  const [index, setIndex] = useState(0);
  const chapter = chapters[index];
  const principle = copy.cards[index % copy.cards.length];
  const wordRef = useRef(null);
  const metaRef = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    const onChapter = (e) => setIndex(e.detail.index);
    window.addEventListener(TECH_CHAPTER_EVENT, onChapter);
    return () => window.removeEventListener(TECH_CHAPTER_EVENT, onChapter);
  }, []);

  // Typography cut on every chapter change.
  useLayoutEffect(() => {
    if (first.current || reducedMotion()) {
      first.current = false;
      return undefined;
    }
    const chars = wordRef.current?.querySelectorAll('[data-char]') ?? [];
    const meta = metaRef.current?.children ?? [];
    const tl = gsap.timeline();
    tl.fromTo(
      chars,
      { yPercent: 115, rotate: 8, opacity: 0 },
      { yPercent: 0, rotate: 0, opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.03 },
      0.15,
    ).fromTo(meta, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'power3.out' }, 0.3);
    return () => tl.kill();
  }, [index]);

  return (
    <StorySection id="process" label="Runs on the edge of play — technologies">
      <div className="tech">
        {/* Full-bleed 3D stage (shared lazy R3F canvas) */}
        <div className="tech-stage">
          <Suspense fallback={null}>
            <TechStage chapter={chapter.id} progress={techProgress} />
          </Suspense>
        </div>

        <div className="process__head tech__head">
          <p className="story-eyebrow" data-reveal>
            {copy.eyebrow}
          </p>
          <h2 className="process__title" data-reveal>
            {copy.title}
          </h2>
        </div>

        {/* Progress rail: one mark per technology */}
        <ol className="tech-rail" aria-label="Technologies">
          {chapters.map((c, i) => (
            <li key={c.id} className={i === index ? 'is-active' : i < index ? 'is-done' : ''}>
              <span className="tech-rail__index">0{i + 1}</span>
              <span className="tech-rail__name">{c.name}</span>
            </li>
          ))}
        </ol>

        <div className="tech-copy">
          <div className="tech-copy__meta" ref={metaRef} key={`m-${chapter.id}`}>
            <span className="tech-copy__index">
              0{index + 1} <em>/ 0{chapters.length}</em>
            </span>
            <span className="tech-copy__role">{chapter.role}</span>
            <p className="tech-copy__line">{chapter.line}</p>
          </div>
          <TechWord text={chapter.name} wordRef={wordRef} key={`w-${chapter.id}`} />
        </div>

        <div className="tech-preview">
          <Suspense fallback={null}>
            <PreviewTile
              key={chapter.id}
              sceneId={chapter.preview.id}
              label={chapter.preview.label}
              meta={chapter.preview.meta}
              camera={{ position: [0, 0.7, 6.4], fov: 34 }}
            />
          </Suspense>
        </div>

        {/* The four principles, kept as a kinetic caption instead of cards */}
        <p className="tech-caption" key={`c-${index}`}>
          <span className="tech-caption__kicker">{principle.kicker}</span>
          <span className="tech-caption__title">{principle.title}</span>
          <span className="tech-caption__body">{principle.body}</span>
        </p>
      </div>
    </StorySection>
  );
}
