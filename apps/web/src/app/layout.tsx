import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Providers } from '@/providers/providers';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'AniHype — Sua plataforma de anime',
    template: '%s | AniHype',
  },
  description:
    'Acompanhe os lançamentos de anime, discuta episódios e conecte-se com a comunidade.',
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AniHype',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-[#0F1115] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
