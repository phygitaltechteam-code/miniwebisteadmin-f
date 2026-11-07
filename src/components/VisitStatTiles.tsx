import React from 'react';
import { VisitStats } from '@/lib/api/visitsApi';

export const fmtCount = (n: number) => n.toLocaleString('en-IN');

/** "5 min ago" / "3 h ago" / date */
export const fmtLastVisit = (iso: string | null) => {
  if (!iso) return 'No visits yet';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Total, today, last 7 / 30 days and unique visitors */
export const VisitStatTiles: React.FC<{ stats: VisitStats; compact?: boolean }> = ({ stats, compact }) => {
  const tiles = [
    { label: 'Total visits', value: stats.totalVisits },
    { label: 'Today', value: stats.today },
    { label: 'Last 7 days', value: stats.last7Days },
    { label: 'Last 30 days', value: stats.last30Days },
    { label: 'Unique visitors', value: stats.uniqueVisitors },
  ];
  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
      {tiles.map((t, i) => (
        <div
          key={t.label}
          className={`rounded border border-[#E0E0E0] bg-white px-3 py-2.5 ${compact && i === 0 ? 'col-span-2' : ''}`}
        >
          <div className="text-[12px] text-gray-500 font-medium">{t.label}</div>
          <div className={`font-bold text-[#000000DE] tabular-nums ${compact && i !== 0 ? 'text-[18px]' : 'text-[22px]'}`}>
            {fmtCount(t.value)}
          </div>
        </div>
      ))}
    </div>
  );
};
