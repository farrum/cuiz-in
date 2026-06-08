# Re-enable & Manage Ads (Web + Mobile)

## Goal
Turn the existing (currently disabled) ad system back on so that:
1. Only **Active** ad slots render; inactive ones are fully hidden (no empty placeholder boxes).
2. A managed **mobile-app banner** shows at the top of every mobile screen.
3. An **inter-question ad** appears in the same slot for **5 seconds after every answer** (web + mobile) before the next question.
4. All slots (web + mobile + interstitial) are manageable from the existing Admin → Ads panel.

> Note: This reverses the project's previous "all ads disabled" security stance. Per your choice, slots may render **any pasted ad code** (the existing malicious-domain blocklist in `useScriptExecution`/`adProviderScripts` stays active as a safety net). Project memory will be updated to reflect ads are now enabled.

## What already exists
- `ad_slots` table + Admin manager (`AdminAdManagement`, `AdSlotTabs`, `EditAdSlotDialog`) with positions: top, middle, bottom, sidebar, app-banner, app-interstitial.
- `SimpleAdBanner` renders slot HTML and runs scripts through the security filter.
- Web pages already place `SimpleAdBanner` (home top/middle/bottom, quiz top/middle/bottom).
- Mobile `TopBannerAd` (top of `MobileShell`) and `InterstitialAd` (already shown after each question in `QuizStoryScreen`) already support DB slots via `app-banner` / `app-interstitial`.
- Web `QuizInterstitial` currently uses the no-op `AdSenseUnit`, so it shows nothing.

## Changes

### 1. Show active, hide inactive
- `SimpleAdBanner`: when there is no active ad content for the slot, render **nothing** (collapse) instead of `AdPlaceholder`.
- `Index.tsx`: remove the `AdPlaceholder` Suspense fallbacks so empty slots leave no gap.
- Ensure active slots are loaded into `localStorage` on app start (call the existing sync routine in `adService` from app bootstrap), so rendering does not depend on opening the quiz first.
- Align placement → position so the home-top and quiz top/bottom placements resolve to their admin slots (map `header→top`, `content→middle`, `footer→bottom` inside `SimpleAdBanner`, keeping `slotId` matching).

### 2. Mobile banner (managed)
- Already mounted top-of-shell. Confirm `TopBannerAd` renders the `app-banner` DB slot when active and renders nothing otherwise. No layout change beyond enabling rendering.

### 3. Inter-question ad — Web
- `QuizPlayPage`: show the interstitial **after every question** (`INTERSTITIAL_EVERY = 1`) and give it priority over the random mini-games so it reliably appears between answer and next question.
- `QuizInterstitial`: replace the no-op `AdSenseUnit` with `SimpleAdBanner` rendering a managed interstitial slot; run a **5-second** countdown then auto-advance to the next question (Skip allowed). If no active interstitial slot exists, advance immediately (no blank screen).

### 4. Inter-question ad — Mobile
- `InterstitialAd`: set the gate to **5 seconds** (currently 7) and confirm it renders the `app-interstitial` DB slot. Flow is already "5s reveal → ad → next question"; if no active slot, it auto-closes (already handled).

### 5. Admin — manage all slots
- `AdSlotTabs`: add tabs so admins can view/toggle/edit **App Banner**, **App Interstitial**, and the **Web Interstitial** slots alongside the existing top/middle/bottom/sidebar.
- `EditAdSlotDialog`: add the web interstitial position option (app-banner / app-interstitial already present). Active toggle already controls show/hide.

### 6. Memory / security
- Update `mem://features/ads` and the index Core line: ads are **enabled**; only Active slots render; malicious-domain blocklist remains the active defense.
- Update the security memory via the security tool to note ads render admin-pasted code by design.

## Technical notes
- No DB schema change required — `ad_slots` already has `position`, `active`, `code`. Admin creates/activates the needed slots (home top, quiz top, quiz bottom, web interstitial, app banner, app interstitial) and pastes ad code.
- `AdSenseUnit` stays a no-op (unused after the interstitial switch to `SimpleAdBanner`).
- All ad rendering keeps the existing `useScriptExecution` security filtering (blocks known malicious domains, service-worker registration, `document.write`, etc.).

## Out of scope
- Bot/scraper filtering.
- Any change to points/economy or gameplay scoring.
