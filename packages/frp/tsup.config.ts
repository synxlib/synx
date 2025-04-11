import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',           // main entry for @synx/frp
    'src/reactive/index.ts',  // @synx/frp/reactive
    'src/event/index.ts',     // @synx/frp/event
  ],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  outDir: 'dist',
});
