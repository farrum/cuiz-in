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
      const { App } = await import('@capacitor/app');

      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Light });
      } catch (e) { console.warn('StatusBar init failed', e); }

      // AdMob: initialize and warm up interstitial + rewarded in background
      try {
        const { initAdMob, preloadAdMobInterstitial, preloadAdMobRewarded } =
          await import('@/mobile/ads/admob');
        if (await initAdMob()) {
          preloadAdMobInterstitial();
          preloadAdMobRewarded();
        }
      } catch (e) { console.warn('[AdMob] init skipped', e); }


      // App State Change: pause audio when app goes to background
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          window.dispatchEvent(new CustomEvent('cuizin_app_background'));
        } else {
          window.dispatchEvent(new CustomEvent('cuizin_app_foreground'));
        }
      });

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

let splashHideStarted = false;

/** Hide the native splash only after React has committed and painted twice. */
export function hideNativeSplashAfterFirstPaint() {
  if (splashHideStarted) return;
  splashHideStarted = true;

  void (async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
      console.info('[Mobile] First paint complete; native splash hidden');
    } catch (error) {
      console.warn('[Mobile] Splash hide failed safely:', error);
    }
  })();
}