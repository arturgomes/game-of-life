import { createBoardId, errorResponse, successResponse } from '@game-of-life/shared';
import type { NextFunction, Request, Response } from 'express';
import { createBoard, getBoardById, getNextGeneration, getStateAtGeneration } from '../services/board.service.js';

/**
 * R1: POST /boards - Upload new board state
 * Input: 2D Array/Matrix
 * Output: { boardId: UUID }
 */
export async function createBoardController(req: Request, res: Response, next: NextFunction): Promise<void> {
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
}

/**
 * R2: GET /boards/:boardId/next - Get single next generation
 * Output: Next board state (2D Array)
 */
export async function getNextGenerationController(req: Request, res: Response, next: NextFunction): Promise<void> {
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
}

/**
 * R3: GET /boards/:boardId/state/:generation - Get state X generations ahead
 * Input: generation (Integer ≥1)
 * Output: Future board state (2D Array)
 */
export async function getStateAtGenerationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
}

/**
 * R4: POST /boards/:boardId/final - Get final stabilized state (real-time)
 * Returns 202 Accepted with WebSocket URL for streaming updates
 */
export async function getFinalStateController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.params;
    const { maxAttempts } = req.body;

    if (!boardId) {
      res.status(400).json(errorResponse('BoardId is required'));
      return;
    }

    if (!maxAttempts || typeof maxAttempts !== 'number' || maxAttempts <= 0) {
      res.status(400).json(errorResponse('maxAttempts must be a positive number'));
      return;
    }

    // Check if board exists
    const boardExists = await getBoardById(createBoardId(boardId));
    if (!boardExists.success) {
      res.status(404).json(errorResponse('Board not found'));
      return;
    }

    // Build WebSocket URL with query parameters
    const protocol = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';
    const host = req.get('host') ?? 'localhost:3000';
    const websocketUrl = `${protocol}://${host}/ws?boardId=${boardId}&maxAttempts=${maxAttempts}`;

    // Return 202 Accepted with WebSocket URL
    res.status(202).json(
      successResponse({
        message: 'Final state calculation initiated',
        websocketUrl,
      }),
    );
  } catch (error) {
    next(error);
  }
}
