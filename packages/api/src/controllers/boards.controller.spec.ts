import type { BoardId, BoardInput, Result } from '@game-of-life/shared';
import { createBoardId } from '@game-of-life/shared';
import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBoardController,
  getFinalStateController,
  getNextGenerationController,
  getStateAtGenerationController,
} from './boards.controller.js';

/**
 * Unit tests for Board Controllers
 * Tests controller logic with mocked services
 */

// Mock the service layer
vi.mock('../services/board.service.js', () => ({
  createBoard: vi.fn(),
  getNextGeneration: vi.fn(),
  getStateAtGeneration: vi.fn(),
}));

// Import mocked services
import { createBoard, getNextGeneration, getStateAtGeneration } from '../services/board.service.js';

describe('boards.controller', () => {
  // Test data
  const testBoardId = '12345678-1234-1234-1234-123456789012';
  const blockPattern: BoardInput = [
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
  ];

  // Mock Express request/response/next
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      body: {},
      params: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('createBoardController', () => {
    it('should create board successfully and return 201', async () => {
      mockRequest.body = { board: blockPattern };

      const successResult: Result<BoardId, string> = {
        success: true,
        data: createBoardId(testBoardId),
      };

      vi.mocked(createBoard).mockResolvedValue(successResult);

      await createBoardController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(createBoard).toHaveBeenCalledWith(blockPattern);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { boardId: testBoardId },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on service failure', async () => {
      mockRequest.body = { board: blockPattern };

      const errorResult: Result<BoardId, string> = {
        success: false,
        error: 'Database connection failed',
      };

      vi.mocked(createBoard).mockResolvedValue(errorResult);

      await createBoardController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() on unexpected errors', async () => {
      mockRequest.body = { board: blockPattern };

      const unexpectedError = new Error('Unexpected error');
      vi.mocked(createBoard).mockRejectedValue(unexpectedError);

      await createBoardController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle empty board input', async () => {
      const emptyBoard: BoardInput = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      mockRequest.body = { board: emptyBoard };

      const successResult: Result<BoardId, string> = {
        success: true,
        data: createBoardId(testBoardId),
      };

      vi.mocked(createBoard).mockResolvedValue(successResult);

      await createBoardController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(createBoard).toHaveBeenCalledWith(emptyBoard);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getNextGenerationController', () => {
    it('should return next generation successfully', async () => {
      mockRequest.params = { boardId: testBoardId };

      const successResult: Result<BoardInput> = {
        success: true,
        data: blockPattern,
      };

      vi.mocked(getNextGeneration).mockResolvedValue(successResult);

      await getNextGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getNextGeneration).toHaveBeenCalledWith(createBoardId(testBoardId));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { state: blockPattern },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if boardId is missing', async () => {
      mockRequest.params = {};

      await getNextGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getNextGeneration).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'BoardId is required',
      });
    });

    it('should return 404 when board not found', async () => {
      mockRequest.params = { boardId: testBoardId };

      const errorResult: Result<BoardInput, string> = {
        success: false,
        error: 'Board not found',
      };

      vi.mocked(getNextGeneration).mockResolvedValue(errorResult);

      await getNextGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Board not found',
      });
    });

    it('should return 500 for other service errors', async () => {
      mockRequest.params = { boardId: testBoardId };

      const errorResult: Result<BoardInput, string> = {
        success: false,
        error: 'Calculation failed',
      };

      vi.mocked(getNextGeneration).mockResolvedValue(errorResult);

      await getNextGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Calculation failed',
      });
    });

    it('should call next() on unexpected errors', async () => {
      mockRequest.params = { boardId: testBoardId };

      const unexpectedError = new Error('Unexpected error');
      vi.mocked(getNextGeneration).mockRejectedValue(unexpectedError);

      await getNextGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('getStateAtGenerationController', () => {
    const generationNumber = 10;

    it('should return state at specific generation successfully', async () => {
      mockRequest.params = {
        boardId: testBoardId,
        generation: generationNumber.toString(),
      };

      const successResult: Result<BoardInput> = {
        success: true,
        data: blockPattern,
      };

      vi.mocked(getStateAtGeneration).mockResolvedValue(successResult);

      await getStateAtGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getStateAtGeneration).toHaveBeenCalledWith(createBoardId(testBoardId), generationNumber);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { state: blockPattern, generation: generationNumber },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if boardId is missing', async () => {
      mockRequest.params = { generation: '5' };

      await getStateAtGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getStateAtGeneration).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'BoardId and generation are required',
      });
    });

    it('should return 400 if generation is missing', async () => {
      mockRequest.params = { boardId: testBoardId };

      await getStateAtGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getStateAtGeneration).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'BoardId and generation are required',
      });
    });

    it('should return 404 when board not found', async () => {
      mockRequest.params = {
        boardId: testBoardId,
        generation: '5',
      };

      const errorResult: Result<BoardInput, string> = {
        success: false,
        error: 'Board not found',
      };

      vi.mocked(getStateAtGeneration).mockResolvedValue(errorResult);

      await getStateAtGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Board not found',
      });
    });

    it('should return 400 for validation errors', async () => {
      mockRequest.params = {
        boardId: testBoardId,
        generation: '0',
      };

      const errorResult: Result<BoardInput, string> = {
        success: false,
        error: 'Generations must be >= 1',
      };

      vi.mocked(getStateAtGeneration).mockResolvedValue(errorResult);

      await getStateAtGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Generations must be >= 1',
      });
    });

    it('should handle string generation parameter correctly', async () => {
      mockRequest.params = {
        boardId: testBoardId,
        generation: '15',
      };

      const successResult: Result<BoardInput> = {
        success: true,
        data: blockPattern,
      };

      vi.mocked(getStateAtGeneration).mockResolvedValue(successResult);

      await getStateAtGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getStateAtGeneration).toHaveBeenCalledWith(createBoardId(testBoardId), 15);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should call next() on unexpected errors', async () => {
      mockRequest.params = {
        boardId: testBoardId,
        generation: '5',
      };

      const unexpectedError = new Error('Unexpected error');
      vi.mocked(getStateAtGeneration).mockRejectedValue(unexpectedError);

      await getStateAtGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle large generation numbers', async () => {
      const largeGeneration = 1000;
      mockRequest.params = {
        boardId: testBoardId,
        generation: largeGeneration.toString(),
      };

      const successResult: Result<BoardInput> = {
        success: true,
        data: blockPattern,
      };

      vi.mocked(getStateAtGeneration).mockResolvedValue(successResult);

      await getStateAtGenerationController(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getStateAtGeneration).toHaveBeenCalledWith(createBoardId(testBoardId), largeGeneration);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { state: blockPattern, generation: largeGeneration },
      });
    });
  });

  describe('getFinalStateController', () => {
    it('should return 501 Not Implemented', () => {
      mockRequest.params = { boardId: testBoardId };
      mockRequest.body = { maxAttempts: 100 };

      getFinalStateController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(501);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not implemented yet',
      });
    });

    it('should not call next() for not implemented endpoint', () => {
      mockRequest.params = { boardId: testBoardId };

      getFinalStateController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(501);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
