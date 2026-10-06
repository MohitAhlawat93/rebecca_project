# Newsletter integration

The public form is implemented but stays disabled until Rebecca's provider/account details are supplied.

Set these Vercel environment variables later:
- `NEWSLETTER_WEBHOOK_URL` — HTTPS webhook from the newsletter provider, Make, Zapier or another approved automation layer.
- `NEWSLETTER_WEBHOOK_TOKEN` — optional bearer token.

No code change is required after configuration. The form checks `GET /api/newsletter` and enables itself automatically. The website does not maintain its own mailing-list database; the configured provider handles storage, consent, unsubscribe and any double opt-in.
