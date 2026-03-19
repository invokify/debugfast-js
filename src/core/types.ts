/**
 * Configuration options for DebugFast initialization
 */
export interface DebugFastConfig {
  /** API endpoint to send error reports to (default: https://ingestion.debugfa.st/v1/events) */
  apiEndpoint?: string;
  /** API key for authentication */
  apiKey: string;
  /** Whether to capture screenshots on error (default: true) */
  captureScreenshot?: boolean;
  /** Whether to capture console logs (default: true) */
  captureConsole?: boolean;
  /** Whether to capture network requests (default: true) */
  captureNetwork?: boolean;
  /** Whether to capture DOM snapshot (default: true) */
  captureDom?: boolean;
  /** Whether to capture user actions (default: true) */
  captureUserActions?: boolean;
  /** Screenshot quality 0-1 (default: 0.7) */
  screenshotQuality?: number;
  /** Maximum console entries to store (default: 50) */
  maxConsoleEntries?: number;
  /** Maximum network requests to store (default: 20) */
  maxNetworkRequests?: number;
  /** Maximum user actions to store (default: 30) */
  maxUserActions?: number;
  /** Whether to mask sensitive DOM inputs (default: true) */
  maskSensitiveInputs?: boolean;
  /** Custom tags to include with every error report */
  tags?: Record<string, string>;
  /** User information to include with error reports */
  user?: UserInfo;
  /** Callback before sending report, return false to cancel */
  beforeSend?: (report: ErrorReport) => ErrorReport | false;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * User information for error attribution
 */
export interface UserInfo {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * A parsed stack frame from an error
 */
export interface StackFrame {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
  source?: string;
}

/**
 * Captured screenshot data
 */
export interface Screenshot {
  /** Base64-encoded image data */
  data: string;
  /** MIME type (image/jpeg or image/png) */
  mimeType: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Timestamp of capture */
  timestamp: number;
}

/**
 * Captured network request/response
 */
export interface NetworkRequest {
  /** Request URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Response status code */
  status?: number;
  /** Response status text */
  statusText?: string;
  /** Request start timestamp */
  startTime: number;
  /** Request end timestamp */
  endTime?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Request type (fetch or xhr) */
  type: 'fetch' | 'xhr';
  /** Whether request failed */
  failed?: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Captured user action (click, input, etc.)
 */
export interface UserAction {
  /** Action type */
  type: 'click' | 'input' | 'submit' | 'focus' | 'blur' | 'scroll' | 'navigation';
  /** Target element selector */
  selector?: string;
  /** Target element tag name */
  tagName?: string;
  /** Element text content (truncated) */
  text?: string;
  /** Input value (masked if sensitive) */
  value?: string;
  /** Timestamp of action */
  timestamp: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Console log entry
 */
export interface ConsoleEntry {
  /** Log level */
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  /** Log message */
  message: string;
  /** Additional arguments */
  args?: string[];
  /** Timestamp */
  timestamp: number;
}

/**
 * Browser and device information
 */
export interface BrowserInfo {
  /** User agent string */
  userAgent: string;
  /** Browser name */
  browser?: string;
  /** Browser version */
  browserVersion?: string;
  /** Operating system */
  os?: string;
  /** OS version */
  osVersion?: string;
  /** Device type */
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  /** Viewport width */
  viewportWidth: number;
  /** Viewport height */
  viewportHeight: number;
  /** Screen width */
  screenWidth: number;
  /** Screen height */
  screenHeight: number;
  /** Device pixel ratio */
  devicePixelRatio: number;
  /** Current URL */
  url: string;
  /** Referrer URL */
  referrer: string;
  /** Language */
  language: string;
  /** Online status */
  online: boolean;
}

/**
 * DOM snapshot
 */
export interface DOMSnapshot {
  /** Serialized HTML */
  html: string;
  /** Document title */
  title: string;
  /** Timestamp */
  timestamp: number;
  /** Truncated due to size */
  truncated?: boolean;
}

/**
 * Complete error report payload
 */
export interface ErrorReport {
  /** Unique report ID */
  id: string;
  /** Timestamp of error */
  timestamp: number;
  /** Error message */
  message: string;
  /** Error name/type */
  name: string;
  /** Parsed stack trace */
  stack?: StackFrame[];
  /** Raw stack trace string */
  rawStack?: string;
  /** Error source (global, unhandledrejection, react, vue, manual) */
  source: 'global' | 'unhandledrejection' | 'react' | 'vue' | 'manual';
  /** Captured screenshot */
  screenshot?: Screenshot;
  /** Browser information */
  browser: BrowserInfo;
  /** Recent console logs */
  consoleLogs?: ConsoleEntry[];
  /** Recent network requests */
  networkRequests?: NetworkRequest[];
  /** Recent user actions */
  userActions?: UserAction[];
  /** DOM snapshot */
  domSnapshot?: DOMSnapshot;
  /** User information */
  user?: UserInfo;
  /** Custom tags */
  tags?: Record<string, string>;
  /** Additional context */
  extra?: Record<string, unknown>;
  /** React component stack (if applicable) */
  componentStack?: string;
}

/**
 * Options for manual error capture
 */
export interface CaptureOptions {
  /** Additional context to include */
  extra?: Record<string, unknown>;
  /** Custom tags for this error */
  tags?: Record<string, string>;
  /** Override user info for this error */
  user?: UserInfo;
  /** Whether to capture screenshot (default: uses config) */
  captureScreenshot?: boolean;
}

/**
 * Internal collector interface
 */
export interface Collector {
  /** Initialize the collector */
  init(): void;
  /** Destroy the collector and restore original behavior */
  destroy(): void;
  /** Collect current state */
  collect(): unknown;
}
