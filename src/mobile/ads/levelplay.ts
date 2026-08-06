import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Unity LevelPlay (ex-ironSource) mediation bridge.
 *
 * The native implementation lives in
 * `android/app/src/main/java/com/geologon/cuiz/LevelPlayPlugin.java`.
 * Every method here is a safe no-op on the web build.
 */
export const LEVELPLAY_APP_KEY = 'cae8dcab-c6a2-4fa1-a3f0-4ebb5ab2b644';
export const LEVELPLAY_PLACEMENTS = {
  banner: 'Banner_Android',
  interstitial: 'Interstitial_Android',
  rewarded: 'Rewarded_Android',
} as const;

export interface LevelPlayPluginDefinition {
  initialize(options: { appKey: string; testMode?: boolean }): Promise<{ initialized: boolean }>;
  showBanner(options: { placement: string }): Promise<void>;
  hideBanner(): Promise<void>;
  loadInterstitial(): Promise<void>;
  showInterstitial(options: { placement: string }): Promise<{ shown: boolean }>;
  loadRewarded(): Promise<void>;
  showRewarded(options: { placement: string }): Promise<{ shown: boolean; rewarded: boolean }>;
  setConsent(options: { consent: boolean; doNotSell?: boolean; childDirected?: boolean }): Promise<void>;
}

const Native = registerPlugin<LevelPlayPluginDefinition>('LevelPlay');

export const isNativeAds = () => Capacitor.isNativePlatform();

let initPromise: Promise<boolean> | null = null;

/** Initialise the SDK once per app session. Resolves false on web/failure. */
export function initLevelPlay(): Promise<boolean> {
  if (!isNativeAds()) return Promise.resolve(false);
  if (!initPromise) {
    initPromise = Native.initialize({ appKey: LEVELPLAY_APP_KEY, testMode: import.meta.env.DEV })
      .then((r) => !!r?.initialized)
      .catch((e) => {
        console.warn('[LevelPlay] init failed', e);
        return false;
      });
  }
  return initPromise;
}

export async function showLevelPlayBanner() {
  if (!(await initLevelPlay())) return;
  try {
    await Native.showBanner({ placement: LEVELPLAY_PLACEMENTS.banner });
  } catch (e) {
    console.warn('[LevelPlay] banner failed', e);
  }
}

export async function hideLevelPlayBanner() {
  if (!isNativeAds()) return;
  try {
    await Native.hideBanner();
  } catch {
    /* noop */
  }
}

/** Warm up an interstitial so the next show has no gap. */
export async function preloadLevelPlayInterstitial() {
  if (!(await initLevelPlay())) return;
  try {
    await Native.loadInterstitial();
  } catch {
    /* noop */
  }
}

/** Returns true when a native interstitial was actually displayed. */
export async function showLevelPlayInterstitial(): Promise<boolean> {
  if (!(await initLevelPlay())) return false;
  try {
    const res = await Native.showInterstitial({ placement: LEVELPLAY_PLACEMENTS.interstitial });
    // Queue the next one immediately.
    Native.loadInterstitial().catch(() => {});
    return !!res?.shown;
  } catch (e) {
    console.warn('[LevelPlay] interstitial failed', e);
    return false;
  }
}

export async function preloadLevelPlayRewarded() {
  if (!(await initLevelPlay())) return;
  try {
    await Native.loadRewarded();
  } catch {
    /* noop */
  }
}

/**
 * Shows a rewarded ad. `shown` tells you whether the native ad appeared
 * (so the caller can fall back to the web video), `rewarded` tells you
 * whether the SDK fired its reward callback — only then grant gems.
 */
export async function showLevelPlayRewarded(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!(await initLevelPlay())) return { shown: false, rewarded: false };
  try {
    const res = await Native.showRewarded({ placement: LEVELPLAY_PLACEMENTS.rewarded });
    Native.loadRewarded().catch(() => {});
    return { shown: !!res?.shown, rewarded: !!res?.rewarded };
  } catch (e) {
    console.warn('[LevelPlay] rewarded failed', e);
    return { shown: false, rewarded: false };
  }
}

export async function setLevelPlayConsent(consent: boolean) {
  if (!isNativeAds()) return;
  try {
    await Native.setConsent({ consent, doNotSell: !consent, childDirected: false });
  } catch {
    /* noop */
  }
}

export default Native;