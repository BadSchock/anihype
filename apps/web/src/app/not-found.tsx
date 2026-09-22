import Link from 'next/link';
import type { Metadata } from 'next';
import { Mascot } from '@/components/brand/mascot';

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center animate-fade-up">
      <p className="text-6xl font-black text-gradient select-none sm:text-7xl">404</p>
      <Mascot size="lg" className="my-4" />
      <h1 className="text-2xl font-bold text-foreground">Ops! Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Esse caminho não existe por aqui. O link pode ter saído do ar ou o endereço está errado.
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
