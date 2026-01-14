// Ad Provider Script Loader
// Ensures ad provider scripts are loaded only once and in the correct order

interface LoadedScript {
  url: string;
  loaded: boolean;
  promise: Promise<void>;
}

const loadedScripts = new Map<string, LoadedScript>();

/**
 * Load an external script and return a promise that resolves when loaded
 */
export const loadScript = (url: string, id: string): Promise<void> => {
  // Check if already loaded or loading
  const existing = loadedScripts.get(id);
  if (existing) {
    return existing.promise;
  }

  // Check if script already exists in DOM
  const existingScript = document.getElementById(id) || document.querySelector(`script[src="${url}"]`);
  if (existingScript) {
    const resolvedPromise = Promise.resolve();
    loadedScripts.set(id, { url, loaded: true, promise: resolvedPromise });
    return resolvedPromise;
  }

  // Create and load the script
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = url;
    script.async = true;
    
    script.onload = () => {
      console.log(`[AdProvider] Script loaded: ${id}`);
      const entry = loadedScripts.get(id);
      if (entry) entry.loaded = true;
      resolve();
    };
    
    script.onerror = () => {
      console.error(`[AdProvider] Failed to load script: ${id}`);
      loadedScripts.delete(id);
      reject(new Error(`Failed to load script: ${url}`));
    };
    
    document.head.appendChild(script);
  });

  loadedScripts.set(id, { url, loaded: false, promise });
  return promise;
};

/**
 * Check if a script is already loaded
 */
export const isScriptLoaded = (id: string): boolean => {
  return loadedScripts.get(id)?.loaded ?? false;
};

/**
 * Load the aclib library for ad network
 */
export const ensureAclibLoaded = async (): Promise<boolean> => {
  // Check if aclib is already available
  if (typeof (window as any).aclib !== 'undefined') {
    console.log('[AdProvider] aclib already available');
    return true;
  }

  try {
    // Load the aclib library - common URL pattern for this ad network
    await loadScript('https://acscdn.com/script/aclib.js', 'aclib-script');
    
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (typeof (window as any).aclib !== 'undefined') {
      console.log('[AdProvider] aclib loaded successfully');
      return true;
    }
    
    console.warn('[AdProvider] aclib script loaded but aclib not defined');
    return false;
  } catch (error) {
    console.error('[AdProvider] Failed to load aclib:', error);
    return false;
  }
};

/**
 * Trigger onclick/banner ad network rescan for dynamically added banners
 */
export const triggerBannerRescan = (retryCount = 0): void => {
  const maxRetries = 3;
  const retryDelay = 500;

  try {
    const win = window as any;
    
    // Check if banner elements exist in DOM first
    const bannerElements = document.querySelectorAll('[data-banner-id]');
    if (bannerElements.length === 0) {
      console.log('[AdProvider] No banner elements found in DOM');
      if (retryCount < maxRetries) {
        console.log(`[AdProvider] Retrying banner rescan in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => triggerBannerRescan(retryCount + 1), retryDelay);
      }
      return;
    }

    console.log(`[AdProvider] Found ${bannerElements.length} banner elements, triggering rescan`);
    
    // Try various onclick/banner network init methods
    let rescanTriggered = false;
    
    if (win.a3klsam?.init) {
      console.log('[AdProvider] Triggering a3klsam.init rescan');
      win.a3klsam.init();
      rescanTriggered = true;
    }
    
    if (win.a3klsam?.refresh) {
      console.log('[AdProvider] Triggering a3klsam.refresh');
      win.a3klsam.refresh();
      rescanTriggered = true;
    }

    // Some networks use different global names
    if (win.adManager?.refresh) {
      win.adManager.refresh();
      rescanTriggered = true;
    }

    // If no ad manager found but we have banner elements, retry
    if (!rescanTriggered && retryCount < maxRetries) {
      console.log(`[AdProvider] No ad manager found, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      setTimeout(() => triggerBannerRescan(retryCount + 1), retryDelay);
    }
  } catch (error) {
    console.error('[AdProvider] Error during banner rescan:', error);
    if (retryCount < maxRetries) {
      setTimeout(() => triggerBannerRescan(retryCount + 1), retryDelay);
    }
  }
};

/**
 * Push to adsbygoogle if available
 */
export const pushAdsByGoogle = (): void => {
  try {
    const win = window as any;
    if (win.adsbygoogle && Array.isArray(win.adsbygoogle)) {
      win.adsbygoogle.push({});
      console.log('[AdProvider] Pushed to adsbygoogle');
    }
  } catch (error) {
    console.error('[AdProvider] Error pushing to adsbygoogle:', error);
  }
};
