/**
 * Custom hook for API operations
 * Provides convenient wrappers for all API endpoints with loading/error states
 */

import { useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import {
  createBoard as apiCreateBoard,
  getNextGeneration as apiGetNextGeneration,
  getStateAtGeneration as apiGetStateAtGeneration,
} from '../lib';
import type { MutableBoardInput } from '../types';

type BoardInput = MutableBoardInput;

export function useApiClient() {
  const { setBoardId, setCurrentBoard, setIsLoading, setError } = useGame();

  /**
   * R1: Create new board
   */
  const createBoard = useCallback(
    async (board: BoardInput) => {
      setIsLoading(true);
      setError(null);

      const result = await apiCreateBoard(board);

      if (result.success) {
        setBoardId(result.data.boardId);
        setCurrentBoard(board);
        setIsLoading(false);
        return result.data.boardId;
      }

      setError(result.error);
      setIsLoading(false);
      return null;
    },
    [setBoardId, setCurrentBoard, setIsLoading, setError],
  );

  /**
   * R2: Get next generation
   */
  const getNextGeneration = useCallback(
    async (boardId: string) => {
      setIsLoading(true);
      setError(null);

      const result = await apiGetNextGeneration(boardId);

      if (result.success) {
        setCurrentBoard(result.data.board);
        setIsLoading(false);
        return result.data.board;
      }

      setError(result.error);
      setIsLoading(false);
      return null;
    },
    [setCurrentBoard, setIsLoading, setError],
  );

  /**
   * R3: Get state at specific generation
   */
  const getStateAtGeneration = useCallback(
    async (boardId: string, generation: number) => {
      setIsLoading(true);
      setError(null);

      const result = await apiGetStateAtGeneration(boardId, generation);

      if (result.success) {
        setCurrentBoard(result.data.board);
        setIsLoading(false);
        return result.data.board;
      }

      setError(result.error);
      setIsLoading(false);
      return null;
    },
    [setCurrentBoard, setIsLoading, setError],
  );

  return {
    createBoard,
    getNextGeneration,
    getStateAtGeneration,
  };
}
