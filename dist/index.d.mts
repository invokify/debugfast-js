import { B as BugFastConfig, C as CaptureOptions, U as UserInfo } from './types-Dpb1Lme_.mjs';
export { a as BrowserInfo, b as ConsoleEntry, D as DOMSnapshot, E as ErrorReport, N as NetworkRequest, S as Screenshot, c as StackFrame, d as UserAction } from './types-Dpb1Lme_.mjs';

/**
 * Main BugFast client class
 */
declare class BugFast {
    private static instance;
    private config;
    private errorCapture;
    private browserCollector;
    private consoleCollector;
    private networkCollector;
    private userActionCollector;
    private domCollector;
    private screenshotCollector;
    private reporter;
    private initialized;
    private constructor();
    /**
     * Initialize BugFast with configuration
     */
    static init(config: BugFastConfig): BugFast;
    /**
     * Get the current instance
     */
    static getInstance(): BugFast | null;
    /**
     * Manually capture an error
     */
    static captureError(error: Error | string, options?: CaptureOptions): void;
    /**
     * Set user information
     */
    static setUser(user: UserInfo): void;
    /**
     * Set custom tags
     */
    static setTags(tags: Record<string, string>): void;
    /**
     * Flush any pending error reports
     */
    static flush(): Promise<void>;
    /**
     * Destroy the BugFast instance and clean up
     */
    static destroy(): void;
    /**
     * Internal: Handle error from React/Vue adapters
     */
    handleAdapterError(error: Error, source: 'react' | 'vue', componentStack?: string): void;
    private setup;
    private teardown;
    private handleError;
    private buildReport;
    private log;
}

export { BugFast, BugFastConfig, CaptureOptions, UserInfo, BugFast as default };
