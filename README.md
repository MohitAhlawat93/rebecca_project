# Risqué Rebecca — Premium Website & AI Concierge

The current build is the Phase 5 production-ready demo: a responsive editorial website for Rebecca, built from her approved public content and photography.

## Public routes

- `/` — premium homepage
- `/about` — profile and personality
- `/rates` — current Singapore consideration
- `/travel` — touring and fly-me-to-you guidance
- `/date-ideas` — date ideas and wishlist direction
- `/gallery` — editorial portfolio
- `/etiquette` — screening, deposits, privacy and policies
- `/reviews` — selected public testimonials
- `/contact` — privacy-first enquiry builder

## AI concierge

`/api/chat` uses the Vercel AI SDK and AI Gateway with `openai/gpt-5.6-luna`. High-risk factual topics use grounded deterministic answers first; broader questions use the model against `lib/rebecca-knowledge.js`. The endpoint refuses to invent private availability, exact private tour details or unpublished information.

If the AI provider is unavailable, the endpoint automatically falls back to grounded deterministic answers for the core topics, so the concierge does not become a dead end.

### Privacy rules

The concierge and enquiry builder explicitly tell visitors not to send ID documents, employer details, financial data or other sensitive screening information. Concierge history remains in the browser and is not trusted or replayed to the server. The enquiry form does not submit data to a database; it formats the visitor's input locally for email/copying into Rebecca's verified channels.

## Main edit locations

- Content and page layout: each `.html` page
- Shared design system: `styles.css`
- Navigation, enquiry builder and concierge UI: `script.js`
- Concierge knowledge: `lib/rebecca-knowledge.js`
- Concierge server endpoint: `api/chat.js`
- Vercel settings: `vercel.json`

## Deployment

GitHub main branch is connected to Vercel. Every push to `main` triggers a deployment.


## Production readiness

- Legacy public URLs with direct equivalents are permanently redirected in `vercel.json`.
- CSP and baseline security headers are configured in `vercel.json`.
- `robots.txt`, `sitemap.xml`, canonical URLs and homepage structured data are ready for the review domain.
- At custom-domain cutover, replace review-domain canonical/OG/sitemap/structured-data URLs with `https://www.risquerebecca.com`.
- See `LAUNCH_CHECKLIST.md` for the cutover sequence.
