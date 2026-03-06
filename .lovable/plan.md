

## Root Cause: Why Fixes Are Not Taking Effect

The investigation reveals **three remaining attack vectors** that explain why the site is still compromised despite previous fixes:

### Finding 1: cuiz.in is likely NOT serving the Lovable build

The console logs from production show:
- `cdn.tailwindcss.com` loading (your current codebase does NOT use this CDN)
- `js.onclckbnr.com/banner-admanager/build.m.js` loading and trying to mount banners (IDs 6066119, 1465098)
- `pubid: 968892, siteid: 361293, swpath: /firebase-messaging-sw.js` -- a push notification subscription

These scripts are **not in the current codebase**. This means cuiz.in is either:
- Pointing to a different hosting provider that has an old infected build
- OR a cached service worker is serving old content

**Action**: Point cuiz.in DNS to Lovable's IP (`185.158.133.1`) and publish the project through Lovable. The `.htaccess` file is irrelevant on Lovable hosting.

### Finding 2: `ad_slot_versions` table still has 69 malicious records

The migration only cleaned `ad_slots` (4 rows). But `ad_slot_versions` has **69 out of 74 rows** containing `data-banner-id`, `aclib.runBanner`, and other compromised code -- all marked `active: true`. Two components render this code unsafely:

- `AdSlotVersions.tsx` line 275: `dangerouslySetInnerHTML={{ __html: selectedVersion.code }}`
- `AdSlotCard.tsx` line 75: `dangerouslySetInnerHTML={{ __html: slot.code || '' }}`

### Finding 3: Multiple code paths re-infect localStorage

Even after cleaning the database, these files bypass the security filters and write raw ad data to localStorage:

- `useProfileAds.ts` line 84: writes directly to `quiz_app_ad_slots` without filtering
- `useQuizAdSync.ts` line 34: writes directly without filtering
- `adFetchService.ts` line 106: writes to localStorage without checks
- `dataSync.ts` line 135: **syncs localStorage data BACK to Supabase** -- this can re-infect the database from a user's cached malicious data

---

## Recovery Plan

### Step 1: Point DNS to Lovable
Update cuiz.in DNS:
- A record for `@` -> `185.158.133.1`
- A record for `www` -> `185.158.133.1`
- TXT record for `_lovable` -> verification value from Lovable project settings

This ensures the Lovable-built clean code is what users see, not an old infected deploy on another host.

### Step 2: Disable all ad rendering sitewide
Remove `SimpleAdBanner` from `PageLayout.tsx` and all page components. Replace with empty fragments. This eliminates the primary injection vector immediately.

Files: `PageLayout.tsx`, `QuizPage.tsx`, `LoginPage.tsx`, `ReferralProgramPage.tsx`, `TopicPage.tsx`, `QuizQuestionPage.tsx`, `CategoryDetailPage.tsx`, `BlogPostPage.tsx`, and others importing SimpleAdBanner.

### Step 3: Clean ad_slot_versions table
Run SQL to deactivate and strip malicious code from all 69 compromised records in `ad_slot_versions`.

### Step 4: Remove dangerous sync-back code
- **`dataSync.ts`**: Remove the code that syncs `quiz_app_ad_slots` from localStorage back to Supabase (lines 121-146). This prevents re-infection of the database from cached malicious data.
- **`useProfileAds.ts`**: Remove direct localStorage writes (line 84), use the filtered path in `useSimpleAd.ts` instead.
- **`useQuizAdSync.ts`**: Remove direct localStorage writes (line 34).
- **`adFetchService.ts`**: Remove localStorage sync (lines 90-106).

### Step 5: Remove dangerouslySetInnerHTML for ad previews
- **`AdSlotVersions.tsx`** line 275 and **`AdSlotCard.tsx`** line 75: Replace `dangerouslySetInnerHTML` with a safe text preview (show code as text, not rendered HTML).

### Step 6: Purge localStorage aggressively
Update the purge script in `index.html` to unconditionally remove `quiz_app_ad_slots` from localStorage (not just when it contains known patterns).

---

## Summary

The issue persists because:
1. **cuiz.in is not serving the fixed code** -- DNS likely points to an old host
2. **69 malicious records remain in `ad_slot_versions`** table
3. **Multiple code paths bypass security filters** and can re-infect via localStorage sync-back

After DNS migration to Lovable + disabling all ads + cleaning the versions table + removing sync-back code, the site will be clean. Ads can be re-enabled later with only safe Google AdSense content.

