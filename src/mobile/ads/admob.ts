import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  type BannerAdOptions,
} from '@capacitor-community/admob';
import { audioManager } from '@/utils/audioManager';
import {
  showLevelPlayInterstitial,
  showLevelPlayRewarded,
  showLevelPlayRewardedInterstitial,
  preloadLevelPlayInterstitial,
  preloadLevelPlayRewarded,
  showLevelPlayBanner,
  hideLevelPlayBanner,
  isLevelPlayBannerShown,
  initLevelPlay
} from './levelplay';

export {
  showLevelPlayInterstitial,
  showLevelPlayRewarded,
  showLevelPlayRewardedInterstitial,
  preloadLevelPlayInterstitial,
  preloadLevelPlayRewarded,
  showLevelPlayBanner,
  hideLevelPlayBanner,
  isLevelPlayBannerShown,
  initLevelPlay
};

export const isMobileAdsEnabled = true;

// ─── Banner (LevelPlay) ───────────────────────────────────────────────────────
export async function showAdMobBanner(customMargin?: number, onFailed?: () => void): Promise<boolean> {
  return showLevelPlayBanner(customMargin, onFailed);
}

export async function hideAdMobBanner(keepLayoutSpacer = false): Promise<void> {
  return hideLevelPlayBanner();
}

export function isAdMobBannerShown(): boolean {
  return isLevelPlayBannerShown();
}

// ─── Interstitial (LevelPlay) ────────────────────────────────────────────────
export async function preloadAdMobInterstitial(): Promise<void> {
  return preloadLevelPlayInterstitial();
}

/** Shows an interstitial ad via LevelPlay. */
export async function showAdMobInterstitial(): Promise<boolean> {
  return showLevelPlayInterstitial();
}

// ─── Rewarded (LevelPlay) ────────────────────────────────────────────────────
export async function preloadAdMobRewarded(): Promise<void> {
  return preloadLevelPlayRewarded();
}

/** Shows a rewarded video ad via LevelPlay. */
export async function showAdMobRewarded(): Promise<{ shown: boolean; rewarded: boolean }> {
  return showLevelPlayRewarded();
}

// ─── Rewarded Interstitial (LevelPlay) ────────────────────────────────────────
export async function showAdMobRewardedInterstitial(): Promise<{ shown: boolean; rewarded: boolean }> {
  return showLevelPlayRewardedInterstitial();
}

/**
 * Unified ad entry point for legacy native video/fullscreen slot callers.
 */
export async function showAdWithFallback(
  prefer: 'interstitial' | 'rewarded' = 'interstitial',
): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return false;

  if (prefer === 'rewarded') {
    const admobR = await withTimeout(
      showAdMobRewarded(),
      10000,
      { shown: false, rewarded: false }
    );
    return admobR.shown;
  }

  const admobI = await withTimeout(
    showAdMobInterstitial(),
    10000,
    false
  );
  return admobI;
}
