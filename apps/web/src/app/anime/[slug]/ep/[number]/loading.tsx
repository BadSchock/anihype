import { CommentItemSkeleton } from '@/components/comments/comment-item';

export default function EpisodeLoading() {
  return (
    <div className="-mx-4 -mt-6 animate-fade-in sm:-mx-6">
      <div className="h-48 w-full shimmer sm:h-64" />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-4 h-3 w-48 rounded shimmer" />
        <div className="h-8 w-3/4 rounded-lg shimmer" />
        <div className="mt-3 flex gap-3">
          <div className="h-4 w-24 rounded shimmer" />
          <div className="h-4 w-16 rounded shimmer" />
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-4 w-full rounded shimmer" />
          <div className="h-4 w-5/6 rounded shimmer" />
        </div>
        <div className="my-8 border-t border-white/6" />
        <div className="mb-4 h-6 w-32 rounded shimmer" />
        <div className="flex flex-col gap-5">
          {Array.from({ length: 5 }).map((_, i) => <CommentItemSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
