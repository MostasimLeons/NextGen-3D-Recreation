import HeroCanvas from './HeroCanvas.jsx';
import Header from './Header.jsx';
import SideTab from './SideTab.jsx';
import InfoCard from './InfoCard.jsx';
import VideoPreview from './VideoPreview.jsx';
import ScrollHint from './ScrollHint.jsx';
import { content } from '../content.js';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero" id="intro" aria-label={`${content.brand} intro`}>
      <HeroCanvas />
      <div className="hero__shade" aria-hidden="true" />

      <Header />
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
