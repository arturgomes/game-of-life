import { memo } from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * GameBoard Component - Interactive grid visualization
 *
 * Features:
 * - Responsive grid rendering with CSS Grid
 * - Click to toggle cells in editor mode
 * - Visual states: alive (black) / dead (white)
 * - Hover effects for cell interaction
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders
 * - Uses data attributes for cleaner conditional styling
 */

type GameBoardProps = {
  editable?: boolean;
};

function GameBoardComponent({ editable = true }: GameBoardProps) {
  const { currentBoard, dimensions, toggleCell, mode } = useGame();

  if (!currentBoard) {
    if (mode === 'streaming') {
      return (
        <div className="flex justify-center items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm min-h-80" />
      );
    }

    return (
      <div className="flex justify-center items-center p-12 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed">
        <div className="text-center">
          <p className="mb-2 text-lg text-gray-500">No board loaded</p>
          <p className="text-sm text-gray-400">Create a new board or load a pattern to begin</p>
        </div>
      </div>
    );
  }

  const isEditable = editable && mode === 'editor';
  const maxCols = Math.min(dimensions.cols, 50);

  return (
    <div className="flex justify-center items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div
        className="grid gap-px border-2 border-gray-500 min-w-80 min-h-80"
        style={{
          gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
          maxWidth: '100%',
          aspectRatio: `${dimensions.cols} / ${dimensions.rows}`,
        }}
      >
        {currentBoard.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex+1}-${colIndex+1 * rowIndex+1}`}
              type="button"
              onClick={() => isEditable && toggleCell(rowIndex, colIndex)}
              disabled={!isEditable}
              data-alive={cell === 1}
              className={`
                aspect-square border border-gray-300 transition-all
                data-[alive=true]:bg-black data-[alive=false]:bg-white
                ${
                  isEditable
                    ? 'cursor-pointer hover:opacity-80 hover:ring-1 hover:ring-blue-400'
                    : 'cursor-default'
                }
                disabled:cursor-not-allowed
              `}
              aria-label={`Cell ${rowIndex},${colIndex}: ${cell === 1 ? 'alive' : 'dead'}`}
            />
          )),
        )}
      </div>
    </div>
  );
}

export const GameBoard = memo(GameBoardComponent);
