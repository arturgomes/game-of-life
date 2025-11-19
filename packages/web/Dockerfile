# Multi-stage build for production-ready web app

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

# Stage 2: Build web app
FROM node:20-alpine AS web-builder
WORKDIR /app

# Install Yarn
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Copy root files
COPY package.json yarn.lock ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy built shared package from previous stage
COPY --from=shared-builder /app/packages/shared ./packages/shared

# Copy web package
COPY packages/web/package.json ./packages/web/
COPY packages/web/tsconfig.json ./packages/web/
COPY packages/web/vite.config.ts ./packages/web/
COPY packages/web/tailwind.config.js ./packages/web/
COPY packages/web/postcss.config.js ./packages/web/
COPY packages/web/index.html ./packages/web/
COPY packages/web/src ./packages/web/src

# Install dependencies and build web
RUN yarn install --frozen-lockfile
RUN cd packages/web && yarn build

# Stage 3: Production image with nginx
FROM nginx:alpine AS runner

# Create nginx user (if not exists)
RUN addgroup -g 101 -S nginx 2>/dev/null || true && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx 2>/dev/null || true

# Copy built files from web-builder
COPY --from=web-builder /app/packages/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
