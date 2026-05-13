import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@anihype/ui', '@anihype/config', '@anihype/types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 'img.anili.st',
      },
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
