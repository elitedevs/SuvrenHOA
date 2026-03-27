/**
 * Structured logger for SuvrenHOA
 * Zero dependencies — wraps console with levels, context, and timestamps
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel =
  process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}

function timestamp(): string {
  return new Date().toISOString();
}

export interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}

export function createLogger(context: string): Logger {
  const fmt = (level: string, message: string) =>
    `[${timestamp()}] [${level.toUpperCase()}] [${context}] ${message}`;

  return {
    debug(message: string, data?: unknown) {
      if (!shouldLog('debug')) return;
      data !== undefined
        ? console.debug(fmt('debug', message), data)
        : console.debug(fmt('debug', message));
    },
    info(message: string, data?: unknown) {
      if (!shouldLog('info')) return;
      data !== undefined
        ? console.info(fmt('info', message), data)
        : console.info(fmt('info', message));
    },
    warn(message: string, data?: unknown) {
      if (!shouldLog('warn')) return;
      data !== undefined
        ? console.warn(fmt('warn', message), data)
        : console.warn(fmt('warn', message));
    },
    error(message: string, data?: unknown) {
      if (!shouldLog('error')) return;
      data !== undefined
        ? console.error(fmt('error', message), data)
        : console.error(fmt('error', message));
    },
  };
}
