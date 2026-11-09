import { Suspense, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import StorySection from './StorySection.jsx';
import { PreviewTile, ProjectsStage } from '../../showcase/lazy.js';
import { THEMES } from '../../showcase/themes.js';
import { content } from '../../content.js';
import './ProjectsSection.css';

const copy = content.story.projects;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Splits text into per-letter spans (words kept together) for staggering. */
function SplitTitle({ text }) {
  return text.split(' ').map((word, wi) => (
    <span key={wi} className="split-word">
      {[...word].map((ch, ci) => (
        <span key={ci} className="split-char" data-char>
          {ch}
        </span>
      ))}
    </span>
  ));
}

/**
 * Interactive 3D creative showcase (≈ oryzo "choose your own", but
 * clickable): Game Development / 3D Art & VR / Creative Design.
 *
 * Each category has its own identity (themes.js): panel colours, light,
 * fog, camera and particles. Switching plays a GSAP sequence — panel
 * colours tween, an orange wipe crosses the stage, the title letters
 * stagger in — while the 3D stage runs its own exit → camera push → enter.
 * The 3D parts (R3F + drei) load lazily.
 */
export default function ProjectsSection() {
  const [activeId, setActiveId] = useState(copy.categories[0].id);
  const active = copy.categories.find((c) => c.id === activeId);
  const theme = THEMES[activeId];
  const rootRef = useRef(null);
  const titleRef = useRef(null);
  const tagsRef = useRef(null);
  const wipeRef = useRef(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const reduce = reducedMotion();
    const vars = { '--accent': theme.accent, '--panel-a': theme.panelA, '--panel-b': theme.panelB };
    if (first.current || reduce) {
      gsap.set(root, vars);
      first.current = false;
      return undefined;
    }
    const chars = titleRef.current?.querySelectorAll('[data-char]') ?? [];
    const tags = tagsRef.current?.children ?? [];
    const tl = gsap.timeline();
    tl.to(root, { ...vars, duration: 0.9, ease: 'power2.inOut' }, 0)
      .fromTo(
        wipeRef.current,
        { scaleX: 0, transformOrigin: '0% 50%', opacity: 1 },
        { scaleX: 1, duration: 0.42, ease: 'power3.in' },
        0,
      )
      .to(wipeRef.current, { transformOrigin: '100% 50%', scaleX: 0, duration: 0.55, ease: 'power3.out' }, 0.42)
      .fromTo(
        chars,
        { yPercent: 110, opacity: 0, rotate: 6 },
        { yPercent: 0, opacity: 1, rotate: 0, duration: 0.8, ease: 'power3.out', stagger: 0.022 },
        0.38,
      )
      .fromTo(tags, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05 }, 0.6);
    return () => tl.kill();
  }, [activeId, theme]);

  return (
    <StorySection id="projects" anchor="projects" label="Explore our work">
      <div className="explore" ref={rootRef} data-theme={activeId}>
        <div className="explore__intro">
          <p className="story-eyebrow" data-reveal>
            {copy.eyebrow}
          </p>
          <div className="explore__tabs" role="group" aria-label="Categories" data-reveal>
            {copy.categories.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={`explore__tab${c.id === activeId ? ' is-active' : ''}`}
                aria-pressed={c.id === activeId}
                onClick={() => setActiveId(c.id)}
              >
                <span className="explore__tab-index">0{i + 1}</span>
                <span className="explore__tab-name">{c.name}</span>
              </button>
            ))}
          </div>
          <p className="explore__body" key={active.id}>
            {active.body}
          </p>
          <p className="explore__note" data-reveal>
            {copy.note}
          </p>
        </div>

        {/* 3D views ignore DOM opacity, so the stage/previews are not reveal-animated */}
        <div className="explore__stage">
          <Suspense fallback={null}>
            <ProjectsStage activeId={activeId} />
          </Suspense>

          {/* Cinematic overlay: index, theme, staggered title, tags */}
          <div className="explore__overlay" aria-live="polite">
            <div className="explore__meta">
              <span className="explore__index">{theme.index}</span>
              <span className="explore__theme">{theme.label}</span>
            </div>
            <h3 className="explore__title" ref={titleRef} key={`t-${active.id}`}>
              <SplitTitle text={active.name} />
            </h3>
            <ul className="explore__tags" ref={tagsRef} key={`g-${active.id}`}>
              {active.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <span className="explore__wipe" ref={wipeRef} aria-hidden="true" />

          <div className="explore__stage-hud">
            <span>{active.stage}</span>
            <span>{copy.hint}</span>
          </div>
        </div>

        <div className="explore__previews">
          <Suspense fallback={null}>
            {active.previews.map((p) => (
              <PreviewTile
                key={`${active.id}-${p.id}`}
                sceneId={p.id}
                label={p.label}
                meta={p.meta}
                camera={{ position: [0, 0.6, 6.5], fov: 34 }}
              />
            ))}
          </Suspense>
        </div>
      </div>
    </StorySection>
  );
}
