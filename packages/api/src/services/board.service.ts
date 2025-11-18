import type { Board, BoardId, BoardInput, BoardState, Result } from '@game-of-life/shared';
import { createBoardId, createCoordinates } from '@game-of-life/shared';
import { v4 as uuidv4 } from 'uuid';
import { createModuleLogger } from '../config/logger.js';
import { getRedisClient } from '../config/redis.js';
import { BoardModel } from '../models/board.model.js';
import { GameBoard } from './game-engine.js';

/**
 * Board service - Business logic for board operations
 * Single Responsibility (C-4), Pure functions (C-3)
 */

const logger = createModuleLogger('board-service');
const CACHE_TTL_CURRENT = Number(process.env.CACHE_TTL_CURRENT ?? 3600);
const CACHE_TTL_GENERATION = Number(process.env.CACHE_TTL_GENERATION ?? 86400); // 24 hours
// CACHE_TTL_FINAL will be used for R4 final state caching

/**
 * Convert dense 2D array to sparse coordinate set (O(R*C) → O(L))
 * Sparse representation (DS1)
 */
function convertToSparse(board: BoardInput): {
  state: [number, number][];
  dimensions: { rows: number; cols: number };
} {
  const liveCells: [number, number][] = [];
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row]?.[col] === 1) {
        liveCells.push([row, col]);
      }
    }
  }

  return {
    state: liveCells,
    dimensions: { rows, cols },
  };
}

/**
 * R1: Create new board
 * Result type for error handling
 */
export async function createBoard(boardInput: BoardInput): Promise<Result<BoardId, string>> {
  try {
    // Convert to sparse representation
    const { state, dimensions } = convertToSparse(boardInput);

    // Generate UUID for boardId (per C-5 branded types)
    const boardId = createBoardId(uuidv4());

    // Save to MongoDB
    await BoardModel.create({
      boardId,
      state,
      dimensions,
    });

    // Cache the current state in Redis
    const redis = getRedisClient();
    if (redis) {
      const cacheKey = `board:${boardId}:current`;
      await redis.setEx(cacheKey, CACHE_TTL_CURRENT, JSON.stringify({ state, dimensions }));
    }

    logger.info({ boardId }, 'Board created successfully');

    return { success: true, data: boardId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create board';
    logger.error({ error }, 'Error creating board');
    return { success: false, error: message };
  }
}

/**
 * Get board by ID
 */
export async function getBoardById(boardId: BoardId): Promise<Result<Board, string>> {
  try {
    // Try cache first
    const redis = getRedisClient();
    if (redis) {
      const cacheKey = `board:${boardId}:current`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        const { state, dimensions } = JSON.parse(cached);
        return {
          success: true,
          data: {
            boardId,
            state,
            dimensions,
            created: new Date(),
            updated: new Date(),
          },
        };
      }
    }

    // Fetch from database
    const board = await BoardModel.findOne({ boardId }).lean();

    if (!board) {
      return { success: false, error: 'Board not found' };
    }

    // Cache for next time
    if (redis) {
      const cacheKey = `board:${boardId}:current`;
      await redis.setEx(
        cacheKey,
        CACHE_TTL_CURRENT,
        JSON.stringify({ state: board.state, dimensions: board.dimensions }),
      );
    }

    return {
      success: true,
      data: {
        boardId: createBoardId(board.boardId),
        state: board.state.map((coord) => [coord[0], coord[1]] as [number, number]),
        dimensions: {
          rows: board.dimensions?.rows ?? 0,
          cols: board.dimensions?.cols ?? 0,
        },
        created: board.createdAt,
        updated: board.updatedAt,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch board';
    logger.error({ error }, 'Error fetching board');
    return { success: false, error: message };
  }
}

/**
 * Get next generation of a board (R2)
 * Implements O(L) sparse algorithm with 3-tier caching
 *
 * @param boardId - Board identifier
 * @returns Result with next generation board state (dense 2D array)
 */
export async function getNextGeneration(boardId: BoardId): Promise<Result<BoardInput, string>> {
  try {
    const cacheKey = `board:${boardId}:generation:1`;
    const redis = getRedisClient();

    // Try cache first
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info({ boardId }, 'Next generation cache hit');
        return { success: true, data: JSON.parse(cached) };
      }
    }

    // Fetch board from database
    const boardResult = await getBoardById(boardId);

    if (!boardResult.success) {
      return { success: false, error: boardResult.error };
    }

    const board = boardResult.data;

    // Create GameBoard and calculate next generation
    const gameBoard = GameBoard.fromSparseArray(board.state, board.dimensions);
    const nextBoard = gameBoard.calculateNextGeneration();
    const nextGeneration = nextBoard.toDenseArray();

    // Cache the result
    if (redis) {
      await redis.setEx(cacheKey, CACHE_TTL_GENERATION, JSON.stringify(nextGeneration));
      logger.info({ boardId }, 'Cached next generation');
    }

    return { success: true, data: nextGeneration };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to calculate next generation';
    logger.error({ error, boardId }, 'Error calculating next generation');
    return { success: false, error: message };
  }
}

/**
 * Cache intermediate generation state
 */
async function cacheIntermediateGeneration(
  boardId: BoardId,
  generation: number,
  board: GameBoard,
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const intermediateKey = `board:${boardId}:generation:${generation}`;
  const intermediate = board.toDenseArray();
  await redis.setEx(intermediateKey, CACHE_TTL_GENERATION, JSON.stringify(intermediate));
}

/**
 * Try to get cached generation state
 */
async function getCachedGeneration(
  boardId: BoardId,
  generations: number,
): Promise<BoardInput | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const cacheKey = `board:${boardId}:generation:${generations}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    logger.info({ boardId, generations }, 'Generation cache hit');
    return JSON.parse(cached);
  }

  return null;
}

/**
 * Get board state X generations ahead (R3)
 * Implements progressive caching for efficiency
 *
 * @param boardId - Board identifier
 * @param generations - Number of generations to calculate (X >= 1)
 * @returns Result with future board state (dense 2D array)
 */
export async function getStateAtGeneration(
  boardId: BoardId,
  generations: number,
): Promise<Result<BoardInput, string>> {
  try {
    if (generations < 1) {
      return { success: false, error: 'Generations must be >= 1' };
    }

    // Try cache first
    const cached = await getCachedGeneration(boardId, generations);
    if (cached) {
      return { success: true, data: cached };
    }

    // Fetch initial board
    const boardResult = await getBoardById(boardId);
    if (!boardResult.success) {
      return { success: false, error: boardResult.error };
    }

    // Calculate generations iteratively
    let currentBoard = GameBoard.fromSparseArray(
      boardResult.data.state,
      boardResult.data.dimensions,
    );

    for (let i = 0; i < generations; i++) {
      currentBoard = currentBoard.calculateNextGeneration();

      // Cache intermediate states (every 10th generation for efficiency)
      if ((i + 1) % 10 === 0) {
        await cacheIntermediateGeneration(boardId, i + 1, currentBoard);
      }
    }

    const finalState = currentBoard.toDenseArray();

    // Cache the final result
    await cacheIntermediateGeneration(boardId, generations, currentBoard);
    logger.info({ boardId, generations }, 'Cached generation state');

    return { success: true, data: finalState };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to calculate generation';
    logger.error({ error, boardId, generations }, 'Error calculating generation');
    return { success: false, error: message };
  }
}

/**
 * Convert sparse array to Set<Coordinates> for O(L) operations
 */
export function sparseToBoardState(state: [number, number][]): BoardState {
  return new Set(state.map(([row, col]) => createCoordinates(row, col)));
}

/**
 * Convert Set<Coordinates> back to sparse array
 */
export function boardStateToSparse(boardState: BoardState): [number, number][] {
  return Array.from(boardState).map((coords) => {
    const [row, col] = coords.split(',').map(Number);
    return [row, col] as [number, number];
  });
}
