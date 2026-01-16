type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const colors = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
};

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const color = colors[level];
    const reset = colors.reset;

    let formatted = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;

    if (meta !== undefined) {
      formatted += ` ${JSON.stringify(meta)}`;
    }

    return formatted;
  }

  debug(message: string, meta?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  info(message: string, meta?: unknown): void {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: unknown): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, meta?: unknown): void {
    console.error(this.formatMessage('error', message, meta));
  }
}

export const logger = new Logger();
export default logger;
