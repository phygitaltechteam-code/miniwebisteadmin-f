import React from 'react';
import {ExternalLink, Loader2} from 'lucide-react';
import {usePlatformMatch} from '@/lib/react-query/leads';
import {rebaseCardUrl} from '@/utils/cardUrl';

/**
 * "On digiwebcard: X ↗" when the lead's business already has a live card (matched by phone,
 * else company name), otherwise "Not on digiwebcard yet". Nothing without a phone or company.
 */
export const PlatformMatchBadge: React.FC<{
  phone?: string | null;
  company?: string | null;
  adminId?: string;
  /** Smaller pill for table rows. */
  compact?: boolean;
}> = ({phone, company, adminId, compact = false}) => {
  const {data, isPending, isError, fetchStatus} = usePlatformMatch(
    {phone, company},
    adminId,
  );

  // Disabled query (no usable phone / company) or a failed lookup: show nothing
  if (isError || (isPending && fetchStatus === 'idle')) return null;

  const size = compact
    ? 'px-2 py-px text-[11px] gap-1'
    : 'px-2.5 py-1 text-[12px] gap-1.5';

  if (isPending) {
    return compact ? null : (
      <span
        className={`inline-flex items-center rounded-full border border-[#E0E0E0] bg-[#FAFAFA] text-[#6B7280] ${size}`}
      >
        <Loader2 className="h-3 w-3 animate-spin" /> Checking digiwebcard…
      </span>
    );
  }

  if (data?.matched) {
    const name = data.businessName || 'this business';
    const href = data.cardLink ? rebaseCardUrl(data.cardLink) : '';
    const title = `Matched by ${data.matchedBy === 'company' ? 'company name' : 'phone number'}`;
    const cls = `inline-flex max-w-full items-center rounded-full border border-[#C8E6C9] bg-[#E8F5E9] font-medium text-[#2E7D32] ${size}`;
    const label = (
      <>
        <span className="truncate">On digiwebcard: {name}</span>
        {href && <ExternalLink className="h-3 w-3 shrink-0" />}
      </>
    );
    return href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`${cls} hover:bg-[#C8E6C9]`}
        title={title}
      >
        {label}
      </a>
    ) : (
      <span className={cls} title={title}>
        {label}
      </span>
    );
  }

  // In table rows only the matches are worth a pill
  if (compact) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#E0E0E0] bg-[#FAFAFA] text-[#6B7280] ${size}`}
    >
      Not on digiwebcard yet
    </span>
  );
};

export default PlatformMatchBadge;
