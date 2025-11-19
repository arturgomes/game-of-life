/**
 * Core library exports for Game of Life frontend
 */

// API Client
export {
  buildWebSocketUrl,
  createBoard,
  getNextGeneration,
  getStateAtGeneration,
  startFinalStateCalculation,
} from './api-client';
// Board Utilities
export {
  boardsEqual,
  cloneBoard,
  countAliveCells,
  createEmptyBoard,
  createRandomBoard,
  getBoardDimensions,
  resizeBoard,
  validateBoard,
} from './board-utils';
// Patterns
export {
  ALL_PATTERNS,
  getAllPatternNames,
  getPatternByName,
  OSCILLATORS,
  SPACESHIPS,
  STILL_LIFES,
} from './patterns';
export type { WebSocketCallbacks } from './websocket-client';
// WebSocket Client
export { GameOfLifeWebSocket } from './websocket-client';
