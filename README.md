# Risqué Rebecca — Premium Website & AI Concierge

The current build is the Phase 6 editorial demo: Rebecca-first, responsive, privacy-conscious and built from her approved public website content and media.

## Public routes

- `/` — premium homepage
- `/about` — profile and personality
- `/rates` — current Singapore consideration
- `/travel` — touring and fly-me-to-you guidance
- `/date-ideas` — public date inspiration, wishlist direction and the private-list handoff
- `/gallery` — curated gallery hub
- `/professional` — complete 67-photo professional portrait archive
- `/selfies-of-risquerebecca` — complete 44-photo candid archive
- `/etiquette` — screening, deposits, privacy and policies
- `/reviews` — selected public testimonials
- `/contact` — privacy-first enquiry builder

## Rebecca’s Concierge

The concierge uses a lightweight local RAG pipeline:

1. `data/rebecca-data.js` is the single source of truth for mutable public facts: profile, rates, travel, policies, contact, date ideas, wishlist and gallery counts.
2. `content.js` renders factual website sections from that source.
3. `lib/rebecca-knowledge.js` derives retrieval chunks from the same source.
4. `api/concierge.js` derives direct and fallback answers from the same source before using Groq for broader grounded responses.
5. GitHub Actions runs `npm run validate:data` to catch missing bindings or accidental re-introduction of legacy duplicate data.

The default dynamic model is `openai/gpt-oss-20b` with reasoning disabled for speed and cost control. Set `GROQ_MODEL` to override it.

### Required Vercel environment variable

- `GROQ_API_KEY` — Groq API key used by `/api/chat`
- `GROQ_MODEL` — optional model override; defaults to `openai/gpt-oss-20b`

Without `GROQ_API_KEY`, the concierge still works for core public topics through the grounded fallback, but broader RAG-generated answers will not call Groq.

### RAG privacy boundary

The retrieval store is derived from the same canonical data used by the website. Do not maintain a second manual copy of profile, rates, travel, policies or contact facts inside concierge code.

The locked private Date Ideas venue list is deliberately excluded. The concierge must not reveal, guess or reconstruct it.

### Privacy rules

- Do not send ID documents, employer documents, financial information, passwords or other sensitive screening material to the concierge.
- Concierge history remains in the browser and is not replayed as trusted server context.
- Groq Responses requests use `store: false`.
- The enquiry builder does not submit visitor data to a database; it formats the enquiry locally for Rebecca’s verified channels.

## Main edit locations

- **Rebecca factual data (edit here first): `data/rebecca-data.js`**
- Page layout/editorial copy: each `.html` page
- Canonical-data page renderer: `content.js`
- Shared design system: `styles.css`
- Navigation, enquiry builder and concierge UI: `script.js`
- Derived RAG knowledge + retrieval: `lib/rebecca-knowledge.js`
- Concierge server endpoint: `api/concierge.js`
- Data validation: `scripts/validate-data.mjs`
- Vercel routing/security settings: `vercel.json`

## Production readiness

GitHub `main` is connected to Vercel. Production deployment is triggered by the eventual Phase 6 merge.

- Legacy paths with direct equivalents are either preserved as real pages or permanently redirected.
- `/professional` and `/selfies-of-risquerebecca` are preserved as real pages.
- CSP and baseline security headers are configured in `vercel.json`.
- `robots.txt`, `sitemap.xml`, canonical URLs and homepage structured data are prepared for the review domain.
- At custom-domain cutover, replace review-domain canonical/OG/sitemap/structured-data URLs with `https://www.risquerebecca.com`.
- See `LAUNCH_CHECKLIST.md` for the final cutover sequence.


## Rebecca Control — RC-01 + RC-02 integrated

The current site includes the private Rebecca Control foundation and Quick Control editor at `/admin`.

- RC-01: server-side owner authentication, signed HttpOnly session, login throttling, noindex/no-store admin boundary.
- RC-02: availability, travel, Singapore rates, contact details and core profile facts in one mobile-first editor.
- Public pages and the AI concierge consume the same effective runtime content.
- `data/rebecca-data.js` remains the fail-safe fallback if persistent runtime storage is unavailable.
- Normal owner edits do not require GitHub or a Vercel deployment after Rebecca's isolated runtime store is connected.
- Quick Control persists through a least-privilege Supabase RLS store using `RC_SUPABASE_URL`, `RC_SUPABASE_PUBLISHABLE_KEY` and a server-only `RC_STORE_SECRET`. The website never needs a Supabase service-role/master key.


### RC-02B persistence

Rebecca Control uses a deliberately narrow persistence model:

- Vercel holds a Supabase publishable key plus a separate high-entropy `RC_STORE_SECRET`.
- The browser never receives either the control secret or direct database access.
- Supabase RLS checks the server-only `x-rc-control-secret` header for the single `current` row.
- `anon` receives column-level SELECT/UPDATE only for the public content fields. It cannot insert/delete rows or read/change the stored secret hash.
- Optimistic version checks prevent one admin session from silently overwriting a newer edit.
- `data/rebecca-data.js` stays the canonical fail-safe if storage cannot be reached.

Required Vercel environment variables:
- `RC_SUPABASE_URL`
- `RC_SUPABASE_PUBLISHABLE_KEY`
- `RC_STORE_SECRET`

The current testing database belongs to Mohit's Supabase account. Before handoff, reproduce `supabase/rc-02-quick-control.sql` in Rebecca's Supabase project, set a fresh `RC_STORE_SECRET`, copy the current payload, and replace only these environment values.


## Rebecca Control — RC-03 Media & Publishing

RC-03 adds a safe media workflow without replacing the preserved photography archive.

Owner workflow:

```text
Upload / choose photos
        ↓
Save Draft
        ↓
Private Preview
        ↓
Publish
        ↓
Live website
```

Key behavior:
- Existing curated Squarespace images remain the safe fallback.
- New uploads go directly from the owner's browser to the project's public Vercel Blob store.
- Upload authorization requires a valid Rebecca Control owner session.
- Accepted formats: JPG, PNG, WebP and AVIF, up to 25 MB.
- A media Draft never changes the public website.
- Private draft preview uses `?rc_preview=1` and requires the authenticated owner session.
- Published media overrides only the selected curated placement; the legacy professional/candid archives stay intact.
- Published history retains up to 12 previous states. Restore sends an older version back to Draft first; it does not silently republish it.
- Optimistic version matching protects against one admin tab overwriting newer media edits.
- Blob images are supported by the existing rotators without Squarespace-specific resize query parameters.

Current editable placements:
- Homepage rotation
- About feature + About editorial
- Reviews
- Travel
- Favourites hero + editorial
- Journal
- Press
- Gallery professional/candid previews
- Date ideas
- Etiquette

Storage:
- image files → Vercel Blob store `rebecca-media`
- draft / published metadata / history → Supabase `rebecca_media_state`
- portable schema → `supabase/rc-03-media-publishing.sql`

The current Supabase state is temporary in Mohit's account. At Rebecca handoff, apply the schema in her project, use a fresh `RC_STORE_SECRET`, copy the media state, and update the existing Vercel persistence environment variables. Media files can remain in the project's Blob store while the same Vercel project is retained; otherwise migrate Blob assets during infrastructure handoff.
