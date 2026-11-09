import { createContext, useContext, useMemo } from 'react';
import { STORY } from './storyConfig.js';

/**
 * The active page's story config, so <StorySection> can size itself from
 * the same `length` values the scroll timeline uses. Defaults to the home
 * story, so existing home sections need no changes.
 */
const StoryContext = createContext(STORY);

export function StoryProvider({ story, children }) {
  return <StoryContext.Provider value={story}>{children}</StoryContext.Provider>;
}

/** { [sectionId]: length } for the active story. */
export function useStoryLengths() {
  const story = useContext(StoryContext);
  return useMemo(() => Object.fromEntries(story.map((s) => [s.id, s.length])), [story]);
}
