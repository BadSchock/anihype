'use client';

import type { RatingAggregate, RatingDimensions } from '@/types/api';

const DIMS: { key: keyof RatingDimensions; label: string; icon: string }[] = [
  { key: 'animation', label: 'Animação', icon: '🎨' },
  { key: 'story',     label: 'Roteiro',  icon: '📖' },
  { key: 'characters',label: 'Personagens', icon: '🎭' },
  { key: 'sound',     label: 'Som',      icon: '🎵' },
  { key: 'hype',      label: 'Hype',     icon: '⚡' },
];

const PENTAGON_KEYS: { key: keyof RatingDimensions; label: string; icon: string }[] = [
  { key: 'animation',  label: 'Animação',    icon: '🎨' },
  { key: 'story',      label: 'Roteiro',     icon: '📖' },
  { key: 'characters', label: 'Personagens', icon: '🎭' },
  { key: 'sound',      label: 'Som',         icon: '🎵' },
  { key: 'hype',       label: 'Hype',        icon: '⚡' },
];

function PentagonChart({ dims }: { dims: RatingDimensions }) {
  const SIZE = 220;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 72;
  const LABEL_R = R + 22;

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

  function labelPoint(index: number) {
    const a = radAngle(index);
    return { x: cx + LABEL_R * Math.cos(a), y: cy + LABEL_R * Math.sin(a) };
  }

  const dataPoints = PENTAGON_KEYS.map((k, i) => dataPoint(i, dims[k.key]));
  const outerPoints = PENTAGON_KEYS.map((_, i) => outerPoint(i));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z';

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="Pentagon Score da comunidade"
    >
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={outerPoints
            .map((p) => `${(cx + (p.x - cx) * scale).toFixed(2)},${(cy + (p.y - cy) * scale).toFixed(2)}`)
            .join(' ')}
          fill="none"
          stroke="rgba(147,51,234,0.12)"
          strokeWidth={scale === 1 ? 1 : 0.6}
        />
      ))}
      {/* Axis lines */}
      {outerPoints.map((p, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={p.x.toFixed(2)} y2={p.y.toFixed(2)}
          stroke="rgba(147,51,234,0.12)"
          strokeWidth={0.6}
        />
      ))}
      {/* Data fill */}
      <path
        d={toPath(dataPoints)}
        fill="rgba(147,51,234,0.20)"
        stroke="rgba(147,51,234,0.9)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Data dot + value */}
      {dataPoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="rgb(147,51,234)" />
          <text
            x={p.x}
            y={p.y - 6}
            textAnchor="middle"
            fontSize={8}
            fontWeight="bold"
            fill="rgb(147,51,234)"
          >
            {dims[PENTAGON_KEYS[i]!.key].toFixed(1)}
          </text>
        </g>
      ))}
      {/* Labels at vertices */}
      {PENTAGON_KEYS.map((dim, i) => {
        const lp = labelPoint(i);
        return (
          <text
            key={dim.key}
            x={lp.x.toFixed(2)}
            y={lp.y.toFixed(2)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="rgba(156,163,175,0.9)"
            fontWeight="500"
          >
            {dim.icon} {dim.label}
          </text>
        );
      })}
    </svg>
  );
}

function getBadgeColor(label: string) {
  const map: Record<string, string> = {
    'Obra-Prima': 'text-yellow-400',
    'Excelente': 'text-orange-400',
    'Recomendado': 'text-blue-400',
    'Ok': 'text-green-400',
    'Decepcionante': 'text-muted-foreground',
  };
  return map[label] ?? 'text-foreground';
}

export function CommunityScore({ aggregate }: { aggregate: RatingAggregate }) {
  if (aggregate.count === 0) {
    return (
      <div className="rounded-xl bg-muted/50 p-5 text-center text-sm text-muted-foreground">
        Ainda não há avaliações. Seja o primeiro a avaliar!
      </div>
    );
  }

  const badge = aggregate.badge;

  return (
    <div className="rounded-xl bg-muted/50 p-5">
      {/* Nota + badge */}
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-5xl font-black text-foreground">{aggregate.average.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">/ 10</span>
        {badge && (
          <span className={`text-base font-bold ${getBadgeColor(badge.label)}`}>
            {badge.emoji} {badge.label}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {aggregate.count} avaliação{aggregate.count !== 1 ? 'ões' : ''}
          {!aggregate.qualifiesForRanking && (
            <span className="ml-1 opacity-60">· 10+ p/ ranking</span>
          )}
        </span>
      </div>

      {/* Pentágono centralizado */}
      <div className="flex justify-center">
        <PentagonChart dims={aggregate.dimensions} />
      </div>

      {/* Barras compactas abaixo */}
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
        {DIMS.map((d) => {
          const val = aggregate.dimensions[d.key];
          return (
            <div key={d.key} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs">{d.icon}</span>
              <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${d.key === 'hype' ? 'bg-purple-500' : 'bg-purple-400/70'}`}
                  style={{ width: `${(val / 10) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-xs font-semibold text-foreground/80">
                {val.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
