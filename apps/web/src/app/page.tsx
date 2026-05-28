import { Suspense } from 'react';
import { TodaySection } from './_sections/today-section';
import { RecentSection } from './_sections/recent-section';
import { TrendingSection } from './_sections/trending-section';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="relative -mx-4 -mt-6 overflow-hidden sm:-mx-6">
        <div className="bg-gradient-to-br from-purple-100/80 via-background to-background px-4 py-14 dark:from-purple-900/40 dark:via-background sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Viva o hype da{' '}
              <span className="text-gradient">temporada</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Acompanhe lançamentos, discuta episódios e conecte-se com a comunidade brasileira de anime.
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <TodaySection />
      </Suspense>

      <Suspense fallback={null}>
        <RecentSection />
      </Suspense>

      <Suspense fallback={null}>
        <TrendingSection />
      </Suspense>
    </div>
  );
}
