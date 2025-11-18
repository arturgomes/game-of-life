import {
  boardIdParamSchema,
  createBoardRequestSchema,
  errorResponse,
  generationParamSchema,
  successResponse,
} from '@game-of-life/shared';
import { createBoardId } from '@game-of-life/shared';
import express, { type Request, type Response, type NextFunction } from 'express';
import { validate } from '../middleware/validate.js';
import { createBoard, getNextGeneration, getStateAtGeneration } from '../services/board.service.js';

/**
 * Board routes
 */

export const boardsRouter = express.Router();

/**
 * R1: POST /boards - Upload new board state
 * Input: 2D Array/Matrix
 * Output: { boardId: UUID }
 */
boardsRouter.post(
  '/',
  express.json(),
  validate(createBoardRequestSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { board } = req.body;

      const result = await createBoard(board);

      if (!result.success) {
        res.status(500).json(errorResponse(result.error));
        return;
      }

      res.status(201).json(successResponse({ boardId: result.data }));
    } catch (error) {
      next(error);
    }
  },
);

/**
 * R2: GET /boards/:boardId/next - Get single next generation
 * Output: Next board state (2D Array)
 */
boardsRouter.get(
  '/:boardId/next',
  validate(boardIdParamSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { boardId } = req.params;

      if (!boardId) {
        res.status(400).json(errorResponse('BoardId is required'));
        return;
      }

      const result = await getNextGeneration(createBoardId(boardId));

      if (!result.success) {
        const status = result.error === 'Board not found' ? 404 : 500;
        res.status(status).json(errorResponse(result.error));
        return;
      }

      res.status(200).json(successResponse({ state: result.data }));
    } catch (error) {
      next(error);
    }
  },
);

/**
 * R3: GET /boards/:boardId/state/:generation - Get state X generations ahead
 * Input: generation (Integer ≥1)
 * Output: Future board state (2D Array)
 */
boardsRouter.get(
  '/:boardId/state/:generation',
  validate(generationParamSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { boardId, generation } = req.params;

      if (!boardId || !generation) {
        res.status(400).json(errorResponse('BoardId and generation are required'));
        return;
      }

      const generations = Number(generation);

      const result = await getStateAtGeneration(createBoardId(boardId), generations);

      if (!result.success) {
        const status = result.error === 'Board not found' ? 404 : 400;
        res.status(status).json(errorResponse(result.error));
        return;
      }

      res.status(200).json(successResponse({ state: result.data, generation: generations }));
    } catch (error) {
      next(error);
    }
  },
);

/**
 * R4: POST /boards/:boardId/final - Get final stabilized state (real-time)
 * TODO: Implement with WebSocket streaming
 */
boardsRouter.post('/:boardId/final', (_req: Request, res: Response): void => {
  res.status(501).json(errorResponse('Not implemented yet'));
});
