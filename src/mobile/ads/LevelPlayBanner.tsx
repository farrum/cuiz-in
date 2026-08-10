import { useEffect } from 'react';
import { hideLevelPlayBanner, showLevelPlayBanner } from './levelplay';

/**
 * Native LevelPlay banner. Renders an empty spacer so the layout reserves
 * room for the natively-overlaid banner (the SDK draws outside the WebView),
 * which prevents the content from reflowing when the ad fills.
 */
interface LevelPlayBannerProps {
  noMargin?: boolean;
}

export function LevelPlayBanner({ noMargin = false }: LevelPlayBannerProps) {
  useEffect(() => {
    // show/hide are reference counted inside the wrapper, so overlapping
    // banner slots (shell + screen) do not cancel each other out.
    showLevelPlayBanner();
    return () => {
      hideLevelPlayBanner();
    };
  }, []);

  return <div aria-hidden className={`h-[50px] shrink-0 ${noMargin ? '' : 'mb-10'}`} />;
}

export default LevelPlayBanner;