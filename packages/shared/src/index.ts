/**
 * Shared package - utilities used by ≥2 packages (per O-1)
 */

// Types
export type {
  Board,
  BoardId,
  BoardInput,
  BoardState,
  Coordinates,
  Dimensions,
  FinalStateResult,
  MutableBoardInput,
  Result,
} from './types.js';

export {
  createBoardId,
  createCoordinates,
  isBoardId,
  parseCoordinates,
} from './types.js';
export type {
  BoardIdParam,
  CreateBoardRequest,
  CreateBoardResponse,
  ErrorResponse,
  FinalStateRequest,
  GenerationParam,
} from './validation.js';
// Validation
export {
  boardIdParamSchema,
  boardIdSchema,
  boardInputSchema,
  createBoardRequestSchema,
  createBoardResponseSchema,
  errorResponse,
  errorResponseSchema,
  finalStateRequestSchema,
  generationParamSchema,
  generationSchema,
  maxAttemptsSchema,
  successResponse,
} from './validation.js';
