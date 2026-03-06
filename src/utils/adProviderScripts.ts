// Ad Provider Script Loader - Hardened version
// Only allows Google AdSense scripts. All other ad networks are blocked.

// Strict allowlist of permitted ad script domains
const ALLOWED_SCRIPT_DOMAINS = [
  'pagead2.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'adservice.google.com',
  'tpc.googlesyndication.com',
];

// Known malicious domains - block these explicitly
const BLOCKED_DOMAINS = [
  'acscdn.com',
  'adexchangeclear.com',
  'onclickpsh.com',
  'mrtnsvr.com',
  'richinfo.co',
  'onclckmn.com',
  'wpadmngr.com',
  'a3klsam',
  'TCPusher',
  'goodgaming138',
  'mahjong222',
];

/**
 * Check if a URL is from an allowed domain
 */
export const isAllowedAdScript = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ALLOWED_SCRIPT_DOMAINS.some(domain => parsed.hostname.includes(domain));
  } catch {
    return false;
  }
};

/**
 * Check if content contains blocked domains
 */
export const containsBlockedContent = (content: string): boolean => {
  const lower = content.toLowerCase();
  return BLOCKED_DOMAINS.some(domain => lower.includes(domain.toLowerCase()));
};

/**
 * Push to adsbygoogle if available (Google AdSense only)
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

// REMOVED: ensureAclibLoaded - was loading malicious acscdn.com/script/aclib.js
// REMOVED: triggerBannerRescan - was triggering compromised a3klsam network
// REMOVED: loadScript - no longer needed, only Google AdSense is allowed
