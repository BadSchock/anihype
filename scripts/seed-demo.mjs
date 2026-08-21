import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'api');

const result = spawnSync('npx', ['prisma', 'db', 'seed'], {
  cwd: apiDir,
  stdio: 'inherit',
  env: { ...process.env, SEED_DEMO_ONLY: '1' },
  shell: true,
});

process.exit(result.status ?? 1);
