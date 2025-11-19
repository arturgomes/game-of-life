/**
 * Custom hook for Controls component logic
 * Separates business logic from UI presentation
 */

import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { logger } from '../lib';
import { useApiClient } from './useApiClient';

export function useControls() {
  const {
    boardId,
    currentBoard,
    dimensions,
    setDimensions,
    createEmptyBoard,
    setError,
    setMode,
    setWebSocketUrl,
  } = useGame();

  const { createBoard, getNextGeneration, getStateAtGeneration, getStartFinalStateCalculation } =
    useApiClient();

  const [rows, setRows] = useState(dimensions.rows);
  const [cols, setCols] = useState(dimensions.cols);
  const [jumpGeneration, setJumpGeneration] = useState(1);
  const [maxAttempts, setMaxAttempts] = useState(1000);

  const handleDimensionsChange = () => {
    setDimensions({ rows, cols });
    createEmptyBoard();
  };

  const handleCreateBoard = async () => {
    if (!currentBoard) {
      setError('No board to upload. Create or load a pattern first.');
      return;
    }

    const newBoardId = await createBoard(currentBoard as (0 | 1)[][]);
    if (newBoardId) {
      setMode('visualizing');
    }
  };

  const handleNextGeneration = async () => {
    if (!boardId) {
      setError('No board uploaded. Upload a board first.');
      return;
    }

    await getNextGeneration(boardId);
  };

  const handleJumpToGeneration = async () => {
    if (!boardId) {
      setError('No board uploaded. Upload a board first.');
      return;
    }

    if (jumpGeneration < 1) {
      setError('Generation must be at least 1.');
      return;
    }

    await getStateAtGeneration(boardId, jumpGeneration);
  };

  const handleStartFinalState = async () => {
    if (!boardId) {
      setError('No board uploaded. Upload a board first.');
      return;
    }

    if (maxAttempts < 1 || maxAttempts > 100_000) {
      setError('Max attempts must be between 1 and 100,000.');
      return;
    }

    logger.debug('useControls', 'Starting final state calculation', { boardId, maxAttempts });
    const url = await getStartFinalStateCalculation(boardId, maxAttempts);

    if (!url) {
      logger.error('useControls', 'Failed to get WebSocket URL');
      return;
    }

    logger.info('useControls', 'WebSocket URL received', { url: url.webSocketUrl });
    setMode('streaming');
    setWebSocketUrl(url.webSocketUrl);
  };

  return {
    // State
    boardId,
    currentBoard,
    rows,
    cols,
    jumpGeneration,
    maxAttempts,

    // Setters
    setRows,
    setCols,
    setJumpGeneration,
    setMaxAttempts,

    // Handlers
    handleDimensionsChange,
    handleCreateBoard,
    handleNextGeneration,
    handleJumpToGeneration,
    handleStartFinalState,
    createEmptyBoard,
  };
}
