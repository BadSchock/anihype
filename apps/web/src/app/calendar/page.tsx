import type { Metadata } from 'next';
import { CalendarPageClient } from './_components/calendar-page-client';

export const metadata: Metadata = {
  title: 'Calendário',
  description: 'Calendário semanal de lançamentos de anime — veja o que vai ao ar cada dia da semana.',
};

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lançamentos dos próximos dias, organizados por data.
        </p>
      </div>
      <CalendarPageClient />
    </div>
  );
}
