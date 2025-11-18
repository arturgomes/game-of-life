import { createClient } from 'redis';
import type { Result } from '@game-of-life/shared';

/**
 * Redis client configuration for caching
 * Per CLAUDE.md: High-speed caching strategy (AD1)
 */

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;

export async function connectRedis(): Promise<Result<RedisClient, string>> {
  if (client?.isOpen) {
    return { success: true, data: client };
  }

  try {
    client = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries: number) => {
          // Exponential backoff: 100ms, 200ms, 400ms, 800ms, max 3000ms
          if (retries > 10) {
            console.error('[Redis] Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(100 * 2 ** retries, 3000);
        },
      },
    });

    client.on('error', (error: Error) => {
      console.error('[Redis] Client error:', error);
    });

    client.on('connect', () => {
      console.info('[Redis] Connected to Redis');
    });

    client.on('reconnecting', () => {
      console.warn('[Redis] Reconnecting to Redis');
    });

    client.on('ready', () => {
      console.info('[Redis] Redis client ready');
    });

    await client.connect();

    return { success: true, data: client };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Redis] Failed to connect:', message);
    return { success: false, error: message };
  }
}

export function getRedisClient(): RedisClient | null {
  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (client?.isOpen) {
    try {
      await client.quit();
      console.info('[Redis] Disconnected from Redis');
    } catch (error) {
      console.error('[Redis] Error disconnecting:', error);
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectRedis();
});

process.on('SIGTERM', async () => {
  await disconnectRedis();
});
