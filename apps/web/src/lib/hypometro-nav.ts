const FOCUS_KEY = 'anihype:focus-hypometro';

/** Marca intenção de focar a seção Hypômetro após navegar (Next ignora #hash). */
export function markHypometroFocus() {
  try {
    sessionStorage.setItem(FOCUS_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function consumeHypometroFocus(): boolean {
  try {
    if (sessionStorage.getItem(FOCUS_KEY) === '1') {
      sessionStorage.removeItem(FOCUS_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function scrollToHypometro() {
  const el = document.getElementById('hypometro');
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}
