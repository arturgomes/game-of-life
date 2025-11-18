import type { BoardInput } from '@game-of-life/shared';
import type { GameBoard } from './game-engine';

/**
 * Cycle Detector Service
 * Detects stable and oscillating patterns in Conway's Game of Life
 */

/**
 * Result type for final state detection
 */
export type FinalState = {
  generation: number;
  state: BoardInput;
  status: 'stable' | 'oscillating' | 'timeout';
  period?: number; // Only defined for oscillating patterns
};

/**
 * Result wrapper following project pattern
 */
export type Result<T, E = string> = { success: true; data: T } | { success: false; error: E };

export type CycleDetectionResult = Result<FinalState, string>;

/**
 * Progress callback for streaming generation updates
 */
export type ProgressCallback = (generation: number, state: BoardInput) => void;

/**
 * Constants for cycle detection
 */
const maxHistorySize = 20; // Check last 20 states for oscillation periods

/**
 * Check if current state matches any state in history (oscillation detection)
 * @returns Period if oscillation detected, undefined otherwise
 */
function detectOscillation(nextHash: string, stateHistory: string[]): number | undefined {
  for (let j = 0; j < stateHistory.length; j++) {
    if (stateHistory[j] === nextHash) {
      return stateHistory.length - j + 1;
    }
  }
  return undefined;
}

/**
 * Check if board is stable (current state equals next state)
 */
function isStable(currentHash: string, nextHash: string): boolean {
  return currentHash === nextHash;
}

/**
 * Detect cycle in Game of Life board evolution
 *
 * Algorithm:
 * 1. Hash-based state comparison using sparse representation (O(L) per generation)
 * 2. Stable detection: current state === next state
 * 3. Oscillation detection: current state matches any of last 20 states
 * 4. Timeout: reached maxAttempts without stabilization
 *
 * @param initialBoard - Starting board state
 * @param maxAttempts - Maximum generations to simulate
 * @param onProgress - Optional callback invoked each generation
 * @returns Result with final state or error
 */
export function detectCycle(
  initialBoard: GameBoard,
  maxAttempts: number,
  onProgress?: ProgressCallback,
): CycleDetectionResult {
  // Validation (C-9: early returns)
  if (maxAttempts <= 0) {
    return { success: false, error: 'maxAttempts must be positive (>= 1)' };
  }

  const stateHistory: string[] = [];

  let currentBoard = initialBoard;
  let generation = 0;

  const initialHash = currentBoard.toStateHash();
  const initialNextBoard = currentBoard.calculateNextGeneration();
  const initialNextHash = initialNextBoard.toStateHash();

  const initialState = currentBoard.toDenseArray();
  onProgress?.(generation, initialState);

  if (isStable(initialHash, initialNextHash)) {
    return {
      success: true,
      data: {
        status: 'stable',
        generation: 0,
        state: initialState,
      },
    };
  }

  stateHistory.push(initialHash);
  currentBoard = initialNextBoard;
  generation = 1;

  onProgress?.(generation, initialNextBoard.toDenseArray());

  for (let i = 1; i < maxAttempts; i++) {
    const currentHash = currentBoard.toStateHash();
    const nextBoard = currentBoard.calculateNextGeneration();
    const nextHash = nextBoard.toStateHash();

    generation = i + 1;
    const nextState = nextBoard.toDenseArray();

    onProgress?.(generation, nextState);

    if (isStable(currentHash, nextHash)) {
      return {
        success: true,
        data: {
          status: 'stable',
          generation: i,
          state: currentBoard.toDenseArray(),
        },
      };
    }

    const period = detectOscillation(nextHash, stateHistory);
    if (period !== undefined) {
      return {
        success: true,
        data: {
          status: 'oscillating',
          generation,
          state: nextState,
          period,
        },
      };
    }

    stateHistory.push(currentHash);
    if (stateHistory.length > maxHistorySize) {
      stateHistory.shift();
    }

    currentBoard = nextBoard;
  }

  // Timeout: reached maxAttempts without stabilization
  return {
    success: true,
    data: {
      status: 'timeout',
      generation: maxAttempts,
      state: currentBoard.toDenseArray(),
    },
  };
}
