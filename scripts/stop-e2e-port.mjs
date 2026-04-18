import { execFileSync } from 'node:child_process';

const port = Number(process.argv[2] || 4174);

function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

let stoppedPids = [];

for (let attempt = 0; attempt < 8; attempt += 1) {
  let pids = [];

  if (process.platform === 'win32') {
    const output = run('powershell.exe', [
      '-NoProfile',
      '-Command',
      `$ErrorActionPreference='SilentlyContinue'; Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object -ExpandProperty OwningProcess -Unique`
    ]);
    pids = unique(output.split(/\s+/));
    for (const pid of pids) {
      run('powershell.exe', ['-NoProfile', '-Command', `Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`]);
      run('taskkill.exe', ['/PID', pid, '/T', '/F']);
    }
  } else {
    const output = run('sh', ['-c', `lsof -ti tcp:${port} || true`]);
    pids = unique(output.split(/\s+/));
    for (const pid of pids) {
      run('kill', ['-TERM', pid]);
      run('kill', ['-KILL', pid]);
    }
  }

  if (!pids.length) {
    break;
  }

  stoppedPids = unique([...stoppedPids, ...pids]);
}

if (stoppedPids.length) {
  console.log(`Stopped stale process(es) on port ${port}: ${stoppedPids.join(', ')}`);
}
