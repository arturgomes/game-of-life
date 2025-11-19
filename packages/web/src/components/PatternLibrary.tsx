import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { ALL_PATTERNS } from '../lib/patterns';
import type { Pattern } from '../types';
import { Button, Card } from './ui';

/**
 * PatternLibrary Component - Quick-load common Game of Life patterns
 *
 * Features:
 * - Categorized patterns (Still Lifes, Oscillators, Spaceships)
 * - Expandable sections for each category
 * - Pattern preview with description
 * - One-click pattern loading
 *
 * Patterns include:
 * - Stable: Block, Beehive, Loaf, Boat, Canoe
 * - Oscillators: Blinker, Toad, Beacon, Pulsar, Pentadecathlon
 * - Spaceships: Glider, LWSS
 */

type CategoryKey = keyof typeof ALL_PATTERNS;

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  stillLifes: 'Still Lifes',
  oscillators: 'Oscillators',
  spaceships: 'Spaceships',
};

const CATEGORY_DESCRIPTIONS: Record<CategoryKey, string> = {
  stillLifes: 'Stable patterns that never change',
  oscillators: 'Patterns that repeat with a period',
  spaceships: 'Patterns that move across the grid',
};

export function PatternLibrary() {
  const { loadPattern } = useGame();
  const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>(null);

  const toggleCategory = (category: CategoryKey) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  const handleLoadPattern = (pattern: Pattern) => {
    loadPattern(pattern.state);
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Pattern Library</Card.Title>
      </Card.Header>
      <Card.Body>
        <div className="space-y-3">
          {(Object.entries(ALL_PATTERNS) as [CategoryKey, Record<string, Pattern>][]).map(
            ([category, patterns]) => {
              const isExpanded = expandedCategory === category;
              const patternCount = Object.keys(patterns).length;

              return (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{CATEGORY_LABELS[category]}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {CATEGORY_DESCRIPTIONS[category]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        {patternCount} {patternCount === 1 ? 'pattern' : 'patterns'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
                      >
                        <title>{isExpanded ? 'Collapse' : 'Expand'}</title>
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Pattern List */}
                  {isExpanded && (
                    <div className="p-3 space-y-2 bg-white">
                      {Object.values(patterns).map((pattern) => (
                        <div
                          key={pattern.name}
                          className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900">{pattern.name}</h4>
                            <p className="text-xs text-gray-600 mt-0.5">{pattern.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {pattern.dimensions.rows} × {pattern.dimensions.cols}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleLoadPattern(pattern)}
                            variant="secondary"
                            className="shrink-0 text-xs"
                          >
                            Load
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            },
          )}

          {/* Empty Board Option */}
          <div className="pt-2 border-t border-gray-200">
            <Button onClick={() => loadPattern([])} variant="secondary" className="w-full text-sm">
              Create Empty Board
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
