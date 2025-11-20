/**
 * WebSocket client for Game of Life final state streaming (R4)
 * Features: automatic reconnection, message parsing, lifecycle management
 */

import type { WebSocketMessage } from '../types';
import { logger } from './logger';

export type WebSocketCallbacks = {
  onMessage: (message: WebSocketMessage) => void;
  onError: (error: string) => void;
  onClose: () => void;
  onOpen?: () => void;
};

/**
 * WebSocket client with automatic reconnection for R4 streaming
 */
export class GameOfLifeWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private readonly reconnectDelay = 1000; // Base delay in ms

  constructor(
    private readonly url: string,
    private readonly callbacks: WebSocketCallbacks,
  ) {}

  /**
   * Establish WebSocket connection
   */
  connect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        logger.info('WebSocket', 'Connected', { url: this.url });
        this.reconnectAttempts = 0;
        this.callbacks.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.callbacks.onMessage(message);
        } catch (error) {
          logger.error('WebSocket', 'Failed to parse message', error);
          this.callbacks.onError('Failed to parse server message');
        }
      };

      this.ws.onerror = (event) => {
        logger.error('WebSocket', 'Connection error', event);
        
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.callbacks.onError('WebSocket connection error');
        }
      };

      this.ws.onclose = (event) => {
        logger.info('WebSocket', 'Connection closed', { code: event.code, reason: event.reason });

        if (event.code === 1000) {
          this.callbacks.onClose();
          return;
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error('WebSocket', 'Max reconnection attempts reached');
          this.callbacks.onError('Connection lost. Max reconnection attempts reached.');
          this.callbacks.onClose();
          return;
        }

        const delay = this.reconnectDelay * 2 ** this.reconnectAttempts;
        logger.info('WebSocket', 'Reconnecting', {
          delay,
          attempt: this.reconnectAttempts + 1,
          maxAttempts: this.maxReconnectAttempts,
        });

        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, delay);
      };
    } catch (error) {
      logger.error('WebSocket', 'Failed to create connection', error);
      this.callbacks.onError(
        error instanceof Error ? error.message : 'Failed to establish connection',
      );
    }
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    if (!this.ws) {
      return;
    }

    logger.info('WebSocket', 'Disconnecting');
    this.ws.close(1000, 'Client disconnect');
    this.ws = null;
  }

  /**
   * Get current connection state
   */
  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
