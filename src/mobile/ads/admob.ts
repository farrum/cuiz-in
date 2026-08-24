import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  AdMob,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';

export const isMobileAdsEnabled = Capacitor.isNativePlatform();

const ANDROID_AD_UNITS = {
  banner: 'ca-app-pub-8770216472380779/2955064989',
  interstitial: 'ca-app-pub-8770216472380779/9160136563',
  rewarded: 'ca-app-pub-8770216472380779/2888986296',
} as const;

let initPromise: Promise<boolean> | null = null;
let interstitialReady = false;
let rewardedReady = false;
let bannerState: 'hidden' | 'loading' | 'shown' = 'hidden';
let requestedBannerMargin = 0;
let fullScreenDepth = 0;

function setBannerHeight(height: number) {
  document.documentElement.style.setProperty('--banner-h', `${Math.max(0, Math.round(height))}px`);
  window.dispatchEvent(new CustomEvent('mobile-banner-state', { detail: { shown: height > 0 } }));
}

async function removeHandles(handles: Array<PluginListenerHandle | undefined>) {
  await Promise.all(handles.map((handle) => handle?.remove().catch(() => undefined)));
}

export function isAdMobBannerShown() {
  return bannerState === 'shown';
}

export async function initAdMob(): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await AdMob.initialize();
      console.info('[AdMob] SDK initialized');
      return true;
    } catch (error) {
      console.warn('[AdMob] initialization failed:', error);
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

export async function showAdMobBanner(margin = 0): Promise<boolean> {
  requestedBannerMargin = margin;
  if (!isMobileAdsEnabled || fullScreenDepth > 0) return false;
  if (bannerState === 'shown' || bannerState === 'loading') return bannerState === 'shown';
  if (!(await initAdMob())) return false;

  bannerState = 'loading';
  setBannerHeight(0);
  let loadedHandle: PluginListenerHandle | undefined;
  let failedHandle: PluginListenerHandle | undefined;
  let sizeHandle: PluginListenerHandle | undefined;

  return new Promise<boolean>(async (resolve) => {
    let settled = false;
    const finish = async (shown: boolean, height = 50) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      await removeHandles([loadedHandle, failedHandle, sizeHandle]);
      bannerState = shown ? 'shown' : 'hidden';
      setBannerHeight(shown ? height : 0);
      if (!shown) await AdMob.removeBanner().catch(() => undefined);
      resolve(shown);
    };
    const timer = window.setTimeout(() => void finish(false), 12_000);

    try {
      loadedHandle = await AdMob.addListener(BannerAdPluginEvents.Loaded, () => void finish(true));
      failedHandle = await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
        console.warn('[AdMob] banner failed to load:', error);
        void finish(false);
      });
      sizeHandle = await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
        if (bannerState === 'shown' && size.height > 0) setBannerHeight(size.height);
      });
      await AdMob.showBanner({
        adId: ANDROID_AD_UNITS.banner,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin,
      });
    } catch (error) {
      console.warn('[AdMob] banner request failed:', error);
      void finish(false);
    }
  });
}

export async function hideAdMobBanner(): Promise<void> {
  bannerState = 'hidden';
  setBannerHeight(0);
  if (!isMobileAdsEnabled) return;
  await AdMob.removeBanner().catch((error) => console.warn('[AdMob] banner cleanup failed:', error));
}

async function enterFullScreenAd() {
  fullScreenDepth += 1;
  if (bannerState !== 'hidden') await hideAdMobBanner();
  window.dispatchEvent(new CustomEvent('cuizin_ad_open'));
}

async function leaveFullScreenAd() {
  fullScreenDepth = Math.max(0, fullScreenDepth - 1);
  window.dispatchEvent(new CustomEvent('cuizin_ad_close'));
  if (fullScreenDepth === 0) await showAdMobBanner(requestedBannerMargin);
}

export async function preloadAdMobInterstitial(): Promise<boolean> {
  if (!isMobileAdsEnabled || !(await initAdMob())) return false;
  try {
    await AdMob.prepareInterstitial({ adId: ANDROID_AD_UNITS.interstitial });
    interstitialReady = true;
    return true;
  } catch (error) {
    interstitialReady = false;
    console.warn('[AdMob] interstitial preload failed:', error);
    return false;
  }
}

export async function showAdMobInterstitial(): Promise<boolean> {
  if (!isMobileAdsEnabled || (!(interstitialReady || await preloadAdMobInterstitial()))) return false;
  interstitialReady = false;
  await enterFullScreenAd();
  let dismissedHandle: PluginListenerHandle | undefined;
  let failedHandle: PluginListenerHandle | undefined;

  try {
    const completed = await new Promise<boolean>(async (resolve) => {
      let settled = false;
      const finish = async (shown: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        await removeHandles([dismissedHandle, failedHandle]);
        resolve(shown);
      };
      const timer = window.setTimeout(() => void finish(false), 90_000);
      dismissedHandle = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => void finish(true));
      failedHandle = await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => void finish(false));
      try {
        await AdMob.showInterstitial();
      } catch (error) {
        console.warn('[AdMob] interstitial show failed:', error);
        void finish(false);
      }
    });
    return completed;
  } finally {
    await leaveFullScreenAd();
    void preloadAdMobInterstitial();
  }
}

export async function preloadAdMobRewarded(): Promise<boolean> {
  if (!isMobileAdsEnabled || !(await initAdMob())) return false;
  try {
    await AdMob.prepareRewardVideoAd({ adId: ANDROID_AD_UNITS.rewarded });
    rewardedReady = true;
    return true;
  } catch (error) {
    rewardedReady = false;
    console.warn('[AdMob] rewarded preload failed:', error);
    return false;
  }
}

export async function showAdMobRewarded(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!isMobileAdsEnabled || (!(rewardedReady || await preloadAdMobRewarded()))) {
    return { shown: false, rewarded: false };
  }
  rewardedReady = false;
  await enterFullScreenAd();
  try {
    const reward = await AdMob.showRewardVideoAd();
    return { shown: true, rewarded: Boolean(reward) };
  } catch (error) {
    console.warn('[AdMob] rewarded show failed:', error);
    return { shown: false, rewarded: false };
  } finally {
    await leaveFullScreenAd();
    void preloadAdMobRewarded();
  }
}

/** Compatibility entrypoint retained for existing full-screen ad callers. */
export async function showAdWithFallback(type: 'interstitial' | 'rewarded'): Promise<boolean> {
  if (type === 'rewarded') {
    const result = await showAdMobRewarded();
    return result.shown && result.rewarded;
  }
  return showAdMobInterstitial();
}