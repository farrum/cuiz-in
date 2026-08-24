import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, AdMobBannerSize } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { audioManager } from '@/utils/audioManager';

const ADMOB_CONFIG = {
  androidBannerId: 'ca-app-pub-2831295465597549/6948956225',
  androidInterstitialId: 'ca-app-pub-2831295465597549/8851079305',
  androidRewardedId: 'ca-app-pub-2831295465597549/7154854253',
  androidRewardedInterstitialId: 'ca-app-pub-2831295465597549/7694056096',
};

export const isMobileAdsEnabled = true;

let isInitialized = false;
let bannerShown = false;
let initPromise: Promise<boolean> | null = null;

// Ensure we initialize AdMob natively
export async function initAdMob(): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true;

  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        initializeForTesting: false,
      });
      isInitialized = true;
      console.log('AdMob Initialized natively via Capacitor');

      // Add listener to resume music when ads close
      AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        console.log('Banner Loaded');
      });

      return true;
    } catch (e) {
      console.error('AdMob Init Error:', e);
      return false;
    }
  })();

  return initPromise;
}

// ─── Banner Ad Handlers ───────────────────────────────────────────────────────

export async function showAdMobBanner(customMargin?: number, onFailed?: () => void): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) {
    bannerShown = true;
    return true; // Mock for web
  }

  await initAdMob();

  if (bannerShown) return true; // Don't show again if already shown

  try {
    const options = {
      adId: ADMOB_CONFIG.androidBannerId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false
    };

    await AdMob.showBanner(options);
    bannerShown = true;
    return true;
  } catch (err) {
    console.warn('AdMob showBanner error:', err);
    if (onFailed) onFailed();
    return false;
  }
}

export async function hideAdMobBanner(keepLayoutSpacer = false): Promise<void> {
  if (!isMobileAdsEnabled || !bannerShown) return;
  bannerShown = false;

  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.hideBanner();
  } catch (err) {
    console.warn('AdMob hideBanner error:', err);
  }
}

export function isAdMobBannerShown(): boolean {
  return bannerShown;
}

// ─── Full-Screen Ad Handlers ──────────────────────────────────────────────────

export async function preloadAdMobInterstitial(): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  await initAdMob();

  try {
    await AdMob.prepareInterstitial({
      adId: ADMOB_CONFIG.androidInterstitialId,
      isTesting: false,
    });
  } catch (e) {
    console.warn('AdMob prepareInterstitial error:', e);
  }
}

export async function showAdMobInterstitial(): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true;

  await initAdMob();
  audioManager.pauseBGM();

  return new Promise(async (resolve) => {
    try {
      await AdMob.showInterstitial();
      resolve(true);
    } catch (e) {
      console.warn('AdMob showInterstitial error:', e);
      resolve(false);
    } finally {
      audioManager.startBGM();
    }
  });
}

export async function preloadAdMobRewarded(): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  await initAdMob();

  try {
    await AdMob.prepareRewardVideoAd({
      adId: ADMOB_CONFIG.androidRewardedId,
      isTesting: false,
    });
  } catch (e) {
    console.warn('AdMob prepareRewardVideoAd error:', e);
  }
}

export async function showAdMobRewarded(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!isMobileAdsEnabled) return { shown: false, rewarded: false };
  if (!Capacitor.isNativePlatform()) return { shown: true, rewarded: true };

  await initAdMob();
  audioManager.pauseBGM();

  return new Promise(async (resolve) => {
    let rewarded = false;

    try {
      const rewardItem = await AdMob.showRewardVideoAd();
      if (rewardItem && rewardItem.amount > 0) {
        rewarded = true;
      }
      resolve({ shown: true, rewarded });
    } catch (e) {
      console.warn('AdMob showRewardVideoAd error:', e);
      resolve({ shown: false, rewarded: false });
    } finally {
      audioManager.startBGM();
    }
  });
}

export async function showAdMobRewardedInterstitial(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!isMobileAdsEnabled) return { shown: false, rewarded: false };
  if (!Capacitor.isNativePlatform()) return { shown: true, rewarded: true };

  await initAdMob();
  audioManager.pauseBGM();

  return new Promise(async (resolve) => {
    let rewarded = false;

    try {
      await AdMob.prepareRewardVideoAd({
        adId: ADMOB_CONFIG.androidRewardedInterstitialId,
        isTesting: false,
      });
      const rewardItem = await AdMob.showRewardVideoAd();
      if (rewardItem && rewardItem.amount > 0) {
        rewarded = true;
      }
      resolve({ shown: true, rewarded });
    } catch (e) {
      console.warn('AdMob showRewardVideoAd error:', e);
      resolve({ shown: false, rewarded: false });
    } finally {
      audioManager.startBGM();
    }
  });
}

export async function showAdWithFallback(
  prefer: 'interstitial' | 'rewarded' = 'interstitial',
): Promise<boolean> {
  if (prefer === 'rewarded') {
    const res = await showAdMobRewarded();
    return res.shown;
  }
  return showAdMobInterstitial();
}
