import React from 'react';
import { SectionProps } from '../useTemplateModel';
import { SectionTitle } from '../SectionTitle';
import { linkHref, titleParts } from '../helpers';

/** Links saved in Link Store and ticked to show */
export const LinksSection: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, isTablet, headings, savedLinks, sectionRank, whatsappGreeting } = t;
  return (
    <section data-section="links" style={{ order: sectionRank('links') }}>
      <SectionTitle isMobile={isMobile} {...titleParts(headings.linksHeading, 'Quick Links')} />
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${isMobile ? 2 : isTablet ? 3 : 4}, minmax(0, 1fr))` }}>
        {savedLinks.map(({ key, label, url, logo, Icon }) => {
          const href = linkHref(key, url, whatsappGreeting);
          return (
            <a
              key={key}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl bg-white border border-slate-200 p-2.5 hover:border-[var(--c)] transition-colors min-w-0"
            >
              <span className="w-9 h-9 shrink-0 rounded-full bg-[var(--cs)] text-[var(--c)] flex items-center justify-center overflow-hidden">
                {logo ? <img src={logo} alt="" className="w-5 h-5 object-contain" /> : <Icon className="w-4 h-4" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-bold text-[#0B1B33] truncate">{label}</span>
                <span className="block text-[10.5px] text-slate-500 truncate">{url}</span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
};
