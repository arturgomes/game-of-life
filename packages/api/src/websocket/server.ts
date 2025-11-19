import type { Server as HttpServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { logger } from '../config/logger.js';
import { handleFinalStateConnection } from './handlers/final-state.js';

/**
 * WebSocket server for real-time communication
 * Used for R4: Streaming final state calculations
 */

let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server attached to HTTP server
 */
export function initializeWebSocketServer(httpServer: HttpServer): WebSocketServer {
  if (wss) {
    logger.warn('WebSocket server already initialized');
    return wss;
  }

  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = req.url ?? 'unknown';
    logger.info({ url }, 'WebSocket client connected');

    // Handle final state calculation connections
    handleFinalStateConnection(ws, url).catch((error) => {
      logger.error({ error, url }, 'Error handling WebSocket connection');
      ws.close(1011, 'Internal server error');
    });

    ws.on('close', () => {
      logger.info({ url }, 'WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      logger.error({ error, url }, 'WebSocket error');
    });
  });

  logger.info('WebSocket server initialized on path /ws');

  return wss;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): WebSocketServer {
  if (!wss) {
    throw new Error('WebSocket server not initialized');
  }
  return wss;
}

/**
 * Shutdown WebSocket server
 */
export function shutdownWebSocketServer(): Promise<void> {
  if (!wss) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    wss?.close((err) => {
      if (err) {
        logger.error({ error: err }, 'Error closing WebSocket server');
        reject(err);
      } else {
        logger.info('WebSocket server closed');
        wss = null;
        resolve();
      }
    });
  });
}
