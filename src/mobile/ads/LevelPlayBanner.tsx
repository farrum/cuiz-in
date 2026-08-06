import { useEffect } from 'react';
import { hideLevelPlayBanner, showLevelPlayBanner } from './levelplay';

/**
 * Native LevelPlay banner. Renders an empty spacer so the layout reserves
 * room for the natively-overlaid banner (the SDK draws outside the WebView),
 * which prevents the content from reflowing when the ad fills.
 */
export function LevelPlayBanner() {
  useEffect(() => {
    let cancelled = false;
    showLevelPlayBanner().then(() => {
      if (cancelled) hideLevelPlayBanner();
    });
    return () => {
      cancelled = true;
      hideLevelPlayBanner();
    };
  }, []);

  return <div aria-hidden className="h-[50px] shrink-0" />;
}

export default LevelPlayBanner;