/**
 * Custom hook for WebSocket connection management (R4)
 * Handles connection lifecycle, message processing, and state updates
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameOfLifeWebSocket } from '../lib';
import type { FinalStateResult, ProgressMessage, WebSocketMessage } from '../types';

type UseWebSocketOptions = {
  url: string | null;
  onComplete: (result: FinalStateResult) => void;
};

export function useWebSocket({ url, onComplete }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState<ProgressMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<GameOfLifeWebSocket | null>(null);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setIsConnected(false);
    setProgress(null);
  }, []);

  useEffect(() => {
    if (!url) return;

    const handleMessage = (message: WebSocketMessage) => {
      if (message.type === 'progress') {
        setProgress(message);
        setError(null);
        setIsConnected(true);
        return;
      }

      if (message.type === 'final') {
        onComplete({
          status: message.status,
          generation: message.generation,
          period: message.period,
          state: message.state,
        });
        setIsConnected(false);
        return;
      }

      if (message.type === 'error') {
        setError(message.error);
        setIsConnected(false);
      }
    };

    const handleError = (err: string) => {
      setError(err);
    };

    const handleClose = () => {
      setIsConnected(false);
    };

    const handleOpen = () => {
      setIsConnected(true);
      setError(null);
    };

    wsRef.current = new GameOfLifeWebSocket(url, {
      onMessage: handleMessage,
      onError: handleError,
      onClose: handleClose,
      onOpen: handleOpen,
    });

    wsRef.current.connect();

    return () => {
      disconnect();
    };
  }, [url, onComplete, disconnect]);

  return {
    isConnected,
    progress,
    error,
    disconnect,
  };
}
