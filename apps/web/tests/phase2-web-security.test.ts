import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(relativeUrl: string) {
  return readFileSync(new URL(relativeUrl, import.meta.url), 'utf8');
}

describe('Phase 2 web security boundary', () => {
  it('enforces every privileged page on the server', () => {
    for (const page of [
      '../app/account/page.tsx',
      '../app/account/drafts/page.tsx',
      '../app/account/security/page.tsx',
      '../app/admin/page.tsx',
      '../app/admin/moderation/page.tsx',
      '../app/admin/organization/page.tsx',
      '../app/platform/page.tsx',
    ]) {
      expect(read(page)).toMatch(/requireRoute/);
    }
  });

  it('ships a session-refresh proxy without treating it as the authorization layer', () => {
    const proxy = read('../proxy.ts');
    expect(proxy).toContain('getClaims');
    expect(proxy).toContain('/sign-in');
    expect(read('../lib/auth/require-route.ts')).toContain('authorizeRoute');
    expect(read('../app/access-denied/page.tsx')).toContain(
      '/account/security?next=',
    );
  });

  it('keeps service credentials out of the web application', () => {
    const webSource = [
      read('../package.json'),
      read('../lib/supabase/config.ts'),
      read('../lib/supabase/browser.ts'),
      read('../lib/supabase/server.ts'),
    ].join('\n');
    expect(webSource).not.toMatch(/service[_-]?role|SUPABASE_SECRET_KEY/i);
  });

  it('sets a restrictive CSP and keeps public media disabled', () => {
    const nextConfig = read('../next.config.ts');
    expect(nextConfig).toContain("object-src 'none'");
    expect(nextConfig).toContain("frame-ancestors 'none'");
    expect(nextConfig).toContain("media-src 'none'");
    expect(nextConfig).toContain('Permissions-Policy');
  });
});
