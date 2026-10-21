// Main client export
export { DebugFast } from './core/DebugFast';

// Default export for convenience
export { DebugFast as default } from './core/DebugFast';

// Type exports
export type {
  DebugFastConfig,
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
  StateSnapshot,
  StateSource,
} from './core/types';

// State library integrations
export {
  createDebugFastMiddleware,
  trackZustandStore,
  trackJotaiAtoms,
} from './integrations/state';
