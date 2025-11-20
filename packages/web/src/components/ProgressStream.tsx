import { useEffect } from 'react';
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

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="overflow-hidden w-full h-3 bg-gray-200 rounded-full">
      <div
        className="h-3 bg-blue-600 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function ProgressStream() {
  const { mode, webSocketUrl, setCurrentBoard, setMode, setWebSocketUrl } = useGame();
  const { maxAttempts } = useControls(); 

  const onComplete = (result: FinalStateResult) => {
    setCurrentBoard(result.state);
    setMode('visualizing'); 
    setWebSocketUrl(null); 
  };

  const { isConnected, progress, error, disconnect } = useWebSocket({
    url: mode === 'streaming' ? webSocketUrl : null,
    onComplete,
  });

  useEffect(() => {
    if (progress?.state) {
      setCurrentBoard(progress.state);
    }
  }, [progress, setCurrentBoard]);

  useEffect(() => {
    if (error) {
      setMode('editor');
      setWebSocketUrl(null);
    }
  }, [error, setMode, setWebSocketUrl]);

  if (mode !== 'streaming') {
    return null;
  }

  const progressPercentage = progress
    ? Math.min(100, (progress.generation / maxAttempts) * 100)
    : 0;

  const hasError = Boolean(error);

  return (
    <div className="absolute inset-0 z-20 bg-white bg-opacity-95 backdrop-blur-sm transition-opacity duration-300 ease-in-out animate-in fade-in">
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <Card.Title>Final State Calculation</Card.Title>
            <button
              type="button"
              onClick={disconnect}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Stop
            </button>
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
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-600">Generation:</span>
                  <span className="text-2xl font-bold text-blue-600">{progress.generation}</span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs text-gray-600">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <ProgressBar percentage={progressPercentage} />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">0</span>
                    <span className="text-xs text-gray-500">{maxAttempts}</span>
                  </div>
                </div>

                <div className="p-3 text-center bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Calculating final state... Generation {progress.generation} of max {maxAttempts}
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
