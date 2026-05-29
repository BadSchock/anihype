'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUserFollowing } from '@/hooks/use-anime-follow';

interface Props {
  username: string;
}

export function FollowingSection({ username }: Props) {
  const { data, isLoading } = useUserFollowing(username);
  const entries = data?.data ?? [];

  if (isLoading) {
    return (
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Seguindo
        </h2>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 w-24 shrink-0 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </section>
    );
  }

  if (entries.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Seguindo
        </h2>
        {data && data.meta.total > entries.length && (
          <span className="text-xs text-muted-foreground">{data.meta.total} animes</span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {entries.map(({ anime }) => {
          const title = anime.titleEnglish ?? anime.titleRomaji;
          return (
            <Link
              key={anime.id}
              href={`/anime/${anime.slug}`}
              className="group relative w-24 shrink-0 sm:w-28"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border transition-transform group-hover:scale-[1.02]">
                {anime.coverImageUrl ? (
                  <Image
                    src={anime.coverImageUrl}
                    alt={title}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                <p className="absolute bottom-0 left-0 right-0 line-clamp-2 p-2 text-[10px] font-semibold leading-tight text-white">
                  {title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
