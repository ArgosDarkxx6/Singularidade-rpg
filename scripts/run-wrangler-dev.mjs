import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['wrangler', 'dev', '--local', '--ip', '127.0.0.1', '--port', '4175'];
const envNames = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];
let temporaryEnvDir = '';

for (const file of ['.env', '.dev.vars']) {
  if (existsSync(file)) {
    args.push('--env-file', file);
  }
}

const runtimeEnv = envNames
  .map((name) => [name, process.env[name]])
  .filter((entry) => typeof entry[1] === 'string' && entry[1].trim());

if (runtimeEnv.length > 0) {
  temporaryEnvDir = mkdtempSync(join(tmpdir(), 'project-nexus-wrangler-'));
  const temporaryEnvFile = join(temporaryEnvDir, '.dev.vars');
  writeFileSync(
    temporaryEnvFile,
    runtimeEnv.map(([name, value]) => `${name}=${String(value).replace(/\r?\n/g, '')}`).join('\n')
  );
  args.push('--env-file', temporaryEnvFile);
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

function cleanup() {
  if (temporaryEnvDir) {
    rmSync(temporaryEnvDir, { recursive: true, force: true });
    temporaryEnvDir = '';
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    cleanup();
    child.kill(signal);
  });
}

child.on('exit', (code, signal) => {
  cleanup();
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
