import React, { Component, ReactNode } from 'react';
import { BugFast } from 'bugfast-js';

export interface BugFastErrorBoundaryProps {
  /** Fallback UI to render when an error occurs */
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Whether to capture screenshot on error (overrides global config) */
  captureScreenshot?: boolean;
  /** Children to wrap */
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary component that captures errors and reports them to BugFast
 */
export class BugFastErrorBoundary extends Component<BugFastErrorBoundaryProps, State> {
  constructor(props: BugFastErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Report to BugFast
    const instance = BugFast.getInstance();
    if (instance) {
      instance.handleAdapterError(error, 'react', errorInfo.componentStack ?? undefined);
    }

    // Call user's onError callback
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.resetError);
      }

      if (fallback) {
        return fallback;
      }

      // Default fallback
      return (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#fff0f0',
            border: '1px solid #ffcccc',
            borderRadius: '4px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h2 style={{ margin: '0 0 10px', color: '#cc0000' }}>Something went wrong</h2>
          <p style={{ margin: '0 0 10px', color: '#666' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={this.resetError}
            style={{
              padding: '8px 16px',
              backgroundColor: '#cc0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component that wraps a component with BugFastErrorBoundary
 */
export function withBugFastErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<BugFastErrorBoundaryProps, 'children'>
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <BugFastErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </BugFastErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withBugFastErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

// Re-export types for convenience
export type { BugFastConfig, ErrorReport, CaptureOptions } from 'bugfast-js';
