import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { Providers } from '@/providers/providers';
import { Navbar } from '@/components/layout/navbar';
import { MobileNav } from '@/components/layout/mobile-nav';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'AniHype — Anime da Temporada',
    template: '%s | AniHype',
  },
  description:
    'Acompanhe os lançamentos de anime, discuta episódios e viva o hype semanal com a comunidade brasileira.',
  keywords: ['anime', 'temporada', 'lançamentos', 'episódios', 'comunidade', 'brasil'],
  authors: [{ name: 'AniHype' }],
  creator: 'AniHype',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: APP_URL,
    siteName: 'AniHype',
    title: 'AniHype — Anime da Temporada',
    description:
      'Acompanhe os lançamentos de anime, discuta episódios e viva o hype semanal com a comunidade brasileira.',
    images: [
      {
        url: `${APP_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: 'AniHype',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AniHype — Anime da Temporada',
    description: 'Acompanhe lançamentos, discuta episódios e viva o hype semanal.',
    images: [`${APP_URL}/og-default.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-[#0F1115] text-white antialiased selection:bg-purple-500/30 selection:text-purple-100">
        <Providers>
          {/* Skip to content */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-purple-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
          >
            Ir para o conteúdo
          </a>

          <Navbar />

          <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 pb-20 sm:pb-6">
            {children}
          </main>

          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
