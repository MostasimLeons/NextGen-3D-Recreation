/**
 * Shared, mutable state for the "Runs on the edge of play" chapters.
 * Written by useScrollStory (one ScrollTrigger), read by the section:
 *   - techProgress.current: 0 → 1 within the active chapter (camera dolly)
 *   - 'tech-chapter' window event: fired only when the chapter index changes,
 *     so React re-renders six times per pass, not every frame.
 */
export const techProgress = { current: 0, index: 0 };
export const TECH_CHAPTER_EVENT = 'tech-chapter';
