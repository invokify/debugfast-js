import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/adapters/react.tsx',
    vue: 'src/adapters/vue.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'vue'],
  treeshake: true,
  splitting: false,
});
