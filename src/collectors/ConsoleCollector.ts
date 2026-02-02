import type { Collector, ConsoleEntry } from '../core/types';
import { createCircularBuffer, safeStringify } from '../utils/helpers';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

/**
 * Intercepts console methods and stores recent entries
 */
export class ConsoleCollector implements Collector {
  private buffer: ReturnType<typeof createCircularBuffer<ConsoleEntry>>;
  private originalMethods: Partial<Record<ConsoleMethod, (...args: unknown[]) => void>> = {};
  private initialized = false;

  constructor(private maxEntries: number = 50) {
    this.buffer = createCircularBuffer<ConsoleEntry>(maxEntries);
  }

  init(): void {
    if (this.initialized) return;

    const methods: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];

    methods.forEach((method) => {
      this.originalMethods[method] = console[method].bind(console);

      console[method] = (...args: unknown[]) => {
        this.captureEntry(method, args);
        this.originalMethods[method]?.(...args);
      };
    });

    this.initialized = true;
  }

  destroy(): void {
    if (!this.initialized) return;

    (Object.keys(this.originalMethods) as ConsoleMethod[]).forEach((method) => {
      if (this.originalMethods[method]) {
        console[method] = this.originalMethods[method] as (...args: unknown[]) => void;
      }
    });

    this.originalMethods = {};
    this.buffer.clear();
    this.initialized = false;
  }

  collect(): ConsoleEntry[] {
    return this.buffer.getAll();
  }

  private captureEntry(level: ConsoleMethod, args: unknown[]): void {
    const [first, ...rest] = args;

    const entry: ConsoleEntry = {
      level,
      message: safeStringify(first, 500),
      timestamp: Date.now(),
    };

    if (rest.length > 0) {
      entry.args = rest.map((arg) => safeStringify(arg, 200));
    }

    this.buffer.push(entry);
  }
}
