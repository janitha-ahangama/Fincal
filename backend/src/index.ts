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

// Middleware
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FinCal API running on http://0.0.0.0:${PORT}`);
});

export default app;
