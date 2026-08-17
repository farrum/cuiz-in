# Fix: missing question text on the quiz screen + add a quiz banner ad

## What you reported
On the quiz screen (both the Android app and the mobile web preview, on every question) the answer options show, but the space above them — where the category chip, difficulty chip and the question itself belong — is blank. You also want a banner ad visible on the quiz screen.

## What is confirmed so far
- The data is fine: all 12,265 rows in the question bank have non-empty question text, category and difficulty, and the fetch code maps those fields correctly.
- The quiz screen renders the chips and question as siblings of the options inside one animated block, so a data problem alone does not explain options appearing while the text above them does not.
- The quiz screen deliberately mounts no banner today — only an invisible spacer for the native banner that the app draws outside the WebView. So on web there is genuinely no ad there.

The exact cause of the blank block is **not yet confirmed** (the preview requires a signed-in account, which cannot be automated for this project). Step 1 below is verification, not a guess.

## Plan

### 1. Confirm the cause (first step, before any fix)
Add temporary diagnostics to the quiz screen that log the loaded question's text/category/difficulty/image URL and the measured height of the block above the options. Check the three realistic candidates:
- an image question whose image URL fails to load, leaving a tall empty box that pushes the text out of view;
- the animated wrapper mounting children out of order so only the options paint;
- a text/background colour collision making the heading invisible rather than absent.
Whichever the logs show is the one that gets fixed; the diagnostics are removed afterwards.

### 2. Fix and harden the question block
- Render the question heading and chips defensively so they can never collapse silently (explicit fallback when a field is empty, guaranteed minimum height).
- Hide broken question images instead of leaving an empty reserved box, and cap image height so the question text stays on screen.
- Use theme tokens for the heading colour so it can never blend into the background.

### 3. Banner ad inside the quiz screen
- Web / mobile web: mount the managed banner slot (the same component used elsewhere) directly under the answer options, with its own slot id so you can control it from the admin ad manager. It collapses to nothing when the slot is inactive, so no empty gap.
- Android app: keep the single persistent native banner (it must not be mounted twice or it flickers) and only make sure the quiz screen reserves its height correctly, so the banner is actually visible above the tab bar rather than sitting behind content.

## Technical notes
- Files touched: `src/mobile/screens/QuizStory/QuizStoryScreen.tsx` (question block, image handling, web banner slot), and if the diagnostics point there, `src/utils/quizDataService.ts`.
- No database or business-logic changes; the answer/gem flow, reveal delay and interstitial cadence stay exactly as they are.
- The native banner stays owned by `BannerHost`; nothing new is mounted on native.
