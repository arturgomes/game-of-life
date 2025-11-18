import { boardIdParamSchema, createBoardRequestSchema, generationParamSchema } from '@game-of-life/shared';
import express from 'express';
import {
  createBoardController,
  getFinalStateController,
  getNextGenerationController,
  getStateAtGenerationController,
} from '../controllers/boards.controller.js';
import { validate } from '../middleware/validate.js';

/**
 * Board routes
 */

export const boardsRouter = express.Router();

/**
 * R1: POST /boards - Upload new board state
 */
boardsRouter.post('/', express.json(), validate(createBoardRequestSchema, 'body'), createBoardController);

/**
 * R2: GET /boards/:boardId/next - Get single next generation
 */
boardsRouter.get('/:boardId/next', validate(boardIdParamSchema, 'params'), getNextGenerationController);

/**
 * R3: GET /boards/:boardId/state/:generation - Get state X generations ahead
 */
boardsRouter.get('/:boardId/state/:generation', validate(generationParamSchema, 'params'), getStateAtGenerationController);

/**
 * R4: POST /boards/:boardId/final - Get final stabilized state (real-time)
 */
boardsRouter.post('/:boardId/final', getFinalStateController);
