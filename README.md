# Conway's Game of Life

Implementation of Conway's Game of Life.


## Introduction

The Game of Life, also known as Conway's Game of Life or simply Life, is a cellular automaton devised by the British mathematician John Horton Conway in 1970. It is a zero-player game, meaning that its evolution is determined by its initial state, requiring no further input. One interacts with the Game of Life by creating an initial configuration and observing how it evolves. It is Turing complete and can simulate a universal constructor or any other Turing machine. 

-- Section extracted from [Wikipedia](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)

## Rules

The universe of the Game of Life is an infinite, two-dimensional orthogonal grid of square cells, each of which is in one of two possible states, live or dead (or populated and unpopulated, respectively). Every cell interacts with its eight neighbours, which are the cells that are horizontally, vertically, or diagonally adjacent. At each step in time, the following transitions occur:

- Any live cell with fewer than two live neighbours dies, as if by underpopulation.
- Any live cell with two or three live neighbours lives on to the next generation.
- Any live cell with more than three live neighbours dies, as if by overpopulation.
- Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
  
The initial pattern constitutes the seed of the system. The first generation is created by applying the above rules simultaneously to every cell in the seed, live or dead; births and deaths occur simultaneously, and the discrete moment at which this happens is sometimes called a tick. Each generation is a pure function of the preceding one. The rules continue to be applied repeatedly to create further generations.

-- Section extracted from [Wikipedia](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)

## Want to play now? TL;DR
If you don't want to read it now, jump straight into [download and play](#play).

## Table of Contents

- [Requirements](#requirements)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Development Commands](#development-commands)
- [Testing](#testing)
- [Code Quality Standards](#code-quality-standards)
- [Environment Variables](#environment-variables)
- [Docker Services](#docker-services)

## Requirements

### Functional Requirements

**R1: POST /boards** - Upload new board state
- Input: 2D Array/Matrix (0 = dead, 1 = live)
- Output: `{ boardId: UUID }`

**R2: GET /boards/{boardId}/next** - Get single next generation
- Output: Next board state (2D Array)

**R3: GET /boards/{boardId}/state/{X}** - Get state X generations ahead
- Input: X (Integer ≥1)
- Output: Future board state

**R4: POST /boards/{boardId}/final** - Get final stabilized state (real-time)
- Input: `{ maxAttempts: X }`
- Output: HTTP 202 + WebSocket stream with generation updates
- Returns: Stabilized/cyclical state or error if X exceeded

### Non-Functional Requirements

**Performance:**
- **O(L) Time Complexity**: L = live cells + their neighbors (NOT O(R×C))
- **Sparse Algorithm**: Efficient for large, mostly empty boards
- **3-Tier Caching**: In-memory LRU → Redis → MongoDB
- **Horizontal Scaling**: Stateless API servers, independent workers

**Reliability:**
- Graceful degradation
- Comprehensive error handling
- Transaction-safe database operations
- Idempotent job handlers

**Maintainability:**
- Strict code quality standards 
- Comprehensive test coverage
- Structured logging with Pino
- Clear separation of concerns

## Architecture

**Technology Stack:**
- **Frontend**: React + Vite + TailwindCSS + Ark UI
- **Backend**: Express.js (Stateless REST API + WebSockets)
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Logger**: Pino
- **Package Manager**: Yarn v1.22.22
- **Build Tool**: Turbo
- **Code Quality**: Biome (formatting + linting)
- **Containerization**: Docker + Docker Compose

### Frontend Features
- **TailwindCSS**: Utility-first styling for rapid UI development
- **Ark UI**: Headless component library for accessible UI primitives
- **Compound Pattern**: Sheet component uses compound component pattern for flexible composition
- **WebSocket Integration**: Real-time communication with API for live progress updates
- **Custom Hooks**: Dedicated hooks for API communication (`useApiClient`, `useWebSocket`)
- **Pattern Library**: Pre-built Game of Life patterns (Blinker, Glider, etc.)

## Features

- **R1: POST /boards** - Upload new board state
- **R2: GET /boards/:boardId/next** - Get single next generation
- **R3: GET /boards/:boardId/state/:X** - Get state X generations ahead
- **R4: POST /boards/:boardId/final** - Get final stabilized state with WebSocket streaming
- **Health Check** - Endpoint for monitoring
- **Structured Logging** - Production-ready Pino logger
- **Error Handling** - Global middleware with proper status codes
- **Input Validation** - Zod schemas for type-safe validation
- **Caching Layer** - Redis integration (graceful fallback)
- **WebSocket Streaming** - Real-time progress updates for long-running calculations
- **O(L) Performance** - Sparse algorithm for efficient large board processing

## Quick Start

### Prerequisites

- **Node.js** ≥ 20.0.0
- **Yarn** 1.22.22 (installed via `npm install -g yarn`)
- **Docker** & **Docker Compose** (for containerized development)

### Using Docker (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd game-of-life

# 2. Install dependencies
yarn install

# 3. Build shared package (required for Docker build)
cd packages/shared && yarn build && cd ../..

# 4. Start all services (MongoDB, Redis, API)
docker-compose up -d

# 5. Verify services are running
docker-compose ps

# 6. Test the API
curl http://localhost:3000/health
# Response: {"status":"ok","timestamp":"2025-11-18T..."}

# 7. View logs
docker-compose logs -f api

# 8. Stop services
docker-compose down
```

### Local Development (Without Docker)

```bash
# 1. Install dependencies
yarn install

# 2. Start MongoDB and Redis locally
# Option A: Using Docker for just databases
docker run -d -p 27017:27017 --name game-of-life-mongo mongo:7
docker run -d -p 6379:6379 --name game-of-life-redis redis:7-alpine

# Option B: Using Homebrew (macOS)
brew services start mongodb-community
brew services start redis

# 3. Set up environment file
cp packages/api/.env.example packages/api/.env
# Edit packages/api/.env if needed (default localhost URLs should work)

# 4. Build shared package
cd packages/shared && yarn build && cd ../..

# 5. Start API in development mode
yarn dev

# API will be available at http://localhost:3000
```
### Play
Before you jump, clone the repo, and set the `.env` file, check first [how to set the environment variables](#environment-variables) section.

```bash
# 1. Clone the repository to a folder you like
git clone https://github.com/arturgomes/game-of-life.git
cd game-of-life

# 2. Install dependencies
yarn install

# 3. Build shared package 
docker-compose build --no-cache      

# 4. Start all services (MongoDB, Redis, API)
docker-compose up -d
```

## Development Setup

### Initial Setup Checklist

1. Install Node.js 20+ and Yarn 1.22.22
2. Clone repository and run `yarn install`
3. Choose Docker or local development approach
4. Configure environment variables in `packages/api/.env`
5. Build shared package: `cd packages/shared && yarn build`
6. Start services (Docker: `docker-compose up` or Local: `yarn dev`)
7. Verify health check: `curl http://localhost:3000/health`

## API Endpoints

### Health Check

```bash
GET /health

Response: 200 OK
{
  "status": "ok",
  "timestamp": "2025-11-18T13:56:07.946Z"
}
```

### R1: Create Board

```bash
POST /boards
Content-Type: application/json

{
  "board": [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0]
  ]
}

Response: 201 Created
{
  "success": true,
  "data": {
    "boardId": "abc123..."
  }
}
```

### R2: Get Next Generation

```bash
GET /boards/:boardId/next

Response: 200 OK
{
  "board": [
    [0, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ]
}
```

**Example with Blinker pattern:**

```bash
# Create board with horizontal blinker
curl -X POST http://localhost:3000/boards \
  -H "Content-Type: application/json" \
  -d '{
    "board": [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0]
    ]
  }'

# Response: {"success":true,"data":{"boardId":"abc123..."}}

# Get next generation (rotates to vertical)
curl http://localhost:3000/boards/abc123/next

# Response:
{
  "board": [
    [0, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ]
}
```

### R3: Get State X Generations Ahead

```bash
GET /boards/:boardId/state/:generation

Response: 200 OK
{
  "board": [[...]]
}
```

**Example:**

```bash
# Get state 10 generations ahead
curl http://localhost:3000/boards/abc123/state/10

# Response:
{
  "board": [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0]
  ]
}
```

**Notes:**
- Generation must be ≥1
- Returns 400 for generation=0 or negative values
- Caches intermediate generations every 10 steps
- Returns 404 for non-existent boardId

### R4: Get Final Stabilized State (WebSocket Streaming)

```bash
POST /boards/:boardId/final
Content-Type: application/json

{
  "maxAttempts": 1000
}

Response: 202 Accepted
{
  "wsUrl": "ws://localhost:3000/ws?boardId=abc123&maxAttempts=1000"
}
```

## Project Structure

```
packages/
├── api/
│   ├── src/
│   │   ├── routes/         # REST endpoints (R1, R2, R3, R4)
│   │   │   └── boards.routes.ts
│   │   ├── controllers/
│   │   │   ├── boards.controller.ts
│   │   │   └── boards.controller.spec.ts 
│   │   ├── services/
│   │   │   ├── board.service.ts
│   │   │   ├── board.service.spec.ts 
│   │   │   ├── game-engine.ts (O(L) implementation)
│   │   │   ├── game-engine.spec.ts 
│   │   │   ├── cycle-detector.ts
│   │   │   └── cycle-detector.spec.ts
│   │   ├── websocket/ 
│   │   │   ├── server.ts
│   │   │   └── handlers/
│   │   │       └── final-state.ts
│   │   ├── middleware/
│   │   │   ├── error-handler.ts
│   │   │   ├── error-handler.spec.ts (18 tests)
│   │   │   └── validate.ts
│   │   ├── models/
│   │   │   └── board.model.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── logger.ts
│   │   ├── app.ts
│   │   └── index.ts
│   ├── test/ # Integration tests
│   │   ├── boards.routes.spec.ts
│   │   └── websocket.spec.ts
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── shared/
│   └── src/
│       ├── types.ts
│       ├── validation.ts
│       └── index.ts
└── web/  # React + Vite frontend
    └── src/
        ├── components/
        │   ├── ui/
        │   ├── Layout/
        │   ├── GameBoard.tsx
        │   ├── Controls.tsx
        │   ├── PatternLibrary.tsx
        │   └── ProgressStream.tsx
        ├── contexts/
        ├── hooks/
        │   ├── useApiClient.ts
        │   ├── useWebSocket.ts
        │   └── useControls.ts
        ├── lib/
        │   ├── api-client.ts
        │   ├── websocket-client.ts
        │   ├── patterns.ts
        │   └── board-utils.ts
        ├── utils/
        └── types/

docker-compose.yml
turbo.json
package.json
```

## Development Commands

```bash
# Installation
yarn install              # Install all dependencies

# Development
yarn dev                  # Start all services in dev mode
cd packages/api && yarn dev  # Start only API in dev mode

# Quality checks 

yarn test                 # Run all tests

# Build
yarn build                # Build all packages
cd packages/shared && yarn build  # Build shared package only
cd packages/api && yarn build     # Build API package only

# Docker
docker-compose up -d --build  # Rebuild and restart
docker-compose up -d      # Start all services in background
```

## Testing

```bash
# Run all tests
yarn test

# Run specific package tests
cd packages/api && yarn test
cd packages/shared && yarn test

# Run specific test file
yarn test -- packages/api/src/services/board.service.spec.ts

# Watch mode
cd packages/api && yarn test:watch

# Test with coverage (when configured)
yarn test:coverage
```

### Test Organization

- **Unit tests**: Colocated with source files (`*.spec.ts`)
- **Integration tests**: In `packages/api/test/*.spec.ts`
- **Property-based tests**: Using `fast-check` for invariants

## Environment Variables

### Development (.env)
On `packages/api` create a `.env` file and place:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=debug  # debug, info, warn, error

# MongoDB (localhost for local dev)
MONGODB_URI=mongodb://localhost:27017/game-of-life

# Redis (localhost for local dev)
REDIS_URL=redis://localhost:6379

# Cache TTL (seconds) - change here to define your own TTL
CACHE_TTL_CURRENT=3600      # Current state: 1 hour
CACHE_TTL_GENERATION=86400  # Generated states: 24 hours
CACHE_TTL_FINAL=604800      # Final states: 7 days

# WebSocket Configuration
WS_HOST=localhost:3000
WS_PROTOCOL=ws
```

On `packages/web` create a `.env` file and place:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_BASE_URL=ws://localhost:3000
```

### Production (Docker)

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Logging
LOG_LEVEL=info

# MongoDB (Docker service name)
MONGODB_URI=mongodb://mongodb:27017/game-of-life

# Redis (Docker service name)
REDIS_URL=redis://redis:6379

# Cache TTL (seconds)
CACHE_TTL_CURRENT=3600
CACHE_TTL_GENERATION=86400
CACHE_TTL_FINAL=604800
```

## Logging

The API uses **Pino** for structured, high-performance logging:

### Example Output (Development)

```
[14:23:15] INFO  (database): Connected to MongoDB: mongodb://mongodb:27017/game-of-life
[14:23:15] INFO  (redis): Redis client ready
[14:23:15] INFO  (server): API server started {"port":3000,"env":"production"}
[14:23:16] INFO  : POST /boards 201
[14:23:20] INFO  (board-service): Board created successfully {"boardId":"abc123..."}
```

## Performance Optimization

### Sparse Board Algorithm (O(L) Complexity)

The Game of Life implementation uses a sparse representation:

```typescript
// Instead of iterating the entire grid (O(R×C))
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    // Check every cell...
  }
}

// We only process live cells + their neighbors (O(L))
type Coordinates = `${number},${number}`;
type BoardState = Set<Coordinates>;

function calculateNextState(board: BoardState): BoardState {
  // Only count neighbors for live cells and their immediate neighbors
  // L = live cells + their 8 neighbors each = at most 9L operations
}
```
**Benefits**:
- Large sparse boards: 1000×1000 with 100 live cells → ~900 operations vs 1,000,000
- Scales with active cells, not total grid size
- Memory efficient: Only store live cells

### Caching Strategy

1. **In-Memory LRU** (per API instance): Fast, limited capacity
2. **Redis** (shared across instances): Fast, larger capacity, distributed
3. **MongoDB** (source of truth): Persistent, unlimited capacity



## License

MIT


