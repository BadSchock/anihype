import type { MetadataRoute } from 'next';

const BASE = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

interface AnimeEntry {
  slug: string;
  updatedAt: string;
}

interface PaginatedAnime {
  data: AnimeEntry[];
  meta: { totalPages: number };
}

async function fetchAllAnimeSlugs(): Promise<AnimeEntry[]> {
  try {
    const all: AnimeEntry[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= 10) {
      const res = await fetch(`${API}/anime?page=${page}&limit=100&orderBy=recent`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const json = (await res.json()) as { data?: PaginatedAnime };
      const body = json.data ?? (json as unknown as PaginatedAnime);
      all.push(...body.data);
      totalPages = body.meta.totalPages;
      page++;
    }

    return all;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const animes = await fetchAllAnimeSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/anime`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  const animeRoutes: MetadataRoute.Sitemap = animes.map((a) => ({
    url: `${BASE}/anime/${a.slug}`,
    lastModified: new Date(a.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...animeRoutes];
}
