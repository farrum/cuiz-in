/**
 * LevelPlay & Unity Ads Adapter (formerly admob.ts).
 * Re-exports from adManager.ts for seamless backwards-compatibility across the app.
 */
export {
  initAdManager as initAdMob,
  showBanner as showAdMobBanner,
  hideBanner as hideAdMobBanner,
  refreshBanner as refreshAdMobBanner,
  suspendBanner as suspendAdMobBanner,
  resumeBanner as resumeAdMobBanner,
  isBannerShown as isAdMobBannerShown,
  preloadInterstitial as preloadAdMobInterstitial,
  showInterstitial as showAdMobInterstitial,
  preloadRewarded as preloadAdMobRewarded,
  showRewarded as showAdMobRewarded,
  showRewarded as showAdMobRewardedInterstitial,
  isFullScreenAdActive,
  listenForBannerState,
  getAdDiagnostics,
  LEVELPLAY_CONFIG,
  UNITY_CONFIG,
  isMobileAdsEnabled,
  type AdDiagnostics,
  type NativeAdsPlugin as CustomAdMobPlugin,
} from './adManager';

import { showInterstitial, showRewarded } from './adManager';

export async function showAdWithFallback(
  prefer: 'interstitial' | 'rewarded' = 'interstitial',
): Promise<boolean> {
  if (prefer === 'rewarded') {
    const res = await showRewarded();
    return res.shown;
  }
  return showInterstitial();
}