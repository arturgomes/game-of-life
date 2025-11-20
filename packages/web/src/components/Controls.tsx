import { useState } from 'react';
import { useControls } from '../hooks';
import { PatternLibrary } from './PatternLibrary';
import { Button, Card, Input } from './ui';
import { Sheet } from './ui/Sheet';

/**
 * Controls Component - Action panel for all API operations (R1-R4)
 *
 * Presentation layer for board controls, separated from logic via useControls hook
 *
 * Sections:
 * 1. Board Setup - Dimensions, create, clear
 * 2. Generation Controls - Next generation, jump to generation X
 * 3. Final State - Calculate final state with max attempts
 */

export function Controls() {
  const {
    boardId,
    currentBoard,
    rows,
    cols,
    jumpGeneration,
    maxAttempts,
    setRows,
    setCols,
    setJumpGeneration,
    setMaxAttempts,
    handleDimensionsChange,
    handleCreateBoard,
    handleNextGeneration,
    handleJumpToGeneration,
    handleStartFinalState,
    createEmptyBoard,
  } = useControls();

  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-row gap-4 justify-between">
      <Button onClick={handleStartFinalState} size="sm" disabled={!boardId} className="w-full">
        Calculate Final State
      </Button>
      <Sheet.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Sheet.Trigger asChild>
          <button
            type="button"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Edit settings
          </button>
        </Sheet.Trigger>
        <Sheet.Portal>
          <Sheet.Overlay />
          <Sheet.Content side="right" className="w-[400px] sm:w-[540px]">
            <Sheet.Close />
            <Sheet.Header>
              <Sheet.Title>Board Setup</Sheet.Title>
              <Sheet.Description>Placeholder for a short description</Sheet.Description>
            </Sheet.Header>

            <Sheet.Body>
              <div className="flex flex-col gap-4">
                {/* Board ID Display */}
                {boardId && (
                  <Card>
                    <Card.Body>
                      <p className="text-xs text-gray-600">
                        Board ID: <span className="font-mono text-blue-600">{boardId}</span>
                      </p>
                    </Card.Body>
                  </Card>
                )}
                <div className="flex flex-col gap-2 align-top">
                  {/* Board Setup Section */}
                  <Card>
                    <Card.Header>
                      <Card.Title>Board Setup</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="rows"
                              className="block mb-1 text-sm font-medium text-gray-700"
                            >
                              Rows
                            </label>
                            <Input
                              id="rows"
                              type="number"
                              min={1}
                              max={100}
                              value={rows}
                              onChange={(e) => setRows(Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="cols"
                              className="block mb-1 text-sm font-medium text-gray-700"
                            >
                              Columns
                            </label>
                            <Input
                              id="cols"
                              type="number"
                              min={1}
                              max={100}
                              value={cols}
                              onChange={(e) => setCols(Number(e.target.value))}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleCreateBoard}
                          size="sm"
                          disabled={!currentBoard}
                          className="w-full"
                        >
                          Upload Board
                        </Button>
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={handleDimensionsChange}
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                          >
                            Set Dimensions
                          </Button>
                          <Button
                            onClick={() => createEmptyBoard()}
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                          >
                            Clear Board
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Generation Controls Section */}
                  <Card>
                    <Card.Header>
                      <Card.Title>Generation Controls</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <div className="space-y-4">
                        <Button
                          onClick={handleNextGeneration}
                          disabled={!boardId}
                          className="w-full"
                        >
                          Next Generation
                        </Button>

                        <div className="space-y-2">
                          <label
                            htmlFor="jumpGen"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Jump to Generation
                          </label>
                          <div className="flex gap-2">
                            <Input
                              id="jumpGen"
                              type="number"
                              min={1}
                              value={jumpGeneration}
                              onChange={(e) => setJumpGeneration(Number(e.target.value))}
                              className="flex-1"
                            />
                            <Button onClick={handleJumpToGeneration} size="sm" disabled={!boardId}>
                              Go
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Final State Section */}
                  <Card>
                    <Card.Header>
                      <Card.Title>Final State Calculation</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="maxAttempts"
                            className="block mb-1 text-sm font-medium text-gray-700"
                          >
                            Max Attempts (1-100,000)
                          </label>
                          <Input
                            id="maxAttempts"
                            type="number"
                            min={1}
                            max={100_000}
                            value={maxAttempts}
                            onChange={(e) => setMaxAttempts(Number(e.target.value))}
                          />
                        </div>
                        <Button
                          onClick={handleStartFinalState}
                          size="sm"
                          disabled={!boardId}
                          className="w-full"
                        >
                          Calculate Final State
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                  <PatternLibrary />
                </div>
              </div>
            </Sheet.Body>

            <Sheet.Footer>
              <Button type="button" size="md" onClick={handleOpenChange}>
                Fechar
              </Button>
            </Sheet.Footer>
          </Sheet.Content>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  );
}
