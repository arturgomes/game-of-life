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
    <div className="space-y-3">
      {(Object.entries(ALL_PATTERNS) as [CategoryKey, Record<string, Pattern>][]).map(
        ([category, patterns]) => {
          const isExpanded = expandedCategory === category;

          return (
            <div key={category} className="overflow-hidden rounded-lg border border-gray-200">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex gap-4 justify-between items-center px-4 py-3 w-full text-left bg-gray-50 transition-colors hover:bg-gray-100"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{CATEGORY_LABELS[category]}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{CATEGORY_DESCRIPTIONS[category]}</p>
                </div>
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
              </button>

              {/* Pattern List */}
              {isExpanded && (
                <div className="p-3 space-y-2 bg-white">
                  {Object.values(patterns).map((pattern) => (
                    <div
                      key={pattern.name}
                      className="flex gap-3 justify-between items-center p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">{pattern.name}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">{pattern.description}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {pattern.dimensions.rows} × {pattern.dimensions.cols}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleLoadPattern(pattern)}
                        variant="secondary"
                        className="text-xs shrink-0"
                      >
                        Pick
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        },
      )}
    </div>
  );
}
