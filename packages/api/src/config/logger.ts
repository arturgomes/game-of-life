import pino from 'pino';
import pinoHttp from 'pino-http';

/**
 * Pino logger configuration
 *
 * Pino is a fast, low-overhead logger for Node.js
 * - Structured JSON logging for production
 * - Pretty printing for development
 * - Context-aware logging with child loggers
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// Base logger configuration
const loggerOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info'),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Add transport only in development
if (isDevelopment) {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  };
}

export const logger = pino(loggerOptions);

// HTTP request logger middleware for Express
export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (res.statusCode >= 300) return 'info';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (_req, _res, error) => {
    return `Request error: ${error.message}`;
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

// Create child loggers for different modules
export function createModuleLogger(module: string) {
  return logger.child({ module });
}
