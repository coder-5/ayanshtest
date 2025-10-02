type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string | undefined;
  data?: any;
  userId?: string | undefined;
  sessionId?: string | undefined;
  requestId?: string | undefined;
}

class Logger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, context, userId, sessionId, requestId } = entry;

    let formatted = `[${timestamp}] ${level.toUpperCase()}`;

    if (context) {
      formatted += ` [${context}]`;
    }

    if (userId) {
      formatted += ` [user:${userId}]`;
    }

    if (sessionId) {
      formatted += ` [session:${sessionId}]`;
    }

    if (requestId) {
      formatted += ` [req:${requestId}]`;
    }

    formatted += `: ${message}`;

    return formatted;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any, metadata?: {
    userId?: string | undefined;
    sessionId?: string | undefined;
    requestId?: string | undefined;
  }) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      ...metadata
    };

    const formatted = this.formatMessage(entry);

    if (this.isDevelopment) {
      // In development, use colored console output
      switch (level) {
        case 'debug':
          console.debug('\x1b[36m%s\x1b[0m', formatted, data ? data : '');
          break;
        case 'info':
          console.info('\x1b[32m%s\x1b[0m', formatted, data ? data : '');
          break;
        case 'warn':
          console.warn('\x1b[33m%s\x1b[0m', formatted, data ? data : '');
          break;
        case 'error':
          console.error('\x1b[31m%s\x1b[0m', formatted, data ? data : '');
          break;
      }
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: string, data?: any, metadata?: {
    userId?: string | undefined;
    sessionId?: string | undefined;
    requestId?: string | undefined;
  }) {
    this.log('debug', message, context, data, metadata);
  }

  info(message: string, context?: string, data?: any, metadata?: {
    userId?: string | undefined;
    sessionId?: string | undefined;
    requestId?: string | undefined;
  }) {
    this.log('info', message, context, data, metadata);
  }

  warn(message: string, context?: string, data?: any, metadata?: {
    userId?: string | undefined;
    sessionId?: string | undefined;
    requestId?: string | undefined;
  }) {
    this.log('warn', message, context, data, metadata);
  }

  error(message: string, context?: string, error?: any, metadata?: {
    userId?: string | undefined;
    sessionId?: string | undefined;
    requestId?: string | undefined;
  }) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error;

    this.log('error', message, context, errorData, metadata);
  }

  // Convenience methods for common use cases
  apiRequest(method: string, path: string, userId?: string, requestId?: string) {
    this.info(`${method} ${path}`, 'API', undefined, { userId, requestId });
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number, userId?: string, requestId?: string) {
    this.info(`${method} ${path} - ${statusCode} (${duration}ms)`, 'API', undefined, { userId, requestId });
  }

  apiError(method: string, path: string, error: any, userId?: string, requestId?: string) {
    this.error(`${method} ${path} failed`, 'API', error, { userId, requestId });
  }

  database(operation: string, table?: string, duration?: number) {
    this.debug(`Database ${operation}${table ? ` on ${table}` : ''}${duration ? ` (${duration}ms)` : ''}`, 'DATABASE');
  }

  databaseError(operation: string, error: any, table?: string) {
    this.error(`Database ${operation}${table ? ` on ${table}` : ''} failed`, 'DATABASE', error);
  }

  auth(message: string, userId?: string, sessionId?: string) {
    this.info(message, 'AUTH', undefined, { userId, sessionId });
  }

  authError(message: string, error?: any, userId?: string, sessionId?: string) {
    this.error(message, 'AUTH', error, { userId, sessionId });
  }

  validation(message: string, data?: any) {
    this.warn(message, 'VALIDATION', data);
  }

  performance(operation: string, duration: number, context?: string) {
    if (duration > 1000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`, context || 'PERFORMANCE');
    } else {
      this.debug(`${operation} completed in ${duration}ms`, context || 'PERFORMANCE');
    }
  }

  security(message: string, data?: any, userId?: string) {
    this.warn(message, 'SECURITY', data, { userId });
  }

  securityError(message: string, error?: any, userId?: string) {
    this.error(message, 'SECURITY', error, { userId });
  }
}

// Create a singleton logger instance
export const logger = new Logger();

// Helper function to create a logger with context
export function createContextLogger(context: string) {
  return {
    debug: (message: string, data?: any, metadata?: { userId?: string; sessionId?: string; requestId?: string }) =>
      logger.debug(message, context, data, metadata),
    info: (message: string, data?: any, metadata?: { userId?: string; sessionId?: string; requestId?: string }) =>
      logger.info(message, context, data, metadata),
    warn: (message: string, data?: any, metadata?: { userId?: string; sessionId?: string; requestId?: string }) =>
      logger.warn(message, context, data, metadata),
    error: (message: string, error?: any, metadata?: { userId?: string; sessionId?: string; requestId?: string }) =>
      logger.error(message, context, error, metadata),
  };
}

// Helper to generate request IDs
export function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export type { LogLevel, LogEntry };