# Bring web quiz & quest pages to parity with the mobile app

Goal: the website gets the same gameplay features the mobile app has, but styled with the existing web theme (no mobile "story" look). Rewarded actions on web use the existing web video ad instead of AdMob.

## What's missing on web today

Confirmed by comparing `src/mobile/screens/QuizStory/QuizStoryScreen.tsx` (and the mobile Hub) with `src/pages/QuizPage.tsx`, `QuizPlayPage.tsx`, `QuizQuestionPage.tsx`:

- Gem counter with fly-to-counter animation, streak flame, floating reward numbers — mobile only (`src/mobile/components/GemCounter.tsx`, `StreakFlame.tsx`).
- Mascot reveal + mood engine and motivational lines on answer — mobile only (`src/mobile/mascots/*`, `useMotivation.ts`).
- Answer feedback choreography: suspense window, correct-option pulse, wrong-option shake, confetti on correct.
- Boosters: "double gems" and "revive streak" (mobile gates them behind an AdMob rewarded ad).
- In-quiz preferences sheet (category + difficulty change without leaving the quiz).
- Quest board: `/empire-quests` is shared, but the mobile Hub also surfaces daily tribute tasks and task progress (`empire_tasks` / `user_task_progress`) that the web has no entry point for.

## Plan

### 1. Shared gameplay layer (no duplication)
Move the reusable logic out of `src/mobile` into `src/components/quiz/*` and `src/hooks/quiz/*` so both apps use one implementation:
- `useQuizReveal` — suspense delay, correct/wrong resolution, pulse/shake triggers, confetti.
- `useSessionGems` — session gem tally, gem-fly trigger, streak tracking, persistence through the existing `gemsService`.
- Web-themed presentational components: `WebGemCounter`, `WebStreakFlame`, `FloatingReward`, `AnswerMascot` (reuses mascot registry + mood engine).
Mobile screens keep their current look by importing the same hooks with their own visuals; no change to mobile behaviour.

### 2. Quiz gameplay parity on web
Apply in `QuizPage.tsx` / `QuizContent.tsx`, `QuizPlayPage.tsx`, and `QuizQuestionPage.tsx`:
- Header strip with gems + streak (web card styling), animated gem fly on a correct answer.
- Suspense reveal, correct-green pulse, wrong-red shake (builds on the highlighting already added to `QuizCard`).
- Motivational message + mascot reaction under the feedback panel.
- Existing ad cadence, sidebar ads and SEO blocks stay untouched.

### 3. Rewards & boosters on web
- After a correct answer: "Double your gems — watch a video" using the existing web video ad (`QuizInterstitial` / `SidebarVideoAd` path, via `useMiniGameVideoAd`).
- On a broken streak: "Revive streak — watch a video" with the same gate.
- Awards go through the existing server-side gem/points path (`logGemsEarned` / `award_currency`), so no new client-trusted writes.

### 4. In-quiz preferences
- Add a "Quiz preferences" popover/sheet to the web quiz header: category list (from `getAvailableCategories`) + difficulty, persisted to the same storage keys the mobile screen uses, reloading the next question on change.
- Reuses `QuizDifficultySelector` where possible.

### 5. Quest page parity
- Add a "Daily Tribute / Tasks" panel to `/empire-quests` on web, reading `empire_tasks` + `user_task_progress` with the same claim/progress logic the mobile Hub uses (extracted into a shared `useEmpireTasks` hook).
- Remove the native-only gating at `EmpireQuestsPage.tsx:961` where it hides quest features from web, replacing the AdMob path with the web video ad.
- Show gems/stars balance and task rewards in web card styling.

### 6. Verification
- `npm run build` + `npx tsgo --noEmit`.
- Browser check of `/quiz`, `/quiz/:question` and `/empire-quests` for reveal animations, booster prompts, preferences and task panel; confirm mobile screens are unchanged.

## Notes
- No database schema changes; existing tables and RPCs cover everything.
- No new ad networks — web uses only the interstitial/VAST setup already in the project.
