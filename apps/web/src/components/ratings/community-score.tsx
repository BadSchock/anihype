'use client';

import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Clapperboard,
  Music2,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import type { RatingAggregate, RatingDimensions } from '@/types/api';

const DIMS: {
  key: keyof RatingDimensions;
  label: string;
  Icon: LucideIcon;
}[] = [
  { key: 'animation', label: 'Animação', Icon: Clapperboard },
  { key: 'story', label: 'Roteiro', Icon: BookOpen },
  { key: 'characters', label: 'Personagens', Icon: Users },
  { key: 'sound', label: 'Som', Icon: Music2 },
  { key: 'hype', label: 'Hype', Icon: Zap },
];

function PentagonChart({ dims }: { dims: RatingDimensions }) {
  const SIZE = 280;
  const PAD = 32;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = SIZE / 2 - PAD;

  function radAngle(index: number) {
    return (index * 72 - 90) * (Math.PI / 180);
  }

  function dataPoint(index: number, value: number) {
    const a = radAngle(index);
    const r = (value / 10) * R;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function outerPoint(index: number) {
    const a = radAngle(index);
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  }

  /** HTML chips outside the SVG — labels never clip on light/dark */
  function labelStyle(index: number): CSSProperties {
    const a = radAngle(index);
    const lr = R + 18;
    const x = cx + lr * Math.cos(a);
    const y = cy + lr * Math.sin(a);
    const left = (x / SIZE) * 100;
    const top = (y / SIZE) * 100;
    const cos = Math.cos(a);
    const sin = Math.sin(a);

    let transform = 'translate(-50%, -50%)';
    if (sin < -0.7) transform = 'translate(-50%, -100%)';
    else if (sin > 0.55) transform = 'translate(-50%, 0%)';
    else if (cos > 0.35) transform = 'translate(0%, -50%)';
    else if (cos < -0.35) transform = 'translate(-100%, -50%)';

    return { left: `${left}%`, top: `${top}%`, transform };
  }

  const dataPoints = DIMS.map((d, i) => dataPoint(i, dims[d.key]));
  const outerPoints = DIMS.map((_, i) => outerPoint(i));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z';

  const uid = 'hypo';

  return (
    <div className="relative mx-auto w-full max-w-[20rem] p-8">
      <div className="relative aspect-square w-full">
        {DIMS.map((dim, i) => {
          const Icon = dim.Icon;
          return (
            <div
              key={dim.key}
              className="pointer-events-none absolute z-10 flex items-center gap-1 whitespace-nowrap rounded-full border border-border bg-background/95 px-2 py-0.5 text-[0.6875rem] font-semibold text-foreground/80 shadow-sm backdrop-blur-sm"
              style={labelStyle(i)}
            >
              <Icon className="h-3 w-3 shrink-0 text-primary" aria-hidden />
              {dim.label}
            </div>
          );
        })}

        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Hypômetro da comunidade"
          className="overflow-visible"
        >
          <defs>
            <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Web / grid — gray for light-theme contrast */}
          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <polygon
              key={scale}
              points={outerPoints
                .map(
                  (p) =>
                    `${(cx + (p.x - cx) * scale).toFixed(2)},${(cy + (p.y - cy) * scale).toFixed(2)}`,
                )
                .join(' ')}
              fill="none"
              stroke="hsl(var(--foreground) / 0.14)"
              strokeWidth={scale === 1 ? 1.35 : 1}
            />
          ))}

          {outerPoints.map((p, i) => (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x.toFixed(2)}
              y2={p.y.toFixed(2)}
              stroke="hsl(var(--foreground) / 0.12)"
              strokeWidth={1}
            />
          ))}

          {/* Score polygon — solid primary ~30% + strong stroke */}
          <path
            d={toPath(dataPoints)}
            fill="hsl(var(--primary) / 0.28)"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            strokeLinejoin="round"
            filter={`url(#${uid}-glow)`}
          />

          {dataPoints.map((p, i) => {
            const a = radAngle(i);
            // Further out + halo so scores stay readable on dark/light
            const labelX = p.x + Math.cos(a) * 20;
            const labelY = p.y + Math.sin(a) * 20;
            const score = dims[DIMS[i]!.key].toFixed(1);
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={5.5} fill="hsl(var(--background))" />
                <circle cx={p.x} cy={p.y} r={3.75} fill="hsl(var(--primary))" />
                {/* Halo: stroke background behind text for contrast on purple fill */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={12}
                  fontWeight="700"
                  stroke="hsl(var(--background))"
                  strokeWidth={4}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  fill="hsl(var(--foreground))"
                >
                  {score}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function getBadgeColor(label: string) {
  const map: Record<string, string> = {
    'Obra-Prima': 'text-yellow-600 dark:text-yellow-400',
    Excelente: 'text-orange-600 dark:text-orange-400',
    Recomendado: 'text-blue-700 dark:text-blue-400',
    Ok: 'text-green-700 dark:text-green-400',
    Decepcionante: 'text-muted-foreground',
  };
  return map[label] ?? 'text-foreground';
}

export function CommunityScore({ aggregate }: { aggregate: RatingAggregate }) {
  if (aggregate.count === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-8 text-center">
        <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary/70" />
        <p className="text-sm font-medium text-foreground">
          Ainda não há notas no Hypômetro
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Seja o primeiro a medir o hype deste anime.
        </p>
      </div>
    );
  }

  const badge = aggregate.badge;

  return (
    <div className="relative rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-background to-muted/50 p-5 shadow-sm sm:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Hypômetro da comunidade
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">
              {aggregate.average.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">/ 10</span>
            {badge && (
              <span className={`text-base font-bold ${getBadgeColor(badge.label)}`}>
                {badge.emoji} {badge.label}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {aggregate.count} avaliação{aggregate.count !== 1 ? 'ões' : ''}
          {!aggregate.qualifiesForRanking && (
            <span className="ml-1 opacity-70">· 10+ p/ ranking</span>
          )}
        </p>
      </div>

      <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-6">
        <PentagonChart dims={aggregate.dimensions} />

        <div className="flex flex-col justify-center gap-2">
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Atributos
          </p>
          {DIMS.map((d) => {
            const val = aggregate.dimensions[d.key];
            const Icon = d.Icon;
            return (
              <div
                key={d.key}
                className="group grid grid-cols-[auto_1fr_2.75rem] items-center gap-3 rounded-xl border border-border/60 bg-background/70 px-2.5 py-2.5 shadow-sm transition-all hover:border-primary/25 hover:bg-background hover:shadow-md"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/10">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">
                    {d.label}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/75 to-primary transition-[width] duration-500"
                      style={{ width: `${(val / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-right text-sm font-bold tabular-nums text-primary">
                  {val.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
