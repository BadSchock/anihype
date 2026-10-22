import { cn } from '@anihype/ui';
import { resolveProfileBanner, type ProfileBannerId } from '@/lib/profile-banners';

interface Props {
  bannerId?: string | null;
  /** header: faixa do perfil. thumb: miniatura da galeria. */
  variant?: 'header' | 'thumb';
  className?: string;
}

export function ProfileBanner({ bannerId, variant = 'header', className }: Props) {
  const id: ProfileBannerId = resolveProfileBanner(bannerId);

  return (
    <div className={cn('relative overflow-hidden', className)} aria-hidden>
      {id === 'original' && <OriginalBanner variant={variant} />}
      {id === 'neon' && <NeonBanner variant={variant} />}
      {id === 'cosmic' && <CosmicBanner variant={variant} />}
    </div>
  );
}

function OriginalBanner({ variant }: { variant: 'header' | 'thumb' }) {
  if (variant === 'thumb') {
    return <div className="absolute inset-0 bg-gradient-to-br from-violet-800 via-purple-600 to-fuchsia-500" />;
  }

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-purple-900/20 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.25),transparent_55%)]" />
    </>
  );
}

function NeonBanner({ variant }: { variant: 'header' | 'thumb' }) {
  const strong = variant === 'thumb';

  return (
    <>
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r',
          strong
            ? 'from-violet-950 via-purple-700 to-fuchsia-500'
            : 'from-violet-950/80 via-purple-700/35 to-background',
        )}
      />
      <div
        className={cn(
          'absolute -right-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full blur-2xl',
          strong ? 'bg-fuchsia-400/70' : 'bg-fuchsia-500/25',
        )}
      />
      <div
        className={cn(
          'absolute left-8 top-3 h-10 w-10 rounded-full blur-xl',
          strong ? 'bg-violet-300/50' : 'bg-violet-300/20',
        )}
      />
      <div className="absolute inset-y-3 left-[18%] w-px rotate-[18deg] bg-white/15" />
    </>
  );
}

function CosmicBanner({ variant }: { variant: 'header' | 'thumb' }) {
  const strong = variant === 'thumb';

  return (
    <>
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r',
          strong
            ? 'from-slate-950 via-indigo-800 to-sky-500'
            : 'from-slate-950/75 via-indigo-800/40 to-background',
        )}
      />
      <div className="absolute left-[22%] top-3 h-1 w-1 rounded-full bg-white/80" />
      <div className="absolute left-[38%] top-8 h-0.5 w-0.5 rounded-full bg-white/70" />
      <div className="absolute right-[30%] top-4 h-1 w-1 rounded-full bg-white/75" />
      <div className="absolute right-[18%] bottom-4 h-0.5 w-0.5 rounded-full bg-sky-100/80" />
      <div
        className={cn(
          'absolute -left-4 bottom-0 h-16 w-16 rounded-full blur-2xl',
          strong ? 'bg-indigo-400/50' : 'bg-indigo-400/20',
        )}
      />
    </>
  );
}
