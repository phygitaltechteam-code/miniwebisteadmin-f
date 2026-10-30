import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Phone, X } from 'lucide-react';
import { api, isFranchiseUser } from '@/utils/axios';

/** One admin whose plan is expiring / expired */
export interface ExpiryAlertAdmin {
  id?: string;
  adminId?: string;
  businessName?: string;
  ownerName?: string;
  phoneNumber?: string;
  cardLink?: string;
  planName?: string;
  expiryDate?: string;
  daysLeft?: number;
  status?: string;
  message?: string;
}

export interface ExpiryAlerts {
  counts: { expiringSoon: number; expired: number };
  showAlert: boolean;
  admins: ExpiryAlertAdmin[];
}

/** superAdmin/admin/expiry-alerts, or franchise/admins/expiry-alerts (its own admins) */
export const getExpiryAlerts = async (type: 'expiring' | 'expired'): Promise<ExpiryAlerts> => {
  const url = isFranchiseUser() ? 'franchise/admins/expiry-alerts' : 'superAdmin/admin/expiry-alerts';
  const res: any = await api.get(url, { params: { type, limit: 50 } });
  const data = res?.data ?? res;
  return {
    counts: { expiringSoon: Number(data?.counts?.expiringSoon) || 0, expired: Number(data?.counts?.expired) || 0 },
    showAlert: Boolean(data?.showAlert),
    admins: Array.isArray(data?.admins) ? data.admins : [],
  };
};

const SEEN_KEY = 'expiry-alerts-seen';
const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

/**
 * SuperAdmin / franchise: popup once per session when admins' plans are expiring soon or have expired.
 * Clicking an admin opens it (renew from Upgrade on its payments page).
 */
export const ExpiryAlertsPopup: React.FC<{ onOpenBusiness?: (adminId: string, businessName?: string) => void }> = ({ onOpenBusiness }) => {
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem(SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [tab, setTab] = useState<'expiring' | 'expired'>('expiring');

  const expiring = useQuery({ queryKey: ['expiry-alerts', 'expiring'], queryFn: () => getExpiryAlerts('expiring'), retry: false });
  const expired = useQuery({ queryKey: ['expiry-alerts', 'expired'], queryFn: () => getExpiryAlerts('expired'), retry: false });
  const counts = expiring.data?.counts || expired.data?.counts || { expiringSoon: 0, expired: 0 };
  const showAlert = Boolean(expiring.data?.showAlert || expired.data?.showAlert || counts.expiringSoon || counts.expired);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  if (!open || !showAlert) return null;
  const current = tab === 'expiring' ? expiring : expired;
  const rows = current.data?.admins || [];

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center bg-black/40 p-4" onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl font-['Roboto',Helvetica,Arial,sans-serif]"
      >
        <div className="flex items-start gap-3 px-5 pt-5 pb-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-[#212121]">Plan expiry alerts</h3>
            <p className="text-[13px] text-gray-600">
              {counts.expiringSoon} expiring soon · {counts.expired} expired
            </p>
          </div>
          <button type="button" onClick={close} className="p-1 rounded text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-6 px-5 border-b border-[#E0E0E0]">
          {(['expiring', 'expired'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-2 text-[13px] font-medium border-b-2 ${tab === t ? 'border-[#2196F3] text-[#2196F3]' : 'border-transparent text-gray-600'}`}
            >
              {t === 'expiring' ? `Expiring soon (${counts.expiringSoon})` : `Expired (${counts.expired})`}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto">
          {current.isLoading ? (
            <div className="py-8 text-center text-[13px] text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-gray-500">None.</div>
          ) : (
            rows.map((a, i) => {
              const adminId = a.adminId || a.id;
              const isExpired = tab === 'expired' || String(a.status).toUpperCase() === 'EXPIRED';
              return (
                <div
                  key={`${adminId || a.businessName}-${i}`}
                  onClick={() => {
                    if (!adminId || !onOpenBusiness) return;
                    close();
                    onOpenBusiness(adminId, a.businessName);
                  }}
                  className={`px-5 py-3 border-b border-[#F0F0F0] ${adminId && onOpenBusiness ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#212121] truncate">{a.businessName || '-'}</p>
                      {a.ownerName && <p className="text-[12px] text-gray-500 truncate">{a.ownerName}</p>}
                    </div>
                    <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full text-white ${isExpired ? 'bg-[#F44336]' : 'bg-amber-500'}`}>
                      {isExpired ? 'Expired' : a.daysLeft === 0 ? 'Today' : `${a.daysLeft ?? '-'} day${a.daysLeft === 1 ? '' : 's'} left`}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-600">
                    {a.planName && <span>{a.planName}</span>}
                    <span>
                      {isExpired ? 'Expired' : 'Expires'} {fmt(a.expiryDate)}
                    </span>
                    {a.phoneNumber && (
                      <a href={`tel:${a.phoneNumber}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[#2196F3] hover:underline">
                        <Phone className="w-3 h-3" /> {a.phoneNumber}
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#E0E0E0] flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-gray-500">Renew from Upgrade on the business's payments page.</p>
          <button type="button" onClick={close} className="rounded bg-[#2196F3] hover:bg-[#1E88E5] px-4 py-1.5 text-[13px] font-medium text-white">
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpiryAlertsPopup;
