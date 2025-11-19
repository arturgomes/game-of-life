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

// type ProgressStreamProps = {
//   wsUrl: string | null;
//   maxAttempts: number;
//   onComplete: (result: FinalStateResult) => void;
// };

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
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div
        className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function ProgressStream() {
  const { mode, webSocketUrl, setCurrentBoard, setMode, setWebSocketUrl } = useGame();
  const { maxAttempts } = useControls(); // Get maxAttempts from where it's defined

  const onComplete = (result: FinalStateResult) => {
    console.log('Final state calculation complete:', result);
    setCurrentBoard(result.state); // Update board to the final state
    setMode('visualizing'); // Switch mode to prevent re-triggering
    setWebSocketUrl(null); // Clear the URL to allow for a new calculation
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
      // Keep the component visible to show the error, but stop the connection attempt
      setWebSocketUrl(null);
    }
  }, [error, setMode, setWebSocketUrl]);

  // Only render this component when in streaming mode
  if (mode !== 'streaming') {
    return null; // Don't render anything if not in streaming mode
  }

  const progressPercentage = progress
    ? Math.min(100, (progress.generation / maxAttempts) * 100)
    : 0;

  const hasError = Boolean(error);

  return (
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
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${getConnectionStatusClass(isConnected, hasError)}`}
            />
            <span className="text-sm text-gray-700 font-medium">
              {getConnectionStatusText(isConnected, hasError)}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {progress && !error && (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-600">Generation:</span>
                <span className="text-2xl font-bold text-blue-600">{progress.generation}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Progress</span>
                  <span className="text-xs text-gray-600">{progressPercentage.toFixed(1)}%</span>
                </div>
                <ProgressBar percentage={progressPercentage} />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">0</span>
                  <span className="text-xs text-gray-500">{maxAttempts}</span>
                </div>
              </div>

              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Calculating final state... Generation {progress.generation} of max {maxAttempts}
                </p>
              </div>
            </>
          )}

          {!progress && !error && isConnected && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Waiting for calculation to begin...</p>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
