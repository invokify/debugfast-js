import React from 'react';
import ReactDOM from 'react-dom/client';
import DebugFast from 'debugfast-js';
import { DebugFastErrorBoundary } from 'debugfast-js/react';
import App from './App';
import './index.css';

// Initialize DebugFast
DebugFast.init({
  apiEndpoint: 'https://httpbin.org/post', // Test endpoint that accepts POST
  apiKey: 'test-api-key',
  captureScreenshot: true,
  captureConsole: true,
  captureNetwork: true,
  captureDom: true,
  captureUserActions: true,
  debug: true, // Enable debug logging
  beforeSend: (report) => {
    console.log('DebugFast Report:', report);
    return report;
  },
});

// Set user info
DebugFast.setUser({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
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
      <App />
    </DebugFastErrorBoundary>
  </React.StrictMode>
);
