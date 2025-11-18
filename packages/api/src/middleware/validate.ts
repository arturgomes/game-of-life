import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Validation middleware using Zod
 * Per CLAUDE.md: Input validation on all endpoints
 */

type ValidationTarget = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const validated = schema.parse(data);
      req[target] = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
}
