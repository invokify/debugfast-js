import React, { Component, ReactNode } from 'react';
export { B as BugFastConfig, C as CaptureOptions, E as ErrorReport } from './types-Dpb1Lme_.js';

interface BugFastErrorBoundaryProps {
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
declare class BugFastErrorBoundary extends Component<BugFastErrorBoundaryProps, State> {
    constructor(props: BugFastErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    resetError: () => void;
    render(): ReactNode;
}
/**
 * Higher-order component that wraps a component with BugFastErrorBoundary
 */
declare function withBugFastErrorBoundary<P extends object>(WrappedComponent: React.ComponentType<P>, errorBoundaryProps?: Omit<BugFastErrorBoundaryProps, 'children'>): React.FC<P>;

export { BugFastErrorBoundary, type BugFastErrorBoundaryProps, withBugFastErrorBoundary };
