import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(__dirname),
  generateBuildId: async () => 'auto-sticker-pwa-qc-20260505',
};

export default nextConfig;
