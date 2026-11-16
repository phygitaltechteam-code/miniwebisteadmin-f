import React from 'react';
import {Eye, Phone, MessageCircle, Mail, Contact, Loader2} from 'lucide-react';
import {useCardAnalytics} from '@/lib/react-query/leads';
import {formatDay} from '@/lib/leads/dates';
import type {CardStatCounts} from '@/types/lead';

const TILES: {
  key: keyof CardStatCounts;
  label: string;
  icon: React.ElementType;
  tone: string;
}[] = [
  {
    key: 'views',
    label: 'Card views',
    icon: Eye,
    tone: 'text-[#1565C0] bg-[#E3F2FD]',
  },
  {
    key: 'calls',
    label: 'Calls',
    icon: Phone,
    tone: 'text-[#2E7D32] bg-[#E8F5E9]',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    tone: 'text-[#00897B] bg-[#E0F2F1]',
  },
  {
    key: 'emails',
    label: 'Emails',
    icon: Mail,
    tone: 'text-[#6A1B9A] bg-[#F3E5F5]',
  },
  {
    key: 'saves',
    label: 'Contact saves',
    icon: Contact,
    tone: 'text-[#E65100] bg-[#FFF3E0]',
  },
];

/** Public card activity for the last [days] days: totals plus a daily views strip. */
export const CardAnalyticsPanel: React.FC<{
  adminId?: string;
  days?: number;
}> = ({adminId, days = 30}) => {
  const {data, isLoading, isError} = useCardAnalytics(days, adminId);
  const daily = data?.daily ?? [];
  const max = Math.max(1, ...daily.map((d) => d.views));

  return (
    <section className="shadow-xs rounded-lg border border-[#E0E0E0] bg-white p-4 font-['Roboto',Helvetica,Arial,sans-serif]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-[#212121]">
          Your card, last {days} days
        </h2>
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF]" />
        )}
      </div>

      {isError ? (
        <p className="text-[13px] text-[#6B7280]">
          Card activity isn't available right now.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {TILES.map(({key, label, icon: Icon, tone}) => (
              <div
                key={key}
                className="flex min-w-0 items-center gap-2.5 rounded-lg border border-[#EEEEEE] px-3 py-2.5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[18px] font-bold tabular-nums leading-tight text-[#212121]">
                    {isLoading
                      ? '–'
                      : (data?.totals[key] ?? 0).toLocaleString('en-IN')}
                  </p>
                  <p className="truncate text-[11.5px] text-[#6B7280]">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {daily.length > 0 && (
            <div className="mt-4">
              <div
                className="flex h-16 items-end gap-[2px]"
                role="img"
                aria-label={`Daily card views for the last ${days} days`}
              >
                {daily.map((d) => (
                  <div
                    key={d.day}
                    className="group relative flex h-full flex-1 items-end"
                    title={`${formatDay(d.day)}: ${d.views} views, ${d.calls} calls, ${d.whatsapp} WhatsApp, ${d.emails} emails, ${d.saves} saves`}
                  >
                    <div
                      className={`w-full rounded-t-sm ${d.views ? 'bg-[#64B5F6] group-hover:bg-[#1E88E5]' : 'bg-[#EEEEEE]'}`}
                      style={{
                        height: d.views
                          ? `${Math.max(6, (d.views / max) * 100)}%`
                          : '2px',
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10.5px] text-[#9CA3AF]">
                <span>{formatDay(daily[0].day)}</span>
                <span>Views per day</span>
                <span>{formatDay(daily[daily.length - 1].day)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default CardAnalyticsPanel;
