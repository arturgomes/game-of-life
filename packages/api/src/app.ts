import express, { type Express } from 'express';
import { httpLogger } from './config/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { boardsRouter } from './routes/boards.routes.js';

/**
 * Express application setup
 */

export function createApp(): Express {
  const app = express();

  // HTTP request logging middleware
  app.use(httpLogger);

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/boards', boardsRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
