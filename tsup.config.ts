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
  // Legacy ESM build for bundlers that ignore `exports` (webpack 4, Vue CLI 4).
  // They read the `module` field and the vue/ and react/ stub folders instead,
  // so modern tools never load these files. Differences from the build above:
  // - ES2019: webpack 4's parser rejects `?.` and `??`.
  // - `.js` instead of `.mjs`: webpack 4 resolves imports inside `.mjs` files
  //   with `main` (CJS), so the adapters would load a second DebugFast singleton.
  {
    entry: {
      index: 'src/index.ts',
      react: 'src/adapters/react.tsx',
      vue: 'src/adapters/vue.ts',
    },
    outDir: 'dist/legacy',
    format: ['esm'],
    outExtension: () => ({ js: '.js' }),
    target: 'es2019',
    sourcemap: true,
    splitting: false,
    external: ['react', 'vue', 'debugfast-js'],
    treeshake: true,
  },
]);
