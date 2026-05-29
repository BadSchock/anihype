/**
 * Libera uma porta local antes de subir o dev server.
 * Uso: node scripts/kill-port.mjs 3002
 */
import { execSync } from 'node:child_process';

const port = Number(process.argv[2] ?? 3002);
if (!Number.isFinite(port)) process.exit(0);

function killWindows() {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts.at(-1);
      if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`Porta ${port}: processo ${pid} encerrado`);
      } catch {
        /* já morreu */
      }
    }
  } catch {
    /* porta livre */
  }
}

function killUnix() {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { shell: true, stdio: 'ignore' });
  } catch {
    /* porta livre */
  }
}

if (process.platform === 'win32') killWindows();
else killUnix();
