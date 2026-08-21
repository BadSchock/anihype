/**
 * CORS — aceita lista explícita + pareamento www/apex + domínios *.anihype.com.br.
 *
 * CORS_ORIGIN: um ou vários domínios separados por vírgula.
 * Ex.: https://anihype.com.br,https://www.anihype.com.br
 */

import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const LOCALHOST_ORIGIN_RE =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

const ANIHYPE_ORIGIN_RE =
  /^https?:\/\/(?:[a-z0-9-]+\.)*anihype\.com\.br(?::\d+)?$/i;

export function parseCorsOrigins(raw: string | undefined): string[] {
  const fallback = ['http://localhost:3002'];
  if (!raw?.trim()) return fallback;

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : fallback;
}

function toggleWwwOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    url.hostname = url.hostname.startsWith('www.')
      ? url.hostname.slice(4)
      : `www.${url.hostname}`;
    return url.origin;
  } catch {
    return null;
  }
}

function trustsAnihypeDomain(allowedOrigins: string[]): boolean {
  return allowedOrigins.some((origin) => origin.includes('anihype.com.br'));
}

export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;

  for (const allowed of allowedOrigins) {
    const paired = toggleWwwOrigin(allowed);
    if (paired === origin) return true;
  }

  if (LOCALHOST_ORIGIN_RE.test(origin)) {
    return allowedOrigins.some((allowed) => LOCALHOST_ORIGIN_RE.test(allowed));
  }

  if (trustsAnihypeDomain(allowedOrigins) && ANIHYPE_ORIGIN_RE.test(origin)) {
    return true;
  }

  return false;
}

export function createCorsOriginChecker(allowedOrigins: string[]) {
  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean | string) => void,
  ): void => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (isOriginAllowed(origin, allowedOrigins)) {
      // Ecoa a origin exata — necessário com credentials: true
      callback(null, origin);
      return;
    }

    callback(null, false);
  };
}

export function buildCorsOptions(allowedOrigins: string[]): CorsOptions {
  const methods: string[] = [
    'GET',
    'HEAD',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ];

  return {
    origin: createCorsOriginChecker(allowedOrigins),
    credentials: true,
    methods,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
    maxAge: 86400,
  };
}
