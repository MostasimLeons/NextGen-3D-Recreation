import { Suspense, useState } from 'react';
import StorySection from './StorySection.jsx';
import { PreviewTile, ProjectsStage } from '../../showcase/lazy.js';
import { content } from '../../content.js';
import './ProjectsSection.css';

const copy = content.story.projects;

/**
 * Interactive category showcase (≈ oryzo "choose your own", but clickable):
 * Game Development / 3D Art & VR / Creative Design. Each swaps a large
 * drag-to-rotate real-time stage and three live preview tiles. The 3D parts
 * (R3F + drei) load lazily.
 */
export default function ProjectsSection() {
  const [activeId, setActiveId] = useState(copy.categories[0].id);
  const active = copy.categories.find((c) => c.id === activeId);

  return (
    <StorySection id="projects" anchor="projects" label="Explore our work">
      <div className="explore">
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
