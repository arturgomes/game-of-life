import { Controls } from './components/Controls';
import { GameBoard } from './components/GameBoard';
import { Layout } from './components/Layout';
import { PatternLibrary } from './components/PatternLibrary';
import { ProgressStream } from './components/ProgressStream';
import { GameProvider, useGame } from './contexts/GameContext';

function AppContent() {
  const { mode, error } = useGame();

  return (
    <Layout>
      <Layout.Header>
        <Layout.Header.Title>Conway's Game of Life</Layout.Header.Title>
        <Layout.Header.Subtitle>
          Interactive visualization with real-time streaming
        </Layout.Header.Subtitle>
      </Layout.Header>

      <Layout.Main>
        <Layout.Main.Content>
          {/* Main Grid Layout */}
          <div className="flex flex-col gap-4 w-full">
            {/* Center - Game Board */}
            <div className="lg:col-span-9">
              <div className="space-y-4">
                {/* Mode Indicator */}
                <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">Mode:</span>
                  <span className="font-mono text-sm font-semibold text-blue-600">
                    {mode.toUpperCase()}
                  </span>
                </div>

                {/* Board Container - GameBoard always visible, ProgressStream overlays when streaming */}
                <div className="relative">
                  <GameBoard />
                  <ProgressStream />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls and Pattern Library */}
            <div className="flex flex-row gap-4 align-bottom">
              <Controls />
              
            </div>
          </div>
        </Layout.Main.Content>
      </Layout.Main>

      <Layout.Footer>
        <Layout.Footer.Text>
          Built with React + Vite + TypeScript | Phase 3 Complete
        </Layout.Footer.Text>
      </Layout.Footer>
    </Layout>
  );
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
