'use client';

import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Clapperboard, Music2, Users, Zap } from 'lucide-react';
import type { MyRating, RatingDimensions } from '@/types/api';
import { useUpsertRating, useDeleteRating } from '@/hooks/use-ratings';

const DIMENSIONS: {
  key: keyof RatingDimensions;
  label: string;
  Icon: LucideIcon;
  description: string;
}[] = [
  { key: 'animation', label: 'Animação', Icon: Clapperboard, description: 'Visual, fluidez, direção de arte' },
  { key: 'story', label: 'Roteiro', Icon: BookOpen, description: 'História, ritmo, coerência' },
  { key: 'characters', label: 'Personagens', Icon: Users, description: 'Desenvolvimento e carisma' },
  { key: 'sound', label: 'Som & Música', Icon: Music2, description: 'OST, abertura, encerramento, vozes' },
  { key: 'hype', label: 'Hype', Icon: Zap, description: 'Diversão, vício e vontade de continuar' },
];

function computeFinalScore(scores: RatingDimensions) {
  return (scores.animation + scores.story + scores.characters + scores.sound + scores.hype * 2) / 6;
}

function getBadge(score: number) {
  if (score >= 9.0) return { label: 'Obra-Prima', emoji: '👑', color: 'text-yellow-400' };
  if (score >= 8.0) return { label: 'Excelente', emoji: '🔥', color: 'text-orange-400' };
  if (score >= 7.0) return { label: 'Recomendado', emoji: '⭐', color: 'text-blue-400' };
  if (score >= 5.0) return { label: 'Ok', emoji: '👍', color: 'text-green-400' };
  return { label: 'Decepcionante', emoji: '💤', color: 'text-muted-foreground' };
}

function ScoreSlider({
  label,
  Icon,
  description,
  value,
  onChange,
}: {
  label: string;
  Icon: LucideIcon;
  description: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-3 sm:items-center">
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            {label}
          </span>
          <span className="mt-0.5 block pl-10 text-xs text-muted-foreground">{description}</span>
        </span>
        <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums text-primary">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-primary"
        aria-label={label}
      />
      <div className="mt-0.5 flex justify-between px-0.5 text-[10px] text-muted-foreground/60">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <span
            key={n}
            className={n <= value ? 'font-semibold text-primary' : ''}
            style={{ width: '10%', textAlign: 'center' }}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

interface RatingFormProps {
  slug: string;
  myRating: MyRating | null | undefined;
  onClose?: () => void;
}

export function RatingForm({ slug, myRating, onClose }: RatingFormProps) {
  const [scores, setScores] = useState<RatingDimensions>({
    animation: myRating?.animation ?? 7,
    story:     myRating?.story     ?? 7,
    characters:myRating?.characters?? 7,
    sound:     myRating?.sound     ?? 7,
    hype:      myRating?.hype      ?? 7,
  });
  const [reviewText, setReviewText] = useState(myRating?.reviewText ?? '');
  const [containsSpoiler, setContainsSpoiler] = useState(myRating?.containsSpoiler ?? false);
  const [showReview, setShowReview] = useState(!!myRating?.reviewText);
  const [formError, setFormError] = useState<string | null>(null);
  const [censorNotice, setCensorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (myRating) {
      setScores({
        animation: myRating.animation,
        story: myRating.story,
        characters: myRating.characters,
        sound: myRating.sound,
        hype: myRating.hype,
      });
      setReviewText(myRating.reviewText ?? '');
      setContainsSpoiler(myRating.containsSpoiler);
      setShowReview(!!myRating.reviewText);
    }
  }, [myRating]);

  const upsert = useUpsertRating(slug);
  const remove = useDeleteRating(slug);

  const finalScore = computeFinalScore(scores);
  const badge = getBadge(finalScore);

  function setScore(key: keyof RatingDimensions, val: number) {
    setScores((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit() {
    setFormError(null);
    setCensorNotice(null);
    try {
      const result = await upsert.mutateAsync({
        ...scores,
        reviewText: reviewText.trim() || undefined,
        containsSpoiler,
      });
      if (result.contentCensored) {
        setCensorNotice('Algumas palavras foram censuradas na sua review.');
        if (result.reviewText) setReviewText(result.reviewText);
        window.setTimeout(() => onClose?.(), 1200);
      } else {
        onClose?.();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível salvar a avaliação.');
    }
  }

  async function handleDelete() {
    setFormError(null);
    try {
      await remove.mutateAsync();
      onClose?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível remover a avaliação.');
    }
  }

  const isLoading = upsert.isPending || remove.isPending;

  return (
    <div className="flex flex-col gap-5">
      {/* Nota final preview */}
      <div className="flex items-center justify-between rounded-xl bg-purple-500/10 px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Hypômetro</p>
          <p className="text-3xl font-black text-foreground">{finalScore.toFixed(1)}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${badge.color}`}>{badge.emoji} {badge.label}</p>
          <p className="text-xs text-muted-foreground">⚡ Hype tem peso duplo</p>
        </div>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-4">
        {DIMENSIONS.map((d) => (
          <ScoreSlider
            key={d.key}
            label={d.label}
            Icon={d.Icon}
            description={d.description}
            value={scores[d.key]}
            onChange={(v) => setScore(d.key, v)}
          />
        ))}
      </div>

      {/* Review opcional */}
      <div>
        <button
          onClick={() => setShowReview((v) => !v)}
          className="text-xs text-purple-400 hover:underline"
        >
          {showReview ? '− Esconder review' : '+ Escrever review (opcional)'}
        </button>
        {showReview && (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={3000}
              rows={4}
              placeholder="Compartilhe sua opinião sobre esse anime..."
              className="w-full rounded-xl bg-muted p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={containsSpoiler}
                  onChange={(e) => setContainsSpoiler(e.target.checked)}
                  className="rounded"
                />
                Contém spoiler
              </label>
              <span className="text-xs text-muted-foreground">{reviewText.length}/3000</span>
            </div>
          </div>
        )}
      </div>

      {censorNotice && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">{censorNotice}</p>
      )}

      {/* Ações */}
      {formError && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{formError}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Salvando...' : myRating ? 'Atualizar Hypômetro' : 'Avaliar no Hypômetro'}
        </button>
        {myRating && (
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="rounded-xl border border-red-500/30 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Remover
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
