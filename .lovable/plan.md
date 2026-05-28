
# Animated Mascot System — Mobile App

A rotating cast of 8 expressive characters reacts to the user's performance with mood-based animations, popping up across the whole mobile experience.

## 1. Characters & Assets

Generate 8 distinct mascots (varied silhouettes/colors — gem creature, fox, owl, robot, cat, dragon-pup, panda, alien) so the cast feels fresh on each appearance. Each character has **6 mood states**:

| State | Trigger |
|---|---|
| `cheer` | correct answer, no prior wrong |
| `excited` | 2+ correct streak |
| `hype` | 5+ correct streak / milestone |
| `neutral` | idle / hub waving |
| `sad` | first wrong / accuracy dipping |
| `angry` | sustained wrong streak / low accuracy |

**Asset pipeline:**
- Use `imagegen` (premium) to produce one transparent PNG per (character × mood) → 48 sprites stored in `src/mobile/assets/mascots/<name>/<mood>.png`.
- Animate via Framer Motion: bounce, scale-pop, shake, eye-blink loops, drop-in/out, particle bursts. No real Lottie JSON in v1 (one branded look, faster to ship); the loader is built so we can swap any sprite for a Lottie JSON later without touching call sites.
- A small `<MascotPlayer character={name} mood={mood} variant="reveal|idle|celebrate" />` component wraps the sprite with the right Motion preset.

## 2. Mood Engine (`useMoodEngine`)

Replaces ad-hoc state with a single hook backed by a Zustand store so every screen reads the same mood.

Inputs tracked:
- Rolling window of last **5 answers** (correct/wrong)
- Current correct streak & wrong streak
- Session-level "frustration score" (decays over time)

Mood resolution:
```
accuracy = correct_in_window / 5
if correct_streak >= 5     → hype
elif correct_streak >= 2   → excited
elif accuracy >= 0.6       → cheer (on correct) / neutral (idle)
elif wrong_streak == 1     → sad
elif wrong_streak == 2     → upset (sad sprite, shake motion)
elif wrong_streak >= 3     → angry
```
**Forgiveness rule:** answering correctly while in `angry` triggers a one-off `forgive` animation (character softens → cheers) before settling back to `cheer`. This is the "recovery" beat that keeps frustrated users hooked.

Thresholds live in one config object so we can tune without code edits later; admin-configurable table is **out of scope for v1** (keep it shipping fast).

## 3. Where Mascots Appear

| Surface | Behavior |
|---|---|
| **Quiz reveal** (`QuizStoryScreen`) | Random character drops in from bottom with mood matching the engine. Speech bubble pulls from `motivational_messages` filtered by the mood's trigger context. Confetti burst on `hype`. |
| **Hub** (`HubScreen`) | A "mascot of the day" idles next to the gem counter with breathing/blink loop; taps trigger a wave + random tip. |
| **Streak milestone** (3/7/14/30 days) | Full-screen takeover: character celebrates with confetti + scaling banner. |
| **Daily Challenge complete** | Hype variant + gem-shower animation. |
| **Mini-games** (`Wheel`, `Scratch`, `TrueFalse`, `Image`) | Character reacts to win/loss outcome at end of round. |
| **Leaderboard** | Character peeks from the side when user's rank improves; sulks when it drops. |
| **Profile** | "Mood mirror" card showing the character that represents the user's current 5-question accuracy — gentle nudge to keep playing. |
| **Onboarding** | Two characters walk the user through 3 slides (cuts current emoji-only flow). |
| **Idle (60s no input)** | Character pops with a `come-back` message to re-engage. |

Random character selection uses a session-seeded shuffle so the same one doesn't appear twice in a row.

## 4. Motivational Copy

Reuses the existing `motivational_messages` table (already migrated). Add two new trigger contexts: `hype` and `forgive`. Each mascot appearance pairs sprite + a weighted random message for that mood. No DB schema change needed — just seed ~15 new rows (data insert, not migration).

## 5. Performance & Bundle

- 48 sprites at ~40 KB each (WebP, transparent) ≈ 2 MB total. Lazy-load per character; only the active character's 6 moods are kept in memory.
- Preload the "mascot of the day" on hub mount; others load on demand.
- All animation via Framer Motion (already installed). No new deps.

## 6. Files to Add / Edit

**New:**
- `src/mobile/mascots/registry.ts` — character list + sprite imports
- `src/mobile/mascots/MascotPlayer.tsx` — sprite + Motion variants
- `src/mobile/mascots/useMoodEngine.ts` — Zustand store + mood resolver
- `src/mobile/mascots/MascotReveal.tsx` — full-screen drop-in for milestones
- `src/mobile/mascots/IdleMascot.tsx` — hub/profile breathing loop
- `src/mobile/assets/mascots/<8 dirs × 6 sprites>` — generated PNGs

**Edit:**
- `QuizStoryScreen.tsx` — replace static reveal panel with `<MascotReveal>`
- `HubScreen.tsx` — mount `<IdleMascot>` next to gem counter
- `OnboardingScreen.tsx` — mascot-led slides
- `LeaderboardScreen.tsx`, `ProfileScreen.tsx`, mini-game screens — wire mood reactions
- `MotivationBubble.tsx` — accept `mood` + `character` props

## 7. Build Order

1. Generate the 48 sprites (longest step; runs in parallel).
2. Build `useMoodEngine` + `MascotPlayer` with one character to validate the loop.
3. Wire into `QuizStoryScreen` first (highest-impact surface).
4. Add remaining 7 characters + rotation.
5. Roll out to Hub → Onboarding → Mini-games → Leaderboard → Profile.
6. Seed new motivational copy for `hype` and `forgive` contexts.

## Open Questions for After Approval

- **Character naming/personality** — should I just name them (Gemmy, Foxy, etc.) or do you want to provide names? Default: I'll generate friendly names.
- **Art style** — chibi/kawaii vs. flat-modern vs. 3D-rendered look? Default: rounded chibi with gem-themed color accents to stay on-brand with CuizIN.

If you want different defaults on either, tell me when you approve; otherwise I'll proceed with the defaults above.
