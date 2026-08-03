import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(relativeUrl: string) {
  return readFileSync(new URL(relativeUrl, import.meta.url), 'utf8');
}

describe('Phase 1 review boundaries', () => {
  it('keeps patched build dependencies aligned with workspace overrides', () => {
    const webPackage = JSON.parse(
      read('../package.json'),
    ) as typeof import('../package.json');
    const workspace = read('../../../pnpm-workspace.yaml');

    expect(webPackage.devDependencies.postcss).toBe('8.5.25');
    expect(workspace).toMatch(/postcss: 8\.5\.25/);
    expect(workspace).toMatch(/sharp: 0\.35\.3/);
  });

  it('keeps Phase 2 dependencies scoped to the web and local toolchain', () => {
    const rootPackage = JSON.parse(
      read('../../../package.json'),
    ) as typeof import('../../../package.json');
    const webPackage = JSON.parse(
      read('../package.json'),
    ) as typeof import('../package.json');
    const nextConfig = read('../next.config.ts');
    const prettierIgnore = read('../../../.prettierignore');

    expect(rootPackage.scripts).toHaveProperty('test:sql');
    expect(rootPackage.scripts).toHaveProperty('db:start');
    expect(rootPackage.devDependencies).toHaveProperty('supabase');
    expect(webPackage.dependencies).toHaveProperty('@supabase/ssr');
    expect(webPackage.dependencies).toHaveProperty(
      '@civic-reporting/contracts',
    );
    expect(nextConfig).toMatch(/contracts|domain|database-types/);
    expect(nextConfig).not.toContain('data-access');
    expect(prettierIgnore).toContain('packages/database-types');
  });

  it('keeps Phase 1 colors and layout decisions in the shared token system', () => {
    const theme = read('../../../packages/design-tokens/src/theme.css');
    const source = [
      read('../components/public-shell.tsx'),
      read('../components/state-notice.tsx'),
      read('../app/accessibility/page.tsx'),
      read('../app/contact/page.tsx'),
      read('../app/page.tsx'),
      read('../app/platform/page.tsx'),
      read('../app/privacy/page.tsx'),
      read('../app/report/new/page.tsx'),
      read('../app/reports/page.tsx'),
    ].join('\n');

    for (const token of [
      '--color-warning-bg',
      '--color-error-bg',
      '--color-safety-hover',
      '--color-map-empty',
    ]) {
      expect(theme).toContain(token);
    }
    expect(source).not.toMatch(/#f0b92d|#fff8e8|#fff6f6|#e8eee9/i);
    expect(read('../app/page.tsx')).toContain('bg-safety');
    expect(read('../app/report/new/page.tsx')).toContain('max-w-[40rem]');
    expect(read('../app/report/new/page.tsx')).not.toContain('shadow');
  });

  it('keeps static Phase 1 status content semantically quiet', () => {
    expect(read('../app/report/new/page.tsx')).not.toContain(
      '<nav aria-label="Report progress">',
    );
    expect(read('../components/state-notice.tsx')).toContain(
      'aria-labelledby={headingId}',
    );
    expect(read('../components/screen-state-gallery.tsx')).not.toContain(
      'aria-live',
    );
    expect(read('../../../.gitignore')).toContain('*.tsbuildinfo');
  });
});
