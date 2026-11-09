import { useRef } from 'react';
import StorySection from '../components/story/StorySection.jsx';
import { StoryProvider } from '../story/StoryContext.jsx';
import { useScrollStory } from '../story/useScrollStory.js';
import { ROUTE_TABLE } from './routeTable.js';
import { CATEGORY_PAGES } from './categoryPages.js';
import { usePageReady } from './usePageReady.js';
import ChapterHeader from '../components/page/ChapterHeader.jsx';
import PortalLink from '../components/page/PortalLink.jsx';
import './pages.css';

const routeOf = (id) => ROUTE_TABLE.find((r) => r.id === id);

/**
 * Shared shell for the deep pages and the 404: the page's own scroll story
 * drives the same persistent 3D scene the home page uses.
 */
export default function CategoryPage({ rig, routeId }) {
  const page = CATEGORY_PAGES[routeId] ?? CATEGORY_PAGES['not-found'];
  const mainRef = useRef(null);
  useScrollStory(rig, mainRef, page.story);
  usePageReady(rig);
  const next = page.next ? routeOf(page.next) : null;
  const ids = new Set(page.story.map((s) => s.id));

  return (
    <StoryProvider story={page.story}>
      <main ref={mainRef} className={`page page--deep page--${routeId}`} data-side={page.side}>
        <StorySection id="cover" label={page.title.join(' ')}>
          <ChapterHeader index={page.index} eyebrow={page.eyebrow} title={page.title} lead={page.lead} tags={page.tags} />
          {routeId === 'not-found' && (
            <div className="deep__actions">
              <PortalLink href="/" label="Back to NEXT GEN" />
            </div>
          )}
        </StorySection>

        {ids.has('chapters') && (
          <StorySection id="chapters" label="Chapters">
            <div className="deep__chapters">
              <p className="story-eyebrow" data-reveal>
                Chapters on this page
              </p>
              <ol className="chapter-index">
                {page.chapters.map((c, i) => (
                  <li key={c.title} className="chapter-index__row" data-reveal>
                    <span className="chapter-index__num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="chapter-index__title">{c.title}</span>
                    <span className="chapter-index__body">{c.body}</span>
                    <span className="chapter-index__status">In production</span>
                  </li>
                ))}
              </ol>
            </div>
          </StorySection>
        )}

        {ids.has('next') && (
          <StorySection id="next" anchor="contact" label="Next">
            <div className="deep__next">
              {next && <PortalLink href={next.path} kicker="Next world" label={next.label} large />}
              <div className="deep__actions" data-reveal>
                <PortalLink href="/" label="Back to home" ghost />
                <PortalLink href="/#contact" label="Get in touch" ghost />
              </div>
            </div>
          </StorySection>
        )}
      </main>
    </StoryProvider>
  );
}
