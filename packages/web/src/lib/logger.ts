/**
 * Simple frontend logger utility
 * Provides consistent logging format with timestamps and context
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isDevelopment = import.meta.env.DEV;

function formatMessage(
  level: LogLevel,
  context: string,
  message: string,
  ...args: unknown[]
): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;

  switch (level) {
    case 'error':
      console.error(prefix, message, ...args);
      break;
    case 'warn':
      console.warn(prefix, message, ...args);
      break;
    case 'debug':
      if (isDevelopment) {
        console.debug(prefix, message, ...args);
      }
      break;
    case 'info':
    default:
      console.log(prefix, message, ...args);
  }
}

export const logger = {
  info: (context: string, message: string, ...args: unknown[]) =>
    formatMessage('info', context, message, ...args),
  warn: (context: string, message: string, ...args: unknown[]) =>
    formatMessage('warn', context, message, ...args),
  error: (context: string, message: string, ...args: unknown[]) =>
    formatMessage('error', context, message, ...args),
  debug: (context: string, message: string, ...args: unknown[]) =>
    formatMessage('debug', context, message, ...args),
};
