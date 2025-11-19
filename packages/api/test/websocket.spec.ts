import type { Server as HttpServer } from 'node:http';
import type { BoardInput } from '@game-of-life/shared';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { BoardModel } from '../src/models/board.model.js';
import { createBoard } from '../src/services/board.service.js';
import * as boardService from '../src/services/board.service.js';
import {
  initializeWebSocketServer,
  getWebSocketServer,
  shutdownWebSocketServer,
} from '../src/websocket/server.js';

/**
 * Integration tests for WebSocket R4 Final State Streaming
 */

describe('WebSocket Final State Streaming', () => {
  let httpServer: HttpServer;
  let testBoardId: string;
  const port = 3001; // Use different port for tests

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

  const singleCellPattern: BoardInput = [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ];

  const gliderPattern: BoardInput = [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ];

  beforeAll(async () => {
    // Connect to test database
    await connectDatabase();

    // Create Express app and HTTP server
    const app = createApp();
    httpServer = app.listen(port);

    // Initialize WebSocket server
    initializeWebSocketServer(httpServer);
  });

  afterAll(async () => {
    // Cleanup
    await disconnectDatabase();
    httpServer.close();
  });

  afterEach(async () => {
    // Wait longer to ensure WebSocket connections are fully closed and all async operations complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Clean up test data after each test
    await BoardModel.deleteMany({});
  });

  it('should detect stable pattern (Block) via WebSocket', async () => {
    // Create board
    const result = await createBoard(blockPattern);
    if (!result.success) throw new Error('Failed to create board');
    testBoardId = result.data;

    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:${port}/ws?boardId=${testBoardId}&maxAttempts=10`);

    const messages: unknown[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        messages.push(message);

        if (message.type === 'final') {
          ws.close();
        }
      });

      ws.on('close', () => resolve());
      ws.on('error', (error) => reject(error));

      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });

    // Verify messages
    expect(messages.length).toBeGreaterThan(0);

    const finalMessage = messages[messages.length - 1] as {
      type: string;
      status: string;
      generation: number;
    };
    expect(finalMessage.type).toBe('final');
    expect(finalMessage.status).toBe('stable');
    expect(finalMessage.generation).toBe(0); // Block is stable from generation 0
  });

  it('should detect oscillating pattern (Blinker) via WebSocket', async () => {
    // Create board
    const result = await createBoard(blinkerPattern);
    if (!result.success) throw new Error('Failed to create board');
    testBoardId = result.data;

    // Wait for database write to complete and verify board exists
    await new Promise((resolve) => setTimeout(resolve, 50));
    const board = await BoardModel.findOne({ boardId: testBoardId });
    if (!board) throw new Error('Board not found after creation');

    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:${port}/ws?boardId=${testBoardId}&maxAttempts=10`);

    const messages: unknown[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        messages.push(message);

        if (message.type === 'final' || message.type === 'error') {
          ws.close();
        }
      });

      ws.on('close', () => resolve());
      ws.on('error', (error) => reject(error));

      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });

    // Verify messages
    expect(messages.length).toBeGreaterThan(0);

    const finalMessage = messages[messages.length - 1] as {
      type: string;
      status?: string;
      period?: number;
      error?: string;
    };

    // Log error if present for debugging
    if (finalMessage.type === 'error') {
      throw new Error(`WebSocket error: ${finalMessage.error}`);
    }

    expect(finalMessage.type).toBe('final');
    expect(finalMessage.status).toBe('oscillating');
    expect(finalMessage.period).toBe(2); // Blinker has period 2
  });

  it('should detect stable pattern (single cell dies) via WebSocket', async () => {
    // Create board
    const result = await createBoard(singleCellPattern);
    if (!result.success) throw new Error('Failed to create board');
    testBoardId = result.data;

    // Wait for database write to complete and verify board exists
    await new Promise((resolve) => setTimeout(resolve, 50));
    const board = await BoardModel.findOne({ boardId: testBoardId });
    if (!board) throw new Error('Board not found after creation');

    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:${port}/ws?boardId=${testBoardId}&maxAttempts=10`);

    const messages: unknown[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        messages.push(message);

        if (message.type === 'final' || message.type === 'error') {
          ws.close();
        }
      });

      ws.on('close', () => resolve());
      ws.on('error', (error) => reject(error));

      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });

    // Verify messages
    expect(messages.length).toBeGreaterThan(0);

    const finalMessage = messages[messages.length - 1] as {
      type: string;
      status?: string;
      generation?: number;
      error?: string;
    };

    // Log error if present for debugging
    if (finalMessage.type === 'error') {
      throw new Error(`WebSocket error: ${finalMessage.error}`);
    }

    expect(finalMessage.type).toBe('final');
    expect(finalMessage.status).toBe('stable');
    expect(finalMessage.generation).toBe(1); // Dies after 1 generation
  });

  it('should timeout for glider pattern with low maxAttempts', async () => {
    // Create board
    const result = await createBoard(gliderPattern);
    if (!result.success) throw new Error('Failed to create board');
    testBoardId = result.data;

    const maxAttempts = 5; // Too low for glider to escape
    const ws = new WebSocket(
      `ws://localhost:${port}/ws?boardId=${testBoardId}&maxAttempts=${maxAttempts}`,
    );

    const messages: unknown[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        messages.push(message);

        if (message.type === 'final') {
          ws.close();
        }
      });

      ws.on('close', () => resolve());
      ws.on('error', (error) => reject(error));

      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });

    // Verify messages
    expect(messages.length).toBeGreaterThan(0);

    const finalMessage = messages[messages.length - 1] as {
      type: string;
      status: string;
      generation: number;
    };
    expect(finalMessage.type).toBe('final');
    expect(finalMessage.status).toBe('timeout');
    expect(finalMessage.generation).toBe(maxAttempts);
  });

  it('should receive progress messages during calculation', async () => {
    // Create board
    const result = await createBoard(blinkerPattern);
    if (!result.success) throw new Error('Failed to create board');
    testBoardId = result.data;

    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:${port}/ws?boardId=${testBoardId}&maxAttempts=10`);

    const progressMessages: unknown[] = [];
    const finalMessages: unknown[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString()) as { type: string };

        if (message.type === 'progress') {
          progressMessages.push(message);
        } else if (message.type === 'final') {
          finalMessages.push(message);
          ws.close();
        }
      });

      ws.on('close', () => resolve());
      ws.on('error', (error) => reject(error));

      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });

    // Verify we received progress messages
    expect(progressMessages.length).toBeGreaterThan(0);
    expect(finalMessages.length).toBe(1);
  });

  it('should return error for invalid boardId', async () => {
    const invalidBoardId = '123e4567-e89b-12d3-a456-426614174000';

    const ws = new WebSocket(`ws://localhost:${port}/ws?boardId=${invalidBoardId}&maxAttempts=10`);

    await new Promise<void>((resolve, reject) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString()) as { type: string; error: string };
        expect(message.type).toBe('error');
        expect(message.error).toBe('Board not found');
      });

      ws.on('close', (code) => {
        expect(code).toBe(1008); // Policy violation
        resolve();
      });

      ws.on('error', (error) => reject(error));

      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });
  });

  it('should return error for missing maxAttempts parameter', async () => {
    const result = await createBoard(blockPattern);
    if (!result.success) throw new Error('Failed to create board');
    testBoardId = result.data;

    const ws = new WebSocket(`ws://localhost:${port}/ws?boardId=${testBoardId}`); // Missing maxAttempts

    await new Promise<void>((resolve, reject) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString()) as { type: string; error: string };
        expect(message.type).toBe('error');
        expect(message.error).toContain('Invalid connection parameters');
      });

      ws.on('close', (code) => {
        expect(code).toBe(1008); // Policy violation
        resolve();
      });

      ws.on('error', (error) => reject(error));

      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });
  });

  it('should return error for invalid maxAttempts (negative)', async () => {
    const result = await createBoard(blockPattern);
    if (!result.success) throw new Error('Failed to create board');
    testBoardId = result.data;

    const ws = new WebSocket(`ws://localhost:${port}/ws?boardId=${testBoardId}&maxAttempts=-1`);

    await new Promise<void>((resolve, reject) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString()) as { type: string; error: string };
        expect(message.type).toBe('error');
        expect(message.error).toContain('Invalid connection parameters');
      });

      ws.on('close', (code) => {
        expect(code).toBe(1008); // Policy violation
        resolve();
      });

      ws.on('error', (error) => reject(error));

      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });
  });

  it('should handle WebSocket client error event', async () => {
    const result = await createBoard(blockPattern);
    if (!result.success) throw new Error('Failed to create board');
    testBoardId = result.data;

    const ws = new WebSocket(`ws://localhost:${port}/ws?boardId=${testBoardId}&maxAttempts=10`);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // Force an error by sending invalid data
        // @ts-expect-error - Intentionally sending invalid data to trigger error handler
        ws._socket.emit('error', new Error('Forced client error'));
      });

      ws.on('close', () => {
        // Error was logged, connection closed
        resolve();
      });

      setTimeout(() => reject(new Error('WebSocket timeout')), 2000);
    });
  });

  it('should handle connection handler error and close connection', async () => {
    // Create a WebSocket connection with invalid URL to trigger handler error
    // The handler will catch the error from parseConnectionParams
    const ws = new WebSocket(`ws://localhost:${port}/ws?invalidUrl`);

    await new Promise<void>((resolve, reject) => {
      let receivedError = false;

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString()) as { type: string; error: string };
        if (message.type === 'error') {
          receivedError = true;
          expect(message.error).toContain('Invalid connection parameters');
        }
      });

      ws.on('close', (code) => {
        expect(receivedError).toBe(true);
        expect(code).toBe(1008); // Policy violation
        resolve();
      });

      ws.on('error', () => {
        // WebSocket connection errors are expected when handler closes connection
        resolve();
      });

      setTimeout(() => reject(new Error('WebSocket timeout')), 2000);
    });
  });

  it('should handle unexpected exception in connection handler', async () => {
    const result = await createBoard(blockPattern);
    if (!result.success) throw new Error('Failed to create board');
    testBoardId = result.data;

    // Mock getBoardById to throw an unexpected error
    const getBoardByIdSpy = vi.spyOn(boardService, 'getBoardById').mockImplementation(() => {
      throw new Error('Unexpected database error');
    });

    const ws = new WebSocket(`ws://localhost:${port}/ws?boardId=${testBoardId}&maxAttempts=10`);

    await new Promise<void>((resolve, reject) => {
      ws.on('close', (code) => {
        expect(code).toBe(1011); // Internal server error
        resolve();
      });

      ws.on('error', () => {
        // Expected when connection is forcefully closed
        resolve();
      });

      setTimeout(() => reject(new Error('WebSocket timeout')), 2000);
    });

    // Restore the spy
    getBoardByIdSpy.mockRestore();
  });
});

describe('WebSocket Server Lifecycle', () => {
  let httpServer: HttpServer;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    await connectDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should warn when initializing WebSocket server twice', () => {
    httpServer = app.listen(3002);

    // First initialization
    const wss1 = initializeWebSocketServer(httpServer);
    expect(wss1).toBeDefined();

    // Second initialization should return same instance and log warning
    const wss2 = initializeWebSocketServer(httpServer);
    expect(wss2).toBe(wss1);

    httpServer.close();
  });

  it('should get WebSocket server instance after initialization', () => {
    httpServer = app.listen(3003);
    initializeWebSocketServer(httpServer);

    const wss = getWebSocketServer();
    expect(wss).toBeDefined();

    httpServer.close();
  });

  it('should throw error when getting WebSocket server before initialization', async () => {
    // Ensure server is shut down
    await shutdownWebSocketServer();

    expect(() => getWebSocketServer()).toThrow('WebSocket server not initialized');
  });

  it('should shutdown WebSocket server successfully', async () => {
    httpServer = app.listen(3004);
    initializeWebSocketServer(httpServer);

    await shutdownWebSocketServer();

    // After shutdown, getting server should throw
    expect(() => getWebSocketServer()).toThrow('WebSocket server not initialized');

    httpServer.close();
  });

  it('should resolve immediately when shutting down non-initialized server', async () => {
    // Ensure server is not initialized
    await shutdownWebSocketServer();

    // Should not throw
    await expect(shutdownWebSocketServer()).resolves.toBeUndefined();
  });

  it('should handle error during WebSocket server shutdown', async () => {
    httpServer = app.listen(3005);
    const wss = initializeWebSocketServer(httpServer);

    // Mock close to trigger error
    const originalClose = wss.close.bind(wss);
    vi.spyOn(wss, 'close').mockImplementation((callback) => {
      if (callback) {
        callback(new Error('Forced shutdown error'));
      }
      return wss;
    });

    await expect(shutdownWebSocketServer()).rejects.toThrow('Forced shutdown error');

    // Restore and cleanup
    vi.restoreAllMocks();
    await new Promise<void>((resolve) => {
      originalClose((err) => {
        if (!err) resolve();
      });
    });
    httpServer.close();
  });
});
