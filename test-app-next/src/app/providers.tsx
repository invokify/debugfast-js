'use client';

import DebugFast from 'debugfast-js';
import { DebugFastErrorBoundary } from 'debugfast-js/react';

if (typeof window !== 'undefined') {
  DebugFast.init({
    apiKey: 'f3b15f01-9578-4628-af4e-1a79a5507cca:96d9438bbb034caf9a7a749ba5ba7d07',
    captureScreenshot: true,
    captureConsole: true,
    captureNetwork: true,
    captureDom: true,
    captureUserActions: true,
    debug: true,
    beforeSend: (report) => {
      console.log('DebugFast Report:', report);
      return report;
    },
  });

  DebugFast.setUser({
    id: 'next-test-user-123',
    email: 'test@example.com',
    name: 'Test User',
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DebugFastErrorBoundary
      fallback={(error, reset) => (
        <div style={{ padding: 20, backgroundColor: '#ffe0e0', borderRadius: 8 }}>
          <h2>Something went wrong!</h2>
          <p style={{ color: '#c00' }}>{error.message}</p>
          <button onClick={reset} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.log('Error caught by boundary:', error);
        console.log('Component stack:', errorInfo.componentStack);
      }}
    >
      {children}
    </DebugFastErrorBoundary>
  );
}
