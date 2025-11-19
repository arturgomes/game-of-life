import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import type { AppMode, Dimensions } from '../types';

/**
 * Game state context for managing board and application state
 * Uses compound pattern to avoid prop drilling
 */

type GameState = {
  boardId: string | null;
  currentBoard: number[][] | null;
  dimensions: Dimensions;
  mode: AppMode;
  isLoading: boolean;
  error: string | null;
  webSocketUrl: string | null;
};

type GameContextValue = GameState & {
  setBoardId: (id: string | null) => void;
  setCurrentBoard: (board: number[][] | null) => void;
  setDimensions: (dimensions: Dimensions) => void;
  setMode: (mode: AppMode) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  createEmptyBoard: (customDimensions?: Dimensions) => void;
  toggleCell: (row: number, col: number) => void;
  loadPattern: (pattern: number[][]) => void;
  setWebSocketUrl: (url: string | null) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}

type GameProviderProps = {
  children: ReactNode;
};

export function GameProvider({ children }: GameProviderProps) {
  const [boardId, setBoardId] = useState<string | null>(null);
  const [currentBoard, setCurrentBoard] = useState<number[][] | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    rows: 10,
    cols: 10,
  });
  const [mode, setMode] = useState<AppMode>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webSocketUrl, setWebSocketUrl] = useState<string | null>(null);

  const createEmptyBoard = useCallback(
    (customDimensions?: Dimensions) => {
      const dims = customDimensions || dimensions;
      const newBoard = Array(dims.rows)
        .fill(0)
        .map(() => Array(dims.cols).fill(0));
      setCurrentBoard(newBoard);
      if (customDimensions) {
        setDimensions(customDimensions);
      }
    },
    [dimensions],
  );

  const toggleCell = useCallback((row: number, col: number) => {
    setCurrentBoard((prev) => {
      if (!prev) return null;

      return prev.map((r, i) => {
        if (i !== row) return r;
        return r.map((cell, j) => {
          if (j !== col) return cell;
          return cell === 1 ? 0 : 1;
        });
      });
    });
  }, []);

  const loadPattern = useCallback((pattern: number[][]) => {
    setCurrentBoard(pattern);
    setDimensions({ rows: pattern.length, cols: pattern[0]?.length ?? 0 });
  }, []);

  const value: GameContextValue = {
    boardId,
    currentBoard,
    dimensions,
    mode,
    webSocketUrl,
    setWebSocketUrl,
    isLoading,
    error,
    setBoardId,
    setCurrentBoard,
    setDimensions,
    setMode,
    setIsLoading,
    setError,
    createEmptyBoard,
    toggleCell,
    loadPattern,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
