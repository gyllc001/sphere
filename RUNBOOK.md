# Sphere Runbook

## Railway API Down / Crash Loop

### Detection
- Uptime monitor (Better Uptime / UptimeRobot) alerts within 60s of the `/health` endpoint returning non-200.
- Sentry fires an alert if >5 errors/min or a new unhandled exception appears.

### Steps to recover

1. **Check Railway dashboard** — go to https://railway.app → Sphere project → `api` service.
2. **View logs** — look for the most recent startup error or OOM message.
3. **Trigger manual redeploy**:
   ```
   railway up --service api
   ```
   Or click **Deploy** in the Railway UI.
4. **If DB is unreachable** — `GET /health` will return `{ "db": "unreachable" }`.
   - Check Neon / Railway PostgreSQL service status.
   - Verify `DATABASE_URL` env var is set in Railway environment.
5. **If crash-looping** (restarting every few seconds):
   - Set Railway restart policy to limit retries: `maxRetries: 3` in `railway.toml` (already configured).
   - Check `process.on('unhandledRejection')` logs for root cause.

### Environment variables required (Railway API service)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `SENTRY_DSN` | Sentry error reporting |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |
| `ANTHROPIC_API_KEY` | Claude AI (negotiation engine) |

### Uptime monitoring setup (one-time)

1. Sign up at https://betteruptime.com (free tier: 10 monitors).
2. Create two monitors:
   - **API**: `https://<railway-api-url>/health` — check every 60s, alert on non-200
   - **Web**: `https://<vercel-url>` — check every 60s
3. Set alert destinations to the on-call email and (optionally) Slack webhook.

### Sentry alert setup (one-time)

1. Create a project at https://sentry.io — platform: Node.js (API) + Next.js (Web).
2. Copy the DSN to Railway env: `SENTRY_DSN=https://...@o....ingest.sentry.io/...`
3. Copy the DSN to Vercel env: `SENTRY_DSN` (server) + `NEXT_PUBLIC_SENTRY_DSN` (client).
4. Set up alert rule: "Alert me when there are more than 5 errors in 1 minute" → email + Slack.

### Railway restart policy

`railway.toml` is configured with `restartPolicyType = "ON_FAILURE"` and `restartPolicyMaxRetries = 3`.
To change: update `railway.toml` and redeploy.
