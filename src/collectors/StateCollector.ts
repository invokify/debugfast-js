import type { Collector, StateSnapshot, StateSource } from '../core/types';
import { createCircularBuffer, SENSITIVE_KEY_PATTERN, truncate } from '../utils/helpers';

const MAX_RECENT_ACTIONS = 10;
const MAX_ARRAY_ITEMS = 100;
const DEPTH_STEPS = [8, 4, 2];

interface RegisteredStore {
  source: StateSource;
  getState: () => unknown;
  recentActions: ReturnType<typeof createCircularBuffer<string>>;
}

/**
 * Snapshots registered stores (Redux, Pinia, Zustand, Jotai, custom) on error
 */
export class StateCollector implements Collector {
  private stores = new Map<string, RegisteredStore>();

  constructor(
    private maxStateSize: number = 50000,
    private sanitizer?: (state: unknown, storeName: string) => unknown
  ) {}

  init(): void {}

  destroy(): void {
    this.stores.clear();
  }

  register(name: string, getState: () => unknown, source: StateSource): void {
    const existing = this.stores.get(name);
    this.stores.set(name, {
      source,
      getState,
      recentActions: existing?.recentActions ?? createCircularBuffer<string>(MAX_RECENT_ACTIONS),
    });
  }

  unregister(name: string, getState?: () => unknown): void {
    // Only remove if it is still the same registration
    if (getState && this.stores.get(name)?.getState !== getState) return;
    this.stores.delete(name);
  }

  recordAction(name: string, actionType: string): void {
    this.stores.get(name)?.recentActions.push(truncate(actionType, 100));
  }

  collect(): StateSnapshot[] {
    if (this.stores.size === 0) return [];

    const budget = Math.floor(this.maxStateSize / this.stores.size);
    const snapshots: StateSnapshot[] = [];

    this.stores.forEach((store, name) => {
      const snapshot: StateSnapshot = {
        name,
        source: store.source,
        data: null,
        timestamp: Date.now(),
      };

      try {
        let state = store.getState();
        if (this.sanitizer) state = this.sanitizer(state, name);
        Object.assign(snapshot, serializeWithinBudget(state, budget));
      } catch {
        snapshot.data = '[Unserializable]';
      }

      const actions = store.recentActions.getAll();
      if (actions.length > 0) snapshot.recentActions = actions;

      snapshots.push(snapshot);
    });

    return snapshots;
  }
}

function serializeWithinBudget(
  state: unknown,
  budget: number
): { data: unknown; truncated?: boolean } {
  let json = '';

  // Retry with shallower depth until the snapshot fits its share of the budget
  for (const [i, maxDepth] of DEPTH_STEPS.entries()) {
    const ctx = { truncated: false };
    const data = serialize(state, maxDepth, 0, new Set(), ctx);
    json = JSON.stringify(data) ?? 'null';
    if (json.length <= budget) {
      return ctx.truncated || i > 0 ? { data, truncated: true } : { data };
    }
  }

  // Still too large at the shallowest depth: keep a raw JSON prefix
  return { data: truncate(json, budget), truncated: true };
}

/**
 * Convert a value into JSON-safe data, masking sensitive keys
 */
function serialize(
  value: unknown,
  maxDepth: number,
  depth: number,
  ancestors: Set<object>,
  ctx: { truncated: boolean }
): unknown {
  if (value === null || value === undefined) return null;

  switch (typeof value) {
    case 'string':
      if (value.length <= 1000) return value;
      ctx.truncated = true;
      return truncate(value, 1000);
    case 'number':
    case 'boolean':
      return value;
    case 'bigint':
      return value.toString();
    case 'function':
    case 'symbol':
      return undefined;
  }

  const obj = value as object;
  if (obj instanceof Date) return obj.toISOString();
  if (obj instanceof Error) return { name: obj.name, message: obj.message };
  if (typeof Element !== 'undefined' && obj instanceof Element) return `[${obj.tagName.toLowerCase()}]`;

  if (ancestors.has(obj)) return '[Circular]';
  if (depth >= maxDepth) {
    ctx.truncated = true;
    return Array.isArray(obj) ? `[Array(${obj.length})]` : '[Object]';
  }

  ancestors.add(obj);
  try {
    if (obj instanceof Map) {
      return serializeArray(Array.from(obj.entries()), maxDepth, depth, ancestors, ctx);
    }
    if (obj instanceof Set) {
      return serializeArray(Array.from(obj.values()), maxDepth, depth, ancestors, ctx);
    }
    if (Array.isArray(obj)) {
      return serializeArray(obj, maxDepth, depth, ancestors, ctx);
    }

    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        result[key] = '[Masked]';
        continue;
      }
      const serialized = serialize(
        (obj as Record<string, unknown>)[key],
        maxDepth,
        depth + 1,
        ancestors,
        ctx
      );
      if (serialized !== undefined) result[key] = serialized;
    }
    return result;
  } finally {
    ancestors.delete(obj);
  }
}

function serializeArray(
  items: unknown[],
  maxDepth: number,
  depth: number,
  ancestors: Set<object>,
  ctx: { truncated: boolean }
): unknown[] {
  if (items.length > MAX_ARRAY_ITEMS) ctx.truncated = true;
  return items
    .slice(0, MAX_ARRAY_ITEMS)
    .map((item) => serialize(item, maxDepth, depth + 1, ancestors, ctx) ?? null);
}
