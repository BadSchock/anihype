/** Monta URL de login com retorno seguro para a página atual */
export function buildLoginUrl(returnPath?: string): string {
  if (!returnPath || !isSafeReturnPath(returnPath)) {
    return '/login';
  }
  return `/login?returnUrl=${encodeURIComponent(returnPath)}`;
}

/** Valida e normaliza returnUrl vindo da query string */
export function getSafeReturnUrl(returnUrl: string | null | undefined): string {
  if (!returnUrl || !isSafeReturnPath(returnUrl)) {
    return '/';
  }
  return returnUrl;
}

function isSafeReturnPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  if (path.startsWith('/login') || path.startsWith('/register')) return false;
  return true;
}
