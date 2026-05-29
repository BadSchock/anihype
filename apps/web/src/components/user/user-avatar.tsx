import Image from 'next/image';
import { cn } from '@anihype/ui';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
} as const;

const PIXEL = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
} as const;

export function UserAvatar({ name, avatarUrl, size = 'md', className }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const sizeClass = SIZE[size];

  if (avatarUrl) {
    return (
      <div
        className={cn(
          'relative flex-shrink-0 overflow-hidden rounded-full bg-purple-500/20 ring-2 ring-purple-500/20',
          sizeClass,
          className,
        )}
      >
        <Image
          src={avatarUrl}
          alt={name}
          fill
          className="object-cover"
          sizes={`${PIXEL[size]}px`}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-full bg-purple-500/30 font-bold text-purple-300 ring-2 ring-purple-500/20',
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}
