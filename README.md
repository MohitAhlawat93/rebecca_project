# Risqué Rebecca — Phase 1 Homepage

A premium, editorial, mobile-first homepage concept for Rebecca.

## Phase 1 direction
- Warm ivory / ink / muted sage / deep wine palette
- Editorial typography and large photography
- Spacious layout rather than a dashboard-like AI aesthetic
- Concierge presence is intentionally restrained and preview-only
- Uses Rebecca's currently approved public photography from her existing Squarespace CDN
- No video

## Files
- `index.html` — homepage structure and copy
- `styles.css` — full design system and responsive styling
- `script.js` — header, concierge dialog, review carousel
- `vercel.json` — deployment headers and routing defaults

## Local preview
Run any static server from the repo root, for example:

```bash
python -m http.server 4173
```

Then visit `http://localhost:4173`.

## Content editing
Most homepage copy is intentionally in `index.html` so it remains visible to search engines and easy to change without touching application logic. Brand colors and spacing are CSS variables at the top of `styles.css`.
