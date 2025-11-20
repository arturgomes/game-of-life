import { useCallback, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { useControls, useWebSocket } from '../hooks';
import type { FinalStateResult } from '../types';
import { Card } from './ui';

/**
 * ProgressStream Component - Real-time WebSocket streaming for R4
 *
 * Features:
 * - Connection status indicator (connecting, connected, error)
 * - Live generation counter
 * - Progress bar visualization
 * - Board state updates during calculation
 * - Final result display (stable, oscillating, timeout)
 * - Oscillation period badge when detected
 *
 * Uses WebSocket for real-time streaming of generation progress
 */

function getConnectionStatusClass(isConnected: boolean, hasError: boolean): string {
  if (hasError) return 'bg-red-500';
  if (isConnected) return 'bg-green-500 animate-pulse';
  return 'bg-yellow-500 animate-pulse';
}

function getConnectionStatusText(isConnected: boolean, hasError: boolean): string {
  if (hasError) return 'Error';
  if (isConnected) return 'Connected';
  return 'Connecting...';
}

export function ProgressStream() {
  const { mode, webSocketUrl, setCurrentBoard, setMode, setWebSocketUrl } = useGame();
  const { maxAttempts } = useControls();
  const previousGenRef = useRef<{ generation: number; timestamp: number } | null>(null);

  const onComplete = useCallback((result: FinalStateResult) => {
    setCurrentBoard(result.state);
    setMode('visualizing');
    setWebSocketUrl(null);
  }, [setCurrentBoard, setMode, setWebSocketUrl]);

  const { isConnected, progress, error } = useWebSocket({
    url: mode === 'streaming' ? webSocketUrl : null,
    onComplete,
  });



  useEffect(() => {
    if (progress?.state) {
      setCurrentBoard(progress.state);
    }
  }, [progress, setCurrentBoard]);


  useEffect(() => {
    if (progress) {
      const now = Date.now();
      previousGenRef.current = { generation: progress.generation, timestamp: now };
    }
  }, [progress]);

  const hasError = Boolean(error);

  return (
    <div className="w-full h-full">
      <Card>
        <Card.Header>
          <div className="flex gap-2 justify-between items-center">
            <Card.Title>Final State Calculation</Card.Title>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <div
                className={`w-3 h-3 rounded-full ${getConnectionStatusClass(isConnected, hasError)}`}
              />
              <span className="text-sm font-medium text-gray-700">
                {getConnectionStatusText(isConnected, hasError)}
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {progress && !error && (
              <>
                {/* Prominent Generation Counter */}
                <div className="flex flex-col items-center py-4 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="mb-1 text-xs tracking-wide text-gray-600 uppercase">
                    Generation
                  </div>
                  <div className="flex flex-row gap-2 items-baseline">
                  <div className="text-6xl font-extrabold tabular-nums text-blue-600 transition-all duration-200 ease-in-out">
                    {progress.generation.toLocaleString()}
                  </div>
                  <span className="text-xl font-normal text-gray-500">/{maxAttempts.toLocaleString()}</span>
                  </div>
                </div>
                
              </>
            )}

            {!progress && !error && isConnected && (
              <div className="p-4 text-center bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Waiting for calculation to begin...</p>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
