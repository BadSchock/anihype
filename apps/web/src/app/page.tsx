import { Suspense } from 'react';
import { TodaySection } from './_sections/today-section';
import { CalendarSection } from './_sections/calendar-section';
import { TrendingSection } from './_sections/trending-section';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <section className="relative -mx-4 -mt-6 overflow-hidden sm:-mx-6">
        <div className="bg-gradient-to-br from-purple-900/40 via-[#0F1115] to-[#0F1115] px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Viva o hype da{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                temporada
              </span>
            </h1>
            <p className="mt-4 text-lg text-white/60">
              Acompanhe lançamentos, discuta episódios e conecte-se com a comunidade brasileira de anime.
            </p>
          </div>
        </div>
      </section>

      {/* Lançamentos de hoje */}
      <Suspense fallback={null}>
        <TodaySection />
      </Suspense>

      {/* Calendário semanal */}
      <Suspense fallback={null}>
        <CalendarSection />
      </Suspense>

      {/* Trending */}
      <Suspense fallback={null}>
        <TrendingSection />
      </Suspense>
    </div>
  );
}
