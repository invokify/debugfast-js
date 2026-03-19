import type {
  DebugFastConfig,
  CaptureOptions,
  ErrorReport,
  UserInfo,
} from './types';
import { ErrorCapture } from './ErrorCapture';
import { BrowserCollector } from '../collectors/BrowserCollector';
import { ConsoleCollector } from '../collectors/ConsoleCollector';
import { NetworkCollector } from '../collectors/NetworkCollector';
import { UserActionCollector } from '../collectors/UserActionCollector';
import { DOMCollector } from '../collectors/DOMCollector';
import { ScreenshotCollector } from '../collectors/ScreenshotCollector';
import { ApiReporter } from '../reporter/ApiReporter';
import { generateId } from '../utils/helpers';

/**
 * Main DebugFast client class
 */
export class DebugFast {
  private static instance: DebugFast | null = null;

  private config: Required<DebugFastConfig>;
  private errorCapture: ErrorCapture;
  private browserCollector: BrowserCollector;
  private consoleCollector: ConsoleCollector | null = null;
  private networkCollector: NetworkCollector | null = null;
  private userActionCollector: UserActionCollector | null = null;
  private domCollector: DOMCollector | null = null;
  private screenshotCollector: ScreenshotCollector | null = null;
  private reporter: ApiReporter;
  private initialized = false;

  private constructor(config: DebugFastConfig) {
    this.config = {
      apiEndpoint: 'https://ingestion.debugfa.st/v1/events',
      captureScreenshot: true,
      captureConsole: true,
      captureNetwork: true,
      captureDom: true,
      captureUserActions: true,
      screenshotQuality: 0.7,
      maxConsoleEntries: 50,
      maxNetworkRequests: 20,
      maxUserActions: 30,
      maskSensitiveInputs: true,
      tags: {},
      user: {},
      beforeSend: (report) => report,
      debug: false,
      ...config,
    };

    this.errorCapture = new ErrorCapture();
    this.browserCollector = new BrowserCollector();
    this.reporter = new ApiReporter({
      apiEndpoint: this.config.apiEndpoint,
      apiKey: this.config.apiKey,
      debug: this.config.debug,
    });
  }

  /**
   * Initialize DebugFast with configuration
   */
  static init(config: DebugFastConfig): DebugFast {
    if (DebugFast.instance) {
      console.warn('[DebugFast] Already initialized. Call destroy() first to re-initialize.');
      return DebugFast.instance;
    }

    DebugFast.instance = new DebugFast(config);
    DebugFast.instance.setup();

    return DebugFast.instance;
  }

  /**
   * Get the current instance
   */
  static getInstance(): DebugFast | null {
    return DebugFast.instance;
  }

  /**
   * Manually capture an error
   */
  static captureError(
    error: Error | string,
    options: CaptureOptions = {}
  ): void {
    const instance = DebugFast.instance;
    if (!instance) {
      console.warn('[DebugFast] Not initialized. Call DebugFast.init() first.');
      return;
    }

    const err = typeof error === 'string' ? new Error(error) : error;
    instance.handleError(err, 'manual', options);
  }

  /**
   * Set user information
   */
  static setUser(user: UserInfo): void {
    const instance = DebugFast.instance;
    if (!instance) {
      console.warn('[DebugFast] Not initialized. Call DebugFast.init() first.');
      return;
    }

    instance.config.user = { ...instance.config.user, ...user };
  }

  /**
   * Set custom tags
   */
  static setTags(tags: Record<string, string>): void {
    const instance = DebugFast.instance;
    if (!instance) {
      console.warn('[DebugFast] Not initialized. Call DebugFast.init() first.');
      return;
    }

    instance.config.tags = { ...instance.config.tags, ...tags };
  }

  /**
   * Flush any pending error reports
   */
  static async flush(): Promise<void> {
    const instance = DebugFast.instance;
    if (!instance) return;

    await instance.reporter.flush();
  }

  /**
   * Destroy the DebugFast instance and clean up
   */
  static destroy(): void {
    const instance = DebugFast.instance;
    if (!instance) return;

    instance.teardown();
    DebugFast.instance = null;
  }

  /**
   * Internal: Handle error from React/Vue adapters
   */
  handleAdapterError(
    error: Error,
    source: 'react' | 'vue',
    componentStack?: string
  ): void {
    this.handleError(error, source, { extra: { componentStack } });
  }

  private setup(): void {
    if (this.initialized) return;

    // Initialize error capture
    this.errorCapture.init((error, source) => {
      this.handleError(error, source);
    });

    // Initialize collectors based on config
    if (this.config.captureConsole) {
      this.consoleCollector = new ConsoleCollector(this.config.maxConsoleEntries);
      this.consoleCollector.init();
    }

    if (this.config.captureNetwork) {
      this.networkCollector = new NetworkCollector(this.config.maxNetworkRequests);
      this.networkCollector.init();
    }

    if (this.config.captureUserActions) {
      this.userActionCollector = new UserActionCollector(
        this.config.maxUserActions,
        this.config.maskSensitiveInputs
      );
      this.userActionCollector.init();
    }

    if (this.config.captureDom) {
      this.domCollector = new DOMCollector(this.config.maskSensitiveInputs);
      this.domCollector.init();
    }

    if (this.config.captureScreenshot) {
      this.screenshotCollector = new ScreenshotCollector(this.config.screenshotQuality);
      this.screenshotCollector.init();
    }

    this.initialized = true;
    this.log('Initialized');
  }

  private teardown(): void {
    if (!this.initialized) return;

    this.errorCapture.destroy();
    this.consoleCollector?.destroy();
    this.networkCollector?.destroy();
    this.userActionCollector?.destroy();
    this.domCollector?.destroy();
    this.screenshotCollector?.destroy();
    this.reporter.destroy();

    this.consoleCollector = null;
    this.networkCollector = null;
    this.userActionCollector = null;
    this.domCollector = null;
    this.screenshotCollector = null;

    this.initialized = false;
    this.log('Destroyed');
  }

  private async handleError(
    error: Error,
    source: ErrorReport['source'],
    options: CaptureOptions = {}
  ): Promise<void> {
    try {
      const report = await this.buildReport(error, source, options);

      // Call beforeSend hook
      const processedReport = this.config.beforeSend(report);
      if (processedReport === false) {
        this.log('Report cancelled by beforeSend hook');
        return;
      }

      await this.reporter.send(processedReport);
    } catch (e) {
      console.error('[DebugFast] Failed to capture error:', e);
    }
  }

  private async buildReport(
    error: Error,
    source: ErrorReport['source'],
    options: CaptureOptions
  ): Promise<ErrorReport> {
    const report: ErrorReport = {
      id: generateId(),
      timestamp: Date.now(),
      message: error.message,
      name: error.name,
      rawStack: error.stack,
      stack: ErrorCapture.parseStack(error.stack),
      source,
      browser: this.browserCollector.collect(),
      user: { ...this.config.user, ...options.user },
      tags: { ...this.config.tags, ...options.tags },
      extra: options.extra,
    };

    // Collect additional context
    if (this.consoleCollector) {
      report.consoleLogs = this.consoleCollector.collect();
    }

    if (this.networkCollector) {
      report.networkRequests = this.networkCollector.collect();
    }

    if (this.userActionCollector) {
      report.userActions = this.userActionCollector.collect();
    }

    if (this.domCollector) {
      report.domSnapshot = this.domCollector.collect();
    }

    // Capture screenshot if enabled
    const shouldCaptureScreenshot =
      options.captureScreenshot ?? this.config.captureScreenshot;
    if (shouldCaptureScreenshot && this.screenshotCollector) {
      const screenshot = await this.screenshotCollector.capture();
      if (screenshot) {
        report.screenshot = screenshot;
      }
    }

    // Add component stack if present
    if (options.extra?.componentStack) {
      report.componentStack = options.extra.componentStack as string;
    }

    return report;
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[DebugFast]', ...args);
    }
  }
}
