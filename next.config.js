/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true
  },
  /** Larger payloads for literature imports (platform request limits still apply, e.g. Vercel). */
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
};

module.exports = nextConfig;
