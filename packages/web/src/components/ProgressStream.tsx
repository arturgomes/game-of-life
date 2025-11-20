import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useControls, useWebSocket } from '../hooks';
import type { FinalStateResult } from '../types';
import { Button, Card } from './ui';

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
  const [genPerSec, setGenPerSec] = useState<number>(0);
  const previousGenRef = useRef<{ generation: number; timestamp: number } | null>(null);

  const onComplete = useCallback((result: FinalStateResult) => {
    setCurrentBoard(result.state);
    setMode('visualizing');
    setWebSocketUrl(null);
  }, [setCurrentBoard, setMode, setWebSocketUrl]);

  const { isConnected, progress, error, disconnect } = useWebSocket({
    url: mode === 'streaming' ? webSocketUrl : null,
    onComplete,
  });

  const handleStop = () => {
    disconnect();
    setMode('editor');
    setWebSocketUrl(null);
  };

  useEffect(() => {
    if (progress?.state) {
      setCurrentBoard(progress.state);
    }
  }, [progress, setCurrentBoard]);


  useEffect(() => {
    if (progress) {
      const now = Date.now();
      if (previousGenRef.current) {
        const timeDiff = (now - previousGenRef.current.timestamp) / 1000; // seconds
        const genDiff = progress.generation - previousGenRef.current.generation;
        if (timeDiff > 0) {
          const rate = genDiff / timeDiff;
          setGenPerSec(Math.round(rate * 10) / 10); // Round to 1 decimal
        }
      }
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
            <Button
              type="button"
              onClick={handleStop}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Stop
            </Button>
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
                <div className="py-4 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="mb-1 text-xs tracking-wide text-gray-600 uppercase">
                    Current Generation
                  </div>
                  <div className="text-5xl font-bold tabular-nums text-blue-600 transition-all duration-200 ease-in-out">
                    {progress.generation.toLocaleString()}
                  </div>
                  {genPerSec > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-mono">{genPerSec}</span> gen/sec
                    </div>
                  )}
                </div>

                {/* Status Message */}
                <div className="p-3 text-center bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    �� Calculating final state...
                    <span className="ml-2 font-mono">{progress.generation.toLocaleString()}</span>
                    <span className="mx-1 text-gray-600">/</span>
                    <span className="font-mono">{maxAttempts.toLocaleString()}</span>
                  </p>
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
