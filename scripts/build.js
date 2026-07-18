/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawnSync } from 'child_process';
import path from 'path';

// 1. Run Vite build
console.log('Building client with Vite...');
const viteBin = path.join('node_modules', 'vite', 'bin', 'vite.js');
const viteResult = spawnSync('node', [viteBin, 'build'], { stdio: 'inherit', shell: true });

if (viteResult.status !== 0) {
  process.exit(viteResult.status || 1);
}

// 2. Run Esbuild server bundling
console.log('Bundling server with Esbuild...');
const esbuildArgs = [
  'server.ts',
  '--bundle',
  '--platform=node',
  '--format=cjs',
  '--packages=external',
  '--sourcemap',
  '--outfile=dist/server.cjs'
];

let esbuildCmd;
let spawnArgs;

if (process.platform === 'win32') {
  // On Windows, use 'node' to execute the JS wrapper to bypass the .cmd shell splitting bug
  esbuildCmd = 'node';
  spawnArgs = [path.join('node_modules', 'esbuild', 'bin', 'esbuild'), ...esbuildArgs];
} else {
  // On Linux/macOS (e.g. Vercel), execute the native binary via npx
  esbuildCmd = 'npx';
  spawnArgs = ['esbuild', ...esbuildArgs];
}

const esbuildResult = spawnSync(esbuildCmd, spawnArgs, { stdio: 'inherit', shell: true });
process.exit(esbuildResult.status || 0);
