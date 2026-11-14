import { useSyncExternalStore } from 'react';

/**
 * Tells the opening skeleton when Beranda has drawn its content, so the skeleton can stay on top until then
 * instead of dropping to a blank frame (tab bar only) between the skeleton and the real screen.
 */
let ready = false;
const subscribers = new Set<() => void>();
const emit = () => subscribers.forEach(fn => fn());

export function markHomeReady() {
  if (!ready) { ready = true; emit(); }
}
export function resetHomeReady() {
  if (ready) { ready = false; emit(); }
}
export function useHomeReady() {
  return useSyncExternalStore(cb => { subscribers.add(cb); return () => { subscribers.delete(cb); }; }, () => ready, () => ready);
}
