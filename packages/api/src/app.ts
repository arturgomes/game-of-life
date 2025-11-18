import express, { type Express } from 'express';
import { boardsRouter } from './routes/boards.routes.js';
import { errorHandler } from './middleware/error-handler.js';

/**
 * Express application setup
 * Per CLAUDE.md: Stateless API for horizontal scaling (NFR3)
 */

export function createApp(): Express {
  const app = express();

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
