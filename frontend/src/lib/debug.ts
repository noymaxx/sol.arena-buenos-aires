// Debug utility for comprehensive logging
const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

export class DebugLogger {
  private static instance: DebugLogger;
  private prefix: string;

  constructor(prefix: string = '[DEBUG]') {
    this.prefix = prefix;
  }

  static getInstance(prefix?: string): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger(prefix);
    }
    return DebugLogger.instance;
  }

  log(message: string, ...args: any[]) {
    if (DEBUG_ENABLED) {
      console.log(`${this.prefix} ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (DEBUG_ENABLED) {
      console.warn(`${this.prefix} [WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (DEBUG_ENABLED) {
      console.error(`${this.prefix} [ERROR] ${message}`, ...args);
    }
  }

  group(message: string) {
    if (DEBUG_ENABLED) {
      console.group(`${this.prefix} ${message}`);
    }
  }

  groupEnd() {
    if (DEBUG_ENABLED) {
      console.groupEnd();
    }
  }

  // Specific debug for BN objects
  debugBN(label: string, value: any) {
    if (!DEBUG_ENABLED) return;

    this.group(`BN Debug: ${label}`);
    this.log('Raw value:', value);
    this.log('Type:', typeof value);
    this.log('Is null/undefined:', value === null || value === undefined);

    if (value) {
      this.log('Constructor:', value.constructor?.name);
      this.log('Has _bn property:', '_bn' in value);
      this.log('Has toNumber method:', typeof value.toNumber === 'function');

      if ('_bn' in value) {
        this.log('_bn value:', value._bn);
        this.log('_bn type:', typeof value._bn);
      }

      if (typeof value.toNumber === 'function') {
        try {
          this.log('toNumber() result:', value.toNumber());
        } catch (err) {
          this.error('toNumber() failed:', err);
        }
      }
    }
    this.groupEnd();
  }

  // Debug object properties safely
  debugObject(label: string, obj: any) {
    if (!DEBUG_ENABLED) return;

    this.group(`Object Debug: ${label}`);

    try {
      this.log('Object:', obj);
      this.log('Type:', typeof obj);
      this.log('Is array:', Array.isArray(obj));
      this.log('Is null:', obj === null);
      this.log('Is undefined:', obj === undefined);

      if (obj && typeof obj === 'object') {
        this.log('Keys:', Object.keys(obj));
        this.log('Constructor:', obj.constructor?.name);

        // Check for common BN properties
        if ('_bn' in obj) {
          this.log('Has _bn property');
          this.debugBN('_bn property', obj._bn);
        }

        // Check common bet properties
        const commonProps = ['stakeLamports', 'netSupportA', 'netSupportB', 'deadlineCrowd', 'resolveTs'];
        commonProps.forEach(prop => {
          if (prop in obj) {
            this.debugBN(prop, obj[prop]);
          }
        });
      }
    } catch (err) {
      this.error('Error debugging object:', err);
    }

    this.groupEnd();
  }

  // Function call wrapper
  wrapFunction<T extends (...args: any[]) => any>(fn: T, name: string): T {
    if (!DEBUG_ENABLED) return fn;

    return ((...args: any[]) => {
      this.group(`Function Call: ${name}`);
      this.log('Arguments:', args);

      try {
        const result = fn(...args);
        this.log('Result:', result);
        this.groupEnd();
        return result;
      } catch (err) {
        this.error('Function threw error:', err);
        this.groupEnd();
        throw err;
      }
    }) as T;
  }

  // Stack trace for error tracking
  trace(message: string) {
    if (DEBUG_ENABLED) {
      console.trace(`${this.prefix} TRACE: ${message}`);
    }
  }
}

// Export singleton instances for different modules
export const debugAnchor = new DebugLogger('[ANCHOR]');
export const debugComponent = new DebugLogger('[COMPONENT]');
export const debugPage = new DebugLogger('[PAGE]');
export const debugBN = new DebugLogger('[BN]');

// Helper functions
export function safeStringify(obj: any, maxDepth: number = 3): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, val) => {
      if (val != null && typeof val === 'object') {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      return val;
    }, 2);
  } catch {
    return '[Unstringifiable]';
  }
}

// Error boundary helper
export function catchAndLog<T>(
  fn: () => T,
  fallback: T,
  label: string,
  logger: DebugLogger = debugComponent
): T {
  try {
    return fn();
  } catch (err) {
    logger.error(`Caught error in ${label}:`, err);
    logger.trace(`Stack trace for ${label}`);
    return fallback;
  }
}