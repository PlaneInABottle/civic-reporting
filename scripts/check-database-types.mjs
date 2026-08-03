import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const generated = spawnSync(
  'pnpm',
  [
    'exec',
    'supabase',
    'gen',
    'types',
    'typescript',
    '--local',
    '--schema',
    'public',
  ],
  { cwd: process.cwd(), encoding: 'utf8' },
);

if (generated.status !== 0) {
  process.stderr.write(generated.stderr);
  process.exit(generated.status ?? 1);
}

const checkedIn = readFileSync(
  new URL('../packages/database-types/src/database.ts', import.meta.url),
  'utf8',
);

const normalized = generated.stdout.replace(/\s+$/u, '\n');

if (checkedIn !== normalized) {
  process.stderr.write(
    'Generated database types have drifted. Run `pnpm types:generate` against the disposable local stack.\n',
  );
  process.exit(1);
}

process.stdout.write('Generated database types match the local schema.\n');
