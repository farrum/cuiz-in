/**
 * App version / platform stamp.
 *
 * Every Supabase request carries these as headers so the database can tell
 * which build produced a given write. Old cached bundles cannot send them, so
 * a missing `x-app-version` means "pre-fix client".
 */
import { Capacitor } from '@capacitor/core';

// Baked in at build time (see vite.config.ts `define`). Falls back for dev.
declare const __APP_BUILD_ID__: string | undefined;

export const APP_BUILD_ID: string =
  typeof __APP_BUILD_ID__ !== 'undefined' && __APP_BUILD_ID__ ? __APP_BUILD_ID__ : 'dev';

let nativeVersion: string | null = null;

export const getAppPlatform = (): string => {
  try {
    return Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web';
  } catch {
    return 'web';
  }
};

export const getAppVersion = (): string =>
  nativeVersion ? `${nativeVersion}+${APP_BUILD_ID}` : APP_BUILD_ID;

/** Native builds also report their store version (e.g. "1.7"). Safe to fail. */
export const hydrateNativeAppVersion = async (): Promise<void> => {
  try {
    if (!Capacitor.isNativePlatform()) return;
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    if (info?.version) nativeVersion = info.version;
  } catch {
    /* noop */
  }
};

export const appVersionHeaders = (): Record<string, string> => ({
  'x-app-version': getAppVersion(),
  'x-app-platform': getAppPlatform(),
});
