#!/usr/bin/env node
// One-command start for a non-technical user.
// Ensures dependencies and the production build exist, then runs the server.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) {
    console.error(`\nCommand failed: ${cmd} ${args.join(' ')}`);
    process.exit(res.status ?? 1);
  }
}

if (!existsSync('node_modules')) {
  console.log('Installing dependencies (first run only)...');
  run('npm', ['install']);
}

if (!existsSync('dist')) {
  console.log('Building the app...');
  run('npm', ['run', 'build']);
}

run('npx', ['tsx', 'server/index.ts']);