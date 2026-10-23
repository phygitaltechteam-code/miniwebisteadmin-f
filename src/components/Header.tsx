import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, CheckCircle2, ChevronDown, LogOut, 
  ArrowRight, Settings as SettingsIcon, User, Inbox, Phone, MessageSquare, 
  Mail, X, RefreshCw, Clock, Tag
} from 'lucide-react';
import { ProfileData, CustomerEnquiry } from '../types/profile';
import {
  useCustomerEnquiries,
  useUpdateCustomerEnquiryStatus,
} from '@/lib/react-query/customerEnquiries';

interface HeaderProps {
  profile: ProfileData;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectStep: (stepNumber: number) => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  searchQuery,
  onSearchChange,
  onSelectStep,
  onSignOut,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEnquiriesModal, setShowEnquiriesModal] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Live Customer Enquiries from GET customers/enquires
  const {
    data: fetchedEnquiries,
    isLoading: isLoadingEnquiries,
    isRefetching: isRefetchingEnquiries,
    refetch: refetchEnquiries,
  } = useCustomerEnquiries();

  const updateStatusMutation = useUpdateCustomerEnquiryStatus();

  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([]);

  useEffect(() => {
    if (fetchedEnquiries) {
      setEnquiries(fetchedEnquiries);
    }
  }, [fetchedEnquiries]);

  const handleUpdateStatus = (id: string, status: CustomerEnquiry['status']) => {
    setEnquiries(prev => prev.map(e => (e.id === id ? { ...e, status } : e)));
    updateStatusMutation.mutate({ id, status });
  };

  const profileRef = useRef<HTMLDivElement>(null);
  const enquiriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (enquiriesRef.current && !enquiriesRef.current.contains(e.target as Node)) {
        setShowEnquiriesModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick search jump targets
  const searchTargets = [
    { label: 'Business Name & Vanity URL', step: 1, section: 'Basic Details' },
    { label: 'Logo & Header Banner', step: 1, section: 'Basic Details' },
    { label: 'Contact Numbers & Map Location', step: 1, section: 'Basic Details' },
    { label: 'GST Number & Establishment Year', step: 2, section: 'About & Specialities' },
    { label: 'Core Specialities & Tags', step: 2, section: 'About & Specialities' },
    { label: 'About Us Marathi Narrative', step: 2, section: 'About & Specialities' },
    { label: 'Products & Enterprise Modules (13 items)', step: 3, section: 'Products & Services' },
    { label: 'WhatsApp & Social Store Links', step: 4, section: 'Links & Social' },
    { label: 'UPI & Merchant QR Codes', step: 5, section: 'Payment & QR' },
    { label: 'Bank Account Coordinates', step: 5, section: 'Payment & QR' },
    { label: 'Photo Gallery & YouTube Teasers', step: 6, section: 'Gallery & Media' },
    { label: 'Visibility Flags & Headings Customizer', step: 7, section: 'Settings & Headings' },
  ];

  const filteredTargets = searchQuery.trim()
    ? searchTargets.filter(t =>
      t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.section.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  return (
    <header className="w-full h-16 px-4 md:px-6 flex items-center justify-between border-b border-[#c5c6cd]/50 bg-white shadow-xs sticky top-0 z-40">
      {/* Left: Brand Identity & Search Bar */}
      <div className="flex items-center gap-4 lg:gap-8 flex-1">
        {/* Brand Crest & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#091426] text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm ring-1 ring-black/10 shrink-0">
            CF
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] sm:text-[15px] font-bold text-[#091426] tracking-tight leading-tight">
              CardForge <span className="hidden sm:inline">Enterprise</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-[#2563EB] uppercase">
              ADMIN PORTAL
            </span>
          </div>
        </div>

        {/* Search Bar with intelligent quick jump */}
        <div className="relative max-w-md w-full hidden md:block">
          <div className={`relative flex items-center rounded-lg border transition-all ${isSearchFocused ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 bg-white' : 'border-[#c5c6cd]/80 bg-[#f8f9ff]'
            }`}>
            <Search className="w-4 h-4 ml-3 text-[#75777d] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search profiles, fields, tags..."
              className="w-full h-9 pl-2.5 pr-8 bg-transparent text-[13px] text-[#0b1c30] placeholder:text-[#75777d] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="mr-2 text-xs text-[#75777d] hover:text-[#0b1c30]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchFocused && filteredTargets.length > 0 && (
            <div className="absolute top-11 left-0 right-0 bg-white rounded-xl shadow-xl border border-[#c5c6cd]/60 overflow-hidden z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[11px] font-bold text-[#75777d] uppercase px-3 py-1.5">
                Quick Jump to Section
              </div>
              {filteredTargets.map((target, idx) => (
                <button
                  key={idx}
                  onMouseDown={() => {
                    onSelectStep(target.step);
                    onSearchChange('');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#EFF6FF] flex items-center justify-between group transition-colors"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-[#091426] group-hover:text-[#2563EB]">
                      {target.label}
                    </p>
                    <p className="text-[11px] text-[#75777d]">
                      Step {target.step}: {target.section}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Enquiries, Notifications, User Profile */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Customer Enquiries Dropdown (Notification Style) */}
        <div className="relative" ref={enquiriesRef}>
          <button
            type="button"
            onClick={() => {
              setShowEnquiriesModal(!showEnquiriesModal);
              if (showProfileMenu) setShowProfileMenu(false);
            }}
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
            <div className="absolute right-0 mt-2 w-[320px] sm:w-[400px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-stroke overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
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
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Interactive Menu */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              if (showEnquiriesModal) setShowEnquiriesModal(false);
            }}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#2563EB]/30 transition-all focus:outline-none"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-full border border-stroke bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-[#2563EB]" />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#75777d] hidden lg:block" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#c5c6cd]/70 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 bg-gradient-to-br from-[#091426] to-[#1e293b] text-white">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full border-2 border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-[#2563EB]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[14px] truncate leading-tight">
                      {profile.contactName}
                    </p>
                    <p className="text-[12px] text-slate-300 truncate mt-0.5">
                      {profile.designation}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Card Administrator
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 text-[13px] space-y-1">
                <div className="px-3 py-2 text-xs text-[#75777d] border-b border-[#c5c6cd]/30">
                  <span className="font-semibold text-[#091426] block">Organization:</span>
                  <span className="truncate block">{profile.businessName}</span>
                </div>

                <a
                  href="#sec-1"
                  onClick={() => { onSelectStep(1); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#0b1c30] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 text-[#75777d]" />
                  <span>Profile Credentials</span>
                </a>

                <div className="pt-1 border-t border-[#c5c6cd]/30">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onSignOut) {
                        onSignOut();
                      } else {
                        localStorage.removeItem('token');
                        localStorage.removeItem('token_key');
                        window.location.reload();
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};