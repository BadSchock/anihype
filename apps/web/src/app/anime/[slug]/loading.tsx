export default function AnimeDetailLoading() {
  return (
    <div className="-mx-4 -mt-6 animate-fade-in sm:-mx-6">
      {/* Banner */}
      <div className="h-48 w-full shimmer sm:h-72" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 -mt-16 sm:-mt-24 sm:flex-row sm:gap-8">
          {/* Cover */}
          <div className="mx-auto h-44 w-32 flex-shrink-0 rounded-xl shimmer sm:mx-0 sm:h-56 sm:w-40" />

          {/* Info */}
          <div className="flex flex-1 flex-col gap-3 pt-2">
            <div className="h-5 w-24 rounded shimmer" />
            <div className="h-8 w-3/4 rounded-lg shimmer" />
            <div className="h-4 w-1/2 rounded shimmer" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-16 rounded-full shimmer" />
              ))}
            </div>
          </div>
        </div>

        {/* Synopsis */}
        <div className="mt-8 space-y-2">
          <div className="h-5 w-24 rounded shimmer" />
          <div className="h-4 w-full rounded shimmer" />
          <div className="h-4 w-5/6 rounded shimmer" />
          <div className="h-4 w-4/5 rounded shimmer" />
        </div>
      </div>
    </div>
  );
}
