# Current work

- [x] Make the admin sitemap counter and validator discover all sitemaps and compare unique question coverage with the full database

- [x] Unify native banner ownership and route spacers
- [x] Correct measured banner placement and 20-second refresh
- [x] Serialize native ad transitions and quiz advancement
- [x] Validate mobile/web rendering and Android integration
- [ ] Replace placeholder lines in public/app-ads.txt with exact lines from LevelPlay dashboard (Setup -> App-ads.txt), then rebuild APK (npm run build && npx cap sync android)
- [x] Realign the homepage leader portrait and restore the banner below Speed Quizzing
- [x] Wait for native full-screen ads to finish before resolving rewards and navigation
- [x] Route homepage mini-game buttons to the web mini-game pages

- [x] Advisor shard lifelines usable in quiz, quests and daily challenge; shards persist until spent
- [x] Replace all web Adsterra placements with the native banner unit
- [x] Push notifications: device registration (web + Android), admin Push panel with Infantry / inactive / all segments
- [ ] Add FIREBASE_SERVICE_ACCOUNT secret (Firebase service account JSON) — waiting on user
- [ ] Add android/app/google-services.json and rebuild APK for Android push — waiting on user
- [ ] Automated daily streak / Infantry reminders (schedule) — after manual sends are confirmed working
