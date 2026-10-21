import type { NextConfig } from 'next';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';
const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3002';

function getApiOrigin(): string {
  try {
    return new URL(API_URL).origin;
  } catch {
    return 'http://localhost:3001';
  }
}

function getWebOrigin(): string {
  try {
    return new URL(APP_URL).origin;
  } catch {
    return 'http://localhost:3002';
  }
}

const API_ORIGIN = getApiOrigin();
const WEB_ORIGIN = getWebOrigin();

function getApiImagePattern(): { protocol: 'http' | 'https'; hostname: string } | null {
  try {
    const url = new URL(API_URL);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return {
      protocol: url.protocol === 'https:' ? 'https' : 'http',
      hostname: url.hostname,
    };
  } catch {
    return null;
  }
}

const API_IMAGE_PATTERN = getApiImagePattern();

const isDev = process.env.NODE_ENV === 'development';

/** CSP mais permissiva em dev (HMR, fonts, YouTube trailer). Produção mantém regras estritas. */
function buildCsp(): string {
  const connectSrc = isDev
    ? `'self' ${API_ORIGIN} ${WEB_ORIGIN} ws://${new URL(WEB_ORIGIN).host} wss://${new URL(WEB_ORIGIN).host}`
    : `'self' ${API_ORIGIN}`;

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src 'self' data: blob: ${API_ORIGIN} https://s4.anilist.co https://img.anili.st https://cdn.myanimelist.net https://media.kitsu.app https://img.youtube.com https://i.ytimg.com`,
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
    "frame-ancestors 'none'",
  ].join('; ');
}

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: buildCsp() },
];

const nextConfig: NextConfig = {
  transpilePackages: ['@anihype/ui', '@anihype/config', '@anihype/types'],

  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 dias
    remotePatterns: [
      ...(API_IMAGE_PATTERN ? [API_IMAGE_PATTERN] : []),
      { protocol: 'https', hostname: 's4.anilist.co' },
      { protocol: 'https', hostname: 'img.anili.st' },
      { protocol: 'https', hostname: 'cdn.myanimelist.net' },
      { protocol: 'https', hostname: 'media.kitsu.app' },
      { protocol: 'https', hostname: '**.anidb.net' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Cache de assets estáticos por 1 ano
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Cache de imagens otimizadas por 1 semana
        source: '/_next/image(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ];
  },

  async redirects() {
    return [
      // Canonical: remover trailing slash
      {
        source: '/:path+/',
        destination: '/:path+',
        permanent: true,
      },
    ];
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  poweredByHeader: false,
};

export default nextConfig;
