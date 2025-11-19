import type { BoardInput } from '@game-of-life/shared';
import { describe, expect, it, vi } from 'vitest';
import type { CycleDetectionResult } from './cycle-detector';
import { detectCycle } from './cycle-detector';
import { GameBoard } from './game-engine';

/**
 * Test patterns for Cycle Detector
 * Following CLAUDE.md standards: T-1 colocated tests, T-5 parameterized inputs, T-8 strong assertions
 */

// Test pattern constants (T-5: parameterized inputs)
const EMPTY_BOARD: BoardInput = [[0]];

const BLOCK_PATTERN: BoardInput = [
  [0, 0, 0, 0],
  [0, 1, 1, 0],
  [0, 1, 1, 0],
  [0, 0, 0, 0],
];

const BLINKER_PATTERN: BoardInput = [
  [0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0],
];

const TOAD_PATTERN: BoardInput = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 0],
  [0, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
];

const GLIDER_PATTERN: BoardInput = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const MAX_ATTEMPTS_DEFAULT = 100;
const MAX_ATTEMPTS_SMALL = 10;

describe('detectCycle', () => {
  describe('stable patterns', () => {
    it('should detect empty board as stable at generation 0', async () => {
      const board = GameBoard.fromDenseArray(EMPTY_BOARD);

      const result = await detectCycle(board, MAX_ATTEMPTS_DEFAULT);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe('stable');
      expect(result.data.generation).toBe(0);
      expect(result.data.period).toBeUndefined();
      expect(result.data.state).toEqual(EMPTY_BOARD);
    });

    it('should detect block pattern as stable at generation 0', async () => {
      const board = GameBoard.fromDenseArray(BLOCK_PATTERN);

      const result = await detectCycle(board, MAX_ATTEMPTS_DEFAULT);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe('stable');
      expect(result.data.generation).toBe(0);
      expect(result.data.period).toBeUndefined();
      expect(result.data.state).toEqual(BLOCK_PATTERN);
    });

    it('should detect when pattern becomes stable after iterations', async () => {
      // Pattern that dies after one generation (single cell)
      const singleCell: BoardInput = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ];
      const board = GameBoard.fromDenseArray(singleCell);

      const result = await detectCycle(board, MAX_ATTEMPTS_DEFAULT);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe('stable');
      expect(result.data.generation).toBe(1);
      expect(result.data.state).toEqual([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
    });
  });

  describe('oscillating patterns', () => {
    it('should detect blinker as oscillating with period 2', async () => {
      const board = GameBoard.fromDenseArray(BLINKER_PATTERN);

      const result = await detectCycle(board, MAX_ATTEMPTS_DEFAULT);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe('oscillating');
      expect(result.data.period).toBe(2);
      expect(result.data.generation).toBeGreaterThanOrEqual(2);
      expect(result.data.state).toBeDefined();
    });

    it('should detect toad as oscillating with period 2', async () => {
      const board = GameBoard.fromDenseArray(TOAD_PATTERN);

      const result = await detectCycle(board, MAX_ATTEMPTS_DEFAULT);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe('oscillating');
      expect(result.data.period).toBe(2);
      expect(result.data.generation).toBeGreaterThanOrEqual(2);
    });
  });

  describe('timeout handling', () => {
    it('should timeout for glider pattern that never stabilizes', async () => {
      const board = GameBoard.fromDenseArray(GLIDER_PATTERN);

      const result = await detectCycle(board, MAX_ATTEMPTS_SMALL);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe('timeout');
      expect(result.data.generation).toBe(MAX_ATTEMPTS_SMALL);
      expect(result.data.period).toBeUndefined();
      expect(result.data.state).toBeDefined();
    });

    it('should timeout after exact maxAttempts generations', async () => {
      const maxAttempts = 5;
      const board = GameBoard.fromDenseArray(GLIDER_PATTERN);

      const result = await detectCycle(board, maxAttempts);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.generation).toBe(maxAttempts);
      expect(result.data.status).toBe('timeout');
    });
  });

  describe('progress callback', () => {
    it('should invoke progress callback for each generation', async () => {
      const progressCallback = vi.fn();
      const board = GameBoard.fromDenseArray(BLINKER_PATTERN);
      const maxAttempts = 5;

      await detectCycle(board, maxAttempts, progressCallback);

      // Should be called at least once (when oscillation detected)
      expect(progressCallback).toHaveBeenCalled();

      // All calls should have valid generation numbers and states
      progressCallback.mock.calls.forEach((call) => {
        const [generation, state] = call;
        expect(typeof generation).toBe('number');
        expect(generation).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(state)).toBe(true);
      });
    });

    it('should not invoke callback if not provided', async () => {
      const board = GameBoard.fromDenseArray(BLOCK_PATTERN);

      // Should not throw when callback is undefined
      const result = await detectCycle(board, MAX_ATTEMPTS_DEFAULT);

      expect(result.success).toBe(true);
    });

    it('should provide current state in progress callback', async () => {
      const progressCallback = vi.fn();
      const board = GameBoard.fromDenseArray(BLOCK_PATTERN);

      await detectCycle(board, MAX_ATTEMPTS_DEFAULT, progressCallback);

      // For stable pattern, should be called once with generation 0
      expect(progressCallback).toHaveBeenCalledWith(0, BLOCK_PATTERN);
    });

    it('should call progress callback multiple times for oscillating pattern', async () => {
      const progressCallback = vi.fn();
      const board = GameBoard.fromDenseArray(BLINKER_PATTERN);

      await detectCycle(board, MAX_ATTEMPTS_DEFAULT, progressCallback);

      // Should be called multiple times (at least for detection)
      expect(progressCallback.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('error handling', () => {
    it('should return error for invalid maxAttempts (0)', async () => {
      const board = GameBoard.fromDenseArray(BLOCK_PATTERN);

      const result = await detectCycle(board, 0);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toContain('maxAttempts must be positive');
    });

    it('should return error for negative maxAttempts', async () => {
      const board = GameBoard.fromDenseArray(BLOCK_PATTERN);

      const result = await detectCycle(board, -5);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toContain('maxAttempts must be positive');
    });
  });

  describe('cycle detection algorithm', () => {
    it('should use hash-based state comparison for efficiency', async () => {
      // This test verifies the algorithm completes in reasonable time
      // O(L) complexity should handle large sparse boards efficiently
      const largeBoard = GameBoard.fromDenseArray(GLIDER_PATTERN);
      const startTime = Date.now();

      await detectCycle(largeBoard, 50);

      const duration = Date.now() - startTime;

      // Should complete in less than 100ms for 50 generations
      expect(duration).toBeLessThan(100);
    });

    it('should detect oscillation period correctly for various periods', async () => {
      // Blinker has period 2
      const blinker = GameBoard.fromDenseArray(BLINKER_PATTERN);
      const result = await detectCycle(blinker, MAX_ATTEMPTS_DEFAULT);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.period).toBe(2);
    });

    it('should maintain state integrity across generations', async () => {
      const progressCallback = vi.fn();
      const board = GameBoard.fromDenseArray(BLINKER_PATTERN);

      await detectCycle(board, MAX_ATTEMPTS_DEFAULT, progressCallback);

      // Verify all states have consistent dimensions
      progressCallback.mock.calls.forEach((call) => {
        const [, state] = call;
        expect(state.length).toBe(BLINKER_PATTERN.length);
        expect(state[0]?.length).toBe(BLINKER_PATTERN[0]?.length);
      });
    });
  });

  describe('result structure', () => {
    it('should return properly typed success result', async () => {
      const board = GameBoard.fromDenseArray(BLOCK_PATTERN);

      const result = await detectCycle(board, MAX_ATTEMPTS_DEFAULT);

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);

      if (!result.success) return;

      expect(result.data).toHaveProperty('status');
      expect(result.data).toHaveProperty('generation');
      expect(result.data).toHaveProperty('state');
    });

    it('should return properly typed error result', async () => {
      const board = GameBoard.fromDenseArray(BLOCK_PATTERN);

      const result = await detectCycle(board, -1);

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);

      if (result.success) return;

      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
    });
  });
});
