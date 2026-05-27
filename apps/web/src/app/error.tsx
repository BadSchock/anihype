'use client';

import Link from 'next/link';
import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[AniHype Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center animate-fade-up">
      <p className="mb-4 text-6xl select-none">💥</p>
      <h1 className="text-2xl font-bold text-white">Algo deu errado</h1>
      <p className="mt-2 max-w-sm text-sm text-white/50">
        Ocorreu um erro inesperado. Nossa equipe foi notificada.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-white/25">ref: {error.digest}</p>
      )}
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn-primary">
          Tentar novamente
        </button>
        <Link href="/" className="btn-ghost">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
