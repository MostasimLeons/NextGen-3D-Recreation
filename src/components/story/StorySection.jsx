import { STORY } from '../../story/storyConfig.js';

const LENGTHS = Object.fromEntries(STORY.map((s) => [s.id, s.length]));

/**
 * A scroll-story section: `length` viewport heights tall, with its content
 * pinned (CSS sticky) for the whole length while the 3D scene animates.
 */
export default function StorySection({ id, anchor, label, className = '', children }) {
  const length = LENGTHS[id] ?? 1;
  return (
    <section
      id={anchor}
      data-story={id}
      className={`story-section story-section--${id} ${className}`}
      style={{ '--len': length }}
      aria-label={label}
    >
      <div className="story-section__pin">{children}</div>
    </section>
  );
}
