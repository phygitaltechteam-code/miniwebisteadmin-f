import React from 'react';
import { ArrowRight } from 'lucide-react';

/** Section heading: plain first part + accent-coloured last word, optional sub line and action button */
export const SectionTitle: React.FC<{
  isMobile: boolean;
  first: string;
  second: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
}> = ({ isMobile, first, second, sub, action, onAction }) => (
  <div className="flex items-end justify-between gap-3 mb-3">
    <div className="min-w-0 border-l-4 border-[var(--c)] pl-2.5">
      <h2 className={`${isMobile ? 'text-[19px]' : 'text-[24px]'} font-extrabold text-[#0B1B33] leading-tight`}>
        {first} <span className="text-[var(--c)]">{second}</span>
      </h2>
      {sub && <p className="text-[12px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
    {action && (
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 inline-flex items-center gap-1 rounded-md border border-[var(--c)] px-2.5 py-1 text-[11px] font-semibold text-[var(--c)] hover:bg-[var(--c)] hover:text-white transition-colors"
      >
        {action} <ArrowRight className="w-3 h-3" />
      </button>
    )}
  </div>
);
