/**
 * Parse CORS_ORIGIN — aceita um ou vários domínios separados por vírgula.
 * Ex.: https://anihype.com.br,https://www.anihype.com.br
 */
export function parseCorsOrigins(raw: string | undefined): string[] {
  const fallback = ['http://localhost:3002'];
  if (!raw?.trim()) return fallback;

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : fallback;
}

export function createCorsOriginChecker(allowedOrigins: string[]) {
  const allowed = new Set(allowedOrigins);

  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ): void => {
    // Requisições sem Origin (curl, health checks, SSR interno)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowed.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  };
}
