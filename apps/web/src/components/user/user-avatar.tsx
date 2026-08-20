import Image from 'next/image';
import type { CSSProperties } from 'react';
import { cn } from '@anihype/ui';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Optional profile frame color (CSS color). Uses ring + ring-offset. */
  frameColor?: string | null;
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

export function UserAvatar({
  name,
  avatarUrl,
  size = 'md',
  className,
  frameColor,
}: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const sizeClass = SIZE[size];
  const hasFrame = Boolean(frameColor);

  const ringClass = hasFrame
    ? 'ring-4 ring-offset-2 ring-offset-background'
    : 'ring-2 ring-purple-500/20';

  const ringStyle: CSSProperties | undefined = hasFrame
    ? { ['--tw-ring-color' as string]: frameColor! }
    : undefined;

  if (avatarUrl) {
    return (
      <div
        className={cn(
          'relative flex-shrink-0 overflow-hidden rounded-full bg-purple-500/20',
          ringClass,
          sizeClass,
          className,
        )}
        style={ringStyle}
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
        'flex flex-shrink-0 items-center justify-center rounded-full bg-purple-500/30 font-bold text-purple-300',
        ringClass,
        sizeClass,
        className,
      )}
      style={ringStyle}
      aria-hidden
    >
      {initial}
    </div>
  );
}
