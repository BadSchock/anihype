'use client';

import type { RatingAggregate, RatingDimensions } from '@/types/api';

const DIMS: { key: keyof RatingDimensions; label: string; icon: string }[] = [
  { key: 'animation', label: 'Animação', icon: '🎨' },
  { key: 'story',     label: 'Roteiro',  icon: '📖' },
  { key: 'characters',label: 'Personagens', icon: '🎭' },
  { key: 'sound',     label: 'Som',      icon: '🎵' },
  { key: 'hype',      label: 'Hype',     icon: '⚡' },
];

function PentagonChart({ dims }: { dims: RatingDimensions }) {
  const SIZE = 120;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 48;

  // 5 pontos distribuídos a cada 72° começando do topo
  function point(index: number, value: number) {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const r = (value / 10) * R;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function outerPoint(index: number) {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    return {
      x: cx + R * Math.cos(angle),
      y: cy + R * Math.sin(angle),
    };
  }

  const keys: (keyof RatingDimensions)[] = ['animation', 'story', 'characters', 'sound', 'hype'];
  const dataPoints = keys.map((k, i) => point(i, dims[k]));
  const outerPoints = keys.map((_, i) => outerPoint(i));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={outerPoints.map((p) => `${(cx + (p.x - cx) * scale).toFixed(1)},${(cy + (p.y - cy) * scale).toFixed(1)}`).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={0.5}
          className="text-muted-foreground"
        />
      ))}
      {/* Grid lines from center */}
      {outerPoints.map((p, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={p.x.toFixed(1)} y2={p.y.toFixed(1)}
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={0.5}
          className="text-muted-foreground"
        />
      ))}
      {/* Data area */}
      <path
        d={toPath(dataPoints)}
        fill="rgb(147 51 234 / 0.25)"
        stroke="rgb(147 51 234)"
        strokeWidth={1.5}
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="rgb(147 51 234)" />
      ))}
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
      <div className="flex items-start gap-5">
        {/* Pentágono */}
        <div className="shrink-0">
          <PentagonChart dims={aggregate.dimensions} />
        </div>

        {/* Dados */}
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-foreground">{aggregate.average.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">/ 10</span>
            {badge && (
              <span className={`text-sm font-semibold ${getBadgeColor(badge.label)}`}>
                {badge.emoji} {badge.label}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {aggregate.count} avaliação{aggregate.count !== 1 ? 'ões' : ''}
            {!aggregate.qualifiesForRanking && (
              <span className="ml-1 opacity-60">
                · precisa de 10+ para entrar no ranking
              </span>
            )}
          </p>

          {/* Barras por dimensão */}
          <div className="flex flex-col gap-1.5">
            {DIMS.map((d) => {
              const val = aggregate.dimensions[d.key];
              return (
                <div key={d.key} className="flex items-center gap-2">
                  <span className="w-24 text-xs text-muted-foreground">{d.icon} {d.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${d.key === 'hype' ? 'bg-purple-500' : 'bg-purple-400/70'}`}
                      style={{ width: `${(val / 10) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-medium text-foreground">{val.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
