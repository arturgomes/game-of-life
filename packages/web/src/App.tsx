import { Layout } from './components/Layout';
import { Card } from './components/ui';
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
          <div className="text-center text-gray-500">
            <h2 className="text-xl font-semibold mb-2">Main block</h2>
            <p className="mb-4">Description for later</p>

            <Card className="max-w-md mx-auto mt-6">
              <Card.Header>
                <Card.Title>Card</Card.Title>
              </Card.Header>
              <Card.Body>
                <ul className="text-left space-y-2 text-sm">
                  <li>One</li>
                  <li>Two</li>
                  <li>Three</li>
                </ul>
              </Card.Body>
              <Card.Footer>
                <p className="text-xs text-gray-600">
                  Current Mode: <span className="font-mono text-blue-600">{mode}</span>
                </p>
              </Card.Footer>
            </Card>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>
        </Layout.Main.Content>
      </Layout.Main>

      <Layout.Footer>
        <Layout.Footer.Text>Conway's Game of Life</Layout.Footer.Text>
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
