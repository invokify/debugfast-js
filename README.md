# debugfast-js

Front-end error tracking SDK for React and Vue applications. Captures comprehensive error context including screenshots, console logs, network requests, DOM snapshots, and user actions.

## Installation

```bash
npm install debugfast-js
# or
pnpm add debugfast-js
# or
yarn add debugfast-js
```

## Quick Start

```typescript
import { DebugFast } from 'debugfast-js';

DebugFast.init({
  apiEndpoint: 'https://your-api.example.com/v1/events',
  apiKey: 'your-api-key',
});
```

## Framework Integration

### React

```tsx
import { DebugFastErrorBoundary } from 'debugfast-js/react';

function App() {
  return (
    <DebugFastErrorBoundary
      fallback={<div>Something went wrong</div>}
      onError={(error, errorInfo) => console.log(error)}
    >
      <YourApp />
    </DebugFastErrorBoundary>
  );
}
```

Or use the higher-order component:

```tsx
import { withDebugFastErrorBoundary } from 'debugfast-js/react';

const SafeComponent = withDebugFastErrorBoundary(MyComponent, {
  fallback: <ErrorFallback />,
});
```

### Vue 3

```typescript
import { createApp } from 'vue';
import { debugfastPlugin } from 'debugfast-js/vue';
import App from './App.vue';

const app = createApp(App);
app.use(debugfastPlugin, {
  captureComponentInfo: true, // Include Vue component props and route info
});
app.mount('#app');
```

Composition API helper:

```vue
<script setup>
import { useDebugFastErrorHandler } from 'debugfast-js/vue';

const { captureError } = useDebugFastErrorHandler();

function handleRiskyOperation() {
  try {
    // risky code
  } catch (error) {
    captureError(error, { context: 'riskyOperation' });
  }
}
</script>
```

## Configuration

```typescript
DebugFast.init({
  // Required
  apiEndpoint: 'https://api.example.com/v1/events',
  apiKey: 'your-api-key',

  // Optional - all default to true
  captureScreenshot: true,
  captureConsole: true,
  captureNetwork: true,
  captureDom: true,
  captureUserActions: true,

  // Limits
  screenshotQuality: 0.7,      // 0-1, default: 0.7
  maxConsoleEntries: 50,       // default: 50
  maxNetworkRequests: 20,      // default: 20
  maxUserActions: 30,          // default: 30

  // Privacy
  maskSensitiveInputs: true,   // Mask password fields, etc.

  // Custom context
  tags: { environment: 'production' },
  user: { id: 'user-123', email: 'user@example.com' },

  // Hooks
  beforeSend: (report) => {
    // Modify report or return false to cancel
    return report;
  },

  // Debug
  debug: false,
});
```

## API Reference

### Static Methods

#### `DebugFast.init(config)`

Initialize the SDK. Must be called before any other methods.

#### `DebugFast.captureError(error, options?)`

Manually capture an error.

```typescript
try {
  await riskyOperation();
} catch (error) {
  DebugFast.captureError(error, {
    extra: { operationId: '123' },
    tags: { severity: 'high' },
  });
}
```

#### `DebugFast.setUser(user)`

Set or update user information.

```typescript
DebugFast.setUser({
  id: 'user-123',
  email: 'user@example.com',
  name: 'John Doe',
});
```

#### `DebugFast.setTags(tags)`

Add custom tags to all future error reports.

```typescript
DebugFast.setTags({
  version: '1.2.3',
  feature: 'checkout',
});
```

#### `DebugFast.flush()`

Flush any pending error reports. Useful before page unload.

```typescript
window.addEventListener('beforeunload', () => {
  DebugFast.flush();
});
```

#### `DebugFast.destroy()`

Clean up and remove all event listeners.

```typescript
DebugFast.destroy();
```

#### `DebugFast.getInstance()`

Get the current DebugFast instance (or null if not initialized).

## What Gets Captured

Each error report includes:

| Data | Description |
|------|-------------|
| **Error** | Message, name, parsed stack trace |
| **Screenshot** | Visual capture of the page at error time |
| **Browser** | Browser, OS, viewport, device type, URL |
| **Console** | Recent console.log/warn/error entries |
| **Network** | Recent fetch/XHR requests with timing |
| **User Actions** | Recent clicks, inputs, navigation |
| **DOM** | HTML snapshot (sensitive inputs masked) |
| **User** | Custom user identification |
| **Tags** | Custom metadata |

## Privacy

- Sensitive inputs (password, credit card, SSN) are automatically masked
- DOM snapshots redact sensitive field values
- Use `beforeSend` hook to filter or redact additional data
- Screenshot capture can be disabled globally or per-error

## Error Sources

Errors are automatically captured from:

- `window.onerror` (global errors)
- `window.onunhandledrejection` (unhandled promise rejections)
- React Error Boundaries
- Vue error handlers

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires `crypto.randomUUID()` or falls back to polyfill.

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  DebugFastConfig,
  ErrorReport,
  CaptureOptions,
  UserInfo,
  StackFrame,
  BrowserInfo,
} from 'debugfast-js';
```

## License

MIT
