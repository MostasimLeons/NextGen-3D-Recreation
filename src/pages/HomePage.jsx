import { useRef } from 'react';
import Hero from '../components/Hero.jsx';
import Story from '../components/story/Story.jsx';
import { useScrollStory } from '../story/useScrollStory.js';
import { STORY } from '../story/storyConfig.js';
import { usePageReady } from './usePageReady.js';

/** The cinematic home page: mug hero + the full scroll story (unchanged). */
export default function HomePage({ rig }) {
  const mainRef = useRef(null);
  // GSAP/ScrollTrigger write straight to rig.state and the DOM — React does
  // not re-render on scroll.
  useScrollStory(rig, mainRef, STORY);
  usePageReady(rig);
  return (
    <main ref={mainRef} className="page">
      <Hero />
      <Story rig={rig} />
    </main>
  );
}
