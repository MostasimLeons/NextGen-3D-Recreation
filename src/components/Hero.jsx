import SideTab from './SideTab.jsx';
import InfoCard from './InfoCard.jsx';
import VideoPreview from './VideoPreview.jsx';
import ScrollHint from './ScrollHint.jsx';
import { content } from '../content.js';
import './Hero.css';

/**
 * Phase 2 hero overlay. The 3D desk scene itself lives in the fixed
 * SceneLayer behind the page; the header is fixed at app level.
 */
export default function Hero() {
  return (
    <section className="hero" id="intro" data-story="intro" aria-label={`${content.brand} intro`}>
      <div className="hero__shade" aria-hidden="true" />

      <SideTab label={content.sideTab} />

      <div className="hero__brand">
        <p className="hero__tagline">{content.tagline}</p>
        <h1 className="hero__wordmark">{content.brand}</h1>
      </div>

      <p className="hero__lead">{content.lead}</p>

      <InfoCard title={content.card.title} body={content.card.body} />
      <VideoPreview brand={content.brand} label={content.video.label} caption={content.video.caption} />
      <ScrollHint label={content.scrollHint} />
    </section>
  );
}
