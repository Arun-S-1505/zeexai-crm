import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database';

// Routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import leadsRoutes from './routes/leads';
import brochureDownloadsRoutes from './routes/brochureDownloads';
import scheduleRoutes from './routes/schedule';
import messagesRoutes from './routes/messages';
import campaignsRoutes from './routes/campaigns';
import directMailRoutes from './routes/directMail';
import quotationsRoutes from './routes/quotations';
import assignmentsRoutes from './routes/assignments';
import acknowledgementsRoutes from './routes/acknowledgements';
import usersRoutes from './routes/users';
import reportsRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import intakeRoutes from './routes/intake';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB Atlas
connectDB();

// Security Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://zeexai.com',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Global Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ZEE X AI CRM Backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/brochure-downloads', brochureDownloadsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/direct-mail', directMailRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/acknowledgements', acknowledgementsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/intake', intakeRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ZEE X AI CRM Backend running on port ${PORT}`);
  console.log(`🔗 Health check available at http://localhost:${PORT}/health`);
});

export default app;

