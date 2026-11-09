import { useEffect } from 'react';
import { signalPageReady } from '../router/navigation.js';

/** Tell the router this page is mounted and its scroll story is wired. */
export function usePageReady(rig) {
  useEffect(() => {
    if (rig) signalPageReady();
  }, [rig]);
}
