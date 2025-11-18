import type { BoardInput } from '@game-of-life/shared';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { BoardModel } from '../src/models/board.model.js';

/**
 * Integration tests for Board Routes (R2 and R3)
 * Tests actual HTTP endpoints with database integration
 */

describe('Board Routes Integration Tests', () => {
  let app: Express;
  let testBoardId: string;

  // Test board patterns
  const blockPattern: BoardInput = [
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
  ];

  const blinkerPattern: BoardInput = [
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
  ];

  beforeAll(async () => {
    // Setup Express app with routes
    app = createApp();

    // Connect to test database
    await connectDatabase();
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await disconnectDatabase();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await BoardModel.deleteMany({});
  });

  describe('R2: GET /boards/:boardId/next', () => {
    it('should return next generation for valid boardId', async () => {
      // Create a board first
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blockPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Get next generation
      const response = await request(app).get(`/boards/${testBoardId}/next`).expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('state');
      expect(Array.isArray(response.body.data.state)).toBe(true);

      // Block pattern should remain stable
      expect(response.body.data.state).toEqual(blockPattern);
    });

    it('should return 404 for invalid boardId', async () => {
      // Use a valid UUID format that doesn't exist in database
      const invalidBoardId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app).get(`/boards/${invalidBoardId}/next`).expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Board not found');
    });

    it('should handle blinker oscillator correctly', async () => {
      // Create blinker board
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blinkerPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Get next generation
      const response = await request(app).get(`/boards/${testBoardId}/next`).expect(200);

      // Blinker should rotate 90 degrees
      const expectedRotated: BoardInput = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ];

      expect(response.body.data.state).toEqual(expectedRotated);
    });

    it('should use cache on second request', async () => {
      // Create board
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blockPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // First request
      const firstResponse = await request(app).get(`/boards/${testBoardId}/next`).expect(200);

      // Second request (should hit cache)
      const secondResponse = await request(app).get(`/boards/${testBoardId}/next`).expect(200);

      expect(firstResponse.body.data.state).toEqual(secondResponse.body.data.state);
    });
  });

  describe('R3: GET /boards/:boardId/state/:generation', () => {
    it('should return correct state for generation=1', async () => {
      // Create board
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blinkerPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Get generation 1 (should be same as R2)
      const response = await request(app).get(`/boards/${testBoardId}/state/1`).expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('state');
      expect(response.body.data).toHaveProperty('generation', 1);

      // Should match what R2 returns
      const r2Response = await request(app).get(`/boards/${testBoardId}/next`).expect(200);

      expect(response.body.data.state).toEqual(r2Response.body.data.state);
    });

    it('should return correct state for generation=10', async () => {
      // Create board
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blockPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Get generation 10
      const response = await request(app).get(`/boards/${testBoardId}/state/10`).expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('state');
      expect(response.body.data).toHaveProperty('generation', 10);

      // Block pattern should remain stable even after 10 generations
      expect(response.body.data.state).toEqual(blockPattern);
    });

    it('should return 400 for generation=0', async () => {
      // Create board
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blockPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Try to get generation 0
      const response = await request(app).get(`/boards/${testBoardId}/state/0`).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should return 404 for non-existent boardId', async () => {
      // Use a valid UUID format that doesn't exist in database
      const invalidBoardId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app).get(`/boards/${invalidBoardId}/state/5`).expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Board not found');
    });

    it('should handle blinker oscillation over multiple generations', async () => {
      // Create blinker board
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blinkerPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Blinker has period 2, so generation 2 should return to original
      const response = await request(app).get(`/boards/${testBoardId}/state/2`).expect(200);

      expect(response.body.data.state).toEqual(blinkerPattern);
    });

    it('should cache intermediate generations', async () => {
      // Create board
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blockPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Request generation 20 (should cache generation 10 and 20)
      const firstResponse = await request(app).get(`/boards/${testBoardId}/state/20`).expect(200);

      // Request generation 20 again (should hit cache)
      const secondResponse = await request(app).get(`/boards/${testBoardId}/state/20`).expect(200);

      expect(firstResponse.body.data.state).toEqual(secondResponse.body.data.state);
    });

    it('should return 400 for invalid UUID format', async () => {
      // Use invalid UUID format
      const invalidBoardId = 'not-a-uuid';

      const response = await request(app).get(`/boards/${invalidBoardId}/state/5`).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should return 400 for negative generation', async () => {
      // Create board
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blockPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Try to get negative generation
      const response = await request(app).get(`/boards/${testBoardId}/state/-5`).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Validation error');
    });
  });

  describe('R1: POST /boards', () => {
    it('should create board and return boardId', async () => {
      const response = await request(app).post('/boards').send({ board: blockPattern }).expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('boardId');
      expect(typeof response.body.data.boardId).toBe('string');

      // Verify boardId is UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(response.body.data.boardId)).toBe(true);
    });

    it('should return 400 for invalid board (not 2D array)', async () => {
      const response = await request(app).post('/boards').send({ board: [1, 2, 3] }).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should return 400 for invalid board (non-array)', async () => {
      const response = await request(app).post('/boards').send({ board: 'invalid' }).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should return 400 for missing board field', async () => {
      const response = await request(app).post('/boards').send({}).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should return 400 for empty board array', async () => {
      const response = await request(app).post('/boards').send({ board: [] }).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should handle large sparse board', async () => {
      // Create 100x100 board with only a few live cells (glider pattern)
      const largeBoard: (0 | 1)[][] = Array.from({ length: 100 }, () =>
        Array.from({ length: 100 }, () => 0 as 0 | 1),
      );

      // Add glider in center
      const row50 = largeBoard[50];
      const row51 = largeBoard[51];
      const row52 = largeBoard[52];

      if (row50 && row51 && row52) {
        row50[51] = 1;
        row51[52] = 1;
        row52[50] = 1;
        row52[51] = 1;
        row52[52] = 1;
      }

      const response = await request(app).post('/boards').send({ board: largeBoard }).expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('boardId');
    });
  });

  describe('R4: POST /boards/:boardId/final', () => {
    it('should return 202 with WebSocket URL for valid request', async () => {
      // Create a board first
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blockPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Request final state calculation
      const response = await request(app)
        .post(`/boards/${testBoardId}/final`)
        .send({ maxAttempts: 100 })
        .expect(202);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Final state calculation initiated');
      expect(response.body.data).toHaveProperty('websocketUrl');
      expect(response.body.data.websocketUrl).toContain(`/ws?boardId=${testBoardId}&maxAttempts=100`);
    });

    it('should return 400 for missing maxAttempts', async () => {
      // Create a board first
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blockPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Request final state without maxAttempts
      const response = await request(app)
        .post(`/boards/${testBoardId}/final`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'maxAttempts must be a positive number');
    });

    it('should return 400 for invalid maxAttempts (negative)', async () => {
      // Create a board first
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blockPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Request final state with negative maxAttempts
      const response = await request(app)
        .post(`/boards/${testBoardId}/final`)
        .send({ maxAttempts: -1 })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'maxAttempts must be a positive number');
    });

    it('should return 400 for invalid maxAttempts (zero)', async () => {
      // Create a board first
      const createResponse = await request(app)
        .post('/boards')
        .send({ board: blockPattern })
        .expect(201);

      testBoardId = createResponse.body.data.boardId;

      // Request final state with zero maxAttempts
      const response = await request(app)
        .post(`/boards/${testBoardId}/final`)
        .send({ maxAttempts: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'maxAttempts must be a positive number');
    });

    it('should return 404 for non-existent boardId', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .post(`/boards/${nonExistentId}/final`)
        .send({ maxAttempts: 100 })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Board not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .post('/boards/invalid-uuid/final')
        .send({ maxAttempts: 100 })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
