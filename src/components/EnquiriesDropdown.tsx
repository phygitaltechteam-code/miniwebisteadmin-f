import React, { useState, useRef, useEffect } from 'react';
import { Inbox, Phone, MessageSquare, Mail, X, RefreshCw, Clock, Tag, UserPlus, Check, Loader2 } from 'lucide-react';
import { CustomerEnquiry } from '../types/profile';
import {
  useCustomerEnquiries,
  useUpdateCustomerEnquiryStatus,
} from '@/lib/react-query/customerEnquiries';
import { useLeadFromEnquiry } from '@/lib/react-query/leads';

interface EnquiriesDropdownProps {
  /** Super admin: pass the admin id to use superAdmin/admin/:adminId/enquires. Admin panel: omit (customers/enquires). */
  adminId?: string;
}

export const EnquiriesDropdown: React.FC<EnquiriesDropdownProps> = ({ adminId }) => {
  const [showEnquiriesModal, setShowEnquiriesModal] = useState(false);

  const {
    data: fetchedEnquiries,
    isLoading: isLoadingEnquiries,
  } = useCustomerEnquiries(adminId);

  const updateStatusMutation = useUpdateCustomerEnquiryStatus(adminId);
  const saveAsLead = useLeadFromEnquiry(adminId);
  const [savedLeadIds, setSavedLeadIds] = useState<string[]>([]);

  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([]);

  useEffect(() => {
    if (fetchedEnquiries) {
      setEnquiries(fetchedEnquiries);
    }
  }, [fetchedEnquiries]);

  // Kept for status actions on enquiry items
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUpdateStatus = (id: string, status: CustomerEnquiry['status']) => {
    setEnquiries(prev => prev.map(e => (e.id === id ? { ...e, status } : e)));
    updateStatusMutation.mutate({ id, status });
  };

  const enquiriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (enquiriesRef.current && !enquiriesRef.current.contains(e.target as Node)) {
        setShowEnquiriesModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={enquiriesRef}>
      <button
        type="button"
        onClick={() => setShowEnquiriesModal(!showEnquiriesModal)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
          showEnquiriesModal
            ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] ring-2 ring-[#2563EB]/20'
            : 'border-blue-200 bg-blue-50/70 text-[#2563EB] hover:bg-blue-100'
        }`}
        title="Customer Enquiries"
        aria-label="Customer Enquiries"
        aria-expanded={showEnquiriesModal}
      >
        <Inbox className="w-4 h-4" />
        <span className="hidden sm:inline">Enquiries</span>
        <span className="px-1.5 py-0.2 rounded-full bg-[#2563EB] text-white text-[10px] min-w-[18px] text-center font-bold">
          {isLoadingEnquiries ? '...' : enquiries.length}
        </span>
      </button>

      {/* ─── Notification-Style Enquiries Popover ──────────────────────── */}
      {showEnquiriesModal && (
        <div className="fixed inset-x-2 top-14 sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[400px] max-w-[calc(100vw-16px)] sm:max-w-[400px] bg-white rounded-2xl shadow-2xl border border-stroke overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Popover Header */}
          <div className="p-3 sm:p-3.5 border-b border-stroke flex items-center justify-between bg-gradient-to-r from-[#f8faff] to-white">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold shrink-0">
                <Inbox className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-[#091426] truncate">
                    Customer Enquiries
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-[10px] font-bold shrink-0">
                    {enquiries.length}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 truncate">
                  Real-time digital card leads
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowEnquiriesModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Popover Body: Notifications Feed */}
          <div className="p-2 sm:p-2.5 overflow-y-auto max-h-[380px] sm:max-h-[440px] space-y-2">
            {isLoadingEnquiries && enquiries.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
                <span>Loading leads...</span>
              </div>
            ) : enquiries.length === 0 ? (
              <div className="text-center py-8 px-4 text-gray-400 text-xs flex flex-col items-center justify-center gap-1.5">
                <Inbox className="w-7 h-7 text-gray-300" />
                <p className="font-medium text-gray-600">No enquiries received yet</p>
                <p className="text-[11px] text-gray-400">Leads captured from your digital card will appear here.</p>
              </div>
            ) : (
              enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="p-2.5 rounded-xl border border-stroke bg-white hover:bg-blue-50/20 hover:border-blue-300 transition-all shadow-2xs space-y-2"
                >
                  {/* Row 1: Avatar + Name, Phone, Email at ONE LINE + Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 uppercase shadow-2xs">
                        {enq.customerName?.trim().charAt(0) || 'C'}
                      </div>
                      
                      {/* Name, Phone, Email at ONE LINE */}
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <p className="font-bold text-xs text-[#091426] truncate">
                          {enq.customerName}
                        </p>
                        {enq.phoneNumber && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-gray-700 font-medium bg-gray-100 px-1.5 py-0.2 rounded border border-stroke/60">
                            <Phone className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                            <span>{enq.phoneNumber}</span>
                          </span>
                        )}
                        {enq.email && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 truncate max-w-[170px] sm:max-w-[220px]">
                            <Mail className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                            <span className="truncate">{enq.email}</span>
                          </span>
                        )}
                        {enq.serviceRequested && (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] font-medium border border-stroke truncate max-w-[130px]">
                            <Tag className="w-2 h-2 shrink-0 text-blue-500" />
                            <span className="truncate">{enq.serviceRequested}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date and Time stacked Up / Down */}
                    {(() => {
                      const parts = (enq.createdAt || '').split(',').map((s) => s.trim());
                      if (parts.length >= 2) {
                        return (
                          <div className="flex flex-col items-end leading-tight text-right shrink-0 ml-auto pl-1">
                            <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">
                              {parts[0]}
                            </span>
                            <span className="text-[9px] text-gray-400 whitespace-nowrap flex items-center gap-0.5 mt-0.5">
                              <Clock className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                              <span>{parts.slice(1).join(', ')}</span>
                            </span>
                          </div>
                        );
                      }
                      return (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium shrink-0 ml-auto whitespace-nowrap">
                          <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>{enq.createdAt}</span>
                        </span>
                      );
                    })()}
                  </div>

                  {/* Row 2: Message on the left, Action buttons (Phone, WhatsApp, Email) aside it */}
                  <div className="flex items-center justify-between gap-2 bg-gray-50/90 border border-stroke p-2 rounded-xl">
                    {/* Message */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 text-[11px] text-gray-700">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <p className="truncate font-medium text-gray-800">
                        "{enq.message || 'No message provided'}"
                      </p>
                    </div>

                    {/* Action buttons aside message */}
                    <div className="flex items-center gap-1 shrink-0">
                      {enq.phoneNumber && (
                        <>
                          <a
                            href={`tel:${enq.phoneNumber.replace(/\s+/g, '')}`}
                            className="px-2 py-0.8 rounded-md bg-white border border-stroke hover:bg-[#EFF6FF] hover:text-[#2563EB] text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                            title="Call"
                          >
                            <Phone className="w-2.5 h-2.5 text-[#2563EB]" />
                            <span>Call</span>
                          </a>

                          <a
                            href={`https://wa.me/${enq.phoneNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.8 rounded-md bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        </>
                      )}

                      {enq.email && (
                        <a
                          href={`mailto:${enq.email}`}
                          className="px-2 py-0.8 rounded-md bg-white border border-stroke hover:bg-gray-100 text-gray-700 text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                          title={`Email: ${enq.email}`}
                        >
                          <Mail className="w-2.5 h-2.5 text-gray-600" />
                          <span>Email</span>
                        </a>
                      )}

                      <button
                        type="button"
                        disabled={saveAsLead.isPending && saveAsLead.variables === enq.id}
                        onClick={() =>
                          saveAsLead.mutate(enq.id, {
                            onSuccess: () => setSavedLeadIds((prev) => [...prev, enq.id]),
                          })
                        }
                        className="px-2 py-0.8 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#2563EB] text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-60"
                        title="Add this enquiry to the leads"
                      >
                        {saveAsLead.isPending && saveAsLead.variables === enq.id ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : savedLeadIds.includes(enq.id) ? (
                          <Check className="w-2.5 h-2.5" />
                        ) : (
                          <UserPlus className="w-2.5 h-2.5" />
                        )}
                        <span>{savedLeadIds.includes(enq.id) ? 'Saved' : 'Save as lead'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
