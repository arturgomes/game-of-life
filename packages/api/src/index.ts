import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { logger } from "./config/logger.js";
import { connectRedis } from "./config/redis.js";

/**
 * Main entry point for the API server
 */

const PORT = Number(process.env.PORT ?? 3000);

async function startServer() {
	// Connect to MongoDB
	const dbResult = await connectDatabase();
	if (!dbResult.success) {
		logger.error({ error: dbResult.error }, "Failed to connect to database");
		process.exit(1);
	}

	// Connect to Redis (optional - degrade gracefully if not available)
	const redisResult = await connectRedis();
	if (!redisResult.success) {
		logger.warn(
			{ error: redisResult.error },
			"Redis connection failed, continuing without cache",
		);
	}

	// Create and start Express app
	const app = createApp();

	app.listen(PORT, () => {
		logger.info(
			{ port: PORT, env: process.env.NODE_ENV ?? "development" },
			"API server started",
		);
		logger.info(`Health check available at http://localhost:${PORT}/health`);
	});
}

// Start the server
startServer().catch((error) => {
	logger.error({ error }, "Failed to start server");
	process.exit(1);
});
