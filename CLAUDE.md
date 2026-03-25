# DebugFast-JS Development Context

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
│   ├── DebugFast.ts        # Main client class (singleton)

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
- `debugfast-js` - Main client
- `debugfast-js/react` - React Error Boundary
- `debugfast-js/vue` - Vue plugin

## Test Apps
- `test-app-react/` - React/Vite test app (port 5173)
- `test-app-vue/` - Vue/Vite test app (port 5174)
- `test-app-next/` - Next.js 15 App Router test app (port 3000)

Run with `npm run dev` in each directory.

### Next.js Test App Notes
- SDK init is guarded with `typeof window !== 'undefined'` in `src/app/providers.tsx` — `'use client'` components still execute on the server during SSR, so the guard prevents `window is not defined` errors.
- `outputFileTracingRoot` in `next.config.ts` is set to the monorepo root to silence the multiple-lockfiles warning from Next.js.

## Key Patterns

### Singleton Pattern
DebugFast uses a singleton - initialize once with `DebugFast.init()`, access anywhere with `DebugFast.getInstance()`.

### Collector Interface
All collectors implement `init()`, `destroy()`, and `collect()` methods.

### Circular Buffers
Console logs, network requests, and user actions use circular buffers to limit memory usage.

### Sensitive Data Masking
Password inputs and sensitive fields are automatically masked in DOM snapshots and user action tracking.

### UUID Generation
Event IDs are generated as UUID v4 using `crypto.randomUUID()` with a fallback implementation for environments without native support.

## API Design
```typescript
// Initialize
DebugFast.init({ apiEndpoint, apiKey, ...options });

// Manual capture
DebugFast.captureError(error, { extra, tags });

// Set user context
DebugFast.setUser({ id, email, name });

// React
<DebugFastErrorBoundary fallback={<Error />}>
  <App />
</DebugFastErrorBoundary>

// Vue
app.use(debugfastPlugin);
```

## Error Report Payload
Reports include: id (UUID v4), timestamp, message, stack, source, browser info, screenshot, console logs, network requests, user actions, DOM snapshot, user info, and tags.

## Backend Integration

### Ingestion API Endpoints
- `POST /v1/events` - Single event (accepts `IngestPayload` directly)
- `POST /v1/events/batch` - Batch events (accepts `{ reports: IngestPayload[] }`)

Both endpoints require `X-API-Key` header for authentication.

### Event Processing Pipeline
1. SDK captures error and sends to ingestion API
2. Ingestion validates API key and enqueues event to Redis (BullMQ)
3. Worker processes queue and inserts into ClickHouse

### Queue Configuration
- Queue name: `debugfast-events` (BullMQ queue names cannot contain `:`)
- Default concurrency: 10 workers
- Retry: 3 attempts with exponential backoff

### ClickHouse Requirements
- Database: `debugfast`
- Timestamp format: `YYYY-MM-DD HH:MM:SS.mmm` (DateTime64(3))
- Async inserts enabled with `wait_for_async_insert: 1`

### Environment Variables
Apps require `.env.local` with:
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
REDIS_URL=redis://localhost:6379
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_DATABASE=debugfast
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

For monorepo apps (ingestion, worker), create symlinks to root `.env.local`:
```bash
ln -s ../../.env.local .env.local
```

### Database Schema
Uses Supabase Auth - no separate User table. Project and ProjectMember tables reference `auth.users(id)` directly via userId field (no foreign key constraint due to separate schemas).
