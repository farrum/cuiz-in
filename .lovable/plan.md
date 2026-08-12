# Remove the white title band at the top of the Android app

## What that band actually is

It is not part of the web app and it is not an ad slot — it is Android's native **ActionBar** (title bar), drawing the app label "CuizIN". That is why nothing done inside the React code hides it.

Why the earlier attempts didn't take effect:

- The launcher activity uses `android:theme="@style/AppTheme.NoActionBarLaunch"`, whose parent is `Theme.SplashScreen`. That chain resolves to a DeviceDefault-style theme that **has** an action bar; the `postSplashScreenTheme` (`AppTheme.NoActionBar`) only takes over once the splash API installs it.
- Because the live theme is not an AppCompat theme, `getSupportActionBar()` in `MainActivity` returns `null`, so the existing `actionBar.hide()` call silently does nothing, and `supportRequestWindowFeature(FEATURE_NO_TITLE)` does not suppress a platform (non-support) action bar.
- The activity also declares `android:label="@string/title_activity_main"`, which is the "CuizIN" text drawn in that band.

So it is fully removable — no need to cover it with an ad.

## Fix

1. `android/app/src/main/res/values/styles.xml`
   - Add the platform-prefixed flags (`android:windowActionBar` false, `android:windowNoTitle` true) alongside the AppCompat ones in `AppTheme`, `AppTheme.NoActionBar` and `AppTheme.NoActionBarLaunch`, so the band is suppressed whichever theme in the chain is active at any moment.
2. `android/app/src/main/AndroidManifest.xml`
   - Remove `android:label` from the `MainActivity` entry so there is no activity title to render. The launcher name still comes from the application-level label.
3. `android/app/src/main/java/com/geologon/cuiz/MainActivity.java`
   - Also hide the **native** action bar (`getActionBar()`), not just the support one, null-guarded — belt-and-braces for any theme that still supplies one.

## Why not put the banner ad on top of it

Not workable, and not needed:
- AdMob/LevelPlay banners are drawn by the SDK inside the app's content area, below system and app chrome — they cannot be positioned over the native action bar. The band would keep its height and the ad would sit under it.
- Covering app chrome with an ad also risks AdMob policy problems (overlapping UI, accidental clicks).

If a title band ever had to stay, the sane alternative is to **style it as our own toolbar** — dark background matching the app, CuizIN logo instead of plain text — so it reads as part of the app. The plan above removes it instead.

## After the change

These are native Android files, so the fix only shows up in a fresh build:
`git pull` → `npm install` → `npm run build` → `npx cap sync android` → rebuild and reinstall the APK. The currently installed app keeps showing the band until it is replaced.