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
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (e) { console.warn('StatusBar init failed', e); }

      try { await SplashScreen.hide(); } catch {}

      // Back-button handler: never close the app from inside a story flow
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else if (window.location.pathname !== '/hub') window.location.assign('/hub');
      });
    } catch (err) {
      console.warn('[Mobile] Capacitor init skipped:', err);
    }
  })();
}