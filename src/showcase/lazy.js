import { lazy } from 'react';

/** Lazily loaded R3F pieces — keeps three-fiber / drei out of the first chunk. */
export const PreviewTile = lazy(() => import('./PreviewTile.jsx'));
export const ProjectsStage = lazy(() => import('./ProjectsStage.jsx'));
export const TechStage = lazy(() => import('./TechStage.jsx'));
