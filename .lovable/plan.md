

## Deep Dive Analysis: The Real Attack Vector

The previous fix removed malicious scripts from `index.html`, but the **actual injection point** was missed. Here is the complete attack chain:

### Root Cause: Database-Stored Ad Code

The `ad_slots` table in Supabase contains ad code with `data-banner-id` attributes that load content from a compromised ad network. The attack flow is:

```text
Supabase ad_slots table (contains data-banner-id divs)
  -> useSimpleAd.ts fetches ad code from DB
  -> SimpleAdBanner.tsx injects HTML via innerHTML
  -> adProviderScripts.ts loads https://acscdn.com/script/aclib.js
  -> aclib calls adexchangeclear.com/script/banner.php
  -> Ad network serves MAHJONG222/GOODGAMING138 gambling content
  -> Gambling content replaces entire page
```

The network requests confirm this: `adexchangeclear.com/script/banner.php?r=9926730` is being called from the preview right now, serving the gambling banners.

### Current Ad Slots in Database (all active):
- **Top Advert**: `data-banner-id="6065583"`, `329915`, `1449373`
- **Middle 1**: `data-banner-id="6065586"`, `6065014` + `aclib.runBanner({zoneId: '9926730'})`
- **Sidebar**: `data-banner-id="6066119"` (x3)
- **Bottom**: Google AdSense (safe) + `data-banner-id="6065583"`

The `data-banner-id` system and `aclib` library are the compromised ad network. Google AdSense in the Bottom slot is the only safe ad code.

### Three Issues Explained:
1. **Gambling page on /categories, /login**: Ad network scripts override page content
2. **Blank page on cuiz.in homepage**: Ad scripts crash or redirect before React renders
3. **404 on /play**: This route doesn't exist in App.tsx (no `/play` route defined). The server-level 404 means hosting doesn't have SPA fallback working

### Why clearing browser history didn't help:
- The ad code is fetched fresh from Supabase every page load
- The service worker caches the infected responses
- `acscdn.com/script/aclib.js` is loaded dynamically by the app code itself

---

## Recovery Plan: Rollback then Harden

### Step 1: Deactivate all ad slots in database
Run SQL to set all ad_slots to `active = false`. This immediately stops the injection at the source.

### Step 2: Clean the ad code in database
- Remove all `data-banner-id` divs from ad slot code
- Remove `aclib.runBanner` calls
- Keep only Google AdSense code in the Bottom slot
- Re-activate only the cleaned Bottom slot

### Step 3: Remove aclib/banner network from codebase
- **`src/utils/adProviderScripts.ts`**: Remove `ensureAclibLoaded()` (loads `acscdn.com/script/aclib.js`), remove `triggerBannerRescan()` (triggers `a3klsam` which is the compromised network)
- **`src/components/ads/SimpleAdBanner.tsx`**: Remove aclib handling code, remove banner rescan triggers, add `acscdn.com` and `adexchangeclear.com` to blocked domains
- **`src/hooks/useScriptExecution.ts`**: Add `acscdn.com`, `adexchangeclear.com`, `a3klsam` to blockedDomains list

### Step 4: Harden SimpleAdBanner with strict allowlist
Instead of a blocklist approach (which can be bypassed), switch to an **allowlist**: only allow Google AdSense scripts to execute. Block all other script execution from ad slots.

### Step 5: Update service workers
- Bump `sw.js` to v3 with `acscdn.com` and `adexchangeclear.com` in MALICIOUS_DOMAINS
- Add these domains to `firebase-messaging-sw.js` BLOCKED_DOMAINS
- Force cache purge on version change

### Step 6: Add CSP headers
Update `.htaccess` CSP to explicitly block `acscdn.com` and `adexchangeclear.com`.

### Step 7: Fix the /play route
The 404 on `/play` is because no such route exists. If this should map to `/quiz`, add a redirect route. The server-level 404 (not React's NotFound) confirms the hosting provider doesn't support SPA routing -- this requires hosting configuration changes you'll need access for.

---

### On Remixing
Remixing would NOT fix the issue because:
- The ad code is in Supabase (shared database), not in the codebase
- The `adProviderScripts.ts` code that loads the malicious library would be copied to the new project
- The real fix is deactivating the compromised ad network at the database level + removing the loader code

### Files to modify:
- `src/utils/adProviderScripts.ts` -- remove aclib and banner rescan
- `src/components/ads/SimpleAdBanner.tsx` -- remove aclib handling, add allowlist
- `src/hooks/useScriptExecution.ts` -- add compromised domains to blocklist
- `public/sw.js` -- v3 with new blocked domains
- `public/firebase-messaging-sw.js` -- add blocked domains
- `public/.htaccess` -- update CSP
- `index.html` -- update cache purge script
- Database: deactivate and clean ad_slots

