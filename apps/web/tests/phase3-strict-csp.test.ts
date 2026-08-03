import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(relativeUrl: string) {
  return readFileSync(new URL(relativeUrl, import.meta.url), 'utf8');
}

describe('Phase 3 nonce-based strict CSP gate', () => {
  it('creates one unpredictable nonce per request and forwards it to rendering', () => {
    const proxy = read('../proxy.ts');
    expect(proxy).toContain('crypto.randomUUID()');
    expect(proxy).toContain("'strict-dynamic'");
    expect(proxy).toContain("'nonce-${nonce}'");
    expect(proxy).toContain("requestHeaders.set('x-nonce', nonce)");
    expect(proxy).toContain(
      "response.headers.set('Content-Security-Policy', contentSecurityPolicy)",
    );
  });

  it('keeps static security headers in config but removes the unsafe CSP', () => {
    const nextConfig = read('../next.config.ts');
    expect(nextConfig).toContain('Permissions-Policy');
    expect(nextConfig).not.toContain("'unsafe-inline'");
    expect(nextConfig).not.toContain('Content-Security-Policy');
  });

  it('forces request-time rendering so Next can attach the nonce', () => {
    const layout = read('../app/layout.tsx');
    expect(layout).toContain("import { connection } from 'next/server'");
    expect(layout).toContain('await connection()');
  });

  it('never opts public UGC into raw HTML rendering', () => {
    const source = [
      read('../app/reports/page.tsx'),
      read('../app/report/new/page.tsx'),
    ].join('\n');
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });
});
