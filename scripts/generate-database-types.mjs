import { writeFileSync } from 'node:fs';
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

writeFileSync(
  new URL('../packages/database-types/src/database.ts', import.meta.url),
  generated.stdout.replace(/\s+$/u, '\n'),
);
process.stdout.write('Generated database types from the local schema.\n');
