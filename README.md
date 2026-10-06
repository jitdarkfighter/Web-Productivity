# Web Wellbeing (Firefox extension)

Local-only browsing analytics per domain, per day: **active time, visits, link clicks**.

## Load temporarily
1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and select `manifest.json` in this folder.
3. Browse a few sites, then click the toolbar icon to see today's stats; use the dropdown for previous days.

## Testing tips
- Switch tabs/windows: time should stop for the previous domain and resume on return.
- Click a link (also ctrl/middle-click): +1 click on the originating domain, +1 visit on the destination. Buttons and `#anchor` links are ignored.
- Inspect data: `about:debugging` → Inspect → Storage → Extension Storage (`days` key).
- Midnight: time is split at local midnight; a new day key starts automatically.

## Design
- `src/background.js` – tracking (tabs, windows, webNavigation, idle, alarms)
- `src/content.js` – link-click detection
- `src/store.js` – serialised writes to `storage.local`
- `src/util.js` – domain/day/format helpers
- `popup/` – UI

## Privacy
All data stays in `browser.storage.local`. No network requests, no remote code; works offline and persists across restarts. Idle (2 min) pauses timing; `www.` is stripped when grouping domains.

## Seeing "previous days" quickly
Open the extension's **Inspect** console (about:debugging) and run:
```js
browser.storage.local.get("days").then(({days}) => {
  days["2026-10-05"] = {"youtube.com": {time: 2520000, visits: 18, clicks: 35}};
  return browser.storage.local.set({days});
})
```
The popup then shows it under "Previous days" and via the ‹ › arrows.

## Notes
- The popup includes the currently running session, so time updates live (refreshes every 5 s).
- Durations are shown in minutes (`<1 min` for under a minute).
- After loading the extension, reload already-open tabs so link-click counting starts there.
