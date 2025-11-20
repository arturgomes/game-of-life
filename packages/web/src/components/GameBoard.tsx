import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * GameBoard Component - Interactive grid visualization
 *
 */

type GameBoardProps = {
  editable?: boolean;
};

type DragAction = 'paint' | 'erase' | null;

const CELL_STATE = {
  dead: 0,
  alive: 1,
};

const CELL_SIZE_CONFIG = {
  min: 8,
  max: 20,
  baseWidth: 600,
};

const BOARD_CONSTRAINTS = {
  minWidth: '400px',
  minHeight: '400px',
  maxWidth: '90vw',
  maxHeight: '70vh',
};

/**
 * Custom hook for managing drag-to-paint functionality
 */
function useDragPaint(
  isEditable: boolean,
  currentBoard: number[][] | null,
  toggleCell: (row: number, col: number) => void,
  boardRef: React.RefObject<HTMLDivElement>,
) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<DragAction>(null);

  const handleMouseDown = useCallback(
    (rowIndex: number, colIndex: number) => {
      if (!isEditable || !currentBoard || !currentBoard[rowIndex]) return;

      const currentState = currentBoard[rowIndex][colIndex];
      setIsDragging(true);
      setDragAction(currentState === CELL_STATE.alive ? 'erase' : 'paint');
      toggleCell(rowIndex, colIndex);
    },
    [isEditable, currentBoard, toggleCell],
  );

  const handleMouseEnter = useCallback(
    (rowIndex: number, colIndex: number) => {
      if (!isDragging || !dragAction || !isEditable || !currentBoard || !currentBoard[rowIndex]) return;

      const currentState = currentBoard[rowIndex][colIndex];
      const shouldToggle =
        (dragAction === 'paint' && currentState === CELL_STATE.dead) ||
        (dragAction === 'erase' && currentState === CELL_STATE.alive);

      if (shouldToggle) {
        toggleCell(rowIndex, colIndex);
      }
    },
    [isDragging, dragAction, isEditable, currentBoard, toggleCell],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragAction(null);
  }, []);

  // Global mouse up and mouse leave handlers
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (!boardRef.current || !isDragging) return;

      // Check if mouse left the board element
      const rect = boardRef.current.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        handleMouseUp();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleMouseLeave);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleMouseLeave);
    };
  }, [isDragging, handleMouseUp, boardRef]);

  return {
    handleMouseDown,
    handleMouseEnter,
  };
}

/**
 * Calculate optimal cell size based on grid dimensions
 */
function calculateCellSize(cols: number): number {
  return Math.max(
    CELL_SIZE_CONFIG.min,
    Math.min(CELL_SIZE_CONFIG.max, CELL_SIZE_CONFIG.baseWidth / cols),
  );
}

/**
 * Generate grid style object
 */
function getGridStyle(rows: number, cols: number, cellSize: number) {
  return {
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: '100%',
    height: '100%',
  };
}

/**
 * Generate board container style object
 */
function getBoardContainerStyle(rows: number, cols: number, cellSize: number) {
  return {
    width: `${cols * cellSize}px`,
    height: `${rows * cellSize}px`,
    minWidth: BOARD_CONSTRAINTS.minWidth,
    minHeight: BOARD_CONSTRAINTS.minHeight,
    maxWidth: BOARD_CONSTRAINTS.maxWidth,
    maxHeight: BOARD_CONSTRAINTS.maxHeight,
  };
}

/**
 * Generate cell className based on state and editability
 */
function getCellClassName(
  isAlive: boolean,
  isEditable: boolean,
  rowIndex: number,
  colIndex: number,
): string {
  const baseClasses = 'transition-all duration-100';
  const colorClasses = isAlive ? 'bg-blue-600' : 'bg-white';
  const borderClasses = `${colIndex > 0 ? 'border-l border-gray-200' : ''} ${rowIndex > 0 ? 'border-t border-gray-200' : ''}`;

  const interactionClasses = isEditable
    ? `cursor-pointer hover:scale-110 hover:z-10 ${
        isAlive ? 'hover:bg-blue-700 hover:shadow-md' : 'hover:bg-blue-100 hover:shadow-sm'
      }`
    : 'cursor-default';

  return `${baseClasses} ${colorClasses} ${borderClasses} ${interactionClasses}`;
}

/**
 * Generate grid overlay background style
 */
function getGridOverlayStyle(cellSize: number) {
  return {
    backgroundImage: `
      linear-gradient(to right, rgba(229, 231, 235, 0.3) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(229, 231, 235, 0.3) 1px, transparent 1px)
    `,
    backgroundSize: `${cellSize}px ${cellSize}px`,
  };
}

/**
 * Empty state component for when no board is loaded
 */
function EmptyBoardState({ mode }: { mode: string }) {
  if (mode === 'streaming') {
    return (
      <div className="flex justify-center items-center p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-80" />
    );
  }

  return (
    <div className="flex justify-center items-center p-12 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed">
      <div className="text-center">
        <p className="mb-2 text-lg font-medium text-gray-600">No board loaded</p>
        <p className="text-sm text-gray-400">Create a new board or load a pattern to begin</p>
      </div>
    </div>
  );
}

/**
 * Individual cell component
 */
type CellProps = {
  isAlive: boolean;
  isEditable: boolean;
  rowIndex: number;
  colIndex: number;
  cellSize: number;
  onMouseDown: () => void;
  onMouseEnter: () => void;
};

const Cell = memo(function Cell({
  isAlive,
  isEditable,
  rowIndex,
  colIndex,
  cellSize,
  onMouseDown,
  onMouseEnter,
}: CellProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      data-alive={isAlive}
      className={getCellClassName(isAlive, isEditable, rowIndex, colIndex)}
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
      }}
      aria-label={`Cell at row ${rowIndex}, column ${colIndex}: ${isAlive ? 'alive' : 'dead'}`}
      role="button"
      tabIndex={isEditable ? 0 : -1}
    />
  );
});

/**
 * Main GameBoard component
 */
function GameBoardComponent({ editable = true }: GameBoardProps) {
  const { currentBoard, dimensions, toggleCell, mode } = useGame();
  const boardRef = useRef<HTMLDivElement>(null);

  const isEditable = editable && mode === 'editor';
  const { handleMouseDown, handleMouseEnter } = useDragPaint(
    isEditable,
    currentBoard,
    toggleCell,
    boardRef,
  );

  if (!currentBoard) {
    return <EmptyBoardState mode={mode} />;
  }

  const cellSize = calculateCellSize(dimensions.cols);
  const boardContainerStyle = getBoardContainerStyle(dimensions.rows, dimensions.cols, cellSize);
  const gridStyle = getGridStyle(dimensions.rows, dimensions.cols, cellSize);
  const gridOverlayStyle = getGridOverlayStyle(cellSize);

  return (
    <div className="flex justify-center items-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-lg">
      <div className="relative">
        <div
          ref={boardRef}
          className="overflow-hidden relative bg-white rounded-lg shadow-inner"
          style={boardContainerStyle}
        >
          <div className="grid" style={gridStyle}>
            {currentBoard.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <Cell
                  key={`${rowIndex}-${colIndex + 1}`}
                  isAlive={cell === CELL_STATE.alive}
                  isEditable={isEditable}
                  rowIndex={rowIndex}
                  colIndex={colIndex}
                  cellSize={cellSize}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                />
              )),
            )}
          </div>

          {/* Grid overlay for better visual separation */}
          {/* <div className="absolute inset-0 pointer-events-none" style={gridOverlayStyle} /> */}
        </div>

        {isEditable && (
          <div className="mt-2 text-xs text-gray-500 text-center bg-white/80 px-3 py-1.5 rounded-full">
            💡 Click or drag to draw
          </div>
        )}
      </div>
    </div>
  );
}

export const GameBoard = memo(GameBoardComponent);
