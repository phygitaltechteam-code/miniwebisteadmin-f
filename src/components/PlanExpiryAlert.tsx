import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Phone, X } from 'lucide-react';
import { api } from '@/utils/axios';

/** Days before the expiry date when the alert starts showing */
const ALERT_DAYS = 3;

/**
 * The logged-in admin's own plan: GET customers/plan
 * { planName, expiryDate, contact: { fullname, phoneNumber, role } } — contact is whoever made the card
 * (the super admin, or the franchise for a franchise's admin).
 */
interface MyPlan {
  planName?: string;
  expiryDate?: string;
  contact?: { fullname?: string; phoneNumber?: string; role?: string } | null;
}

const getMyPlan = async (): Promise<MyPlan | null> => {
  const res: any = await api.get('customers/plan');
  return res?.data ?? res ?? null;
};

/** Whole days from today to the expiry date (0 = today, negative = already expired) */
const daysUntil = (iso: string) => {
  const end = new Date(iso);
  if (isNaN(end.getTime())) return null;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(end) - startOfDay(new Date())) / 86400000);
};

/** Banner under the admin header from 3 days before the plan expires: contact your super admin */
export const PlanExpiryAlert: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const { data: plan } = useQuery({
    queryKey: ['my-plan'],
    queryFn: getMyPlan,
    retry: false,
    staleTime: 1000 * 60 * 30,
  });

  const days = plan?.expiryDate ? daysUntil(plan.expiryDate) : null;
  if (dismissed || days === null || days > ALERT_DAYS) return null;

  const expired = days < 0;
  const dateText = new Date(plan!.expiryDate!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const when = expired ? `expired on ${dateText}` : days === 0 ? 'expires today' : `expires in ${days} day${days > 1 ? 's' : ''} (${dateText})`;
  const contact = plan?.contact;
  const contactRole = String(contact?.role || '').toUpperCase() === 'FRANCHISE' ? 'franchise' : 'super admin';
  const phone = (contact?.phoneNumber || '').replace(/[^\d+]/g, '');

  return (
    <div className={`w-full border-b ${expired ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
      <div className="max-w-[1520px] mx-auto px-3 sm:px-6 py-2.5 flex items-start sm:items-center gap-2.5 text-[13px]">
        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${expired ? 'text-rose-500' : 'text-amber-500'}`} />
        <p className="flex-1 min-w-0">
          Your {plan?.planName ? <b>{plan.planName}</b> : 'plan'} {when}. Please contact your {contactRole}
          {contact?.fullname ? <> <b>{contact.fullname}</b></> : null}
          {phone ? (
            <>
              {' '}on{' '}
              <a href={`tel:${phone}`} className="inline-flex items-center gap-1 font-bold underline">
                <Phone className="w-3.5 h-3.5" /> {contact?.phoneNumber}
              </a>
            </>
          ) : null}
          {' '}to renew.
        </p>
        <button type="button" onClick={() => setDismissed(true)} className="shrink-0 p-1 rounded hover:bg-black/5" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PlanExpiryAlert;
