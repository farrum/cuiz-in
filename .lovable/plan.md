## Fix the Railway Journey map

The current map looks broken because the four PNG assets (`train_asset.png`, `station_asset.png`, `signal_asset.png`, `track_asset.png`) all have opaque white backgrounds. The CSS tries to hide that with `mix-blend-mode: multiply`, but it fails on the dark green/wooden board so each element renders as a white card floating over the track. Layout is also off: both scroll banners appear stacked/overlapping, and the station buildings sit beside (not on) the track.

### Steps

1. **Regenerate the 4 map assets as true transparent PNGs** (via `imagegen--edit_image` with `transparent_background: true`), overwriting:
   - `public/train_asset.png` — brass steampunk locomotive, front view, transparent bg
   - `public/station_asset.png` — Victorian steampunk station building on a stone plinth, 3/4 view, transparent bg
   - `public/signal_asset.png` — brass semaphore signal with red/green lamps, transparent bg
   - `public/track_asset.png` — top-down vertical railway track tile (wooden sleepers + rails on gravel), seamless repeat, transparent bg outside the track edges

2. **Add a steampunk board background** for the map viewport:
   - Generate `public/railway_board_bg.jpg` — dark green relief map with wooden frame edges, gears in corners, compass rose (matches the reference).
   - Apply as `background-image` on the map container in `EmpireQuestsPage.tsx`, replacing the current `bg-*` classes.

3. **Rewrite the railway CSS in `src/index.css`** (`.railway-track-bg`, `.station-container`, `.station-building-*`, `.semaphore-signal-img`, `.station-wooden-plaque`, `.train-root`):
   - Remove all `mix-blend-mode: multiply` (no longer needed once PNGs are transparent).
   - Track: 90px wide, centered, `background-repeat: repeat-y`, sits at z-index 1 with a soft inset shadow so it looks recessed into the board.
   - Station row: use CSS grid `[left-building] [track] [right-building]` so buildings sit flush against the track edges instead of overlapping it. Left building uses `scaleX(-1)` to face inward.
   - Semaphore: anchor to left of the left building, `bottom: 40px`, above track z-index.
   - Wooden nameplate: centered across the track, `translateY(85px)` so it sits below the buildings (matching the reference where "MUMBAI CENTRAL" hangs under the station).
   - Train: unchanged positioning logic, but drop the white background; keep the drop shadow and wobble.
   - Locked state: `filter: grayscale(100%) brightness(0.7)` on the whole `.station-container`.

4. **Remove the parchment scroll banners** from `EmpireQuestsPage.tsx` (the "Aethelgard: Map of the Steampunk Kingdoms" elements that currently overlap in the corners).

5. **Verify** with `npm run build` and a Playwright screenshot of `/empire-quests` to confirm buildings, track, signal, nameplate, and train align like the reference.

### Files touched
- `public/train_asset.png`, `public/station_asset.png`, `public/signal_asset.png`, `public/track_asset.png` (regenerated, transparent)
- `public/railway_board_bg.jpg` (new)
- `src/index.css` — Railway Map Styles section
- `src/pages/EmpireQuestsPage.tsx` — map container background, remove scroll banners
