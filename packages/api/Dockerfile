# Multi-stage build for production-ready API

# Stage 1: Build shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app

# Install Yarn
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Copy root package files
COPY package.json yarn.lock ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy shared package
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

# Install dependencies and build shared
RUN yarn install --frozen-lockfile
RUN cd packages/shared && yarn build

# Stage 2: Build API
FROM node:20-alpine AS api-builder
WORKDIR /app

# Install Yarn
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Copy root files
COPY package.json yarn.lock ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy built shared package from previous stage
COPY --from=shared-builder /app/packages/shared ./packages/shared

# Copy API package
COPY packages/api/package.json ./packages/api/
COPY packages/api/tsconfig.json ./packages/api/
COPY packages/api/src ./packages/api/src

# Install dependencies and build API
RUN yarn install --frozen-lockfile
RUN cd packages/api && yarn build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install Yarn
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy package files
COPY --from=api-builder /app/package.json ./
COPY --from=api-builder /app/yarn.lock ./
COPY --from=api-builder /app/packages/shared/package.json ./packages/shared/
COPY --from=api-builder /app/packages/api/package.json ./packages/api/

# Copy built files
COPY --from=api-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=api-builder /app/packages/api/dist ./packages/api/dist

# Install production dependencies only
RUN yarn install --production --frozen-lockfile

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "packages/api/dist/index.js"]
