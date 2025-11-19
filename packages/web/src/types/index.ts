/**
 * Type definitions for the Game of Life frontend
 * Reuses types from @game-of-life/shared and adds frontend-specific types
 */

// Re-export shared types
export type {
  CreateBoardRequest,
  CreateBoardResponse,
  Dimensions,
  MutableBoardInput,
} from '@game-of-life/shared';

/**
 * Frontend Result type - uses string for errors (not Error objects)
 * This is different from shared's Result type which uses Error
 */
export type Result<T> = { success: true; data: T } | { success: false; error: string };

/**
 * WebSocket message types for R4 final state streaming
 * Uses MutableBoardInput for frontend state compatibility
 */
export type WebSocketMessage = ProgressMessage | FinalMessage | ErrorMessage;

export type ProgressMessage = {
  type: 'progress';
  generation: number;
  state: number[][];
};

export type FinalMessage = {
  type: 'final';
  generation: number;
  status: 'stable' | 'oscillating' | 'timeout';
  period?: number | undefined; 
  state: number[][];
};

export type ErrorMessage = {
  type: 'error';
  error: string;
};

/**
 * Frontend-specific types for R4 final state result
 */
export type FinalStateResult = {
  status: 'stable' | 'oscillating' | 'timeout';
  generation: number;
  period?: number | undefined; 
  state: number[][];
};

export type AppMode = 'editor' | 'visualizing' | 'streaming';

export type Pattern = {
  name: string;
  description: string;
  dimensions: { rows: number; cols: number };
  state: number[][];
};
