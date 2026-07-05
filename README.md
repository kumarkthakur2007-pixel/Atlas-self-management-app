# Atlas — PWA build

This folder turns Atlas into a fully installable Progressive Web App.

## Why you can't just double-click index.html anymore

Service workers (offline support, caching, installability) only run on `http://` or `https://` — never on `file://`. To test installability, "Add to Home Screen," and offline mode, you need to serve these files over a local server.

## Run it locally (pick one)

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# VS Code
Right-click index.html → "Open with Live Server"
```

Then open `http://localhost:8080` (use your machine's LAN IP instead of localhost to test install on a phone on the same Wi-Fi).

## Deploy it for real

Upload this whole folder as-is to any static host with HTTPS — GitHub Pages, Netlify, Vercel, Cloudflare Pages, Firebase Hosting. HTTPS is required for service workers outside of localhost.

## What's in here

- `index.html` — the app (unchanged UI, same Glassmorphism theme)
- `manifest.json` — app name, icons, theme color, standalone display mode
- `service-worker.js` — app-shell caching + offline fallback
- `offline.html` — shown when there's no network and nothing cached yet
- `icons/` — app icon at 72, 96, 128, 144, 152, 192, 384, 512px, generated from your logo

## What changed vs. the previous single-file version

- **Installable** — manifest + service worker registered; Chrome/Edge/Samsung Internet on Android will offer "Add to Home Screen"; a custom "Install Atlas" banner also appears (dismissible, never shown once installed)
- **Offline support** — app shell, icons, and previously visited data are cached; `offline.html` shows if a page was never cached and the network is down; a small "Offline" badge appears in the top bar
- **Sidebar scrolling fixed** — the logo header and account footer are now fixed; the nav links scroll independently in between, with momentum scrolling on Android and no clipping on small screens
- **Search fixed** — the top bar search is now a real cross-module live search (tasks, journal, habits, goals, study subjects, expenses) with a results dropdown; task search now also matches notes/category, not just the title
- **Back button fixed** — in-app navigation now uses `history.pushState`/`popstate`, so Back moves between Atlas pages instead of closing the app; pressing Back on the Dashboard shows "Press back again to exit Atlas" and only exits if pressed again within 2 seconds
- **State persistence** — current page, task/goal filters, and each module's search text are remembered per user and restored after a refresh or relaunch
- **Performance** — Chart.js/Lucide load with `defer`, below-the-fold logo images use `loading="lazy"`, and the service worker caches fonts/scripts/icons for faster repeat loads

No visual, color, spacing, typography, or animation changes were made.
