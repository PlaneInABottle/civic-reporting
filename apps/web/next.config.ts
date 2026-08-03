import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@civic-reporting/design-tokens'],
};

export default nextConfig;
