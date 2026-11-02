import React from 'react';
import { Phone, Send, Menu } from 'lucide-react';
import { SectionProps } from '../useTemplateModel';

/** Sticky header with logo, desktop nav and Call / Get a Quote (on mobile it takes no space and slides in after the profile card) */
export const HeaderSection: React.FC<SectionProps> = ({ t }) => {
  const { profile, isMobile, isTablet, pad, businessName, tagline, navItems, activeNav, goTo, headerHidden, menuOpen, setMenuOpen, phone, enquireUrl } = t;
  return (
    <div className={`sticky top-0 z-30 ${isMobile ? 'h-0' : ''}`}>
      <header
        className={`bg-white border-b border-slate-200 ${pad} py-2.5 flex items-center justify-between gap-3 transition-transform duration-300 ${headerHidden ? '-translate-y-full' : 'translate-y-0 shadow-sm'}`}
      >
        {isMobile && (
          <button type="button" onClick={() => setMenuOpen((o) => !o)} className="text-slate-700" aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          {profile.logoUrl ? (
            <img src={profile.logoUrl} alt={businessName} className="w-9 h-9 rounded-lg object-contain bg-white border border-slate-100" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[var(--c)] text-white flex items-center justify-center font-bold">
              {businessName.charAt(0)}
            </div>
          )}
          <div className="min-w-0 leading-tight">
            <div className="text-[15px] font-extrabold text-[#0B1B33] truncate">{businessName}</div>
            {tagline && <div className="text-[10px] text-slate-500 truncate">{tagline}</div>}
          </div>
        </div>
        {!isMobile && !isTablet && (
          <nav className="flex items-center gap-0.5 min-w-0 overflow-x-auto text-[12px] font-medium text-slate-700">
            {navItems.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => goTo(n.id)}
                className={`shrink-0 whitespace-nowrap px-2 py-1.5 rounded-md hover:text-[var(--c)] ${activeNav === n.id ? 'bg-[var(--cs)] text-[var(--c)]' : ''}`}
              >
                {n.label}
              </button>
            ))}
          </nav>
        )}
        {isMobile ? (
          <a href={phone ? `tel:${phone}` : '#'} className="w-9 h-9 rounded-lg bg-[var(--c)] text-white flex items-center justify-center" aria-label="Call">
            <Phone className="w-4 h-4" />
          </a>
        ) : (
          <a href={enquireUrl('a quote')} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[var(--c)] hover:bg-[var(--cd)] px-3.5 py-2 text-[12px] font-semibold text-white">
            <Send className="w-3.5 h-3.5" /> Get a Quote
          </a>
        )}
      </header>
      {isMobile && menuOpen && !headerHidden && (
        <div className="bg-white border-b border-slate-200 px-4 py-2 grid grid-cols-2 gap-1 text-[13px]">
          {navItems.map((n) => (
            <button key={n.id} type="button" onClick={() => goTo(n.id)} className={`py-1.5 text-left ${activeNav === n.id ? 'text-[var(--c)] font-semibold' : 'text-slate-700'}`}>
              {n.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
