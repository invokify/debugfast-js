import type { ErrorReport } from '../core/types';
import { sleep } from '../utils/helpers';

interface ReporterConfig {
  apiEndpoint: string;
  apiKey: string;
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  batchDelay?: number;
  debug?: boolean;
}

/**
 * Sends error reports to the configured API endpoint
 */
export class ApiReporter {
  private config: Required<ReporterConfig>;
  private queue: ErrorReport[] = [];
  private isSending = false;
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private offlineQueue: ErrorReport[] = [];

  constructor(config: ReporterConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 10,
      batchDelay: 2000,
      debug: false,
      ...config,
    };

    // Listen for online event to flush offline queue
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flushOfflineQueue());
    }
  }

  /**
   * Queue a report for sending
   */
  async send(report: ErrorReport): Promise<void> {
    if (!navigator.onLine) {
      this.offlineQueue.push(report);
      this.log('Offline, queued report for later');
      return;
    }

    this.queue.push(report);
    this.scheduleBatch();
  }

  /**
   * Immediately send all queued reports
   */
  async flush(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    await this.sendBatch();
  }

  /**
   * Destroy the reporter
   */
  destroy(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.queue = [];
    this.offlineQueue = [];
  }

  private scheduleBatch(): void {
    if (this.batchTimeout) return;

    // Send immediately if we've hit batch size
    if (this.queue.length >= this.config.batchSize) {
      this.sendBatch();
      return;
    }

    // Otherwise, wait for batch delay
    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      this.sendBatch();
    }, this.config.batchDelay);
  }

  private async sendBatch(): Promise<void> {
    if (this.isSending || this.queue.length === 0) return;

    this.isSending = true;

    const batch = this.queue.splice(0, this.config.batchSize);

    try {
      await this.sendWithRetry(batch);
      this.log(`Successfully sent ${batch.length} report(s)`);
    } catch (error) {
      this.log('Failed to send reports, re-queuing', error);
      // Re-queue failed reports
      this.queue.unshift(...batch);
    } finally {
      this.isSending = false;

      // Send remaining if any
      if (this.queue.length > 0) {
        this.scheduleBatch();
      }
    }
  }

  private async sendWithRetry(reports: ErrorReport[]): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        await this.sendRequest(reports);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log(`Attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < this.config.maxRetries - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private async sendRequest(reports: ErrorReport[]): Promise<void> {
    const payload = reports.length === 1 ? reports[0] : { reports };

    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private async flushOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    this.log(`Online, flushing ${this.offlineQueue.length} offline report(s)`);

    const reports = this.offlineQueue.splice(0, this.offlineQueue.length);
    this.queue.push(...reports);
    this.scheduleBatch();
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[BugFast Reporter]', ...args);
    }
  }
}
