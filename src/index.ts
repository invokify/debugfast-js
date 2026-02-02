// Main client export
export { BugFast } from './core/BugFast';

// Default export for convenience
export { BugFast as default } from './core/BugFast';

// Type exports
export type {
  BugFastConfig,
  ErrorReport,
  CaptureOptions,
  UserInfo,
  StackFrame,
  Screenshot,
  NetworkRequest,
  UserAction,
  ConsoleEntry,
  BrowserInfo,
  DOMSnapshot,
} from './core/types';
