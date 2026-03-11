import React, { useState } from 'react';
import DebugFast from 'debugfast-js';

function BuggyComponent(): React.ReactNode {
  throw new Error('This component always crashes!');
}

function App() {
  const [showBuggy, setShowBuggy] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const triggerGlobalError = () => {
    // This will be caught by window.onerror
    setTimeout(() => {
      throw new Error('Global error from setTimeout!');
    }, 0);
  };
function BuggyComponent() {
  // Only throw in development/demo mode when explicitly triggered
  // Wrap usage of this component in an ErrorBoundary to handle gracefully
  return <div>Buggy Component (safe)</div>;
}

// Ensure the parent renders BuggyComponent inside an ErrorBoundary:
// <ErrorBoundary fallback={<p>Something went wrong.</p>}>
//   <BuggyComponent />
// </ErrorBoundary>
  };

  const triggerManualCapture = () => {
    try {
      JSON.parse('invalid json {{{');
    } catch (error) {
      DebugFast.captureError(error as Error, {
        extra: { context: 'Parsing user input' },
        tags: { feature: 'json-parser' },
      });
    }
  };

  const triggerConsoleError = () => {
    console.error('This is a console error!');
    console.warn('This is a warning');
    console.log('This is a log message');
  };

  const triggerNetworkRequest = async () => {
    try {
      // Successful request
      await fetch('https://httpbin.org/get');
      console.log('Request succeeded');

      // Failed request
      await fetch('https://httpbin.org/status/500');
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>DebugFast-JS Test App</h1>
      <p>Open the browser console to see DebugFast debug output.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400 }}>
        <section>
          <h3>Test User Actions</h3>
          <input
            type="text"
            placeholder="Type something..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ padding: 8, width: '100%', boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="Password (will be masked)"
            style={{ padding: 8, width: '100%', boxSizing: 'border-box', marginTop: 8 }}
          />
        </section>

        <section>
          <h3>Trigger Errors</h3>
          <button onClick={() => setShowBuggy(true)} style={buttonStyle}>
            Trigger React Error Boundary
          </button>

          <button onClick={triggerGlobalError} style={buttonStyle}>
            Trigger Global Error
          </button>

          <button onClick={triggerUnhandledRejection} style={buttonStyle}>
            Trigger Unhandled Rejection
          </button>

          <button onClick={triggerManualCapture} style={buttonStyle}>
            Trigger Manual Capture
          </button>
        </section>

        <section>
          <h3>Test Collectors</h3>
          <button onClick={triggerConsoleError} style={buttonStyle}>
            Trigger Console Logs
          </button>

          <button onClick={triggerNetworkRequest} style={buttonStyle}>
            Trigger Network Requests
          </button>
        </section>
      </div>

      {showBuggy && <BuggyComponent />}
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px',
  marginTop: 8,
  cursor: 'pointer',
  width: '100%',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  fontSize: 14,
};

export default App;
