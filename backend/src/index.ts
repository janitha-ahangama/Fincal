import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db } from './config/firebase';
import dotenv from 'dotenv';

dotenv.config();

// Routes
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import recurringRoutes from './routes/recurring';
import dashboardRoutes from './routes/dashboard';
import budgetRoutes from './routes/budgets';
import insightsRoutes from './routes/insights';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware (CORS)
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];

app.use(cors({
    origin: (origin, callback) => {
        // Reflect the request origin back to allow any site to hit the API during debugging
        // This is necessary because Chrome/Firefox block '*' when credentials: true
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
}));

// Robust Request Log for Vercel debugging
app.use((req, _res, next) => {
    console.log(`[DEBUG] Incoming Request: ${req.method} ${req.originalUrl || req.url}`);
    console.log(`[DEBUG] Path: ${req.path}, Origin: ${req.headers.origin || 'none'}`);
    next();
});

app.get('/debug', (req, res) => {
    res.json({
        url: req.url,
        path: req.path,
        headers: req.headers,
        envKeys: Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('PRIVATE')),
        nodeEnv: process.env.NODE_ENV
    });
});

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.status(200).json({ message: 'FinCal API is running', env: process.env.NODE_ENV });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/insights', insightsRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 FinCal API running on http://0.0.0.0:${PORT}`);
    });
}

export default app;
