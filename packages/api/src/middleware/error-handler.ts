import { errorResponse } from '@game-of-life/shared';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { createModuleLogger } from '../config/logger.js';

/**
 * Global error handler middleware
 */

const logger = createModuleLogger('error-handler');

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (error instanceof ZodError) {
    logger.warn({ error: error.issues, path: req.path }, 'Validation error');
    res.status(400).json(
      errorResponse('Validation error', {
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }),
    );
    return;
  }

  // Standard errors
  if (error instanceof Error) {
    logger.error({ error: error.message, stack: error.stack, path: req.path }, 'Request error');
    res.status(500).json(errorResponse(error.message));
    return;
  }

  // Unknown errors
  logger.error({ error, path: req.path }, 'Unknown error');
  res.status(500).json(errorResponse('Internal server error'));
}
