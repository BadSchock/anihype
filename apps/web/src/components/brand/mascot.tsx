import Image from 'next/image';
import { cn } from '@anihype/ui';

/**
 * O PNG oficial é 2000×2000. A personagem opaca fica em
 * x 312–1692 e y 456–1548 (~69% da largura, ~55% da altura).
 * A caixa abaixo tem a proporção desse recorte. A imagem é
 * ampliada e deslocada só aqui, para a margem transparente
 * sair do quadro sem afetar o Hero.
 */
const FRAME_TOP = '-41.76%';

const SIZE_CLASS = {
  sm: 'h-[72px] sm:h-20 lg:h-[88px]',
  md: 'h-24 sm:h-28 lg:h-[120px]',
  lg: 'h-40 sm:h-[190px] lg:h-[210px]',
} as const;

type MascotSize = keyof typeof SIZE_CLASS;

interface MascotProps {
  src?: string;
  size?: MascotSize;
  className?: string;
}

export function Mascot({
  src = '/mascote-anihype.png',
  size = 'sm',
  className,
}: MascotProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative mx-auto aspect-[1380/1092] max-w-full overflow-hidden',
        SIZE_CLASS[size],
        className,
      )}
    >
      <Image
        src={src}
        alt=""
        width={2000}
        height={2000}
        sizes={size === 'lg' ? '280px' : size === 'md' ? '160px' : '120px'}
        priority={size !== 'sm'}
        className="pointer-events-none absolute left-1/2 h-[183.15%] w-auto max-w-none -translate-x-1/2 select-none"
        style={{ top: FRAME_TOP }}
      />
    </div>
  );
}
