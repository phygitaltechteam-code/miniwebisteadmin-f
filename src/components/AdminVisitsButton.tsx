import React, { useEffect, useRef, useState } from 'react';
import { Eye, Loader2, RefreshCw, X } from 'lucide-react';
import { useMyVisits } from '@/lib/react-query/visits';
import { VisitStatTiles, fmtCount, fmtLastVisit } from './VisitStatTiles';

/** Admin header: how many guests opened the admin's own card (GET customers/visits) */
export const AdminVisitsButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isFetching, isError, refetch } = useMyVisits(30);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Card visits"
        aria-label={`Card visits${data ? `: ${data.totalVisits}` : ''}`}
        aria-expanded={open}
        className={`flex h-8 items-center gap-1.5 rounded border px-2 transition-colors ${
          open ? 'border-[#2196F3] bg-blue-50 text-[#2196F3]' : 'border-[#C4C4C4] text-[#616161] hover:bg-gray-100 hover:text-[#2196F3]'
        }`}
      >
        <Eye className="h-4 w-4" />
        <span className="text-[12px] font-semibold tabular-nums">{data ? fmtCount(data.totalVisits) : '–'}</span>
      </button>

      {open && (
        <div className="fixed inset-x-2 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[340px] flex flex-col bg-white rounded-lg shadow-2xl border border-[#E0E0E0] z-50 font-['Roboto',Helvetica,Arial,sans-serif]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E0E0E0]">
            <span className="text-[14px] font-bold text-[#212121]">Card visits</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-auto p-1 rounded text-gray-500 hover:text-[#2196F3] hover:bg-gray-100"
              title="Refresh"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={() => setOpen(false)} className="p-1 rounded text-gray-500 hover:bg-gray-100" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 bg-[#FAFAFA]">
            {isLoading ? (
              <div className="py-8 text-center text-[13px] text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading visits…
              </div>
            ) : isError || !data ? (
              <div className="py-8 text-center text-[13px] text-rose-600">Could not load visit counts.</div>
            ) : (
              <>
                <VisitStatTiles stats={data} compact />
                <p className="mt-2.5 text-[12px] text-gray-500">Last visit: {fmtLastVisit(data.lastVisitAt)}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
