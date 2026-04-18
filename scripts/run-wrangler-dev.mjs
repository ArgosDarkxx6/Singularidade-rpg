import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['wrangler', 'dev', '--local', '--ip', '127.0.0.1', '--port', '4175'];

for (const file of ['.env', '.dev.vars']) {
  if (existsSync(file)) {
    args.push('--env-file', file);
  }
}

const command = process.platform === 'win32' ? 'cmd.exe' : npx;
const commandArgs =
  process.platform === 'win32'
    ? ['/d', '/s', '/c', [npx, ...args].join(' ')]
    : args;

const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  env: process.env
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
