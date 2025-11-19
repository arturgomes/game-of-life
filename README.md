# Conway's Game of Life - Production-Ready Scalable API

A horizontally scalable, production-ready API implementation of Conway's Game of Life with O(L) complexity using sparse board representation.

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
- [Troubleshooting](#troubleshooting)

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
- Graceful degradation (Redis optional)
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
- **Frontend**: React + Vite (planned)
- **Backend**: Express.js (Stateless REST API + WebSockets)
- **Database**: MongoDB with Mongoose (distributed-ready)
- **Cache**: Redis (shared across instances)
- **Logger**: Pino (production-grade structured logging)
- **Task Queue**: Redis Queue or RabbitMQ (planned)
- **Package Manager**: Yarn v1.22.22
- **Build Tool**: Turbo (monorepo orchestration)
- **Code Quality**: Biome (formatting + linting)
- **Containerization**: Docker + Docker Compose

**Core Principles:**
1. **Stateless API** - All state in distributed database
2. **Decoupled Workers** - Heavy computation via task queue
3. **O(L) Complexity** - Sparse coordinate set for optimal performance
4. **Horizontal Scalability** - Load-balanced API servers, worker pool

## Features

- ✅ **R1: POST /boards** - Upload new board state
- ✅ **R2: GET /boards/:boardId/next** - Get single next generation
- ✅ **R3: GET /boards/:boardId/state/:X** - Get state X generations ahead
- ✅ **R4: POST /boards/:boardId/final** - Get final stabilized state with WebSocket streaming
- ✅ **Health Check** - Endpoint for monitoring
- ✅ **Structured Logging** - Production-ready Pino logger
- ✅ **Error Handling** - Global middleware with proper status codes
- ✅ **Input Validation** - Zod schemas for type-safe validation
- ✅ **Caching Layer** - Redis integration (graceful fallback)
- ✅ **WebSocket Streaming** - Real-time progress updates for long-running calculations
- ✅ **O(L) Performance** - Sparse algorithm for efficient large board processing

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

## Development Setup

### Initial Setup Checklist

1. ✅ Install Node.js 20+ and Yarn 1.22.22
2. ✅ Clone repository and run `yarn install`
3. ✅ Choose Docker or local development approach
4. ✅ Configure environment variables in `packages/api/.env`
5. ✅ Build shared package: `cd packages/shared && yarn build`
6. ✅ Start services (Docker: `docker-compose up` or Local: `yarn dev`)
7. ✅ Verify health check: `curl http://localhost:3000/health`

### Common Setup Issues

**Issue: `workspace:*` protocol error**
- **Solution**: Already fixed - using version numbers instead of `workspace:*`

**Issue: Missing packageManager field**
- **Solution**: Already added to root `package.json`

**Issue: TypeScript errors on build**
- **Solution**: Ensure shared package is built first: `cd packages/shared && yarn build`

**Issue: MongoDB connection refused**
- **Solution**: Verify MongoDB is running on port 27017 or use Docker Compose

**Issue: Turbo command not found**
- **Solution**: Use `yarn dev` instead of `turbo run dev` directly

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

**WebSocket Protocol:**

Connect to the WebSocket URL and receive real-time progress updates:

```javascript
// Client example (Node.js with ws library)
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/ws?boardId=abc123&maxAttempts=1000');

ws.on('message', (data) => {
  const message = JSON.parse(data);

  switch (message.type) {
    case 'progress':
      // Periodic update during calculation
      console.log(`Generation ${message.generation}`);
      console.log(message.state); // Current board state as 2D array
      break;

    case 'complete':
      // Final result
      console.log(`Final status: ${message.status}`); // "stable" | "oscillating" | "timeout"
      console.log(`Generation: ${message.generation}`);
      console.log(message.state); // Final board state

      if (message.status === 'oscillating') {
        console.log(`Period: ${message.period}`); // Oscillation period (e.g., 2 for blinker)
      }
      break;

    case 'error':
      console.error(message.message);
      break;
  }
});
```

**Message Types:**

1. **Progress Message** (sent periodically during calculation):
```json
{
  "type": "progress",
  "generation": 42,
  "state": [[0,1,0], [0,1,0], [0,1,0]]
}
```

2. **Complete Message - Stable Pattern**:
```json
{
  "type": "complete",
  "status": "stable",
  "generation": 5,
  "state": [[1,1], [1,1]]
}
```

3. **Complete Message - Oscillating Pattern**:
```json
{
  "type": "complete",
  "status": "oscillating",
  "generation": 10,
  "period": 2,
  "state": [[0,1,0], [0,1,0], [0,1,0]]
}
```

4. **Complete Message - Timeout**:
```json
{
  "type": "complete",
  "status": "timeout",
  "generation": 1000,
  "state": [[...]]
}
```

5. **Error Message**:
```json
{
  "type": "error",
  "message": "Board not found"
}
```

**Common Patterns:**

- **Stable** (Block 2×2): Reaches final state at generation 0
- **Oscillating** (Blinker): Detected as period-2 oscillator
- **Never Stabilizes** (Glider): Returns timeout after maxAttempts

## Project Structure

```
packages/
├── api/                    # Express API server (COMPLETE ✅)
│   ├── src/
│   │   ├── routes/         # REST endpoints (R1, R2, R3, R4)
│   │   │   └── boards.routes.ts
│   │   ├── controllers/    # HTTP request/response handlers
│   │   │   ├── boards.controller.ts
│   │   │   └── boards.controller.spec.ts (24 tests)
│   │   ├── services/       # Business logic
│   │   │   ├── board.service.ts
│   │   │   ├── board.service.spec.ts (25 tests)
│   │   │   ├── game-engine.ts (O(L) implementation)
│   │   │   ├── game-engine.spec.ts (44 tests)
│   │   │   ├── cycle-detector.ts
│   │   │   └── cycle-detector.spec.ts (18 tests)
│   │   ├── websocket/      # WebSocket streaming (R4)
│   │   │   ├── server.ts
│   │   │   └── handlers/
│   │   │       └── final-state.ts
│   │   ├── middleware/     # Validation, error handling
│   │   │   ├── error-handler.ts
│   │   │   ├── error-handler.spec.ts (18 tests)
│   │   │   └── validate.ts
│   │   ├── models/         # Mongoose schemas
│   │   │   └── board.model.ts
│   │   ├── config/         # Database, Redis, logger
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── logger.ts
│   │   ├── app.ts          # Express app setup
│   │   └── index.ts        # Entry point (HTTP + WebSocket)
│   ├── test/               # Integration tests
│   │   ├── boards.routes.spec.ts (25 tests)
│   │   └── websocket.spec.ts (18 tests)
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── shared/                 # Shared utilities (COMPLETE ✅)
│   └── src/
│       ├── types.ts        # Branded types (BoardId, Coordinates, etc)
│       ├── validation.ts   # Zod schemas (R1-R4)
│       └── index.ts        # Exports
└── web/                    # React + Vite frontend (PLANNED 📋)
    └── src/
        ├── components/     # React components
        └── api/            # API client

docker-compose.yml          # Multi-service orchestration (COMPLETE ✅)
turbo.json                  # Turbo build configuration
package.json                # Root package with workspaces
```

**Test Coverage: 172 tests (100% passing)**
- Unit Tests: 129 tests
- Integration Tests: 43 tests

## Development Commands

```bash
# Installation
yarn install              # Install all dependencies

# Development
yarn dev                  # Start all services in dev mode (via turbo)
cd packages/api && yarn dev  # Start only API in dev mode

# Quality checks 
yarn lint                 # Check code with Biome
yarn lint:fix             # Format and fix with Biome
yarn typecheck            # TypeScript type checking (all packages)
yarn test                 # Run all tests

# Build
yarn build                # Build all packages
cd packages/shared && yarn build  # Build shared package only
cd packages/api && yarn build     # Build API package only

# Docker
docker-compose up         # Start all services in foreground
docker-compose up -d      # Start all services in background
docker-compose down       # Stop all services
docker-compose logs -f api  # Follow API logs
docker-compose ps         # Check service status
docker-compose restart api  # Restart API service
docker-compose up -d --build  # Rebuild and restart
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

### Test Suite Summary

**Total: 172 tests (100% passing) ✅**

#### Unit Tests (129 tests)
- **game-engine.spec.ts** (44 tests)
  - Cell operations and neighbor calculations
  - Game of Life rules validation
  - Stable patterns: Block, Beehive, Loaf, Boat
  - Oscillators: Blinker, Toad, Beacon
  - Gliders and movement
  - Boundary conditions
  - Large sparse board performance (1000×1000)

- **cycle-detector.spec.ts** (18 tests)
  - Stable pattern detection
  - Oscillating pattern detection with period calculation
  - Timeout handling for non-stabilizing patterns
  - Progress callback streaming
  - Error handling for invalid inputs
  - Hash-based state comparison efficiency

- **boards.controller.spec.ts** (24 tests)
  - R1: Create board (4 tests)
  - R2: Get next generation (5 tests)
  - R3: Get state at generation (8 tests)
  - R4: Get final state (7 tests)

- **board.service.spec.ts** (25 tests)
  - Board CRUD operations
  - Cache management (Redis + in-memory)
  - Generation calculation with caching
  - Error handling and graceful degradation
  - Sparse/dense conversion utilities

- **error-handler.spec.ts** (18 tests)
  - ZodError validation error handling
  - Standard Error handling
  - Unknown error handling
  - Request path logging
  - Response behavior validation

#### Integration Tests (43 tests)
- **boards.routes.spec.ts** (25 tests)
  - R1: POST /boards (9 tests)
  - R2: GET /boards/:boardId/next (4 tests)
  - R3: GET /boards/:boardId/state/:generation (6 tests)
  - R4: POST /boards/:boardId/final (6 tests)
  - Real database and HTTP endpoint testing

- **websocket.spec.ts** (18 tests)
  - WebSocket Final State Streaming (8 tests)
    - Stable pattern detection (Block)
    - Oscillating pattern detection (Blinker)
    - Single cell death
    - Timeout handling (Glider)
    - Progress message streaming
    - Error handling
  - WebSocket Server Lifecycle (10 tests)
    - Server initialization and shutdown
    - Connection handling
    - Multiple concurrent connections
    - Message format validation
    - Error recovery

### Test Organization

- **Unit tests**: Colocated with source files (`*.spec.ts`)
- **Integration tests**: In `packages/api/test/*.spec.ts`
- **Property-based tests**: Using `fast-check` for invariants

### Test Quality Standards 

- Parameterized inputs (no magic numbers)
- Strong assertions (not just truthy checks)
- Edge cases, boundaries, unexpected inputs
- Test descriptions match assertions
- Each test has one clear purpose
- TDD approach: Write test first, then implementation

## Code Quality Standards


### Core Principles

- **TDD**: Test-first development (scaffold → test → implement → refactor)
- **Pure Functions**: Preferred over classes unless polymorphism required
- **Single Responsibility**: Each function does one thing well
- **DRY**: Extract only when reused ≥2 places or dramatically improves readability

### TypeScript Standards

- **Branded Types**: For type safety (`BoardId`, not plain `string`)
- **Type over Interface**: Use `type` by default, `interface` only for merging
- **No Comments**: Except for non-obvious business rules, optimizations, security
- **Early Returns**: Reduce nesting, flatten control flow
- **Lookup Objects**: Instead of switch/if-else chains

### Complexity Limits

- **Cyclomatic Complexity**: ≤10 per function
- **Nesting Depth**: ≤3 levels
- **Function Length**: Prefer small, composable functions

### Git & Commits

- **Conventional Commits**: `feat(auth): add OAuth2 login support`
- **Atomic Commits**: One logical change per commit
- **No AI References**: Don't mention AI tools in commit messages

### Pre-Commit Checklist

```bash
# MUST run before every commit 
yarn lint:fix             # Format and lint
yarn typecheck            # Type checking
yarn test                 # All tests pass
```

## Environment Variables

### Development (.env)

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

# Cache TTL (seconds)
CACHE_TTL_CURRENT=3600      # Current state: 1 hour
CACHE_TTL_GENERATION=86400  # Generated states: 24 hours
CACHE_TTL_FINAL=604800      # Final states: 7 days
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

## Docker Services

### Service Details

| Service | Image | Port | Status |
|---------|-------|------|--------|
| **mongodb** | mongo:7 | 27017 | ✅ Healthy |
| **redis** | redis:7-alpine | 6379 | ✅ Healthy |
| **api** | game-of-life-api | 3000 | ✅ Running |

### Health Checks

- **MongoDB**: `mongosh localhost:27017/test --quiet --eval 'db.runCommand("ping").ok'`
- **Redis**: `redis-cli ping`
- **API**: Starts after MongoDB and Redis are healthy

### Volumes

- `mongodb_data`: Persisted MongoDB data
- `redis_data`: Persisted Redis data

### Network

- `game-of-life-network`: Bridge network for inter-service communication

## Logging

The API uses **Pino** for structured, high-performance logging:

### Features

- **Development**: Pretty-printed, colorized output with timestamps
- **Production**: JSON-formatted logs for aggregation systems (Datadog, ELK, etc.)
- **Module Loggers**: Each module has its own context (database, redis, board-service)
- **HTTP Logging**: Automatic request/response logging with status codes
- **Error Tracking**: Structured error logging with stack traces
- **Performance**: Minimal overhead, asynchronous I/O

### Example Output (Development)

```
[14:23:15] INFO  (database): Connected to MongoDB: mongodb://mongodb:27017/game-of-life
[14:23:15] INFO  (redis): Redis client ready
[14:23:15] INFO  (server): API server started {"port":3000,"env":"production"}
[14:23:16] INFO  : POST /boards 201
[14:23:20] INFO  (board-service): Board created successfully {"boardId":"abc123..."}
```

### Example Output (Production)

```json
{"level":"info","time":"2025-11-18T13:55:16.939Z","pid":1,"hostname":"api","module":"database","msg":"Connected to MongoDB: mongodb://mongodb:27017/game-of-life"}
{"level":"info","time":"2025-11-18T13:55:16.943Z","pid":1,"hostname":"api","port":3000,"env":"production","msg":"API server started"}
```

## Troubleshooting

### Yarn Installation Issues

**Error**: `Couldn't find package "@game-of-life/shared@workspace:*"`
- **Cause**: Yarn Classic doesn't support `workspace:*` protocol
- **Solution**: Already fixed - using version numbers

### Turbo Missing packageManager

**Error**: `Missing 'packageManager' field in package.json`
- **Cause**: Turbo requires explicit package manager declaration
- **Solution**: Already added `"packageManager": "yarn@1.22.22"`

### TypeScript Build Errors

**Error**: Type incompatibilities in logger or services
- **Cause**: Strict TypeScript checking
- **Solution**: Already fixed in logger.ts and board.service.ts

### Docker Build Failures

**Error**: `npm install` failures in Dockerfile
- **Cause**: Dockerfile was using npm instead of yarn
- **Solution**: Dockerfile updated to use Yarn 1.22.22

### MongoDB Connection Refused

**Symptoms**: `ECONNREFUSED ::1:27017`
- **Check**: `docker-compose ps` - Is MongoDB healthy?
- **Solution**: `docker-compose up -d` to start services
- **Logs**: `docker-compose logs mongodb`

### Redis Connection Issues

**Symptoms**: Redis warnings but API still works
- **Expected**: API degrades gracefully without Redis
- **Check**: `docker-compose ps` - Is Redis healthy?
- **Solution**: Redis is optional for basic functionality

### API Won't Start

**Symptoms**: API container exits immediately
- **Check logs**: `docker-compose logs api`
- **Common causes**:
  - MongoDB not ready (should wait for health check)
  - TypeScript build errors
  - Missing environment variables
- **Solution**: `docker-compose up -d --build` to rebuild

### Port Conflicts

**Error**: Port 3000/27017/6379 already in use
- **Check**: `lsof -i :3000` (macOS/Linux)
- **Solution**: Stop conflicting service or change port in docker-compose.yml

### Shared Package Not Found

**Error**: `Cannot find module '@game-of-life/shared'`
- **Cause**: Shared package not built
- **Solution**: `cd packages/shared && yarn build`

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

### Horizontal Scaling

- **Stateless API**: Any instance can handle any request
- **Load Balancer**: Distribute requests across instances
- **Worker Pool**: Independent workers for computation
- **Shared Cache**: Redis coordinates across instances

## License

MIT

