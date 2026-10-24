import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, LogOut, ArrowRight, User } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { EnquiriesDropdown } from './EnquiriesDropdown';

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
        <EnquiriesDropdown />

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