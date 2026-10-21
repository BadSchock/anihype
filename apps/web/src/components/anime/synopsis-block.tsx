import { formatSynopsis } from '@/lib/format-synopsis';

interface Props {
  synopsis: string | null | undefined;
  title?: string | null;
  className?: string;
}

export function SynopsisBlock({ synopsis, title = 'Sinopse', className }: Props) {
  const formatted = formatSynopsis(synopsis);
  if (!formatted) return null;

  const paragraphs = formatted.text.split(/\n{2,}/);

  return (
    <section className={className}>
      {title ? <h2 className="mb-3 text-lg font-bold text-foreground">{title}</h2> : null}
      <div className="space-y-3 text-sm leading-relaxed text-foreground/80 sm:text-base">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
      {formatted.source ? (
        <p className="mt-3 text-xs text-muted-foreground">Fonte: {formatted.source}</p>
      ) : null}
    </section>
  );
}
