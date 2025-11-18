/**
 * Shared package - utilities used by ≥2 packages (per O-1)
 */

// Types
export type {
  BoardId,
  Coordinates,
  BoardState,
  Dimensions,
  Board,
  BoardInput,
  FinalStateResult,
  Result,
} from './types.js';

export {
  createBoardId,
  isBoardId,
  createCoordinates,
  parseCoordinates,
} from './types.js';

// Validation
export {
  boardInputSchema,
  boardIdSchema,
  generationSchema,
  maxAttemptsSchema,
  createBoardRequestSchema,
  finalStateRequestSchema,
  boardIdParamSchema,
  generationParamSchema,
  createBoardResponseSchema,
  errorResponseSchema,
  successResponse,
  errorResponse,
} from './validation.js';

export type {
  CreateBoardRequest,
  FinalStateRequest,
  BoardIdParam,
  GenerationParam,
  CreateBoardResponse,
  ErrorResponse,
} from './validation.js';
