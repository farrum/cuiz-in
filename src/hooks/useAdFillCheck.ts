import { useEffect, useState } from 'react';

export type AdFillState = 'pending' | 'filled' | 'empty';

/**
 * Watches an ad container and reports whether the ad network actually
 * delivered a creative. Networks can answer a request with an empty document
 * (dead key, unapproved domain, no fill); without this check the slot keeps a
 * blank band on the page forever.
 */
export const useAdFillCheck = (
  containerId: string,
  enabled: boolean,
  refreshGeneration: number = 0,
  timeoutMs: number = 4000
): AdFillState => {
  const [state, setState] = useState<AdFillState>('pending');

  useEffect(() => {
    if (!enabled) {
      setState('pending');
      return;
    }

    setState('pending');

    const hasCreative = (): boolean => {
      const container = document.getElementById(containerId);
      if (!container) return false;

      // Anything the network painted directly into the container.
      if (container.querySelector('img, ins, a, canvas, video')) return true;

      const frames = Array.from(container.querySelectorAll('iframe'));
      if (frames.length === 0) return false;

      return frames.some((frame) => {
        if (frame.offsetHeight > 20 && frame.offsetWidth > 20) {
          try {
            const doc = frame.contentDocument;
            // Cross-origin creative: we cannot read it, so it is real content.
            if (!doc) return true;
            const body = doc.body;
            if (!body) return false;
            if (body.querySelector('iframe, img, ins, a, canvas, video')) return true;
            return body.scrollHeight > 20;
          } catch {
            // Cross-origin access error means a real creative loaded.
            return true;
          }
        }
        return false;
      });
    };

    let settled = false;
    const interval = window.setInterval(() => {
      if (hasCreative()) {
        settled = true;
        window.clearInterval(interval);
        window.clearTimeout(timer);
        setState('filled');
      }
    }, 400);

    const timer = window.setTimeout(() => {
      window.clearInterval(interval);
      if (!settled) setState(hasCreative() ? 'filled' : 'empty');
    }, timeoutMs);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [containerId, enabled, refreshGeneration, timeoutMs]);

  return state;
};
