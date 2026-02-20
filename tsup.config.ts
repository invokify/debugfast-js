import { defineConfig } from 'tsup';

export default defineConfig([
  // Main bundle
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
  },
  // React adapter - imports debugfast-js at runtime
  {
    entry: { react: 'src/adapters/react.tsx' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['react', 'debugfast-js'],
    treeshake: true,
  },
  // Vue adapter - imports debugfast-js at runtime
  {
    entry: { vue: 'src/adapters/vue.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['vue', 'debugfast-js'],
    treeshake: true,
  },
]);
