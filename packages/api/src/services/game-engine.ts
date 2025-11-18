import type { BoardInput, BoardState, Coordinates, Dimensions } from '@game-of-life/shared';
import { createCoordinates, parseCoordinates } from '@game-of-life/shared';

/**
 * Represents a single cell in the Game of Life grid
 */
export class Cell {
  constructor(
    public readonly row: number,
    public readonly col: number,
  ) {}

  /**
   * Get all 8 neighboring cell positions
   */
  getNeighborPositions(): Cell[] {
    const neighbors: Cell[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        // Skip the cell itself
        if (dr === 0 && dc === 0) {
          continue;
        }

        neighbors.push(new Cell(this.row + dr, this.col + dc));
      }
    }

    return neighbors;
  }

  /**
   * Convert to sparse coordinate string
   */
  toCoordinates(): Coordinates {
    return createCoordinates(this.row, this.col);
  }

  /**
   * Check if cell is within board boundaries
   */
  isWithinBounds(dimensions: Dimensions): boolean {
    return (
      this.row >= 0 && this.row < dimensions.rows && this.col >= 0 && this.col < dimensions.cols
    );
  }

  /**
   * Create Cell from Coordinates string
   */
  static fromCoordinates(coords: Coordinates): Cell {
    const [row, col] = parseCoordinates(coords);
    return new Cell(row, col);
  }
}

/**
 * Game of Life rules engine
 * Encapsulates the core logic for determining cell state transitions
 */
export class GameRules {
  /**
   * Determine if a cell should be alive in the next generation
   *
   * Rules:
   * - Live cell with 2-3 neighbors → survives
   * - Live cell with <2 or >3 neighbors → dies
   * - Dead cell with exactly 3 neighbors → becomes alive
   *
   * @param isCurrentlyAlive - Current state of the cell
   * @param neighborCount - Number of live neighbors (0-8)
   * @returns true if cell should be alive in next generation
   */
  shouldBeAlive(isCurrentlyAlive: boolean, neighborCount: number): boolean {
    if (isCurrentlyAlive) {
      // Live cell survives with 2-3 neighbors
      return neighborCount === 2 || neighborCount === 3;
    }

    // Dead cell becomes alive with exactly 3 neighbors
    return neighborCount === 3;
  }
}

/**
 * Game of Life board with O(L) sparse representation
 * L = number of live cells + their neighbors (not R*C entire grid)
 */
export class GameBoard {
  private readonly rules: GameRules;

  constructor(
    private readonly state: BoardState,
    public readonly dimensions: Dimensions,
  ) {
    this.rules = new GameRules();
  }

  /**
   * Get the current board state
   */
  getState(): BoardState {
    return new Set(this.state);
  }

  /**
   * Check if a cell is alive
   */
  isCellAlive(cell: Cell): boolean {
    return this.state.has(cell.toCoordinates());
  }

  /**
   * Count live neighbors for a specific cell
   */
  countLiveNeighbors(cell: Cell): number {
    let count = 0;

    for (const neighbor of cell.getNeighborPositions()) {
      if (neighbor.isWithinBounds(this.dimensions) && this.isCellAlive(neighbor)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Get all cells that need to be evaluated for the next generation
   * This includes all live cells and their neighbors (O(L) optimization)
   */
  private getCellsToEvaluate(): Set<Coordinates> {
    const cellsToCheck = new Set<Coordinates>();

    // For each live cell, add it and all its neighbors to evaluation set
    for (const coords of this.state) {
      const cell = Cell.fromCoordinates(coords);

      // Add the live cell itself
      cellsToCheck.add(coords);

      // Add all neighbors that are within bounds
      for (const neighbor of cell.getNeighborPositions()) {
        if (neighbor.isWithinBounds(this.dimensions)) {
          cellsToCheck.add(neighbor.toCoordinates());
        }
      }
    }

    return cellsToCheck;
  }

  /**
   * Calculate the next generation using O(L) sparse algorithm
   */
  calculateNextGeneration(): GameBoard {
    const cellsToEvaluate = this.getCellsToEvaluate();
    const nextState = new Set<Coordinates>();

    // Apply rules to each cell in the evaluation set
    for (const coords of cellsToEvaluate) {
      const cell = Cell.fromCoordinates(coords);
      const isAlive = this.isCellAlive(cell);
      const neighborCount = this.countLiveNeighbors(cell);

      if (this.rules.shouldBeAlive(isAlive, neighborCount)) {
        nextState.add(coords);
      }
    }

    return new GameBoard(nextState, this.dimensions);
  }

  /**
   * Convert sparse board to dense 2D array for API response
   */
  toDenseArray(): BoardInput {
    const dense: (0 | 1)[][] = Array.from({ length: this.dimensions.rows }, () =>
      Array.from({ length: this.dimensions.cols }, () => 0 as const),
    );

    for (const coords of this.state) {
      const cell = Cell.fromCoordinates(coords);
      const row = dense[cell.row];
      if (row) {
        row[cell.col] = 1;
      }
    }

    return dense;
  }

  /**
   * Create GameBoard from dense 2D array input
   */
  static fromDenseArray(input: BoardInput): GameBoard {
    const sparse = new Set<Coordinates>();
    const rows = input.length;
    const cols = rows > 0 ? (input[0]?.length ?? 0) : 0;

    for (let row = 0; row < rows; row++) {
      const currentRow = input[row];
      if (!currentRow) continue;

      for (let col = 0; col < currentRow.length; col++) {
        if (currentRow[col] === 1) {
          sparse.add(createCoordinates(row, col));
        }
      }
    }

    return new GameBoard(sparse, { rows, cols });
  }

  /**
   * Create GameBoard from sparse coordinate array
   */
  static fromSparseArray(
    state: ReadonlyArray<readonly [number, number]>,
    dimensions: Dimensions,
  ): GameBoard {
    const sparse = new Set<Coordinates>();

    for (const [row, col] of state) {
      sparse.add(createCoordinates(row, col));
    }

    return new GameBoard(sparse, dimensions);
  }

  /**
   * Get serialized state as array for storage
   */
  toSparseArray(): Array<[number, number]> {
    return Array.from(this.state).map((coords) => {
      const [row, col] = parseCoordinates(coords);
      return [row, col] as [number, number];
    });
  }

  /**
   * Get serialized state string for cycle detection
   */
  toStateHash(): string {
    // Sort coordinates for consistent hashing
    const sorted = Array.from(this.state).sort();
    return JSON.stringify(sorted);
  }

  /**
   * Check if this board state equals another
   */
  equals(other: GameBoard): boolean {
    if (this.state.size !== other.state.size) {
      return false;
    }

    for (const coord of this.state) {
      if (!other.state.has(coord)) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Facade functions for backward compatibility and simple usage
 * (Can be used directly without instantiating classes)
 */

export function calculateNextState(board: BoardState, dimensions: Dimensions): BoardState {
  const gameBoard = new GameBoard(board, dimensions);
  const nextBoard = gameBoard.calculateNextGeneration();
  return nextBoard.getState();
}

export function countNeighbors(board: BoardState, row: number, col: number): number {
  // We need proper dimensions for boundary checking
  // Calculate dimensions from the board state
  let maxRow = 0;
  let maxCol = 0;

  for (const coord of board) {
    const [r, c] = parseCoordinates(coord);
    maxRow = Math.max(maxRow, r);
    maxCol = Math.max(maxCol, c);
  }

  const dimensions = { rows: maxRow + 1, cols: maxCol + 1 };
  const gameBoard = new GameBoard(board, dimensions);
  const cell = new Cell(row, col);
  return gameBoard.countLiveNeighbors(cell);
}

export function sparseToDense(state: BoardState, dimensions: Dimensions): BoardInput {
  const gameBoard = new GameBoard(state, dimensions);
  return gameBoard.toDenseArray();
}

export function denseToSparse(input: BoardInput): BoardState {
  const gameBoard = GameBoard.fromDenseArray(input);
  return gameBoard.getState();
}
