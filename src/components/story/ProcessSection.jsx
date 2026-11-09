import { Fragment, Suspense } from 'react';
import StorySection from './StorySection.jsx';
import { PreviewTile } from '../../showcase/lazy.js';
import { content } from '../../content.js';

const copy = content.story.process;

/**
 * "Runs on the edge of play" (≈ oryzo social content): a pinned stage where a
 * horizontal track of principle cards and live 3D preview tiles scrolls left,
 * while a giant marquee of the tools we work with scrolls the other way.
 */
export default function ProcessSection() {
  const tilesAfter = (i) => copy.tiles.filter((t) => t.after === i);

  return (
    <StorySection id="process" label="How we work">
      <div className="process__head">
        <p className="story-eyebrow" data-reveal>
          {copy.eyebrow}
        </p>
        <h2 className="process__title" data-reveal>
          {copy.title}
        </h2>
      </div>

      {/* Tool names — names only, no logos */}
      <div className="tech-marquee" aria-label="Tools: Unity, Unreal Engine, Blender, Three.js, WebGL, VR">
        <div className="tech-marquee__row" data-marquee aria-hidden="true">
          {[...copy.tech, ...copy.tech].map((name, i) => (
            <span key={`${name}-${i}`} className={`tech-marquee__item${i % 2 ? ' is-outline' : ''}`}>
              {name}
              <span className="tech-marquee__sep">✦</span>
            </span>
          ))}
        </div>
      </div>

      <ol className="process__track" data-track>
        {copy.cards.map((c, i) => (
          <Fragment key={c.title}>
            {i === 0 &&
              tilesAfter(0).map((t) => (
                <li key={t.id} className="process__tile">
                  <Suspense fallback={null}>
                    <PreviewTile sceneId={t.id} label={t.label} meta={t.meta} camera={{ position: [0, 0.8, 6.4], fov: 34 }} />
                  </Suspense>
                </li>
              ))}
            <li className="process-card">
              <span className="process-card__kicker">
                <span className="process-card__index">0{i + 1}</span>
                {c.kicker}
              </span>
              <span className="process-card__title">{c.title}</span>
              <span className="process-card__body">{c.body}</span>
              <span className="process-card__meta">{c.meta}</span>
            </li>
            {tilesAfter(i + 1).map((t) => (
              <li key={t.id} className="process__tile">
                <Suspense fallback={null}>
                  <PreviewTile sceneId={t.id} label={t.label} meta={t.meta} camera={{ position: [0, 0.8, 6.4], fov: 34 }} />
                </Suspense>
              </li>
            ))}
          </Fragment>
        ))}
      </ol>
    </StorySection>
  );
}
