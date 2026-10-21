import { DebugFast } from '../core/DebugFast';

/**
 * Minimal structural types so the SDK has no runtime dependency on any state library
 */
interface ReduxMiddlewareAPI {
  getState: () => unknown;
}

interface ZustandStoreLike {
  getState: () => unknown;
}

interface JotaiStoreLike<A> {
  get: (atom: A) => unknown;
}

/**
 * Redux / Redux Toolkit middleware that attaches store state and recent action types to error reports.
 *
 * @example
 * configureStore({ reducer, middleware: (gDM) => gDM().concat(createDebugFastMiddleware()) })
 */
export function createDebugFastMiddleware(options: { name?: string } = {}) {
  const name = options.name ?? 'redux';

  return (api: ReduxMiddlewareAPI) => {
    DebugFast.registerStore(name, api.getState, 'redux');

    return (next: (action: unknown) => unknown) => (action: unknown) => {
      const type = (action as { type?: unknown } | null)?.type;
      if (typeof type === 'string') {
        DebugFast.recordStateAction(name, type);
      }
      return next(action);
    };
  };
}

/**
 * Attach a Zustand store (the hook returned by `create()` or a vanilla store) to error reports.
 * Returns a function that stops tracking.
 */
export function trackZustandStore(store: ZustandStoreLike, name = 'zustand'): () => void {
  return DebugFast.registerStore(name, () => store.getState(), 'zustand');
}

/**
 * Attach Jotai atoms to error reports. Jotai cannot enumerate atoms, so pass the ones to capture.
 * Returns a function that stops tracking.
 *
 * @example
 * trackJotaiAtoms(getDefaultStore(), { cart: cartAtom, filters: filtersAtom })
 */
export function trackJotaiAtoms<A>(
  store: JotaiStoreLike<A>,
  atoms: Record<string, A>,
  name = 'jotai'
): () => void {
  return DebugFast.registerStore(
    name,
    () => {
      const values: Record<string, unknown> = {};
      for (const [key, atom] of Object.entries(atoms)) {
        try {
          values[key] = store.get(atom);
        } catch {
          values[key] = '[Unreadable]';
        }
      }
      return values;
    },
    'jotai'
  );
}
