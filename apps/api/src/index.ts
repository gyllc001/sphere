import 'dotenv/config';
import { initSentry, Sentry } from './lib/sentry';
initSentry(); // must be called before any other imports that might throw
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import brandAuthRoutes from './routes/brands.auth';
import communityAuthRoutes from './routes/communities.auth';
import campaignRoutes from './routes/campaigns';
import communityPortalRoutes from './routes/community-portal';
import matchingRoutes from './routes/matching';
import dealRoutes from './routes/deals';
import contentSubmissionRoutes from './routes/content-submissions';
import metricsRoutes from './routes/metrics';
import adminRoutes from './routes/admin';
import messageRoutes from './routes/messages';
import disputeRoutes from './routes/disputes';
import billingRoutes, { stripeWebhookHandler } from './routes/billing';

const app = express();
const PORT = process.env.PORT || 4000;
const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
console.log(`[startup] PORT=${PORT} NODE_ENV=${process.env.NODE_ENV} DATABASE_URL=${process.env.DATABASE_URL ? 'set' : 'MISSING'}`);

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Stripe webhook must receive raw body — mount before express.json()
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json());

app.get('/health', async (_req, res) => {
  let dbOk = false;
  try {
    await dbPool.query('SELECT 1');
    dbOk = true;
  } catch {
    // db unreachable
  }
  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    version: process.env.npm_package_version,
    db: dbOk ? 'connected' : 'unreachable',
    ts: new Date().toISOString(),
  });
});

app.use('/api/brands/auth', brandAuthRoutes);
app.use('/api/communities/auth', communityAuthRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/owner', communityPortalRoutes);
app.use('/api/campaigns', matchingRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/deals/:dealId/content', contentSubmissionRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/admin', express.text({ type: ['text/csv', 'text/plain'] }), adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/billing', billingRoutes);

// Sentry error handler — must be before the generic error handler
app.use(Sentry.expressErrorHandler());

// Global error handler — prevent unhandled async route errors from crashing the process
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled route error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  Sentry.captureException(reason);
});

app.listen(PORT, () => {
  console.log(`Sphere API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

export default app;
