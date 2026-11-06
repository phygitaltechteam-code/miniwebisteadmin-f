import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, Star, X } from 'lucide-react';
import { useMyReviews } from '@/lib/react-query/reviews';
import { reviewsErrorText } from '@/lib/api/reviewsApi';

/** Review ids already seen in this browser (the rest count as new) */
const SEEN_KEY = 'admin-seen-reviews';
const readSeen = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
};
const saveSeen = (ids: string[]) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-500)));
  } catch {
    /* ignore */
  }
};

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const Stars: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'w-3.5 h-3.5' }) => (
  <span className="inline-flex shrink-0" aria-label={`${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`${size} text-amber-400 ${n <= Math.round(rating) ? 'fill-amber-400' : ''}`} />
    ))}
  </span>
);

/** Admin header: all reviews left on the admin's own card, same popup design as the notification bell */
export const AdminReviewsButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>(readSeen);
  const boxRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useMyReviews({ refetchInterval: 5 * 60 * 1000 });
  const reviews = data?.reviews || [];
  const newIds = reviews.filter((r) => !seen.includes(r.id)).map((r) => r.id);

  const close = () => {
    if (newIds.length) {
      // Closing marks the listed reviews as seen
      const next = [...seen, ...newIds];
      setSeen(next);
      saveSeen(next);
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  });

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        title="All Reviews"
        aria-label={`All Reviews${newIds.length ? `, ${newIds.length} new` : ''}`}
        aria-expanded={open}
        className={`relative flex h-8 w-8 items-center justify-center rounded border transition-colors ${
          open ? 'border-[#2196F3] bg-blue-50 text-[#2196F3]' : 'border-[#C4C4C4] text-[#616161] hover:bg-gray-100 hover:text-[#2196F3]'
        }`}
      >
        <Star className="h-4 w-4" />
        {newIds.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F44336] text-white text-[10px] font-bold flex items-center justify-center">
            {newIds.length > 99 ? '99+' : newIds.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[400px] max-h-[70vh] flex flex-col bg-white rounded-lg shadow-2xl border border-[#E0E0E0] z-50 font-['Roboto',Helvetica,Arial,sans-serif]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E0E0E0]">
            <span className="text-[14px] font-bold text-[#212121]">All Reviews</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-auto p-1 rounded text-gray-500 hover:text-[#2196F3] hover:bg-gray-100"
              title="Refresh"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={close} className="p-1 rounded text-gray-500 hover:bg-gray-100" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {data && reviews.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#E0E0E0] bg-amber-50/40 text-[12.5px] text-gray-700">
              <Stars rating={data.summary.averageRating} />
              <b className="text-[#212121]">{data.summary.averageRating.toFixed(1)}</b>
              <span>· {data.summary.totalRatings} review{data.summary.totalRatings === 1 ? '' : 's'}</span>
            </div>
          )}

          <div className="overflow-y-auto">
            {isLoading ? (
              <div className="py-10 text-center text-[13px] text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading reviews…
              </div>
            ) : isError ? (
              <div className="py-10 px-4 text-center text-[13px] text-rose-600">{reviewsErrorText(error)}</div>
            ) : reviews.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-gray-500">No reviews yet.</div>
            ) : (
              reviews.map((r) => {
                const isNew = newIds.includes(r.id);
                return (
                  <div key={r.id} className={`px-4 py-3 border-b border-[#F0F0F0] ${isNew ? 'bg-blue-50/60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-semibold text-[#212121] truncate">
                        {isNew && <span className="inline-block w-2 h-2 rounded-full bg-[#F44336] mr-1.5 align-middle" />}
                        {r.fullName}
                      </p>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <Stars rating={r.rating} />
                        <span className="text-[11px] text-gray-500">{fmtDate(r.createdAt)}</span>
                      </div>
                    </div>
                    {r.message && <p className="mt-1 text-[12.5px] text-[#424242] whitespace-pre-line break-words">{r.message}</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsButton;
