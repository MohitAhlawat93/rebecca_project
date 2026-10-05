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

1. `data/rebecca-data.js` remains the canonical safe fallback for Rebecca’s public facts.
2. RC-02 can overlay owner-approved runtime changes from Rebecca Control through `lib/admin-store.js`.
3. `content.js` loads the effective public state from `/api/public-content` and falls back to the bundled canonical data if runtime storage is unavailable.
4. `lib/rebecca-knowledge.js` builds retrieval chunks from the same effective state.
5. `api/concierge.js` uses that same effective state for direct, fallback and RAG-grounded answers.
6. `npm run validate` checks canonical bindings, admin authentication and the RC-02 Quick Control data flow.

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

- **Owner-managed changing facts after RC-02 is connected: `/admin` → Quick Control**
- Canonical fallback/default factual data: `data/rebecca-data.js`
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


## Rebecca Control — RC-01 foundation

RC-01 introduces a private owner-only control surface at `/admin` without changing the public website experience.

Security model:
- Owner credentials are configured only through Vercel environment variables.
- Password verification uses scrypt; the plaintext password is never committed to GitHub.
- Successful sign-in creates a short-lived, signed, HttpOnly, SameSite=Strict session cookie.
- Admin HTML and API responses are `no-store` and `noindex`.
- Repeated failed sign-in attempts receive a lightweight server-side rate limit.
- The dashboard is read-only in RC-01 and proves it can read the existing `data/rebecca-data.js` single source of truth.

Required environment variables:
- `RC_ADMIN_LOGIN_ID`
- `RC_ADMIN_PASSWORD_HASH` using `scrypt$N$r$p$salt$hash`
- `RC_SESSION_SECRET` with at least 32 characters

RC-02 will add controlled editing behind this same authentication boundary. Persistent editable content should use an isolated Rebecca-specific datastore rather than another client's database.


## Rebecca Control — RC-02 Quick Control

RC-02 turns the RC-01 owner shell into a practical, mobile-first control surface for the information Rebecca changes most often.

Rebecca can manage:
- availability status and public availability message
- public travel windows
- Singapore rate amounts, visibility and featured state
- official contact information
- repeated profile facts such as base, age display, height, heritage and languages

Runtime flow:

```text
Rebecca Control
      ↓
Rebecca-only content store
      ↓
effective public state
   ↙          ↘
website     concierge
```

Safety and fallback rules:
- Routine edits do not require a GitHub commit or Vercel deployment.
- If runtime storage cannot be reached, the public website and concierge fall back to `data/rebecca-data.js`.
- Save is disabled/rejected when persistent storage is not configured; the UI never pretends an edit was published.
- The Supabase secret is server-only and must never be exposed to browser code.
- No visitor, enquiry, screening or customer data is introduced by RC-02.
- WhatsApp and Telegram URLs are derived from the owner-friendly phone/handle fields so Rebecca does not manage technical URLs manually.
- Availability selections suggest sensible public wording automatically.
- Travel labels are derived where possible to reduce duplicate editing.

RC-02 storage environment variables:
- `RC_SUPABASE_URL`
- `RC_SUPABASE_SECRET_KEY`

Use a **Rebecca-specific Supabase project only**. Do not reuse another client or project database. Apply `supabase/rc-02-quick-control.sql` to that database before enabling writes.

RC-02 validation:
- `npm run validate:quick-control`
- `npm run validate`
