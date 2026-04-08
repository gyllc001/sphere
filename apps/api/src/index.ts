import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import brandAuthRoutes from './routes/brands.auth';
import communityAuthRoutes from './routes/communities.auth';
import campaignRoutes from './routes/campaigns';
import communityPortalRoutes from './routes/community-portal';
import matchingRoutes from './routes/matching';
import dealRoutes from './routes/deals';
import contentSubmissionRoutes from './routes/content-submissions';
import metricsRoutes from './routes/metrics';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: process.env.npm_package_version });
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

// Global error handler — prevent unhandled async route errors from crashing the process
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled route error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`Sphere API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

export default app;
