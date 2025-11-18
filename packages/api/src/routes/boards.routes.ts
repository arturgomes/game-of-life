import express, { type Request, type Response, type NextFunction } from 'express';
import { createBoardRequestSchema, successResponse, errorResponse } from '@game-of-life/shared';
import { validate } from '../middleware/validate.js';
import { createBoard } from '../services/board.service.js';

/**
 * Board routes
 * Per CLAUDE.md: REST endpoints (R1, R2, R3, R4)
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
 * TODO: Implement next generation calculation
 */
boardsRouter.get('/:boardId/next', (_req: Request, res: Response): void => {
  res.status(501).json(errorResponse('Not implemented yet'));
});

/**
 * R3: GET /boards/:boardId/state/:generation - Get state X generations ahead
 * TODO: Implement X generations calculation
 */
boardsRouter.get('/:boardId/state/:generation', (_req: Request, res: Response): void => {
  res.status(501).json(errorResponse('Not implemented yet'));
});

/**
 * R4: POST /boards/:boardId/final - Get final stabilized state (real-time)
 * TODO: Implement with WebSocket streaming
 */
boardsRouter.post('/:boardId/final', (_req: Request, res: Response): void => {
  res.status(501).json(errorResponse('Not implemented yet'));
});
