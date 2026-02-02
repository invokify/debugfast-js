import { App } from 'vue';
export { B as BugFastConfig, C as CaptureOptions, E as ErrorReport } from './types-Dpb1Lme_.js';

interface BugFastPluginOptions {
    /** Whether to capture Vue-specific component info */
    captureComponentInfo?: boolean;
}
/**
 * Vue plugin for BugFast error handling
 */
declare const bugfastPlugin: {
    install(app: App, options?: BugFastPluginOptions): void;
};
/**
 * Composition API helper for capturing errors in setup functions
 */
declare function useBugFastErrorHandler(): {
    captureError: (error: Error | string, extra?: Record<string, unknown>) => void;
};

export { type BugFastPluginOptions, bugfastPlugin, useBugFastErrorHandler };
