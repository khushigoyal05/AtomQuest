import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

import authRoutes from './routes/auth';
import goalRoutes from './routes/goals';
import achievementRoutes from './routes/achievements';
import checkinRoutes from './routes/checkins';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import commentRoutes from './routes/comments';
import exportRoutes from './routes/export';
import aiRoutes from './routes/ai';
import { errorHandler } from './middleware/errorHandler';
import { runEscalationCheck } from './services/escalation';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://atomquest-theta-seven.vercel.app'
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/ai', aiRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Escalation Cron (every hour) ────────────────────────────────────────────
cron.schedule('0 * * * *', async () => {
  console.log('🔔 Running escalation check...');
  await runEscalationCheck();
});

app.listen(PORT, () => {
  console.log(`🚀 AtomQuest API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
