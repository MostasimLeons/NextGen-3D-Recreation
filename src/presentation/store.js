import { useSyncExternalStore } from 'react';

/**
 * Open/closed state of the cinematic presentation, shared between the hero
 * card that starts it and the lazily loaded player. `opener` is the element
 * that opened it, so focus can return there on close.
 */
let state = { open: false, opener: null };
const subs = new Set();
const emit = () => subs.forEach((fn) => fn());

export function openPresentation(opener = document.activeElement) {
  if (state.open) return;
  state = { open: true, opener };
  emit();
}

export function closePresentation() {
  if (!state.open) return;
  const { opener } = state;
  state = { open: false, opener: null };
  emit();
  if (opener instanceof HTMLElement) requestAnimationFrame(() => opener.focus({ preventScroll: true }));
}

export function usePresentation() {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => state,
  );
}
