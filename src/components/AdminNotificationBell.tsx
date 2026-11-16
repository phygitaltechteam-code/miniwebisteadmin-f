import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, CalendarClock, Check, Inbox, Loader2, MessageCircle, Phone, RefreshCw, UserPlus, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCustomerEnquiries } from '@/lib/react-query/customerEnquiries';
import { useLeadFromEnquiry } from '@/lib/react-query/leads';
import { ContactLine, usePlanExpiry } from './PlanExpiryAlert';
import { LatestEnquiryPopup } from './LatestEnquiryPopup';

/** Enquiry ids already seen in this browser (the rest count as new) */
const SEEN_KEY = 'admin-bell-seen-enquiries';
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
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const digits = (p: string) => p.replace(/\D/g, '').slice(-10);

/** Admin panel bell, same design as the super admin one: own enquiries + own plan expiry */
export const AdminNotificationBell: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'enquiries' | 'expiry'>('enquiries');
  const [seen, setSeen] = useState<string[]>(readSeen);
  const boxRef = useRef<HTMLDivElement>(null);

  // Checked every minute so a new enquiry pops up
  const { data: enquiries = [], isLoading, isFetching, refetch } = useCustomerEnquiries(undefined, { refetchInterval: 60 * 1000 });
  const plan = usePlanExpiry();
  const saveAsLead = useLeadFromEnquiry();
  const [savedLeadIds, setSavedLeadIds] = useState<string[]>([]);
  const planStatus = String(plan?.status || '').toUpperCase();
  const planAlert = Boolean(plan?.showAlert) || planStatus === 'EXPIRED';
  const hasPlan = Boolean(plan?.expiryDate) && planStatus !== 'NO_EXPIRY';
  const newIds = enquiries.filter((e) => !seen.includes(e.id)).map((e) => e.id);
  const badge = newIds.length + (planAlert ? 1 : 0);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = () => {
    if (open && newIds.length) {
      // Closing marks the listed enquiries as seen
      const next = [...seen, ...newIds];
      setSeen(next);
      saveSeen(next);
    }
    if (!open && planAlert && newIds.length === 0) setTab('expiry');
    setOpen(!open);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={toggle}
        title="Notifications"
        aria-label={`Notifications${badge ? `, ${badge}` : ''}`}
        aria-expanded={open}
        className={`relative flex h-8 w-8 items-center justify-center rounded border transition-colors ${
          open ? 'border-[#2196F3] bg-blue-50 text-[#2196F3]' : 'border-[#C4C4C4] text-[#616161] hover:bg-gray-100 hover:text-[#2196F3]'
        }`}
      >
        <Bell className="h-4 w-4" />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F44336] text-white text-[10px] font-bold flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[400px] max-h-[70vh] flex flex-col bg-white rounded-lg shadow-2xl border border-[#E0E0E0] z-50 font-['Roboto',Helvetica,Arial,sans-serif]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E0E0E0]">
            <span className="text-[14px] font-bold text-[#212121]">Notifications</span>
            <button
              type="button"
              onClick={() => {
                refetch();
                queryClient.invalidateQueries({ queryKey: ['plan-expiry'] });
              }}
              className="ml-auto p-1 rounded text-gray-500 hover:text-[#2196F3] hover:bg-gray-100"
              title="Refresh"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={toggle} className="p-1 rounded text-gray-500 hover:bg-gray-100" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex border-b border-[#E0E0E0] text-[13px] font-medium">
            {([
              ['enquiries', Inbox, `Enquiries (${enquiries.length})`, newIds.length > 0],
              ['expiry', AlertTriangle, `Plan expiry (${hasPlan && planAlert ? 1 : 0})`, planAlert],
            ] as const).map(([id, Icon, label, dot]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border-b-2 ${
                  tab === id ? 'border-[#2196F3] text-[#2196F3]' : 'border-transparent text-gray-600 hover:text-black'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
                {dot && <span className="w-2 h-2 rounded-full bg-[#F44336]" />}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto">
            {tab === 'expiry' ? (
              !plan || !hasPlan ? (
                <div className="py-10 text-center text-[13px] text-gray-500">No plan expiry.</div>
              ) : (
                <div className={`px-4 py-3 border-b border-[#F0F0F0] ${planStatus === 'EXPIRED' ? 'bg-rose-50/60' : planAlert ? 'bg-amber-50/50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2196F3]">Your plan</p>
                      <p className="text-[14px] font-semibold text-[#212121] truncate">{plan.planName || 'Subscription plan'}</p>
                    </div>
                    <span
                      className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full text-white ${
                        planStatus === 'EXPIRED' ? 'bg-[#F44336]' : planAlert ? 'bg-amber-500' : 'bg-[#4CAF50]'
                      }`}
                    >
                      {planStatus === 'EXPIRED'
                        ? 'Expired'
                        : plan.daysLeft === 0
                          ? 'Today'
                          : plan.daysLeft !== undefined
                            ? `${plan.daysLeft} day${plan.daysLeft === 1 ? '' : 's'} left`
                            : 'Active'}
                    </span>
                  </div>
                  {plan.message && <p className="mt-1 text-[12.5px] text-[#424242]">{plan.message}</p>}
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-gray-600">
                    <CalendarClock className="w-3.5 h-3.5" />
                    {plan.startDate ? `${fmtDate(plan.startDate)} – ` : ''}
                    {fmtDate(plan.expiryDate)}
                  </p>
                  {planAlert && (
                    <div className="mt-2.5">
                      <ContactLine info={plan} />
                    </div>
                  )}
                </div>
              )
            ) : isLoading ? (
              <div className="py-10 text-center text-[13px] text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading enquiries…
              </div>
            ) : enquiries.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-gray-500">No enquiries yet.</div>
            ) : (
              enquiries.map((e) => {
                const isNew = newIds.includes(e.id);
                return (
                  <div key={e.id} className={`px-4 py-3 border-b border-[#F0F0F0] ${isNew ? 'bg-blue-50/60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {e.serviceRequested && (
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2196F3] truncate">{e.serviceRequested}</p>
                        )}
                        <p className="text-[14px] font-semibold text-[#212121] truncate">
                          {isNew && <span className="inline-block w-2 h-2 rounded-full bg-[#F44336] mr-1.5 align-middle" />}
                          {e.customerName}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-gray-500">{e.createdAt}</span>
                    </div>
                    {e.message && <p className="mt-1 text-[12.5px] text-[#424242] whitespace-pre-line break-words">{e.message}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                        {e.phoneNumber && (
                          <>
                            <a href={`tel:${e.phoneNumber}`} className="inline-flex items-center gap-1 rounded border border-[#E0E0E0] px-2 py-0.5 text-[#212121] hover:border-[#2196F3]">
                              <Phone className="w-3 h-3" /> {e.phoneNumber}
                            </a>
                            <a
                              href={`https://wa.me/91${digits(e.phoneNumber)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded border border-[#E0E0E0] px-2 py-0.5 text-[#2E7D32] hover:border-[#2E7D32]"
                            >
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          </>
                        )}
                        {e.email && (
                          <a href={`mailto:${e.email}`} className="text-[#2196F3] hover:underline truncate">
                            {e.email}
                          </a>
                        )}
                        <button
                          type="button"
                          disabled={saveAsLead.isPending && saveAsLead.variables === e.id}
                          onClick={() =>
                            saveAsLead.mutate(e.id, {
                              onSuccess: () => setSavedLeadIds((prev) => [...prev, e.id]),
                            })
                          }
                          className="ml-auto inline-flex items-center gap-1 rounded border border-[#BBDEFB] bg-[#E3F2FD] px-2 py-0.5 font-medium text-[#1565C0] hover:bg-[#BBDEFB] disabled:opacity-60"
                          title="Add this enquiry to your leads"
                        >
                          {saveAsLead.isPending && saveAsLead.variables === e.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : savedLeadIds.includes(e.id) ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <UserPlus className="w-3 h-3" />
                          )}
                          {savedLeadIds.includes(e.id) ? 'Saved as lead' : 'Save as lead'}
                        </button>
                      </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Popup for each new enquiry as it comes in */}
      <LatestEnquiryPopup
        enquiries={enquiries}
        storageKey="admin-popped-enquiries"
        onView={() => {
          setTab('enquiries');
          setOpen(true);
        }}
      />
    </div>
  );
};

export default AdminNotificationBell;
