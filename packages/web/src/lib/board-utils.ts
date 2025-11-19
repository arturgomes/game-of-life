/**
 * Utility functions for board manipulation and validation
 */

import type { MutableBoardInput as BoardInput, Dimensions } from '@game-of-life/shared';

/**
 * Create empty board with specified dimensions
 */
export function createEmptyBoard(dimensions: Dimensions): BoardInput {
  return Array(dimensions.rows)
    .fill(0)
    .map(() => Array(dimensions.cols).fill(0));
}

/**
 * Create random board with specified dimensions and alive probability
 */
export function createRandomBoard(dimensions: Dimensions, aliveProbability = 0.3): BoardInput {
  return Array(dimensions.rows)
    .fill(0)
    .map(() =>
      Array(dimensions.cols)
        .fill(0)
        .map(() => (Math.random() < aliveProbability ? 1 : 0)),
    );
}

/**
 * Get dimensions from board
 */
export function getBoardDimensions(board: BoardInput): Dimensions {
  return {
    rows: board.length,
    cols: board[0]?.length ?? 0,
  };
}

/**
 * Validate board structure - extracted guard clauses 
 */
export function validateBoard(board: BoardInput): { valid: boolean; error?: string } {
  if (!board || board.length === 0) {
    return { valid: false, error: 'Board cannot be empty' };
  }

  const cols = board[0]?.length ?? 0;
  if (cols === 0) {
    return { valid: false, error: 'Board must have at least one column' };
  }

  const rowLengthError = validateRowLengths(board, cols);
  if (rowLengthError) return rowLengthError;

  const cellValueError = validateCellValues(board);
  if (cellValueError) return cellValueError;

  return { valid: true };
}

/**
 * Helper: Validate all rows have same length
 */
function validateRowLengths(
  board: BoardInput,
  expectedCols: number,
): { valid: boolean; error?: string } | null {
  for (const row of board) {
    if (!row || row.length !== expectedCols) {
      return { valid: false, error: 'All rows must have the same length' };
    }
  }
  return null;
}

/**
 * Helper: Validate all cells are 0 or 1
 */
function validateCellValues(board: BoardInput): { valid: boolean; error?: string } | null {
  for (const row of board) {
    if (!row) continue;
    for (const cell of row) {
      if (cell !== 0 && cell !== 1) {
        return { valid: false, error: 'All cells must be 0 (dead) or 1 (alive)' };
      }
    }
  }
  return null;
}

/**
 * Count alive cells in board
 */
export function countAliveCells(board: BoardInput): number {
  return board.reduce(
    (count: number, row: readonly (0 | 1)[]) =>
      count + row.filter((cell: 0 | 1) => cell === 1).length,
    0,
  );
}

/**
 * Clone board (deep copy)
 */
export function cloneBoard(board: BoardInput): BoardInput {
  return board.map((row: readonly (0 | 1)[]) => [...row]);
}

/**
 * Check if two boards are equal - extracted row comparison 
 */
export function boardsEqual(board1: BoardInput, board2: BoardInput): boolean {
  if (board1.length !== board2.length) return false;

  const firstRow1 = board1[0];
  const firstRow2 = board2[0];
  if (firstRow1?.length !== firstRow2?.length) return false;

  return board1.every((row1, i) => {
    const row2 = board2[i];
    return row1 && row2 && rowsEqual(row1, row2);
  });
}

/**
 * Helper: Check if two rows are equal
 */
function rowsEqual(row1: readonly (0 | 1)[], row2: readonly (0 | 1)[]): boolean {
  return row1.every((cell, j) => cell === row2[j]);
}

/**
 * Resize board (center content, fill with dead cells)
 */
export function resizeBoard(board: BoardInput, newDimensions: Dimensions): BoardInput {
  const oldDimensions = getBoardDimensions(board);
  const newBoard = createEmptyBoard(newDimensions);

  // Calculate offsets to center the old board
  const rowOffset = Math.floor((newDimensions.rows - oldDimensions.rows) / 2);
  const colOffset = Math.floor((newDimensions.cols - oldDimensions.cols) / 2);

  // Copy old board data row by row
  copyBoardData(board, newBoard, { rowOffset, colOffset }, oldDimensions, newDimensions);

  return newBoard;
}

/**
 * Helper: Copy cells from old board to new board - extracted row copying (per C-14)
 */
function copyBoardData(
  oldBoard: BoardInput,
  newBoard: BoardInput,
  offset: { rowOffset: number; colOffset: number },
  oldDims: Dimensions,
  newDims: Dimensions,
): void {
  for (let i = 0; i < oldDims.rows; i++) {
    copyBoardRow(oldBoard[i], newBoard, i, offset, oldDims.cols, newDims);
  }
}

/**
 * Helper: Copy single row from old board to new board
 */
function copyBoardRow(
  oldRow: readonly (0 | 1)[] | undefined,
  newBoard: BoardInput,
  rowIndex: number,
  offset: { rowOffset: number; colOffset: number },
  oldCols: number,
  newDims: Dimensions,
): void {
  if (!oldRow) return;

  const newRowIndex = rowIndex + offset.rowOffset;
  if (newRowIndex < 0 || newRowIndex >= newDims.rows) return;

  const targetRow = newBoard[newRowIndex];
  if (!targetRow) return;

  for (let j = 0; j < oldCols; j++) {
    const newColIndex = j + offset.colOffset;
    if (newColIndex < 0 || newColIndex >= newDims.cols) continue;

    const cell = oldRow[j];
    if (cell !== undefined) {
      targetRow[newColIndex] = cell;
    }
  }
}
