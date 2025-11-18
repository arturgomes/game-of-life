import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorResponse } from '@game-of-life/shared';

/**
 * Global error handler middleware
 * Per CLAUDE.md: Graceful error handling (NFR2)
 */

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[Error]', error);

  // Zod validation errors
  if (error instanceof ZodError) {
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
    res.status(500).json(errorResponse(error.message));
    return;
  }

  // Unknown errors
  res.status(500).json(errorResponse('Internal server error'));
}
