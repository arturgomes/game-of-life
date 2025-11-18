import { nanoid } from 'nanoid';
import type {
  BoardId,
  BoardInput,
  Board,
  Result,
  BoardState,
} from '@game-of-life/shared';
import { createBoardId, createCoordinates } from '@game-of-life/shared';
import { BoardModel } from '../models/board.model.js';
import { getRedisClient } from '../config/redis.js';
import { createModuleLogger } from '../config/logger.js';

/**
 * Board service - Business logic for board operations
 * Single Responsibility (C-4), Pure functions (C-3)
 */

const logger = createModuleLogger('board-service');
const CACHE_TTL_CURRENT = Number(process.env.CACHE_TTL_CURRENT ?? 3600);

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
    const boardId = createBoardId(nanoid());

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
