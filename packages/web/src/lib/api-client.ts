/**
 * Type-safe API client for Game of Life backend
 * Implements all endpoints: R1 (create), R2 (next), R3 (state), R4 (final)
 */

import type { CreateBoardResponse, MutableBoardInput, Result } from '../types';

type BoardInput = MutableBoardInput;

// Environment variables with fallbacks
// In Docker production, use relative paths for Nginx proxy
// In development, use direct API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * R1: POST /boards - Create new board
 * @param board - 2D array representing the board state
 * @returns BoardId for subsequent operations
 */
export async function createBoard(board: BoardInput): Promise<Result<CreateBoardResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to create board' };
    }

    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * R2: GET /boards/:boardId/next - Get next generation
 * @param boardId - UUID of the board
 * @returns Next board state
 */
export async function getNextGeneration(boardId: string): Promise<Result<{ state: BoardInput }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/boards/${boardId}/next`);

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to get next generation' };
    }

    const body = await response.json();
    // API returns { data: { state: [...] } }
    return { success: true, data: body.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * R3: GET /boards/:boardId/state/:generation - Get state X generations ahead
 * @param boardId - UUID of the board
 * @param generation - Target generation number (≥1)
 * @returns Board state at specified generation
 */
export async function getStateAtGeneration(
  boardId: string,
  generation: number,
): Promise<Result<{ state: BoardInput; generation: number }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/boards/${boardId}/state/${generation}`);

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to get board state' };
    }

    const body = await response.json();
    // API returns { data: { state: [...], generation: X } }
    return { success: true, data: body.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * R4: POST /boards/:boardId/final - Initiate final state calculation
 * Returns 202 Accepted and WebSocket URL for streaming
 * @param boardId - UUID of the board
 * @param maxAttempts - Maximum generations to calculate (1-100,000)
 * @returns WebSocket URL for streaming progress
 */
export async function startFinalStateCalculation(
  boardId: string,
  maxAttempts: number,
): Promise<Result<{ webSocketUrl: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/boards/${boardId}/final`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxAttempts }),
    });

    if (!response.ok) {
      const body = await response.json();
      return { success: false, error: body.error || 'Failed to start calculation' };
    }

    const body = await response.json();

    // R4 returns 202 Accepted with { data: { message: "...", websocketUrl: "ws://..." } }
    return { success: true, data: { webSocketUrl: body.data.websocketUrl } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Helper: Build WebSocket URL for R4 final state streaming
 * @param boardId - UUID of the board
 * @param maxAttempts - Maximum generations to calculate
 * @returns WebSocket URL with query parameters
 */
export function buildWebSocketUrl(boardId: string, maxAttempts: number): string {
  // In Docker production, use relative path for Nginx proxy
  // Determine protocol based on current page protocol
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || `${protocol}//${window.location.host}`;
  return `${wsBaseUrl}/ws/final?boardId=${boardId}&maxAttempts=${maxAttempts}`;
}
