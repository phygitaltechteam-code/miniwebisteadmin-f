import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, LogOut, ArrowRight, User, CreditCard, Users, UserCheck } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { AdminNotificationBell } from './AdminNotificationBell';
import { AdminReviewsButton } from './AdminReviewsButton';
import { AdminVisitsButton } from './AdminVisitsButton';
import { LogoutConfirmModal } from './superadmin/SuperAdminSidebar';
import { useDueTodayCount } from '@/lib/react-query/leads';

interface HeaderProps {
  profile: ProfileData;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectStep: (stepNumber: number) => void;
  onSignOut?: () => void;
  /** Card builder, Leads or Customers; the toggle shows only when onViewChange is given. */
  view?: 'card' | 'leads' | 'customers';
  onViewChange?: (view: 'card' | 'leads' | 'customers') => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  searchQuery,
  onSearchChange,
  onSelectStep,
  onSignOut,
  view = 'card',
  onViewChange,
}) => {
  // Follow-ups due today or overdue, shown on the Leads tab
  const { data: dueCount = 0 } = useDueTodayCount(undefined, !!onViewChange);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const signOut = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('token_key');
      window.location.reload();
    }
  };

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
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
    { label: 'About Us Narrative', step: 2, section: 'About & Specialities' },
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
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 flex-1 min-w-0">
        {/* Brand Crest & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#091426] text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm ring-1 ring-black/10 shrink-0">
            CF
          </div>
          <div className={`${onViewChange ? 'hidden min-[420px]:flex' : 'flex'} flex-col`}>
            <span className="text-[13px] sm:text-[15px] font-bold text-[#091426] tracking-tight leading-tight">
              CardForge <span className="hidden sm:inline">Enterprise</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-[#2563EB] uppercase">
              ADMIN PORTAL
            </span>
          </div>
        </div>

        {/* Card builder / Leads / Customers switch */}
        {onViewChange && (
          <div className="flex items-center rounded-lg border border-[#c5c6cd]/80 bg-[#f8f9ff] p-0.5 shrink-0" role="tablist" aria-label="Section">
            {([
              ['card', 'Card Builder', CreditCard],
              ['leads', 'Leads', Users],
              ['customers', 'Customers', UserCheck],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => view !== id && onViewChange(id)}
                title={label}
                className={`relative flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-md text-[13px] font-semibold transition-colors ${
                  view === id ? 'bg-white text-[#2563EB] shadow-xs ring-1 ring-[#c5c6cd]/60' : 'text-[#45474c] hover:text-[#0b1c30]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {/* Three tabs: icons only below md so the header fits */}
                <span className="hidden md:inline">{label}</span>
                {id === 'leads' && dueCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 md:static min-w-[18px] h-[18px] px-1 rounded-full bg-[#F44336] text-white text-[10px] font-bold flex items-center justify-center"
                    title={`${dueCount} follow-up${dueCount === 1 ? '' : 's'} due`}
                  >
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Search Bar with intelligent quick jump */}
        <div className={`relative max-w-md w-full hidden ${view === 'card' ? 'md:block' : ''}`}>
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
        {/* Guest visits on the admin's card */}
        <AdminVisitsButton />

        {/* All reviews left on the admin's card */}
        <AdminReviewsButton />

        {/* Notifications: own enquiries + plan expiry (same bell as the super admin panel) */}
        <AdminNotificationBell />

        {/* Logout (asks for confirmation, same popup as the super admin panel) */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[13px] font-semibold transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
        {showLogoutConfirm && (
          <LogoutConfirmModal
            onConfirm={() => {
              setShowLogoutConfirm(false);
              signOut();
            }}
            onCancel={() => setShowLogoutConfirm(false)}
          />
        )}

        {/* Profile Avatar & Interactive Menu */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
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
                  </div>
                </div>
              </div>

              <div className="p-3 text-[13px] space-y-1">
                <div className="pt-1 border-t border-[#c5c6cd]/30">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutConfirm(true);
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