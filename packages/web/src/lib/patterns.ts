/**
 * Predefined Game of Life patterns
 * Includes stable patterns, oscillators, and spaceships
 * 
 * Patterns found in https://blog.xojo.com/2022/05/11/conways-game-of-life/
 */

import type { Pattern } from '../types';

/**
 * Still life patterns (stable, never change)
 */
export const STILL_LIFES: Record<string, Pattern> = {
  block: {
    name: 'Block',
    description: 'Simplest still life - 2×2 square',
    dimensions: { rows: 4, cols: 4 },
    state: [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
  },
  beehive: {
    name: 'Beehive',
    description: 'Hexagonal still life',
    dimensions: { rows: 5, cols: 6 },
    state: [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 1, 0, 0, 1, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  },
  loaf: {
    name: 'Loaf',
    description: 'Asymmetric still life',
    dimensions: { rows: 6, cols: 6 },
    state: [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 1, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  },
  boat: {
    name: 'Boat',
    description: 'Small still life',
    dimensions: { rows: 5, cols: 5 },
    state: [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
    ],
  },
  canoe: {
    name: 'Canoe',
    description: 'Smaller still life',
    dimensions: { rows: 7, cols: 7 },
    state: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0, 0, 0],
      [0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
  },
};

/**
 * Oscillators (repeat with a period)
 */
export const OSCILLATORS: Record<string, Pattern> = {
  blinker: {
    name: 'Blinker',
    description: 'Period 2 oscillator - simplest',
    dimensions: { rows: 5, cols: 5 },
    state: [
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
    ],
  },
  toad: {
    name: 'Toad',
    description: 'Period 2 oscillator',
    dimensions: { rows: 6, cols: 6 },
    state: [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 1, 0, 0, 1, 0],
      [0, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  },
  beacon: {
    name: 'Beacon',
    description: 'Period 2 oscillator',
    dimensions: { rows: 6, cols: 6 },
    state: [
      [0, 0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0, 0],
      [0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0],
      [0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  },
  pulsar: {
    name: 'Pulsar',
    description: 'Period 3 oscillator - larger pattern',
    dimensions: { rows: 17, cols: 17 },
    state: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  pentadecathlon: {
    name: 'Penta-decathlon',
    description: 'Period 15 oscillator - larger pattern',
    dimensions: { rows: 12, cols: 11 },
    state: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
};

/**
 * Spaceships (move across the grid)
 */
export const SPACESHIPS: Record<string, Pattern> = {
  glider: {
    name: 'Glider',
    description: 'Smallest spaceship - moves diagonally',
    dimensions: { rows: 5, cols: 5 },
    state: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 1, 1, 0],
      [0, 0, 0, 0, 0],
    ],
  },
  lwss: {
    name: 'Lightweight Spaceship (LWSS)',
    description: 'Moves horizontally',
    dimensions: { rows: 7, cols: 7 },
    state: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1, 0],
      [0, 1, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
  },
};


/**
 * All patterns grouped by category
 */
export const ALL_PATTERNS = {
  stillLifes: STILL_LIFES,
  oscillators: OSCILLATORS,
  spaceships: SPACESHIPS,
};

/**
 * Get pattern by name (case-insensitive)
 */
export function getPatternByName(name: string): Pattern | null {
  const lowerName = name.toLowerCase();

  for (const category of Object.values(ALL_PATTERNS)) {
    for (const [key, pattern] of Object.entries(category)) {
      if (key.toLowerCase() === lowerName || pattern.name.toLowerCase() === lowerName) {
        return pattern;
      }
    }
  }

  return null;
}

/**
 * Get all pattern names
 */
export function getAllPatternNames(): string[] {
  return Object.values(ALL_PATTERNS).flatMap((category) =>
    Object.values(category).map((pattern) => pattern.name),
  );
}
