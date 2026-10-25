import { useLayoutEffect } from 'react';

/** A new wizard step / checkout starts at its heading, even after editing a long cart. */
export function usePrototypeScroll(step: string | number | boolean) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector('.p-scroll')?.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);
}

/** Keep the phone frame, sticky heading and action dock fixed while reviewing a long cart. */
export function scrollPrototypeTo(element: HTMLElement | null) {
  const scroller = element?.closest<HTMLElement>('.p-scroll');
  if (!element || !scroller) return;
  const heading = scroller.querySelector<HTMLElement>('.p-header');
  const offset = (heading?.getBoundingClientRect().height ?? 0) + 18;
  const top = scroller.scrollTop + element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - offset;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
}
