import React, { useEffect, useRef, useState } from 'react';
import { Bell, Inbox, Loader2, MessageCircle, Phone, RefreshCw, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { isFranchiseUser } from '@/utils/axios';
import { getAllBusinessEnquiries } from '@/lib/api/superadmin/allEnquiries';

/** Last time the list was opened (per role); enquiries after it count as new */
const seenKey = () => `enquiry-bell-seen:${isFranchiseUser() ? 'franchise' : 'superadmin'}`;
const readSeen = () => {
  try {
    return Number(localStorage.getItem(seenKey())) || 0;
  } catch {
    return 0;
  }
};
const saveSeen = (t: number) => {
  try {
    localStorage.setItem(seenKey(), String(t));
  } catch {
    /* private mode: badge just resets */
  }
};

const digits = (p: string) => p.replace(/\D/g, '').slice(-10);

/** Bell with a count of new enquiries across all businesses (SuperAdmin / franchise); click lists them */
export const EnquiryNotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState(readSeen);
  const boxRef = useRef<HTMLDivElement>(null);

  const { data: enquiries = [], isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['all-business-enquiries', isFranchiseUser() ? 'franchise' : 'superadmin'],
    queryFn: getAllBusinessEnquiries,
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  });
  const newCount = enquiries.filter((e) => e.receivedAt > seenAt).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = () => {
    if (open) {
      // Closing marks everything shown as seen
      const latest = Math.max(seenAt, ...enquiries.map((e) => e.receivedAt));
      setSeenAt(latest);
      saveSeen(latest);
    }
    setOpen(!open);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={toggle}
        title="Enquiry notifications"
        aria-label={`Enquiry notifications${newCount ? `, ${newCount} new` : ''}`}
        aria-expanded={open}
        className={`relative flex h-8 w-8 items-center justify-center rounded border transition-colors ${
          open ? 'border-[#2196F3] bg-blue-50 text-[#2196F3]' : 'border-[#C4C4C4] text-[#616161] hover:bg-gray-100 hover:text-[#2196F3]'
        }`}
      >
        <Bell className="h-4 w-4" />
        {newCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F44336] text-white text-[10px] font-bold flex items-center justify-center">
            {newCount > 99 ? '99+' : newCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[400px] max-h-[70vh] flex flex-col bg-white rounded-lg shadow-2xl border border-[#E0E0E0] z-50 font-['Roboto',Helvetica,Arial,sans-serif]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E0E0E0]">
            <Inbox className="w-4 h-4 text-[#2196F3]" />
            <span className="text-[14px] font-bold text-[#212121]">Enquiries</span>
            <span className="text-[12px] text-gray-500">
              {enquiries.length} total{newCount ? ` · ${newCount} new` : ''}
            </span>
            <button
              type="button"
              onClick={() => refetch()}
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

          <div className="overflow-y-auto">
            {isLoading ? (
              <div className="py-10 text-center text-[13px] text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading enquiries…
              </div>
            ) : isError ? (
              <div className="py-10 text-center text-[13px] text-red-600">Failed to load enquiries</div>
            ) : enquiries.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-gray-500">No enquiries yet.</div>
            ) : (
              enquiries.map((e) => {
                const isNew = e.receivedAt > seenAt;
                return (
                  <div key={e.id} className={`px-4 py-3 border-b border-[#F0F0F0] ${isNew ? 'bg-blue-50/60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2196F3] truncate">{e.businessName || 'Business'}</p>
                        <p className="text-[14px] font-semibold text-[#212121] truncate">
                          {isNew && <span className="inline-block w-2 h-2 rounded-full bg-[#F44336] mr-1.5 align-middle" />}
                          {e.customerName}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-gray-500">{e.createdAt}</span>
                    </div>
                    {e.serviceRequested && <p className="mt-0.5 text-[12px] text-gray-600">For: {e.serviceRequested}</p>}
                    {e.message && <p className="mt-1 text-[12.5px] text-[#424242] whitespace-pre-line break-words">{e.message}</p>}
                    {(e.phoneNumber || e.email) && (
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
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryNotificationBell;
