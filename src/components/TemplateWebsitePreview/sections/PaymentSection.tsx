import React from 'react';
import { Phone, QrCode, Landmark, Wallet } from 'lucide-react';
import { SectionProps } from '../useTemplateModel';
import { SectionTitle } from '../SectionTitle';
import { displayPhone, titleParts } from '../helpers';

/** Payment (UPI, wallets ticked to show, bank details) */
export const PaymentSection: React.FC<SectionProps> = ({ t }) => {
  const { profile, isMobile, isTablet, headings, sectionRank, wallets, upiPhone, bankRows, showUpiBlock, bankAlone } = t;
  return (
    <section data-section="payment" style={{ order: sectionRank('payment') }}>
      <SectionTitle isMobile={isMobile} {...titleParts(headings.paymentHeading, 'Payment Details')} />
      {/* Desktop: UPI + wallets on the left, bank details on the right; mobile: stacked */}
      <div
        className={
          !isMobile && bankRows.length > 0 && showUpiBlock && (wallets.length > 0 || profile.upiId || upiPhone)
            ? 'grid grid-cols-2 gap-4 items-start'
            : 'space-y-3'
        }
      >
        {showUpiBlock && (profile.upiId || upiPhone || wallets.length > 0) && (
          <div className="space-y-3 min-w-0">
            {(profile.upiId || upiPhone) && (
              <div className="flex flex-wrap gap-2">
                {profile.upiId && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-2 text-[12.5px]">
                    <Wallet className="w-4 h-4 text-[var(--c)]" /> UPI ID: <b className="font-semibold">{profile.upiId}</b>
                  </span>
                )}
                {upiPhone && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-2 text-[12.5px]">
                    <Phone className="w-4 h-4 text-[var(--c)]" /> {displayPhone(upiPhone)}
                  </span>
                )}
              </div>
            )}
            {wallets.length > 0 && (
              <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${isMobile ? Math.min(wallets.length, 2) : 3}, minmax(0, 1fr))` }}>
                {wallets.map((w) => (
                  <div key={w.id} className="rounded-xl bg-white border border-slate-200 shadow-sm p-3 flex flex-col items-center text-center gap-1.5">
                    <span className="text-[13px] font-bold text-[#0B1B33]">{w.name}</span>
                    {w.qr ? (
                      <img src={w.qr} alt={`${w.name} QR`} className="w-28 h-28 object-contain rounded-md border border-slate-100 bg-white p-1" />
                    ) : (
                      <span className="w-28 h-28 rounded-md bg-[var(--cs)] flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-[var(--c)] opacity-50" />
                      </span>
                    )}
                    {w.phone && <span className="text-[12px] text-slate-600">{displayPhone(w.phone)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {bankRows.length > 0 && (
          <div className="rounded-xl bg-white border border-slate-200 border-t-4 border-t-[var(--c)] shadow-sm p-4 min-w-0">
            <div className="flex items-center gap-2 mb-3 text-[14px] font-bold text-[#0B1B33]">
              <span className="w-8 h-8 rounded-full bg-[var(--cs)] flex items-center justify-center">
                <Landmark className="w-4 h-4 text-[var(--c)]" />
              </span>
              Bank Details
            </div>
            {bankAlone ? (
              // Desktop, bank details only: every field side by side across the full width
              <dl className="grid gap-3 text-[13px]" style={{ gridTemplateColumns: `repeat(${isTablet ? 3 : bankRows.length}, minmax(0, 1fr))` }}>
                {bankRows.map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[var(--cs)] px-3 py-2.5 min-w-0">
                    <dt className="text-[11.5px] text-slate-500">{label}</dt>
                    <dd className="mt-0.5 font-semibold text-[#0B1B33] break-all">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <dl className="divide-y divide-slate-100 text-[13px]">
                {bankRows.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-2">
                    <dt className="text-slate-500 shrink-0">{label}</dt>
                    <dd className="font-semibold text-[#0B1B33] text-right break-all">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
