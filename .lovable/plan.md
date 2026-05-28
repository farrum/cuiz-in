
# CuizIN Mobile App — Hybrid Hub + Stories on Capacitor

## Goal
Ship a native iOS + Android app from the existing repo that delivers a Duolingo-style hub opening into immersive full-screen story flows. Users, gems, streaks, leaderboard, and all business logic stay identical to the web app — only the UI shell changes.

## How it works (at a glance)

```text
        ┌──────────────────────────────────────────────┐
        │           Same Supabase backend              │
        │  (profiles, gems, quiz_questions, streaks)   │
        └─────────────▲────────────────────┬───────────┘
                      │                    │
            ┌─────────┴────────┐  ┌────────┴─────────┐
            │   Web build      │  │  Mobile build    │
            │ VITE_PLATFORM=   │  │ VITE_PLATFORM=   │
            │      web         │  │     mobile       │
            │  → src/App.tsx   │  │ → src/AppMobile  │
            └──────────────────┘  └────────┬─────────┘
                                            │
                                   ┌────────┴─────────┐
                                   │  Capacitor wraps │
                                   │  → iOS + Android │
                                   └──────────────────┘
```

Same repo, same auth, same gems math — the build flag swaps the root component so the mobile bundle never ships web admin/SEO code.

## v1 Scope (confirmed)
- Core quiz loop + gems balance
- Daily challenges, login streak, daily riddle vault
- Leaderboard (monthly winners + user rank) + profile
- Mini-games: spin wheel, scratch card, flashcard match, true/false swipe, boss fight

## The mobile UX

**Hub screen (home)** — a Duolingo-style scrollable "island map" with animated nodes for each activity. A mascot character walks the path, reacts to your streak, and pops speech bubbles with motivating messages. Gem balance floats at the top with a constant subtle shimmer; streak flame animates when tapped.

**Story flows** — tapping any hub node launches a full-screen vertical story (like Instagram/your existing `/stories`):
- Quiz story: each question is a full-screen card with a Lottie reaction on answer, confetti on correct, a shake on wrong, and auto-advance after 5s with a progress bar at the top.
- Daily challenge story: intro card → questions → reward reveal with scratch-card animation.
- Mini-game stories: each game gets its own themed transition (wheel spin, card flip, etc.).
- Swipe down to exit, swipe left/right to skip when allowed.

**Motivation engine** — a new `motivational_messages` table the admin can edit. Messages are surfaced contextually: after a wrong answer ("Don't stop now — your streak is one tap away!"), on app open ("You earned 47 gems yesterday. Beat it today?"), after 30s of inactivity ("The leaderboard is waiting 👀"), on streak milestones, etc. Messages render as animated speech bubbles from the mascot or as bottom-sheet pop-ups.

**Animation budget** — heavy but tasteful, all 60fps:
- Framer Motion for screen transitions, gestures, and shared-element animations between hub → story
- Lottie React for mascot, gem earned bursts, correct/wrong feedback, level-up celebrations
- `canvas-confetti` (already in repo) for milestone moments
- Haptic feedback (`@capacitor/haptics`) on every meaningful tap, correct answer, gem earn, and streak save
- Subtle parallax and scroll-linked motion on the hub map

## Technical Plan

### 1. Build flag + dual entry points
- Add `VITE_PLATFORM` env var (`web` | `mobile`), default `web`.
- `src/main.tsx` picks the root: `if (import.meta.env.VITE_PLATFORM === 'mobile') render(<AppMobile/>) else render(<App/>)`.
- New `package.json` scripts: `build:mobile` runs Vite with the flag set, outputs to `dist/`.
- Vite config: when `VITE_PLATFORM=mobile`, exclude admin/SEO chunks via dynamic imports already in place.

### 2. New mobile shell (`src/mobile/`)
```
src/mobile/
  AppMobile.tsx              — root with mobile router + providers
  router.tsx                 — React Router routes: /hub, /quiz, /daily, /game/:id, /profile, /leaderboard, /onboarding, /login
  layout/
    MobileShell.tsx          — safe-area handling, status bar, bottom tab bar
    BottomTabs.tsx           — Home / Play / Leaderboard / Profile (animated)
  screens/
    Hub/                     — island map + mascot + gem header
    QuizStory/               — full-screen story-format quiz
    DailyChallengeStory/
    MiniGames/               — wheel, scratch, flashcard, true-false, boss
    Leaderboard/
    Profile/
    Onboarding/              — 4-card swipeable intro (only first launch)
  components/
    Mascot.tsx               — Lottie mascot with mood states
    GemCounter.tsx           — shimmering gem balance with count-up
    StreakFlame.tsx
    MotivationBubble.tsx
    StoryCard.tsx, StoryProgress.tsx
    HapticButton.tsx         — wraps Button with haptics
  hooks/
    useMotivation.ts         — selects context-aware messages
    useHaptics.ts
    useStoryGestures.ts      — swipe up/down/left/right
  motion/
    transitions.ts           — Framer Motion variants (hub→story, card flips)
    lottie/                  — bundled Lottie JSON (correct, wrong, gem, level-up, mascot)
```

### 3. Reuse, don't duplicate
- All gems logic (`gemsService`, `validate-quiz-answer` edge function, streak hooks): **reused as-is**.
- Supabase client, auth flow, `useQuizQuestion`, `useQuizGems`, `usePersistentQuizStats`: **reused as-is**.
- Mobile screens are pure presentation wrappers over these existing hooks → no risk of drifting business logic.

### 4. Capacitor integration
Per the existing `mem://reference/mobile` memory + the Capacitor knowledge:
- Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/push-notifications`, `@capacitor/app`.
- `capacitor.config.ts` with `appId: app.lovable.7e6688c8dfb8442e8feda62399ade2ef`, `appName: cuiz-in`, hot-reload `server.url` pointing at the Lovable preview for dev.
- Add splash screen, app icon (generated from existing branding), status bar styling.
- Deep links: `cuizin://` scheme for OAuth callbacks and shared challenge links.
- Push notifications (FCM/APNs) for: daily streak reminders, "new daily challenge live", "you're #X on the leaderboard — defend it".

### 5. New backend additions (minimal)
One small migration:
- `motivational_messages` table: `id`, `trigger_context` (`on_open` | `on_wrong` | `on_correct` | `streak_milestone` | `idle` | `low_gems` | `daily_reminder`), `text`, `emoji`, `weight`, `is_active`. Admin-managed, public read.
- `push_tokens` table: `user_id`, `token`, `platform` (`ios` | `android`), `created_at`. RLS: user owns rows.
- New edge function `send-push-notification` (admin-triggered + cron) for streak reminders.

No changes to `profiles`, `quiz_questions`, `quiz_answers`, gems tables, or any existing logic.

### 6. Admin additions
A small "Mobile Content" tab inside existing admin to:
- CRUD motivational messages
- Trigger test push notifications
- Toggle daily-reminder cron on/off

### 7. Distribution path (App Stores)
1. Build the mobile bundle in the sandbox (verify it runs in browser at mobile viewport).
2. Export repo to GitHub → `npm install` → `npx cap add ios && npx cap add android` → `npm run build:mobile && npx cap sync`.
3. iOS: open Xcode project, sign with your Apple Developer account ($99/yr), submit via TestFlight → App Store review.
4. Android: open Android Studio, generate signed AAB, upload to Play Console ($25 one-time), internal testing → production.

Requirements you'll need: Apple Developer account, Google Play Console account, app icon (1024×1024), screenshots, privacy policy URL (you already have `/privacy`), data safety declarations.

## What I'll build in implementation (in order)
1. Build-flag setup + empty `AppMobile.tsx` rendering a "Hello mobile" screen, verify both web and mobile builds work.
2. Mobile shell: router, bottom tabs, safe-area, status bar, onboarding.
3. Hub screen with mascot, animated island nodes, gem counter, streak flame.
4. Quiz story flow (full-screen cards, gestures, Lottie reactions, haptics) wired to existing quiz hooks.
5. Daily challenge story + leaderboard + profile screens.
6. Mini-game stories (wheel, scratch, flashcard, true/false, boss).
7. Motivation engine + `motivational_messages` migration + admin CRUD.
8. Capacitor config, splash, icon, push notifications + `push_tokens` migration.
9. Final polish, mobile-viewport QA in the sandbox, then export-to-GitHub instructions for the native builds.

## Out of scope for v1
- Ads on mobile (your memory says ads are disabled sitewide — confirmed)
- In-app purchases / store payments
- Offline mode (everything still requires network — Supabase calls)
- Web admin redesign (admin stays web-only)

## Questions I'd flag before building
- **Mascot character**: do you want me to generate one (cute gem-themed character with a few mood states as Lottie animations), or do you have existing art?
- **Push notifications**: OK to use Firebase Cloud Messaging? It requires a small Firebase project setup on your side (free tier). If you'd rather skip push in v1, I can ship in-app motivation only.
- **Onboarding**: should brand-new installs require sign-up immediately, or allow 5 guest questions first (matches your existing web 30-question guest limit, scaled down)?

I'll wait for your go-ahead before touching any files. Once approved, the first thing I'll do is the build-flag setup and confirm both builds still work — then move through the steps above.
