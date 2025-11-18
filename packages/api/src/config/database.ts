import mongoose from 'mongoose';
import type { Result } from '@game-of-life/shared';

/**
 * MongoDB connection configuration using Mongoose
 * Per CLAUDE.md: Database persistence for crash resilience (NFR1)
 */

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/game-of-life';

export async function connectDatabase(): Promise<Result<void, string>> {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.info('[Database] Connected to MongoDB:', MONGODB_URI);

    // Handle connection events
    mongoose.connection.on('error', (error: Error) => {
      console.error('[Database] MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected');
    });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Database] Failed to connect to MongoDB:', message);
    return { success: false, error: message };
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.info('[Database] Disconnected from MongoDB');
  } catch (error) {
    console.error('[Database] Error disconnecting from MongoDB:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
