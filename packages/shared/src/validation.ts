import { z } from 'zod';

/**
 * Validation schemas using Zod
 * Per CLAUDE.md: Input validation on all endpoints
 */

// Cell value: 0 (dead) or 1 (alive)
const cellSchema = z.union([z.literal(0), z.literal(1)]);

// Board input: 2D array of cells
export const boardInputSchema = z
  .array(z.array(cellSchema))
  .min(1, 'Board must have at least one row')
  .refine((board) => board.every((row) => row.length === board[0]?.length), {
    message: 'All rows must have the same length',
  })
  .refine((board) => (board[0]?.length ?? 0) > 0, {
    message: 'Board must have at least one column',
  });

// BoardId validation
export const boardIdSchema = z.string().uuid('BoardId must be a valid UUID');

// Generation number (X) for R3
export const generationSchema = z.coerce
  .number()
  .int('Generation must be an integer')
  .positive('Generation must be positive (≥1)');

// Max attempts for R4
export const maxAttemptsSchema = z.coerce
  .number()
  .int('Max attempts must be an integer')
  .positive('Max attempts must be positive')
  .max(100000, 'Max attempts cannot exceed 100000');

/**
 * Request body schemas
 */

// R1: POST /boards
export const createBoardRequestSchema = z.object({
  board: boardInputSchema,
});

export type CreateBoardRequest = z.infer<typeof createBoardRequestSchema>;

// R4: POST /boards/:boardId/final
export const finalStateRequestSchema = z.object({
  maxAttempts: maxAttemptsSchema,
});

export type FinalStateRequest = z.infer<typeof finalStateRequestSchema>;

/**
 * Response schemas
 */

// R1 response
export const createBoardResponseSchema = z.object({
  boardId: boardIdSchema,
});

export type CreateBoardResponse = z.infer<typeof createBoardResponseSchema>;

// Error response
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Success response wrapper
export function successResponse<T>(data: T) {
  return { success: true as const, data };
}

export function errorResponse(error: string, details?: Record<string, unknown>) {
  return { success: false as const, error, details };
}
