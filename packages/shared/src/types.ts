/**
 * Branded types for type safety (per C-5)
 * Prevents mixing different ID types
 */

// Branded type for BoardId
export type BoardId = string & { readonly __brand: 'BoardId' };

export function createBoardId(id: string): BoardId {
  return id as BoardId;
}

export function isBoardId(value: unknown): value is BoardId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Coordinates for sparse board representation
 * Format: "row,col" for efficient Set operations
 */
export type Coordinates = `${number},${number}`;

export function createCoordinates(row: number, col: number): Coordinates {
  return `${row},${col}`;
}

export function parseCoordinates(coords: Coordinates): [number, number] {
  const parts = coords.split(',');
  const row = Number(parts[0]);
  const col = Number(parts[1]);
  return [row, col];
}

/**
 * Sparse board state using Set for O(L) complexity
 * Only stores live cells
 */
export type BoardState = Set<Coordinates>;

/**
 * Board dimensions
 */
export type Dimensions = {
  readonly rows: number;
  readonly cols: number;
};

/**
 * Board entity for database storage
 */
export type Board = {
  readonly boardId: BoardId;
  readonly state: ReadonlyArray<readonly [number, number]>; // Array of [x, y] pairs
  readonly dimensions: Dimensions;
  readonly created: Date;
  readonly updated: Date;
};

/**
 * Input format for board upload (R1)
 * 2D array where 1 = live cell, 0 = dead cell
 */
export type BoardInput = ReadonlyArray<ReadonlyArray<0 | 1>>;

/**
 * Final state result for R4
 */
export type FinalStateResult =
  | { readonly type: 'stable'; readonly generation: number; readonly state: BoardState }
  | {
      readonly type: 'oscillating';
      readonly period: number;
      readonly generation: number;
      readonly state: BoardState;
    }
  | { readonly type: 'timeout'; readonly generation: number; readonly state: BoardState };

/**
 * Result type for error handling (per Critical Implementation Notes)
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };
