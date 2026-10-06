# Rebecca Image Pipeline — Phase 7C

## Current production contract

The demo currently uses Rebecca's already-approved public Squarespace image assets.

Do **not** paste raw/original image URLs into page markup without responsive attributes. Every public `<img>` must use:

- a bounded fallback `src`
- responsive `srcset`
- an accurate `sizes` hint
- `decoding="async"`
- `loading="lazy"` unless it is the homepage LCP image
- `fetchpriority="high"` only for the homepage LCP image

Squarespace currently provides 100, 300, 500, 750, 1000, 1500 and 2500-pixel image variants and serves modern WebP output. Phase 7C uses those variants directly instead of making mobile visitors download the original asset.

## Current responsive roles

| Role | Intended display |
| --- | --- |
| `hero` | Homepage LCP. Eager + high priority. |
| `home-editorial` | Homepage editorial/gallery photography. Lazy. |
| `page-editorial` | About, Rates, Travel, Etiquette, Reviews, Contact and Date Ideas portrait. Lazy. |
| `gallery-preview` | Main gallery edit. Lazy. |
| `archive-professional` | 67-image professional archive. Lazy. |
| `archive-candid` | 44-image candid archive. Lazy. |

Run:

```bash
npm run validate:images
```

before merging image changes.

## When Rebecca supplies replacement originals

Do **not** commit full-resolution masters to GitHub.

1. Keep an untouched master copy in private archival storage.
2. Upload public web derivatives to a dedicated object-storage/CDN bucket controlled by the project.
3. Retain at least the equivalent responsive widths used by this site.
4. Prefer automatic AVIF/WebP negotiation at the CDN layer, with a safe fallback format.
5. Preserve the same image roles and `sizes` contract in HTML.
6. Replace public URLs in one phase, then run `npm run validate`.
7. Visually inspect crop/focal point on desktop and mobile before production promotion.

## Why the originals are not mirrored into Git

Git is a source-code store, not the master media archive. Mirroring 111 full-resolution photographs into repository history would make clones, diffs and future media changes unnecessarily heavy. The current CDN remains the approved demo source until the replacement-original handoff.
