import React, { useEffect, useState } from 'react';
import { BellRing, MessageCircle, Phone, X } from 'lucide-react';

export interface LatestEnquiry {
  id: string;
  customerName: string;
  phoneNumber?: string;
  email?: string;
  message?: string;
  serviceRequested?: string;
  createdAt?: string;
  businessName?: string;
}

/** Enquiry ids already shown as a popup (per panel), so each one pops only once */
const readPopped = (key: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};
const savePopped = (key: string, ids: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(ids.slice(-500)));
  } catch {
    /* ignore */
  }
};

const digits = (p: string) => p.replace(/\D/g, '').slice(-10);

/**
 * Bottom-right popup for the latest enquiry that came in (newest first list).
 * The first load only remembers what is already there; enquiries arriving after that pop up once.
 */
export const LatestEnquiryPopup: React.FC<{
  enquiries: LatestEnquiry[];
  storageKey: string;
  onView?: (enquiry: LatestEnquiry) => void;
}> = ({ enquiries, storageKey, onView }) => {
  const [current, setCurrent] = useState<LatestEnquiry | null>(null);

  useEffect(() => {
    if (!enquiries.length) return;
    const popped = readPopped(storageKey);
    if (!popped.length) {
      // First time on this browser: don't pop old enquiries
      savePopped(storageKey, enquiries.map((e) => e.id));
      return;
    }
    const fresh = enquiries.filter((e) => !popped.includes(e.id));
    if (!fresh.length) return;
    savePopped(storageKey, [...popped, ...fresh.map((e) => e.id)]);
    setCurrent(fresh[0]);
  }, [enquiries, storageKey]);

  // Closes itself after a while
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), 15000);
    return () => clearTimeout(t);
  }, [current]);

  if (!current) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-[90] w-[calc(100vw-24px)] sm:w-[360px] rounded-lg bg-white shadow-2xl border border-[#E0E0E0] border-l-4 border-l-[#2196F3] font-['Roboto',Helvetica,Arial,sans-serif] animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-start gap-3 p-4">
        <div className="w-9 h-9 shrink-0 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center">
          <BellRing className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#2196F3] truncate">
            New enquiry{current.businessName ? ` · ${current.businessName}` : ''}
          </p>
          <p className="text-[14px] font-semibold text-[#212121] truncate">{current.customerName}</p>
          {current.serviceRequested && <p className="text-[12px] text-gray-600 truncate">For: {current.serviceRequested}</p>}
          {current.message && <p className="mt-0.5 text-[12.5px] text-[#424242] line-clamp-2 break-words">{current.message}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
            {current.phoneNumber && (
              <>
                <a href={`tel:${current.phoneNumber}`} className="inline-flex items-center gap-1 rounded border border-[#E0E0E0] px-2 py-0.5 text-[#212121] hover:border-[#2196F3]">
                  <Phone className="w-3 h-3" /> {current.phoneNumber}
                </a>
                <a
                  href={`https://wa.me/91${digits(current.phoneNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-[#E0E0E0] px-2 py-0.5 text-[#2E7D32] hover:border-[#2E7D32]"
                >
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
              </>
            )}
            {onView && (
              <button
                type="button"
                onClick={() => {
                  onView(current);
                  setCurrent(null);
                }}
                className="ml-auto font-semibold text-[#2196F3] hover:underline"
              >
                View
              </button>
            )}
          </div>
        </div>
        <button type="button" onClick={() => setCurrent(null)} className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default LatestEnquiryPopup;
