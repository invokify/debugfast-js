import type { App, ComponentPublicInstance } from 'vue';
import { BugFast } from '../core/BugFast';

export interface BugFastPluginOptions {
  /** Whether to capture Vue-specific component info */
  captureComponentInfo?: boolean;
}

/**
 * Extract component stack from Vue component instance
 */
function getComponentStack(vm: ComponentPublicInstance | null): string {
  if (!vm) return '';

  const stack: string[] = [];
  let current: ComponentPublicInstance | null = vm;

  while (current) {
    const name =
      current.$options?.name ||
      current.$options?.__name ||
      (current.$options as { _componentTag?: string })?._componentTag ||
      'AnonymousComponent';

    stack.push(`<${name}>`);

    current = current.$parent ?? null;
  }

  return stack.join('\n  at ');
}

/**
 * Extract component info from Vue component instance
 */
function getComponentInfo(vm: ComponentPublicInstance | null): Record<string, unknown> {
  if (!vm) return {};

  const info: Record<string, unknown> = {};

  // Component name
  const name =
    vm.$options?.name ||
    vm.$options?.__name ||
    (vm.$options as { _componentTag?: string })?._componentTag;

  if (name) {
    info.componentName = name;
  }

  // Props (shallow copy, avoid circular refs)
  if (vm.$props && Object.keys(vm.$props).length > 0) {
    try {
      info.props = JSON.parse(JSON.stringify(vm.$props));
    } catch {
      info.props = '[Unserializable]';
    }
  }

  // Route info if using vue-router
  const route = (vm as ComponentPublicInstance & { $route?: { path: string; name?: string; params?: Record<string, unknown> } }).$route;
  if (route) {
    info.route = {
      path: route.path,
      name: route.name,
      params: route.params,
    };
  }

  return info;
}

/**
 * Vue plugin for BugFast error handling
 */
export const bugfastPlugin = {
  install(app: App, options: BugFastPluginOptions = {}): void {
    const { captureComponentInfo = true } = options;

    // Global error handler
    const originalErrorHandler = app.config.errorHandler;

    app.config.errorHandler = (
      err: unknown,
      vm: ComponentPublicInstance | null,
      info: string
    ): void => {
      const error = err instanceof Error ? err : new Error(String(err));
      const instance = BugFast.getInstance();

      if (instance) {
        const componentStack = getComponentStack(vm);
        const componentInfo = captureComponentInfo ? getComponentInfo(vm) : {};

        // Capture error with Vue-specific context
        BugFast.captureError(error, {
          extra: {
            componentStack,
            vueInfo: info,
            ...componentInfo,
          },
          tags: {
            framework: 'vue',
          },
        });
      }

      // Call original error handler if exists
      if (originalErrorHandler) {
        originalErrorHandler(err, vm, info);
      } else {
        // Default behavior: log to console
        console.error('[Vue Error]', err);
        if (vm) {
          console.error('Component:', getComponentStack(vm));
        }
        console.error('Info:', info);
      }
    };

    // Global warning handler (development only)
    if (typeof globalThis !== 'undefined' && (globalThis as { __DEV__?: boolean }).__DEV__ !== false) {
      const originalWarnHandler = app.config.warnHandler;

      app.config.warnHandler = (
        msg: string,
        vm: ComponentPublicInstance | null,
        trace: string
      ): void => {
        // Log warnings but don't report them as errors
        console.warn('[Vue Warning]', msg);
        if (trace) {
          console.warn(trace);
        }

        if (originalWarnHandler) {
          originalWarnHandler(msg, vm, trace);
        }
      };
    }
  },
};

/**
 * Composition API helper for capturing errors in setup functions
 */
export function useBugFastErrorHandler(): {
  captureError: (error: Error | string, extra?: Record<string, unknown>) => void;
} {
  return {
    captureError(error: Error | string, extra?: Record<string, unknown>): void {
      BugFast.captureError(error, { extra });
    },
  };
}

// Re-export types for convenience
export type { BugFastConfig, ErrorReport, CaptureOptions } from '../core/types';
