# Add Video Ads to Web Stories

We get strong traffic to `/stories` but currently show no ads there. This adds a full-screen, skippable video ad "slide" into the story flow after every 2 story questions, matching the immersive story format.

## Behavior

- After the user finishes every 2nd question (after Q2, Q4, Q6, …), show a video ad slide before the next question.
- The ad is a VAST video (same network already used in mini-games / sidebar), played muted with autoplay.
- A "Sponsored" label and a "Skip" control are shown. Skipping (or the video completing) advances to the next question.
- If no video inventory is available (`onUnavailable`), the ad slide is skipped automatically and the user proceeds straight to the next question — no blank gap.
- The ad does not break the story progress bars; it appears as an overlay between question transitions.

## How it works (technical)

File: `src/pages/WebStoriesPage.tsx`

- Reuse the existing `ProxiedVastVideoAd` component (resolves VAST through the `vast-proxy` edge function so it fills on desktop too) with the default tag URL `https://vast.yomeno.xyz/vast?spot_id=1494657`.
- Add state: `showAd` (boolean) and a `pendingIndex` (the question index to move to once the ad closes).
- Create a single `goToNext()` helper used by both the auto-advance timer and the manual next button:
  - Compute the next index.
  - If the just-completed question count is a multiple of 2 (`(currentIndex + 1) % 2 === 0`) and there is a next question, set `pendingIndex` and `showAd = true` instead of advancing immediately. Pause the auto-advance timer while the ad is up.
  - Otherwise advance normally.
- Add a `closeAd()` helper that sets `currentIndex = pendingIndex`, clears `showAd`, and resets progress/answer state.
- Render an ad overlay (full-screen `fixed inset-0 z-[60] bg-black` within the story container) when `showAd` is true, containing:
  - "Sponsored Ad" label + "Skip Ad" button (calls `closeAd`).
  - `<ProxiedVastVideoAd tagUrl=... onUnavailable={closeAd} onComplete={closeAd} />`.
- Wire the existing auto-advance `useEffect` and the manual Next button / right-tap navigation to go through `goToNext()` so the ad cadence is consistent regardless of how the user advances. Pause the progress timer while `showAd` is true.

No backend or schema changes are needed — the VAST proxy edge function already exists.

## Note

The "every 2 questions" cadence and the VAST spot are easy to tune later if you want a different frequency or ad source.
