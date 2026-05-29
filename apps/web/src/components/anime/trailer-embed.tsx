'use client';

import { useState } from 'react';

interface Props {
  trailerUrl: string;
  title: string;
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v');
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1);
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export function TrailerEmbed({ trailerUrl, title }: Props) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractYouTubeId(trailerUrl);

  if (!videoId) return null;

  const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const sdThumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold text-foreground">Trailer</h2>
      <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl" style={{ aspectRatio: '16/9' }}>
        {playing ? (
          <iframe
            src={embedUrl}
            title={`Trailer — ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex items-center justify-center"
            aria-label={`Assistir trailer de ${title}`}
          >
            {/* Thumbnail */}
            <img
              src={thumbUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = sdThumbUrl;
              }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/30" />
            {/* Play button */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-xl transition-transform duration-200 group-hover:scale-110 sm:h-20 sm:w-20">
              <svg
                className="ml-1 h-7 w-7 text-white sm:h-9 sm:w-9"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            {/* Label */}
            <span className="absolute bottom-4 left-0 right-0 text-center text-sm font-semibold text-white/80 drop-shadow">
              Assistir trailer
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
