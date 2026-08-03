import type { NextConfig } from 'next';

const supabaseOrigin = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
    ).origin;
  } catch {
    return 'http://127.0.0.1:54321';
  }
})();

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "media-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${supabaseOrigin}`,
  "worker-src 'self' blob:",
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: [
    '@civic-reporting/contracts',
    '@civic-reporting/database-types',
    '@civic-reporting/design-tokens',
    '@civic-reporting/domain',
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
