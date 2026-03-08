

## Plan: CuizIN Native Mobile App (Separate Lovable Project + Capacitor)

### Approach

Create a **new Lovable project** with a mobile-first UI, connected to the **same Supabase database** (`pgywvtphfidouakypdno`). Then wrap it with Capacitor to produce native iOS and Android apps.

### Why Separate Project Works Well

- Mobile-first design without compromising the existing web layout
- No risk of breaking the live website during mobile development
- Same Supabase database = shared users, quiz questions, points, leaderboards
- Lighter bundle (no admin panels, SEO components, ad infrastructure)

### Phase 1: New Lovable Project Setup

1. **Create new Lovable project** called "CuizIN Mobile"
2. **Connect to existing Supabase project** (same `pgywvtphfidouakypdno` instance) -- use the external Supabase connection option with the same URL and anon key
3. **Set up Capacitor** in the new project:
   - Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
   - Run `npx cap init` with appID `app.lovable.cuizin` and appName `CuizIN`
   - Configure hot-reload pointing to the new project's sandbox URL

### Phase 2: Core Mobile Screens

Build these mobile-optimized screens (no desktop layout needed):

| Screen | Maps to existing data |
|--------|----------------------|
| **Splash / Onboarding** | New (3-slide intro) |
| **Login / Register** | Same `profiles` table + Supabase Auth |
| **Home (Quiz Hub)** | `quiz_questions` table |
| **Quiz Player** | `quiz_questions`, `quiz_answers` |
| **Categories** | Same category slugs |
| **Daily Challenges** | `daily_challenges`, `user_challenge_progress` |
| **Profile & Stats** | `profiles`, `daily_points`, `monthly_points` |
| **Leaderboard** | `profiles` (points), `user_referrals` |
| **Referral** | `user_referrals` |
| **Settings** | Profile edit, logout |

### Phase 3: Native Features (Capacitor Plugins)

- **Push Notifications** (`@capacitor/push-notifications`) -- notify daily challenges, streak reminders
- **Haptic Feedback** (`@capacitor/haptics`) -- on correct/wrong answers
- **App Badge** (`@capacitor/badge`) -- unread challenge count
- **Share** (`@capacitor/share`) -- share quiz results natively
- **Status Bar** (`@capacitor/status-bar`) -- match app theme
- **Splash Screen** (`@capacitor/splash-screen`) -- branded launch screen

### Phase 4: Build & Publish

1. Export project to GitHub
2. `npm install` → `npx cap add ios` → `npx cap add android`
3. `npm run build` → `npx cap sync`
4. Open in Xcode / Android Studio for final build
5. Submit to App Store and Google Play

### What Stays Shared (via same Supabase DB)

- All quiz questions and categories
- User accounts, points, streaks
- Daily challenges and progress
- Referrals and leaderboard
- Login streaks and badges

### What's Mobile-Only (new code)

- Native navigation (bottom tab bar, stack navigation)
- Touch-optimized quiz card with swipe gestures
- Push notification registration and handling
- Haptic feedback on answers
- App store assets (icons, screenshots, store listing)

### Estimated Effort

- Phase 1 (setup): 1 session
- Phase 2 (core screens): 3-5 sessions
- Phase 3 (native features): 2-3 sessions
- Phase 4 (build & publish): Manual work outside Lovable (Xcode/Android Studio)

### Prerequisites

- Mac with Xcode for iOS builds
- Android Studio for Android builds
- Apple Developer Account ($99/year) for App Store
- Google Play Developer Account ($25 one-time) for Play Store

