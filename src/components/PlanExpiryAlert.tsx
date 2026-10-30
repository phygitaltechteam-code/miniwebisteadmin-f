import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, LogOut, Phone } from 'lucide-react';
import { api } from '@/utils/axios';

/**
 * Admin's plan expiry: GET customers/plan-expiry (login also returns it as user.planExpiry)
 * { status: ACTIVE | EXPIRING_SOON | EXPIRED | NO_EXPIRY, daysLeft, showAlert, expiryDate, message, planName }
 */
export interface PlanExpiryInfo {
  status?: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY' | string;
  daysLeft?: number;
  showAlert?: boolean;
  expiryDate?: string;
  message?: string;
  planName?: string;
  startDate?: string;
  /** Who to call to renew (the super admin, or the franchise for its admins), when the API sends it */
  contact?: { fullname?: string; phoneNumber?: string; role?: string } | null;
}

/** Renewal contact: the API's contact, else the super admin from .env (VITE_SUPPORT_NAME / VITE_SUPPORT_PHONE) */
const renewalContact = (info?: PlanExpiryInfo | null) => {
  const c = info?.contact;
  const phone = c?.phoneNumber || import.meta.env.VITE_SUPPORT_PHONE || '';
  const name = c?.phoneNumber ? c?.fullname : c?.fullname || import.meta.env.VITE_SUPPORT_NAME;
  const role = String(c?.role || '').toUpperCase() === 'FRANCHISE' ? 'franchise' : 'super admin';
  return { phone: String(phone), name: name || '', role };
};

/** "Contact your super admin <name> on <phone>" line with a call button */
export const ContactLine: React.FC<{ info?: PlanExpiryInfo | null }> = ({ info }) => {
  const { phone, name, role } = renewalContact(info);
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-[13px] text-[#424242]">
      Contact your {role}
      {name ? <b> {name}</b> : null} to renew.
      {phone && (
        <a
          href={`tel:${phone.replace(/[^d+]/g, '')}`}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-[#2196F3] py-2 text-[14px] font-semibold text-[#2196F3] hover:bg-blue-50"
        >
          <Phone className="w-4 h-4" /> {phone}
        </a>
      )}
    </div>
  );
};

const getPlanExpiry = async (): Promise<PlanExpiryInfo | null> => {
  const res: any = await api.get('customers/plan-expiry');
  return res?.data ?? res ?? null;
};

/** planExpiry saved with the login response */
const planExpiryFromLogin = (): PlanExpiryInfo | null => {
  try {
    const stored = JSON.parse(localStorage.getItem('token') || '{}');
    return stored?.user?.planExpiry || stored?.data?.user?.planExpiry || null;
  } catch {
    return null;
  }
};

/** The logged-in admin's plan expiry (API, else the login response) */
export const usePlanExpiry = (): PlanExpiryInfo | null => {
  const { data } = useQuery({
    // Per login, so one admin never sees another one's cached expiry
    queryKey: ['plan-expiry', (() => { try { return localStorage.getItem('token')?.slice(-24) || ''; } catch { return ''; } })()],
    queryFn: getPlanExpiry,
    retry: false,
    staleTime: 1000 * 60 * 30,
  });
  return data || planExpiryFromLogin();
};

const DISMISS_KEY = 'plan-expiry-alert-dismissed';

/** Popup after login (and on reload) while the plan is about to expire; shown once per session */
export const PlanExpiryAlert: React.FC = () => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const info = usePlanExpiry();

  const close = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  if (dismissed || !info?.showAlert) return null;
  const dateText = info.expiryDate
    ? new Date(info.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const message =
    info.message ||
    (info.daysLeft !== undefined ? `Your plan expires in ${info.daysLeft} day${info.daysLeft === 1 ? '' : 's'}${dateText ? ` (${dateText})` : ''}. Please renew soon.` : 'Your plan expires soon. Please renew soon.');

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center bg-black/40 p-4" onClick={close}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4 font-['Roboto',Helvetica,Arial,sans-serif]">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <h3 className="text-[17px] font-bold text-[#212121]">Plan expiring soon</h3>
          {info.planName && <p className="text-[12px] text-gray-500 mt-0.5">{info.planName}</p>}
          <p className="mt-2 text-[14px] text-[#424242] leading-relaxed">{message}</p>
        </div>
        <ContactLine info={info} />
        <button type="button" onClick={close} className="w-full rounded-lg bg-[#2196F3] hover:bg-[#1E88E5] py-2.5 text-[14px] font-medium text-white">
          OK
        </button>
      </div>
    </div>
  );
};

/** Event fired by the axios interceptor when the backend answers 403 PLAN_EXPIRED */
export const PLAN_EXPIRED_EVENT = 'plan-expired';

/**
 * Blocking popup once the plan has expired (login or any request answers 403 PLAN_EXPIRED).
 * Logged in: the only way out is Logout. On the login page: OK closes it.
 */
export const PlanExpiredGate: React.FC<{ isAuthenticated: boolean; onSignOut: () => void }> = ({ isAuthenticated, onSignOut }) => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onExpired = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      setMessage(detail?.message || 'Your plan has expired. Please renew to continue.');
    };
    window.addEventListener(PLAN_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(PLAN_EXPIRED_EVENT, onExpired);
  }, []);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4 font-['Roboto',Helvetica,Arial,sans-serif]">
        <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-rose-500" />
        </div>
        <div>
          <h3 className="text-[17px] font-bold text-[#212121]">Plan expired</h3>
          <p className="mt-2 text-[14px] text-[#424242] leading-relaxed">{message}</p>
        </div>
        <ContactLine info={planExpiryFromLogin()} />
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              onSignOut();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-500 hover:bg-rose-600 py-2.5 text-[14px] font-medium text-white"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        ) : (
          <button type="button" onClick={() => setMessage(null)} className="w-full rounded-lg bg-[#2196F3] hover:bg-[#1E88E5] py-2.5 text-[14px] font-medium text-white">
            OK
          </button>
        )}
      </div>
    </div>
  );
};

export default PlanExpiryAlert;
