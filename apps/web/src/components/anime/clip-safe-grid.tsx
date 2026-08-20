'use client';

import { useEffect, useRef } from 'react';

/** Sentinel that calls onVisible when it enters the viewport (infinite scroll). */
export function InfiniteScrollSentinel({
  onVisible,
  disabled,
}: {
  onVisible: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onVisible();
      },
      { root: null, rootMargin: '320px 0px', threshold: 0 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [onVisible, disabled]);

  return <div ref={ref} className="h-8 w-full" aria-hidden />;
}
