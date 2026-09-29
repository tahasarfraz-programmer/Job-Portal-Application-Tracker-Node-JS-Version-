import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 50 }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
connectDB().then(() => app.listen(port, () => console.log(`API listening on :${port}`))).catch((e) => { console.error(e.message); process.exit(1); });
