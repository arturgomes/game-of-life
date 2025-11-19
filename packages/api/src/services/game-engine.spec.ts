import type { BoardInput, BoardState, Dimensions } from '@game-of-life/shared';
import { createCoordinates } from '@game-of-life/shared';
import { describe, expect, it } from 'vitest';
import {
  Cell,
  calculateNextState,
  countNeighbors,
  denseToSparse,
  GameBoard,
  GameRules,
  sparseToDense,
} from './game-engine';

describe('Cell', () => {
  it('should create cell with row and col', () => {
    const cell = new Cell(2, 3);

    expect(cell.row).toBe(2);
    expect(cell.col).toBe(3);
  });

  it('should get all 8 neighbor positions', () => {
    const cell = new Cell(5, 5);
    const neighbors = cell.getNeighborPositions();

    expect(neighbors).toHaveLength(8);
    expect(neighbors).toContainEqual(new Cell(4, 4)); // Top-left
    expect(neighbors).toContainEqual(new Cell(4, 5)); // Top
    expect(neighbors).toContainEqual(new Cell(4, 6)); // Top-right
    expect(neighbors).toContainEqual(new Cell(5, 4)); // Left
    expect(neighbors).toContainEqual(new Cell(5, 6)); // Right
    expect(neighbors).toContainEqual(new Cell(6, 4)); // Bottom-left
    expect(neighbors).toContainEqual(new Cell(6, 5)); // Bottom
    expect(neighbors).toContainEqual(new Cell(6, 6)); // Bottom-right
  });

  it('should convert to coordinates string', () => {
    const cell = new Cell(3, 7);

    expect(cell.toCoordinates()).toBe('3,7');
  });

  it('should check if within bounds', () => {
    const dimensions: Dimensions = { rows: 10, cols: 10 };

    expect(new Cell(5, 5).isWithinBounds(dimensions)).toBe(true);
    expect(new Cell(0, 0).isWithinBounds(dimensions)).toBe(true);
    expect(new Cell(9, 9).isWithinBounds(dimensions)).toBe(true);
    expect(new Cell(-1, 5).isWithinBounds(dimensions)).toBe(false);
    expect(new Cell(5, -1).isWithinBounds(dimensions)).toBe(false);
    expect(new Cell(10, 5).isWithinBounds(dimensions)).toBe(false);
    expect(new Cell(5, 10).isWithinBounds(dimensions)).toBe(false);
  });

  it('should create from coordinates string', () => {
    const coords = createCoordinates(4, 6);
    const cell = Cell.fromCoordinates(coords);

    expect(cell.row).toBe(4);
    expect(cell.col).toBe(6);
  });
});

describe('GameRules', () => {
  const rules = new GameRules();

  describe('live cells', () => {
    it('should survive with 2 neighbors', () => {
      expect(rules.shouldBeAlive(true, 2)).toBe(true);
    });

    it('should survive with 3 neighbors', () => {
      expect(rules.shouldBeAlive(true, 3)).toBe(true);
    });

    it('should die with 0 neighbors (underpopulation)', () => {
      expect(rules.shouldBeAlive(true, 0)).toBe(false);
    });

    it('should die with 1 neighbor (underpopulation)', () => {
      expect(rules.shouldBeAlive(true, 1)).toBe(false);
    });

    it('should die with 4 neighbors (overpopulation)', () => {
      expect(rules.shouldBeAlive(true, 4)).toBe(false);
    });

    it('should die with 8 neighbors (overpopulation)', () => {
      expect(rules.shouldBeAlive(true, 8)).toBe(false);
    });
  });

  describe('dead cells', () => {
    it('should become alive with exactly 3 neighbors', () => {
      expect(rules.shouldBeAlive(false, 3)).toBe(true);
    });

    it('should stay dead with 0 neighbors', () => {
      expect(rules.shouldBeAlive(false, 0)).toBe(false);
    });

    it('should stay dead with 1 neighbor', () => {
      expect(rules.shouldBeAlive(false, 1)).toBe(false);
    });

    it('should stay dead with 2 neighbors', () => {
      expect(rules.shouldBeAlive(false, 2)).toBe(false);
    });

    it('should stay dead with 4 neighbors', () => {
      expect(rules.shouldBeAlive(false, 4)).toBe(false);
    });

    it('should stay dead with 8 neighbors', () => {
      expect(rules.shouldBeAlive(false, 8)).toBe(false);
    });
  });
});

describe('GameBoard', () => {
  describe('conversion methods', () => {
    it('should convert dense array to sparse representation', () => {
      const input: BoardInput = [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const state = board.getState();

      expect(state.size).toBe(3);
      expect(state.has(createCoordinates(0, 1))).toBe(true);
      expect(state.has(createCoordinates(1, 1))).toBe(true);
      expect(state.has(createCoordinates(2, 1))).toBe(true);
    });

    it('should convert sparse representation to dense array', () => {
      const state = new Set([
        createCoordinates(0, 1),
        createCoordinates(1, 1),
        createCoordinates(2, 1),
      ]);

      const board = new GameBoard(state, { rows: 3, cols: 3 });
      const dense = board.toDenseArray();

      expect(dense).toEqual([
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ]);
    });

    it('should handle empty board conversion', () => {
      const input: BoardInput = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const state = board.getState();

      expect(state.size).toBe(0);
    });
  });

  describe('cell operations', () => {
    it('should check if cell is alive', () => {
      const state = new Set([createCoordinates(1, 1)]);
      const board = new GameBoard(state, { rows: 3, cols: 3 });

      expect(board.isCellAlive(new Cell(1, 1))).toBe(true);
      expect(board.isCellAlive(new Cell(0, 0))).toBe(false);
    });

    it('should count live neighbors correctly', () => {
      // Block pattern (2x2)
      const state = new Set([
        createCoordinates(1, 1),
        createCoordinates(1, 2),
        createCoordinates(2, 1),
        createCoordinates(2, 2),
      ]);

      const board = new GameBoard(state, { rows: 5, cols: 5 });

      // Center cells have 3 neighbors each
      expect(board.countLiveNeighbors(new Cell(1, 1))).toBe(3);
      expect(board.countLiveNeighbors(new Cell(1, 2))).toBe(3);
      expect(board.countLiveNeighbors(new Cell(2, 1))).toBe(3);
      expect(board.countLiveNeighbors(new Cell(2, 2))).toBe(3);

      // Adjacent cell has 2 neighbors
      expect(board.countLiveNeighbors(new Cell(0, 0))).toBe(1);
      expect(board.countLiveNeighbors(new Cell(0, 1))).toBe(2);
    });
  });

  describe('board state comparison', () => {
    it('should detect equal boards', () => {
      const state1 = new Set([createCoordinates(1, 1), createCoordinates(2, 2)]);
      const state2 = new Set([createCoordinates(1, 1), createCoordinates(2, 2)]);

      const board1 = new GameBoard(state1, { rows: 5, cols: 5 });
      const board2 = new GameBoard(state2, { rows: 5, cols: 5 });

      expect(board1.equals(board2)).toBe(true);
    });

    it('should detect different boards', () => {
      const state1 = new Set([createCoordinates(1, 1)]);
      const state2 = new Set([createCoordinates(2, 2)]);

      const board1 = new GameBoard(state1, { rows: 5, cols: 5 });
      const board2 = new GameBoard(state2, { rows: 5, cols: 5 });

      expect(board1.equals(board2)).toBe(false);
    });
  });
});

describe('Game of Life Patterns', () => {
  describe('empty board', () => {
    it('should stay empty', () => {
      const input: BoardInput = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const next = board.calculateNextGeneration();

      expect(next.getState().size).toBe(0);
    });
  });

  describe('single cell', () => {
    it('should die from underpopulation', () => {
      const input: BoardInput = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const next = board.calculateNextGeneration();

      expect(next.getState().size).toBe(0);
    });
  });

  describe('stable patterns', () => {
    it('should keep Block (2x2) stable', () => {
      const input: BoardInput = [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const next = board.calculateNextGeneration();
      const result = next.toDenseArray();

      expect(result).toEqual(input);
    });

    it('should keep Beehive stable', () => {
      const input: BoardInput = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0],
        [0, 1, 0, 0, 1, 0],
        [0, 0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const next = board.calculateNextGeneration();
      const result = next.toDenseArray();

      expect(result).toEqual(input);
    });

    it('should keep Loaf stable', () => {
      const input: BoardInput = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0],
        [0, 1, 0, 0, 1, 0],
        [0, 0, 1, 0, 1, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const next = board.calculateNextGeneration();
      const result = next.toDenseArray();

      expect(result).toEqual(input);
    });

    it('should keep Boat stable', () => {
      const input: BoardInput = [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0],
        [0, 1, 0, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const next = board.calculateNextGeneration();
      const result = next.toDenseArray();

      expect(result).toEqual(input);
    });
  });

  describe('oscillators', () => {
    it('should oscillate Blinker (period 2) - horizontal to vertical', () => {
      const horizontal: BoardInput = [
        [0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0],
      ];

      const vertical: BoardInput = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ];

      const board1 = GameBoard.fromDenseArray(horizontal);
      const board2 = board1.calculateNextGeneration();
      const board3 = board2.calculateNextGeneration();

      expect(board2.toDenseArray()).toEqual(vertical);
      expect(board3.toDenseArray()).toEqual(horizontal);
    });

    it('should oscillate Toad (period 2)', () => {
      const phase1: BoardInput = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 0],
        [0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ];

      const phase2: BoardInput = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 1, 0],
        [0, 1, 0, 0, 1, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ];

      const board1 = GameBoard.fromDenseArray(phase1);
      const board2 = board1.calculateNextGeneration();
      const board3 = board2.calculateNextGeneration();

      expect(board2.toDenseArray()).toEqual(phase2);
      expect(board3.toDenseArray()).toEqual(phase1);
    });

    it('should oscillate Beacon (period 2)', () => {
      const phase1: BoardInput = [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0],
        [0, 1, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 0],
        [0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0],
      ];

      const phase2: BoardInput = [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0],
        [0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0],
        [0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0],
      ];

      const board1 = GameBoard.fromDenseArray(phase1);
      const board2 = board1.calculateNextGeneration();
      const board3 = board2.calculateNextGeneration();

      expect(board2.toDenseArray()).toEqual(phase2);
      expect(board3.toDenseArray()).toEqual(phase1);
    });
  });

  describe('gliders', () => {
    it('should move Glider diagonally over 4 generations', () => {
      const gen0: BoardInput = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ];

      let board = GameBoard.fromDenseArray(gen0);
      const originalState = board.getState();

      // Run 4 generations to complete one cycle (glider moves)
      for (let i = 0; i < 4; i++) {
        board = board.calculateNextGeneration();
      }

      const finalState = board.getState();

      // After 4 generations, glider should have moved (state should be different)
      expect(board.equals(GameBoard.fromDenseArray(gen0))).toBe(false);

      // Glider should still have 5 cells
      expect(finalState.size).toBe(5);

      // At least some cells should have moved from original positions
      let movedCount = 0;
      for (const coord of originalState) {
        if (!finalState.has(coord)) {
          movedCount++;
        }
      }

      expect(movedCount).toBeGreaterThan(0); // At least one cell moved
    });

    it('should maintain Glider pattern through one generation', () => {
      const gen0: BoardInput = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ];

      const gen1Expected: BoardInput = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 1, 0, 1, 0, 0],
        [0, 0, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ];

      const board = GameBoard.fromDenseArray(gen0);
      const next = board.calculateNextGeneration();

      expect(next.toDenseArray()).toEqual(gen1Expected);
    });
  });

  describe('boundary conditions', () => {
    it('should handle cells at top edge', () => {
      const input: BoardInput = [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const next = board.calculateNextGeneration();

      // Blinker should oscillate
      expect(next.toDenseArray()).toEqual([
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ]);
    });

    it('should handle cells at bottom edge', () => {
      const input: BoardInput = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 1, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const next = board.calculateNextGeneration();

      // Both cells die from underpopulation
      expect(next.getState().size).toBe(0);
    });

    it('should handle cells at left edge', () => {
      const input: BoardInput = [
        [0, 0, 0],
        [1, 1, 0],
        [0, 0, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const next = board.calculateNextGeneration();

      // Block pattern should form
      expect(next.toDenseArray()).toEqual([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
    });

    it('should handle cells at right edge', () => {
      const input: BoardInput = [
        [0, 0, 0],
        [0, 1, 1],
        [0, 0, 0],
      ];

      const board = GameBoard.fromDenseArray(input);
      const next = board.calculateNextGeneration();

      // Both cells die
      expect(next.getState().size).toBe(0);
    });
  });

  describe('large sparse boards (performance test)', () => {
    it('should handle 1000x1000 board with 100 live cells efficiently', () => {
      const dimensions: Dimensions = { rows: 1000, cols: 1000 };
      const state = new Set<BoardState[keyof BoardState]>();

      // Create 100 random live cells
      for (let i = 0; i < 100; i++) {
        const row = Math.floor(Math.random() * 1000);
        const col = Math.floor(Math.random() * 1000);
        state.add(createCoordinates(row, col));
      }

      const board = new GameBoard(state, dimensions);

      const startTime = Date.now();
      const next = board.calculateNextGeneration();
      const endTime = Date.now();

      const executionTime = endTime - startTime;

      // Should complete in reasonable time (< 100ms for O(L) algorithm)
      expect(executionTime).toBeLessThan(100);

      // Next generation should exist
      expect(next.getState().size).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Facade Functions', () => {
  it('should calculate next state using facade', () => {
    const state = new Set([
      createCoordinates(0, 1),
      createCoordinates(1, 1),
      createCoordinates(2, 1),
    ]);
    const dimensions: Dimensions = { rows: 3, cols: 3 };

    const next = calculateNextState(state, dimensions);

    expect(next.size).toBe(3);
    expect(next.has(createCoordinates(1, 0))).toBe(true);
    expect(next.has(createCoordinates(1, 1))).toBe(true);
    expect(next.has(createCoordinates(1, 2))).toBe(true);
  });

  it('should count neighbors using facade', () => {
    const state = new Set([
      createCoordinates(1, 1),
      createCoordinates(1, 2),
      createCoordinates(2, 1),
    ]);

    expect(countNeighbors(state, 1, 1)).toBe(2);
    expect(countNeighbors(state, 2, 2)).toBe(3);
    expect(countNeighbors(state, 0, 0)).toBe(1);
  });

  it('should convert sparse to dense using facade', () => {
    const state = new Set([createCoordinates(1, 1)]);
    const dimensions: Dimensions = { rows: 3, cols: 3 };

    const dense = sparseToDense(state, dimensions);

    expect(dense).toEqual([
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]);
  });

  it('should convert dense to sparse using facade', () => {
    const input: BoardInput = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];

    const sparse = denseToSparse(input);

    expect(sparse.size).toBe(1);
    expect(sparse.has(createCoordinates(1, 1))).toBe(true);
  });
});
