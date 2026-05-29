import type { StreamingLink } from '@/types/api';

const PLATFORM_COLORS: Record<string, string> = {
  crunchyroll: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  netflix: 'bg-red-500/15 text-red-300 border-red-500/30',
  'amazon-prime-video': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'disney-plus': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'hbo-max': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  funimation: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
};

function platformStyle(slug: string) {
  return PLATFORM_COLORS[slug] ?? 'bg-muted text-foreground border-border';
}

interface Props {
  links: StreamingLink[];
  compact?: boolean;
}

export function WhereToWatch({ links, compact = false }: Props) {
  if (links.length === 0) return null;

  return (
    <section className={compact ? '' : 'mt-8'}>
      {!compact && (
        <h2 className="mb-3 text-lg font-bold text-foreground">Onde assistir</h2>
      )}
      <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-1'}`}>
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80 ${platformStyle(link.platform.slug)}`}
          >
            <span>{link.platform.name}</span>
            {link.regionCode && (
              <span className="text-[10px] opacity-70">{link.regionCode}</span>
            )}
            <span aria-hidden className="text-xs opacity-60">↗</span>
          </a>
        ))}
      </div>
      {!compact && (
        <p className="mt-2 text-xs text-muted-foreground">
          Links fornecidos pelo AniList ou curados pela equipe AniHype.
        </p>
      )}
    </section>
  );
}
