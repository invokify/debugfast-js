# BugFast-JS Development Context

## Project Overview
A TypeScript library for catching front-end bugs in React and Vue applications. Captures comprehensive error context including screenshots, browser info, console logs, DOM snapshots, network requests, and user actions.

## Tech Stack
- **Language**: TypeScript
- **Build**: tsup (dual ESM/CJS output)
- **Screenshot**: html2canvas
- **Frameworks**: React 16.8+, Vue 3+

## Project Structure
```
src/
├── index.ts              # Main entry point
├── core/
│   ├── BugFast.ts        # Main client class (singleton)
│   ├── ErrorCapture.ts   # Global error handlers
│   └── types.ts          # TypeScript interfaces
├── collectors/           # Data collection modules
│   ├── ScreenshotCollector.ts
│   ├── ConsoleCollector.ts
│   ├── NetworkCollector.ts
│   ├── DOMCollector.ts
│   ├── BrowserCollector.ts
│   └── UserActionCollector.ts
├── reporter/
│   └── ApiReporter.ts    # API endpoint with retry logic
├── adapters/
│   ├── react.tsx         # React Error Boundary
│   └── vue.ts            # Vue plugin
└── utils/
    └── helpers.ts        # Utility functions
```

## Commands
- `npm run build` - Build library (outputs to dist/)
- `npm run typecheck` - TypeScript type checking
- `npm run dev` - Watch mode build

## Package Exports
- `bugfast-js` - Main client
- `bugfast-js/react` - React Error Boundary
- `bugfast-js/vue` - Vue plugin

## Test Apps
- `test-app/` - React test app (port 5173)
- `test-app-vue/` - Vue test app (port 5174)

Run with `npm run dev` in each directory.

## Key Patterns

### Singleton Pattern
BugFast uses a singleton - initialize once with `BugFast.init()`, access anywhere with `BugFast.getInstance()`.

### Collector Interface
All collectors implement `init()`, `destroy()`, and `collect()` methods.

### Circular Buffers
Console logs, network requests, and user actions use circular buffers to limit memory usage.

### Sensitive Data Masking
Password inputs and sensitive fields are automatically masked in DOM snapshots and user action tracking.

## API Design
```typescript
// Initialize
BugFast.init({ apiEndpoint, apiKey, ...options });

// Manual capture
BugFast.captureError(error, { extra, tags });

// Set user context
BugFast.setUser({ id, email, name });

// React
<BugFastErrorBoundary fallback={<Error />}>
  <App />
</BugFastErrorBoundary>

// Vue
app.use(bugfastPlugin);
```

## Error Report Payload
Reports include: id, timestamp, message, stack, source, browser info, screenshot, console logs, network requests, user actions, DOM snapshot, user info, and tags.
