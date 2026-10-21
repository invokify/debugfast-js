import DebugFast from 'debugfast-js';

// Demo store: attached to every report via the state capture API.
// Registered at import time (before DebugFast.init) to exercise queued registration.
// Safe during SSR: registerStore only writes to a static registry, no window access.
export const cartStore = {
  state: {
    items: [] as { sku: string; qty: number }[],
    coupon: null as string | null,
    paymentToken: 'tok_demo_123', // masked as [Masked] in reports
  },
  add(sku: string) {
    this.state = { ...this.state, items: [...this.state.items, { sku, qty: 1 }] };
    DebugFast.recordStateAction('cart', 'cart/add');
  },
};

DebugFast.registerStore('cart', () => cartStore.state, 'custom');
