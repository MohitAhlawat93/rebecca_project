# Concierge 2.0 — Phase 7D

## What changed

Concierge 2.0 separates booking logic from free-form conversation.

```text
visitor message
   ↓
guardrails
   ↓
deterministic booking planner
   ↓
canonical Rebecca data
   ↓
structured answer + next actions
   ↓
grounded RAG only when planner/direct rules do not cover the question
```

The planner lives in:

```text
lib/concierge-planner.js
```

The API remains:

```text
api/concierge.js
```

## Deterministic booking facts

The language model does not calculate these:

- Singapore duration/rate matching
- India, Hong Kong, London, USA, Australia and China touring-rate matching
- FMTY public minimums
- Singapore / touring / FMTY deposit type
- couples surcharge
- live-availability restriction
- enquiry handoff links

Those values come from `data/rebecca-data.js`.

## Conversation memory

The browser sends the recent chat history. The planner can therefore handle follow-ups such as:

```text
I will be in Singapore on 18 November.
Actually make it 8 hours.
```

The second message keeps the location/date context while changing only the duration.

## Structured actions

Planner responses can return actions such as:

- Draft my enquiry
- Date ideas
- View rates
- Travel guidance
- Contact Rebecca
- WhatsApp Rebecca
- Telegram Rebecca
- Email Rebecca
- Copy enquiry

Sensitive screening material must never be collected in the concierge.

## Page awareness

The client sends the current path to the concierge. Starter prompts change on:

- /rates
- /travel
- /date-ideas
- /etiquette
- /contact

The site remains editorial first; the AI adapts quietly to the page.

## Mobile contract

On phones up to 640px:

- the panel must not become full screen
- target width is `min(340px, calc(100vw - 40px))`
- target height is `min(58svh, 480px)`
- opening the panel must not automatically focus the text input
- the keyboard should appear only when the visitor taps the input
- the background overlay stays subtle

Run:

```bash
npm run validate:concierge
npm run validate
```

before merging.
