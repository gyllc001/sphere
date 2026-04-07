import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

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

// Routes will be registered here as features are built
// import authRoutes from './routes/auth';
// import brandRoutes from './routes/brands';
// import communityRoutes from './routes/communities';
// import campaignRoutes from './routes/campaigns';
// app.use('/api/auth', authRoutes);
// app.use('/api/brands', brandRoutes);
// app.use('/api/communities', communityRoutes);
// app.use('/api/campaigns', campaignRoutes);

app.listen(PORT, () => {
  console.log(`Sphere API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

export default app;
