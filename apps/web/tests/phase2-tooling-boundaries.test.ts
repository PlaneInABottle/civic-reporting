import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(relativeUrl: string) {
  return readFileSync(new URL(relativeUrl, import.meta.url), 'utf8');
}

describe('Phase 2 local-only tooling boundaries', () => {
  it('pins the project-local Supabase CLI and explicit local commands', () => {
    const rootPackage = JSON.parse(
      read('../../../package.json'),
    ) as typeof import('../../../package.json');

    expect(rootPackage.devDependencies).toHaveProperty('supabase', '2.111.0');
    expect(rootPackage.scripts).toMatchObject({
      'db:start': 'supabase start',
      'db:stop': 'supabase stop',
      'db:reset:local': 'supabase db reset --local',
      'test:sql': 'supabase test db --local',
      'types:generate': 'node scripts/generate-database-types.mjs',
    });
    expect(Object.values(rootPackage.scripts).join('\n')).not.toMatch(
      /--linked|db push|functions deploy/,
    );
  });

  it('uses an isolated synthetic local project and pasteable OTP template', () => {
    const config = read('../../../supabase/config.toml');
    const template = read('../../../supabase/templates/magic-link.html');

    expect(config).toContain('project_id = "civic-reporting-phase2-local"');
    expect(config).toContain('site_url = "http://127.0.0.1:3010"');
    expect(config).toContain(
      'content_path = "./supabase/templates/magic-link.html"',
    );
    expect(template).toContain('{{ .Token }}');
    expect(template).not.toContain('{{ .ConfirmationURL }}');
  });

  it('never places a service-role credential contract in web source', () => {
    const source = [
      read('../package.json'),
      read('../next.config.ts'),
      read('../playwright.config.ts'),
    ].join('\n');

    expect(source).not.toMatch(/SERVICE_ROLE|service_role/i);
  });
});
