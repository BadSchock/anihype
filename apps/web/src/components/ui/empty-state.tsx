import { cn } from '@anihype/ui';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'Nada por aqui',
  description = 'Não encontramos nada para exibir.',
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && <div className="mb-4 text-white/30">{icon}</div>}
      <p className="text-lg font-semibold text-white/70">{title}</p>
      <p className="mt-1 text-sm text-white/40">{description}</p>
    </div>
  );
}
