

## Diagnosis

The screenshots show two distinct problems on the production domain (cuiz.in):

1. **Gambling site injection** on `/categories`, `/login` -- third-party ad scripts are hijacking page content and redirecting to scam sites (MAHJONG222, GOODGAMING138)
2. **Server-level 404 errors** on `/quiz`, `/faq`, `/admin`, `/archived-challenges` -- these show a raw server 404, NOT your React NotFound component, meaning the SPA fallback is not working on your hosting provider
3. **PWA name still says "Earn Money"** in the install prompt

## Root Cause

The **malicious ad scripts** in `index.html` are the attack vector:

- `https://richinfo.co/richpartners/push/js/rp-cl-ob.js` (line 147) -- push notification hijacker, known for injecting gambling content
- `https://js.onclckmn.com/static/onclicka.js` (line 132) -- onclick hijacker
- `https://js.wpadmngr.com/static/adManager.js` (line 138) -- ad manager that can inject arbitrary content

These scripts can:
- Register malicious service workers that cache and serve scam pages
- Redirect users to gambling sites
- Override page content entirely

Additionally, `firebase-messaging-sw.js` line 50 blocks `'cuiz.in'` in its own BLOCKED_DOMAINS list, which can interfere with the site's own requests.

## Plan

### 1. Remove malicious ad scripts from index.html
- Remove the `richinfo.co` script entirely (known hijacker)
- Remove `onclckmn.com` script (onclick hijacker)  
- Remove `wpadmngr.com` script (ad manager hijacker)
- Keep only legitimate scripts: Google Tag Manager, Google Analytics, Google AdSense

### 2. Clean up firebase-messaging-sw.js
- Remove `'cuiz.in'` from BLOCKED_DOMAINS (it's blocking the site's own requests)
- Add the malicious ad domains to the block list instead

### 3. Clean up sw.js service worker
- Add malicious ad domains (`richinfo.co`, `onclckmn.com`, `wpadmngr.com`) to MALICIOUS_DOMAINS list
- Add cache-busting to force re-registration of clean service worker

### 4. Update manifest.json
- Change name from "Play Quiz & Earn Money" to "Play Quiz & Learn"
- Update description to remove money/reward references

### 5. Add service worker unregistration script
- Add a one-time script in index.html to force unregister any rogue service workers and clear caches on the production domain, so the malicious cached content is purged

### Hosting 404 Issue
The server-level 404s suggest your hosting provider (not Netlify/Lovable) may not be configured for SPA routing. The `_redirects` file works on Netlify, but if cuiz.in uses a different host, you need to configure it there. The `.htaccess` file exists but the hosting may not support Apache rewrites. This is a hosting configuration issue outside of the codebase.

## Technical Details

Files to modify:
- `index.html` -- remove 3 malicious ad scripts (~15 lines)
- `public/manifest.json` -- update name/description
- `public/firebase-messaging-sw.js` -- fix BLOCKED_DOMAINS
- `public/sw.js` -- add malicious domains to block list, add cache clear on activate

