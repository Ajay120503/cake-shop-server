import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

import { corsOptions } from './config/cors.js';
import { errorHandler, notFound } from './middleware/error.js';
import logger from './utils/logger.js';
import apiRoutes from './routes/index.js';

const app = express();

// =====================
// Global Middlewares
// =====================

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// Sanitize data (against NoSQL injection)
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: ['category', 'price', 'rating', 'tags', 'sort'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// =====================
// API Routes
// =====================
app.use('/api/v1', apiRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎂 Welcome to Cake Shop API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
  });
});

// =====================
// Error Handling
// =====================
app.use(notFound);
app.use(errorHandler);

export default app;
