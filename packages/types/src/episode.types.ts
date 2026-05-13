export type EpisodeStatus = 'AIRED' | 'UPCOMING' | 'UNKNOWN';

export interface Episode {
  id: number;
  animeId: number;
  slug: string;
  number: number;
  title: string | null;
  thumbnailUrl: string | null;
  airDate: string | null;
  duration: number | null;
  status: EpisodeStatus;
  anime: {
    id: number;
    slug: string;
    titleRomaji: string;
    titleEnglish: string | null;
    coverImageUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeSchedule {
  date: string;
  episodes: Episode[];
}

export interface WeeklyCalendar {
  monday: Episode[];
  tuesday: Episode[];
  wednesday: Episode[];
  thursday: Episode[];
  friday: Episode[];
  saturday: Episode[];
  sunday: Episode[];
}
