/**
 * Initialize Capacitor native plugins. Safe to call in a web/browser
 * preview — every plugin call is guarded by Capacitor.isNativePlatform().
 */
export function initMobilePlatform() {
  (async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const { StatusBar, Style } = await import('@capacitor/status-bar');
      const { SplashScreen } = await import('@capacitor/splash-screen');
      const { App } = await import('@capacitor/app');

      try {
        await StatusBar.setStyle({ style: Style.Light });
      } catch (e) { console.warn('StatusBar init failed', e); }

      try { await SplashScreen.hide(); } catch {}

      // AdMob: initialize and warm up interstitial + rewarded
      try {
        const { initAdMob, preloadAdMobInterstitial, preloadAdMobRewarded } =
          await import('@/mobile/ads/admob');
        if (await initAdMob()) {
          preloadAdMobInterstitial();
          preloadAdMobRewarded();
        }
      } catch (e) { console.warn('[AdMob] init skipped', e); }


      // Back-button handler: never close the app from inside a story flow.
      // Uses SPA history (pushState + popstate) instead of location.assign so
      // the WebView never does a full reload (which re-showed the splash and
      // re-initialised the ad SDKs).
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else if (window.location.pathname !== '/hub') {
          window.history.pushState({}, '', '/hub');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      });
    } catch (err) {
      console.warn('[Mobile] Capacitor init skipped:', err);
    }
  })();
}