import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center animate-fade-up">
      <p className="mb-4 text-8xl font-black text-gradient select-none">404</p>
      <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        O que você procura não existe aqui. Pode ter sido movido, deletado ou o link está errado.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">
          ← Voltar ao início
        </Link>
        <Link href="/anime" className="btn-ghost">
          Ver animes
        </Link>
      </div>
    </div>
  );
}
