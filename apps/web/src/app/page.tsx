import { Suspense } from 'react';
import { HeroSection } from './_sections/hero-section';
import { TodaySection } from './_sections/today-section';
import { RecentSection } from './_sections/recent-section';
import { TrendingSection } from './_sections/trending-section';
import { CommunitySection } from './_sections/community-section';
import { FeaturedReviewSection } from './_sections/featured-review-section';
import { HomeSectionsSkeleton } from './_sections/home-sections-skeleton';

export default function HomePage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-10 [&>*]:w-full [&>*]:min-w-0">
      <HeroSection />

      <Suspense fallback={<HomeSectionsSkeleton />}>
        <TodaySection />
        <CommunitySection />
        <FeaturedReviewSection />
        <RecentSection />
        <TrendingSection />
      </Suspense>
    </div>
  );
}
