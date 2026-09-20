# Replace web Adsterra units with the native banner

## Changes
- Replace every stored Adsterra web slot with the supplied native banner code while preserving each slot's active/inactive status and placement.
- Normalize older cached Adsterra banner code in the browser so returning visitors immediately receive the native unit.
- Render each native unit in an isolated ad frame so the repeated container ID works safely when several ads appear on one page.
- Keep native Android/iOS advertising unchanged and retain the malicious-domain blocklist.

## Validation
- Check that old Adsterra banner keys no longer render.
- Verify multiple native units can mount independently on one web page without duplicate-container conflicts.
- Run the project type check and inspect the homepage in the browser.

## Technical details
- Apply a database migration only to `ad_slots` rows containing known Adsterra/High Performance Format code.
- Preserve inactive slots; only active slots will continue to render.
