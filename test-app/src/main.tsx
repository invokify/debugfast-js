import React from 'react';
import ReactDOM from 'react-dom/client';
import BugFast from 'bugfast-js';
import { BugFastErrorBoundary } from 'bugfast-js/react';
import App from './App';
import './index.css';

// Initialize BugFast
BugFast.init({
  apiEndpoint: 'http://localhost:3001/v1/events', // Single events go here, batches go to /batch
  apiKey: 'f76bf7ae-669f-4dc7-b406-431e67f635a9:03333005c455472c92a559c263981e82',
  captureScreenshot: true,
  captureConsole: true,
  captureNetwork: true,
  captureDom: true,
  captureUserActions: true,
  debug: true, // Enable debug logging
  beforeSend: (report) => {
    console.log('BugFast Report:', report);
    return report;
  },
});

// Set user info
BugFast.setUser({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BugFastErrorBoundary
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
    </BugFastErrorBoundary>
  </React.StrictMode>
);
