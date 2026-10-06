# Rebecca image library — Phase 7H

`data/rebecca-images.js` is the canonical public photo inventory.

The 2026-10-06 audit compared the preserved redesign archive with Rebecca's current public Squarespace site. Squarespace path encodings such as `+` and `%2B` are normalized before deduplication.

Canonical archive:
- 81 professional photographs
- 82 candid photographs
- 163 distinct archive photographs total
- 23 additional current-site-only visual assets retained for future editorial use

Run `npm run sync:images` after changing the library, then `npm run validate`.

Images remain on Rebecca's approved Squarespace CDN and use bounded responsive variants. Original full-resolution binaries are not committed to GitHub.

Editorial motion stays restrained: one-time scroll reveal, 10.5-second crossfades on selected chapters, tiny desktop-only parallax, no mobile parallax, and full `prefers-reduced-motion` support.
