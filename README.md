# Risqué Rebecca — Premium Website & AI Concierge

Phase 2 is a complete, responsive editorial website for Rebecca, built from her approved public content and photography.

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

`/api/chat` uses the Vercel AI SDK and AI Gateway with `openai/gpt-5.6-luna`. The prompt is grounded in `lib/rebecca-knowledge.js` and refuses to invent private availability, exact tour dates or unpublished information.

If the AI provider is unavailable, the endpoint automatically falls back to grounded deterministic answers for the core topics, so the concierge does not become a dead end.

### Privacy rules

The concierge and enquiry builder explicitly tell visitors not to send ID documents, employer details, financial data or other sensitive screening information. The enquiry form does not submit data to a database; it formats the visitor's input locally for email/copying into Rebecca's verified channels.

## Main edit locations

- Content and page layout: each `.html` page
- Shared design system: `styles.css`
- Navigation, enquiry builder and concierge UI: `script.js`
- Concierge knowledge: `lib/rebecca-knowledge.js`
- Concierge server endpoint: `api/chat.js`
- Vercel settings: `vercel.json`

## Deployment

GitHub main branch is connected to Vercel. Every push to `main` triggers a deployment.
