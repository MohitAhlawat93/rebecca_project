# Rebecca Data Editing Guide

Phase 7A uses one canonical public-data file:

```
data/rebecca-data.js
```

For factual changes, edit that file first. Do **not** copy the same number or rule into HTML, the concierge endpoint, or the RAG knowledge file.

## What controls what

| Change | Canonical key |
|---|---|
| Base, age, height, languages, education, style | `REBECCA_DATA.profile` |
| Homepage/About fact cards | `profile.homeFacts` and `profile.aboutFacts` |
| Singapore prices | `singapore.rates` |
| Extension amount | `singapore.extensionPerHour` |
| Couples / hosting / phone call / private-date terms | `singapore.terms` |
| Public tour windows | `travel.calendar` |
| FMTY regional minimums | `travel.fmty` |
| India / Hong Kong / London / USA / Australia / China prices | `travel.touringRates` |
| Screening | `policies.screening` |
| Deposits | `policies.deposits` |
| Cancellation rules | `policies.cancellations` |
| Boundaries / etiquette | `policies.boundaries` |
| WhatsApp / Telegram / email | `contact` |
| Public gallery counts | `gallery` |

## Example workflow

If Rebecca changes one Singapore rate:

1. Open `data/rebecca-data.js`.
2. Find the matching item inside `singapore.rates`.
3. Change the amount there only.
4. Commit the change.
5. GitHub Actions runs `npm run validate`.
6. The Rates page and concierge both read the new value from the same source.

For a new tour:

1. Add or update an item in `travel.calendar`.
2. If regional invitation rules change, update `travel.fmty`.
3. If local touring prices change, update `travel.touringRates`.
4. Do not manually rewrite `travel.html` or concierge answers.

## Architecture

```
data/rebecca-data.js
        │
        ├── content.js ──────────────> public website facts
        │
        ├── lib/rebecca-knowledge.js -> retrieval context
        │
        └── api/concierge.js ────────> direct/fallback AI answers
```

The HTML pages contain layout and editorial copy; mutable factual sections use `data-*` binding containers rendered by `content.js`.

## Validation

Run:

```bash
npm run validate
```

This checks JavaScript syntax, required canonical fields, RAG derivation, page bindings, the canonical concierge endpoint, and removal of legacy duplicate data files.

If validation fails, fix the error before deploying.

## Images

Public facts remain in `data/rebecca-data.js`, but photography has its own delivery rules. See `IMAGE_PIPELINE.md` before replacing any image URL so responsive sizes and the homepage LCP priority remain intact.
