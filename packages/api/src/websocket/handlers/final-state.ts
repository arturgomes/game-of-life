import type { BoardInput } from '@game-of-life/shared';
import { createBoardId } from '@game-of-life/shared';
import type { WebSocket } from 'ws';
import { logger } from '../../config/logger.js';
import { getBoardById } from '../../services/board.service.js';
import { detectCycle } from '../../services/cycle-detector.js';
import { GameBoard } from '../../services/game-engine.js';

/**
 * WebSocket handler for R4: Final state calculation with streaming updates
 */

/**
 * Message types sent to client
 */
type ProgressMessage = {
  type: 'progress';
  generation: number;
  state: BoardInput;
};

type FinalMessage = {
  type: 'final';
  generation: number;
  state: BoardInput;
  status: 'stable' | 'oscillating' | 'timeout';
  period?: number;
};

type ErrorMessage = {
  type: 'error';
  error: string;
};

type WebSocketMessage = ProgressMessage | FinalMessage | ErrorMessage;

/**
 * Parse connection parameters from URL query string
 */
function parseConnectionParams(url: string): { boardId: string; maxAttempts: number } | null {
  try {
    const urlObj = new URL(url, 'ws://localhost');
    const boardId = urlObj.searchParams.get('boardId');
    const maxAttemptsParam = urlObj.searchParams.get('maxAttempts');

    if (!boardId || !maxAttemptsParam) {
      return null;
    }

    const maxAttempts = Number.parseInt(maxAttemptsParam, 10);

    if (Number.isNaN(maxAttempts) || maxAttempts <= 0) {
      return null;
    }

    return { boardId, maxAttempts };
  } catch {
    return null;
  }
}

/**
 * Send JSON message to WebSocket client
 */
function sendMessage(ws: WebSocket, message: WebSocketMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Handle WebSocket connection for final state calculation
 */
export async function handleFinalStateConnection(ws: WebSocket, url: string): Promise<void> {
  // Parse connection parameters
  const params = parseConnectionParams(url);

  if (!params) {
    sendMessage(ws, {
      type: 'error',
      error: 'Invalid connection parameters. Required: boardId and maxAttempts',
    });
    ws.close(1008, 'Invalid parameters');
    return;
  }

  const { boardId, maxAttempts } = params;

  logger.info({ boardId, maxAttempts }, 'Starting final state calculation');

  // Retrieve board from database
  const boardResult = await getBoardById(createBoardId(boardId));

  if (!boardResult.success) {
    sendMessage(ws, {
      type: 'error',
      error: 'Board not found',
    });
    ws.close(1008, 'Board not found');
    return;
  }

  const { state, dimensions } = boardResult.data;

  // Create GameBoard instance from stored sparse state
  const gameBoard = GameBoard.fromSparseArray(state, dimensions);

  // Progress callback to stream generation updates
  const onProgress = (generation: number, stateArray: BoardInput): void => {
    sendMessage(ws, {
      type: 'progress',
      generation,
      state: stateArray,
    });
  };

  // Run cycle detection with streaming
  const result = detectCycle(gameBoard, maxAttempts, onProgress);

  if (!result.success) {
    sendMessage(ws, {
      type: 'error',
      error: result.error,
    });
    ws.close(1011, 'Cycle detection failed');
    return;
  }

  // Send final result
  const finalMessage: FinalMessage = {
    type: 'final',
    generation: result.data.generation,
    state: result.data.state,
    status: result.data.status,
  };

  if (result.data.period !== undefined) {
    finalMessage.period = result.data.period;
  }

  sendMessage(ws, finalMessage);

  logger.info(
    { boardId, status: result.data.status, generation: result.data.generation },
    'Final state calculation complete',
  );

  // Close connection after sending final message
  ws.close(1000, 'Calculation complete');
}
