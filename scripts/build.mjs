// Bundles k6 test files with esbuild.
// k6 imports (k6, k6/*) are marked external — resolved by k6 at runtime, not bundled.
// Add new entry points here when adding tests for a new service or flow.

import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: [
    'src/tests/api/todos-api/health.test.ts',
    'src/tests/api/todos-api/todos.test.ts',
    'src/tests/flows/todo-lifecycle.test.ts',
  ],
  bundle: true,
  outdir: 'dist',
  outbase: 'src',
  target: 'es6',
  external: ['k6', 'k6/*'],
  format: 'cjs',
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
