import type { BoardInput } from '@game-of-life/shared';
import { createBoardId } from '@game-of-life/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RedisClient } from '../config/redis.js';
import { getRedisClient } from '../config/redis.js';
import { BoardModel } from '../models/board.model.js';
import {
  boardStateToSparse,
  createBoard,
  getBoardById,
  getNextGeneration,
  getStateAtGeneration,
  sparseToBoardState,
} from './board.service.js';

/**
 * Unit tests for Board Service
 * Tests business logic with mocked dependencies
 */

// Mock dependencies
vi.mock('../config/redis.js', () => ({
  getRedisClient: vi.fn(),
}));

vi.mock('../config/logger.js', () => ({
  createModuleLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock('../models/board.model.js', () => ({
  // biome-ignore lint/style/useNamingConvention: BoardModel is a Mongoose model
  BoardModel: {
    create: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => '12345678-1234-1234-1234-123456789012'),
}));

describe('board.service', () => {
  const mockRedis = {
    get: vi.fn(),
    setEx: vi.fn(),
  } as unknown as RedisClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBoard', () => {
    const simpleBlock: BoardInput = [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ];

    it('should create board successfully and cache in Redis', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(BoardModel.create).mockResolvedValue({
        boardId: '12345678-1234-1234-1234-123456789012',
        state: [
          [1, 1],
          [1, 2],
          [2, 1],
          [2, 2],
        ],
        dimensions: { rows: 4, cols: 4 },
      } as never);

      const result = await createBoard(simpleBlock);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('12345678-1234-1234-1234-123456789012');
      }

      expect(BoardModel.create).toHaveBeenCalledWith({
        boardId: '12345678-1234-1234-1234-123456789012',
        state: [
          [1, 1],
          [1, 2],
          [2, 1],
          [2, 2],
        ],
        dimensions: { rows: 4, cols: 4 },
      });

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'board:12345678-1234-1234-1234-123456789012:current',
        expect.any(Number),
        expect.any(String),
      );
    });

    it('should create board successfully without Redis', async () => {
      vi.mocked(getRedisClient).mockReturnValue(null);
      vi.mocked(BoardModel.create).mockResolvedValue({
        boardId: '12345678-1234-1234-1234-123456789012',
        state: [[1, 1]],
        dimensions: { rows: 4, cols: 4 },
      } as never);

      const result = await createBoard(simpleBlock);

      expect(result.success).toBe(true);
      expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(BoardModel.create).mockRejectedValue(new Error('Database connection failed'));

      const result = await createBoard(simpleBlock);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database connection failed');
      }
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(BoardModel.create).mockRejectedValue('String error');

      const result = await createBoard(simpleBlock);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to create board');
      }
    });

    it('should handle empty board correctly', async () => {
      const emptyBoard: BoardInput = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(BoardModel.create).mockResolvedValue({
        boardId: '12345678-1234-1234-1234-123456789012',
        state: [],
        dimensions: { rows: 3, cols: 3 },
      } as never);

      const result = await createBoard(emptyBoard);

      expect(result.success).toBe(true);
      expect(BoardModel.create).toHaveBeenCalledWith({
        boardId: expect.any(String),
        state: [],
        dimensions: { rows: 3, cols: 3 },
      });
    });
  });

  describe('getBoardById', () => {
    const testBoardId = createBoardId('12345678-1234-1234-1234-123456789012');
    const storedBoard = {
      boardId: '12345678-1234-1234-1234-123456789012',
      state: [
        [1, 1],
        [1, 2],
      ],
      dimensions: { rows: 4, cols: 4 },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should return board from cache if available', async () => {
      const cachedData = {
        state: [[1, 1]],
        dimensions: { rows: 4, cols: 4 },
      };

      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getBoardById(testBoardId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.boardId).toBe(testBoardId);
        expect(result.data.state).toEqual([[1, 1]]);
        expect(result.data.dimensions).toEqual({ rows: 4, cols: 4 });
      }

      expect(BoardModel.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database on cache miss and update cache', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(storedBoard),
      } as never);

      const result = await getBoardById(testBoardId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.boardId).toBe(testBoardId);
        expect(result.data.state).toEqual([
          [1, 1],
          [1, 2],
        ]);
      }

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `board:${testBoardId}:current`,
        expect.any(Number),
        expect.any(String),
      );
    });

    it('should return error if board not found in database', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as never);

      const result = await getBoardById(testBoardId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Board not found');
      }
    });

    it('should work without Redis (database only)', async () => {
      vi.mocked(getRedisClient).mockReturnValue(null);
      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(storedBoard),
      } as never);

      const result = await getBoardById(testBoardId);

      expect(result.success).toBe(true);
      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error('Database error')),
      } as never);

      const result = await getBoardById(testBoardId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database error');
      }
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockRejectedValue('String error'),
      } as never);

      const result = await getBoardById(testBoardId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to fetch board');
      }
    });
  });

  describe('getNextGeneration', () => {
    const testBoardId = createBoardId('12345678-1234-1234-1234-123456789012');
    const blockPattern: BoardInput = [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ];

    it('should return cached generation if available', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify(blockPattern));

      const result = await getNextGeneration(testBoardId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(blockPattern);
      }

      expect(BoardModel.findOne).not.toHaveBeenCalled();
    });

    it('should calculate next generation on cache miss', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);

      // Mock getBoardById to return a board
      const storedBoard = {
        boardId: testBoardId,
        state: [
          [1, 1],
          [1, 2],
          [2, 1],
          [2, 2],
        ] as [number, number][],
        dimensions: { rows: 4, cols: 4 },
        created: new Date(),
        updated: new Date(),
      };

      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          boardId: '12345678-1234-1234-1234-123456789012',
          state: storedBoard.state,
          dimensions: storedBoard.dimensions,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as never);

      const result = await getNextGeneration(testBoardId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        // Block pattern remains stable
        expect(result.data).toEqual(blockPattern);
      }

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `board:${testBoardId}:generation:1`,
        expect.any(Number),
        expect.any(String),
      );
    });

    it('should return error if board not found', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as never);

      const result = await getNextGeneration(testBoardId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Board not found');
      }
    });

    it('should handle calculation errors', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error('Calculation failed')),
      } as never);

      const result = await getNextGeneration(testBoardId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Calculation failed');
      }
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockRejectedValue('String error'),
      } as never);

      const result = await getNextGeneration(testBoardId);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Error comes from getBoardById which is called internally
        expect(result.error).toBe('Failed to fetch board');
      }
    });

    it('should handle non-Error exceptions from Redis operations', async () => {
      // Mock Redis to throw non-Error exception during get
      const mockBadRedis = {
        get: vi.fn().mockRejectedValue('Redis string error'),
        setEx: vi.fn(),
      } as unknown as RedisClient;

      vi.mocked(getRedisClient).mockReturnValue(mockBadRedis);

      const result = await getNextGeneration(testBoardId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to calculate next generation');
      }
    });
  });

  describe('getStateAtGeneration', () => {
    const testBoardId = createBoardId('12345678-1234-1234-1234-123456789012');
    const blockPattern: BoardInput = [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ];

    it('should reject generations < 1', async () => {
      const result = await getStateAtGeneration(testBoardId, 0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Generations must be >= 1');
      }
    });

    it('should return cached generation if available', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify(blockPattern));

      const result = await getStateAtGeneration(testBoardId, 5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(blockPattern);
      }
    });

    it('should calculate multiple generations and cache intermediates', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);

      const storedBoard = {
        boardId: testBoardId,
        state: [
          [1, 1],
          [1, 2],
          [2, 1],
          [2, 2],
        ] as [number, number][],
        dimensions: { rows: 4, cols: 4 },
        created: new Date(),
        updated: new Date(),
      };

      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          boardId: '12345678-1234-1234-1234-123456789012',
          state: storedBoard.state,
          dimensions: storedBoard.dimensions,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as never);

      const result = await getStateAtGeneration(testBoardId, 15);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }

      // Should cache generation 10 and 15 (every 10th + final)
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `board:${testBoardId}:generation:10`,
        expect.any(Number),
        expect.any(String),
      );
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `board:${testBoardId}:generation:15`,
        expect.any(Number),
        expect.any(String),
      );
    });

    it('should return error if board not found', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as never);

      const result = await getStateAtGeneration(testBoardId, 5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Board not found');
      }
    });

    it('should handle calculation errors', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error('Calculation failed')),
      } as never);

      const result = await getStateAtGeneration(testBoardId, 5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Calculation failed');
      }
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(getRedisClient).mockReturnValue(mockRedis);
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(BoardModel.findOne).mockReturnValue({
        lean: vi.fn().mockRejectedValue('String error'),
      } as never);

      const result = await getStateAtGeneration(testBoardId, 5);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Error comes from getBoardById which is called internally
        expect(result.error).toBe('Failed to fetch board');
      }
    });

    it('should handle non-Error exceptions from Redis operations', async () => {
      // Mock Redis to throw non-Error exception during get
      const mockBadRedis = {
        get: vi.fn().mockRejectedValue('Redis string error'),
        setEx: vi.fn(),
      } as unknown as RedisClient;

      vi.mocked(getRedisClient).mockReturnValue(mockBadRedis);

      const result = await getStateAtGeneration(testBoardId, 10);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to calculate generation');
      }
    });
  });

  describe('sparseToBoardState', () => {
    it('should convert sparse array to Set<Coordinates>', () => {
      const sparseInput: [number, number][] = [
        [1, 1],
        [1, 2],
        [2, 1],
      ];

      const result = sparseToBoardState(sparseInput);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
      expect(result.has('1,1')).toBe(true);
      expect(result.has('1,2')).toBe(true);
      expect(result.has('2,1')).toBe(true);
    });

    it('should handle empty array', () => {
      const result = sparseToBoardState([]);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('should handle coordinates with zeros', () => {
      const sparseInput: [number, number][] = [
        [0, 0],
        [0, 5],
        [5, 0],
      ];

      const result = sparseToBoardState(sparseInput);

      expect(result.size).toBe(3);
      expect(result.has('0,0')).toBe(true);
      expect(result.has('0,5')).toBe(true);
      expect(result.has('5,0')).toBe(true);
    });
  });

  describe('boardStateToSparse', () => {
    it('should convert Set<Coordinates> to sparse array', () => {
      const boardState = new Set(['1,1', '1,2', '2,1']);

      const result = boardStateToSparse(boardState);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result).toContainEqual([1, 1]);
      expect(result).toContainEqual([1, 2]);
      expect(result).toContainEqual([2, 1]);
    });

    it('should handle empty Set', () => {
      const boardState = new Set<string>();

      const result = boardStateToSparse(boardState);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle coordinates with zeros', () => {
      const boardState = new Set(['0,0', '0,5', '5,0']);

      const result = boardStateToSparse(boardState);

      expect(result).toHaveLength(3);
      expect(result).toContainEqual([0, 0]);
      expect(result).toContainEqual([0, 5]);
      expect(result).toContainEqual([5, 0]);
    });

    it('should be inverse of sparseToBoardState', () => {
      const originalSparse: [number, number][] = [
        [1, 1],
        [2, 3],
        [4, 5],
      ];

      const boardState = sparseToBoardState(originalSparse);
      const result = boardStateToSparse(boardState);

      expect(result).toHaveLength(originalSparse.length);
      for (const coord of originalSparse) {
        expect(result).toContainEqual(coord);
      }
    });
  });
});
