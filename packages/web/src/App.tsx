import { Controls } from './components/Controls';
import { GameBoard } from './components/GameBoard';
import { Layout } from './components/Layout';
import { GameProvider, useGame } from './contexts/GameContext';

function AppContent() {
  const { mode, error } = useGame();

  return (
    <Layout>
      <Layout.Header>
        <div className="flex flex-row justify-between">
          <div>
            <Layout.Header.Title>Conway's Game of Life</Layout.Header.Title>
            <Layout.Header.Subtitle>
              Interactive visualization with real-time streaming
            </Layout.Header.Subtitle>
          </div>
          <div className="flex gap-2 justify-between items-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Mode:</span>
            <span className="font-mono text-sm font-semibold text-blue-600">
              {mode.toUpperCase()}
            </span>
          </div>
        </div>
      </Layout.Header>

      <Layout.Main>
        <Layout.Main.Content>
          <div className="flex flex-col gap-4 w-full">
            <div className="lg:col-span-9">
              <div className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="flex-1">
                    <GameBoard />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-row gap-4 align-bottom">
              <Controls />
            </div>
          </div>
        </Layout.Main.Content>
      </Layout.Main>
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
