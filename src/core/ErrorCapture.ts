import type { StackFrame } from './types';

export type ErrorHandler = (
  error: Error,
  source: 'global' | 'unhandledrejection'
) => void;

/**
 * Manages global error handlers and stack trace parsing
 */
export class ErrorCapture {
  private originalOnError: OnErrorEventHandler = null;
  private originalOnUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null = null;
  private errorHandler: ErrorHandler | null = null;
  private initialized = false;

  /**
   * Initialize global error handlers
   */
  init(handler: ErrorHandler): void {
    if (this.initialized) return;

    this.errorHandler = handler;

    // Store original handlers
    this.originalOnError = window.onerror;
    this.originalOnUnhandledRejection = window.onunhandledrejection;

    // Set up global error handler
    window.onerror = (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) => {
      const err =
        error ||
        new Error(typeof message === 'string' ? message : 'Unknown error');

      this.handleError(err, 'global');

      // Call original handler if exists
      if (this.originalOnError) {
        return this.originalOnError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    // Set up unhandled promise rejection handler
    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

      this.handleError(error, 'unhandledrejection');

      // Call original handler if exists
      if (this.originalOnUnhandledRejection) {
        this.originalOnUnhandledRejection.call(window, event);
      }
    };

    this.initialized = true;
  }

  /**
   * Destroy and restore original handlers
   */
  destroy(): void {
    if (!this.initialized) return;

    window.onerror = this.originalOnError;
    window.onunhandledrejection = this.originalOnUnhandledRejection;

    this.originalOnError = null;
    this.originalOnUnhandledRejection = null;
    this.errorHandler = null;
    this.initialized = false;
  }

  /**
   * Parse a stack trace string into structured frames
   */
  static parseStack(stack?: string): StackFrame[] {
    if (!stack) return [];

    const frames: StackFrame[] = [];
    const lines = stack.split('\n');

    for (const line of lines) {
      const frame = ErrorCapture.parseStackLine(line);
      if (frame) {
        frames.push(frame);
      }
    }

    return frames;
  }

  /**
   * Parse a single stack trace line
   */
  private static parseStackLine(line: string): StackFrame | null {
    const trimmed = line.trim();

    // Chrome/Edge/Node format: "    at functionName (filename:line:col)"
    // or "    at filename:line:col"
    const chromeMatch = trimmed.match(
      /^at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|(.+?):(\d+))\)?$/
    );

    if (chromeMatch) {
      return {
        function: chromeMatch[1] || '<anonymous>',
        filename: chromeMatch[2] || chromeMatch[5],
        lineno: parseInt(chromeMatch[3] || chromeMatch[6], 10),
        colno: chromeMatch[4] ? parseInt(chromeMatch[4], 10) : undefined,
        source: trimmed,
      };
    }

    // Firefox/Safari format: "functionName@filename:line:col"
    const firefoxMatch = trimmed.match(/^(.*)@(.+?):(\d+):(\d+)$/);

    if (firefoxMatch) {
      return {
        function: firefoxMatch[1] || '<anonymous>',
        filename: firefoxMatch[2],
        lineno: parseInt(firefoxMatch[3], 10),
        colno: parseInt(firefoxMatch[4], 10),
        source: trimmed,
      };
    }

    return null;
  }

  private handleError(error: Error, source: 'global' | 'unhandledrejection'): void {
    if (this.errorHandler) {
      try {
        this.errorHandler(error, source);
      } catch (e) {
        console.error('[DebugFast] Error in error handler:', e);
      }
    }
  }
}
