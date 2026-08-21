import { Capacitor } from '@capacitor/core';

/**
 * Unity LevelPlay mediation bridge - DEACTIVATED / STUBBED.
 * Removed completely from mobile native builds.
 */
export const LEVELPLAY_APP_KEY = '';
export const LEVELPLAY_PLACEMENTS = {
  banner: '',
  interstitial: '',
  rewarded: '',
} as const;

export const LEVELPLAY_AD_UNITS = {
  banner: '',
  interstitial: '',
  rewarded: '',
} as const;

export const isNativeAds = () => Capacitor.isNativePlatform();

export function initLevelPlay(): Promise<boolean> {
  return Promise.resolve(false);
}

export async function showLevelPlayBanner() {}
export async function hideLevelPlayBanner(keepLayoutSpacer = false) {}
export function isLevelPlayBannerShown(): boolean {
  return false;
}

export async function preloadLevelPlayInterstitial() {}
export async function showLevelPlayInterstitial(): Promise<boolean> {
  return false;
}

export async function preloadLevelPlayRewarded() {}
export async function showLevelPlayRewarded(): Promise<{ shown: boolean; rewarded: boolean }> {
  return { shown: false, rewarded: false };
}

export async function setLevelPlayConsent(consent: boolean) {}

export async function showLevelPlayVideoAd(
  prefer: 'rewarded' | 'interstitial' = 'interstitial',
): Promise<boolean> {
  return false;
}

export default null;