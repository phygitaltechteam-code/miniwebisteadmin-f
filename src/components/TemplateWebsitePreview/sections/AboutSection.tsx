import React from 'react';
import { cleanRichHtml, RICH_TEXT_CLASS } from '@/utils/richText';
import { SectionProps } from '../useTemplateModel';
import { SectionTitle } from '../SectionTitle';
import { iconFor, titleParts } from '../helpers';

/** Icon tiles for Nature of Business / Specializations */
const IconTiles: React.FC<{ items: string[]; isMobile: boolean; isTablet: boolean; keyWithIndex?: boolean }> = ({ items, isMobile, isTablet, keyWithIndex }) => (
  <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${isMobile || isTablet ? 4 : 8}, minmax(0, 1fr))` }}>
    {items.map((label, i) => {
      const Icon = iconFor(label, i);
      return (
        <div key={keyWithIndex ? `${label}-${i}` : label} className="rounded-xl bg-white border border-slate-200 px-1.5 py-3 flex flex-col items-center text-center gap-1.5 hover:border-[var(--c)] transition-colors">
          <Icon className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'} text-[var(--c)]`} />
          <span className={`${isMobile ? 'text-[9.5px]' : 'text-[11.5px]'} font-semibold text-[#0B1B33] leading-tight line-clamp-2`}>{label}</span>
        </div>
      );
    })}
  </div>
);

/** About Us (mobile), Nature of Business and Our Specializations, in the saved block order */
export const AboutSection: React.FC<SectionProps> = ({ t }) => {
  const { profile, isMobile, isTablet, vis, about, aboutHtml, headings, services, specialities, sectionRank, aboutRank } = t;
  return (
    <div data-section="about" className="flex flex-col gap-8" style={{ order: sectionRank('about') }}>
      {/* ─── Mobile: full About Us ─── */}
      {isMobile && !vis.hideAboutSection && (about || profile.establishmentYear || profile.gstNumber) && (
        <section style={{ order: aboutRank('about') }}>
          <SectionTitle isMobile={isMobile} {...titleParts(headings.aboutUsHeading, 'About Us')} />
          {(profile.establishmentYear || profile.gstNumber) && (
            <div className="flex flex-wrap gap-2 mb-2.5">
              {profile.establishmentYear && (
                <span className="rounded-md bg-[var(--cs)] text-[var(--c)] px-2.5 py-1 text-[11px] font-semibold">Since {profile.establishmentYear}</span>
              )}
              {profile.gstNumber && (
                <span className="rounded-md bg-[var(--cs)] text-[var(--c)] px-2.5 py-1 text-[11px] font-semibold">GST: {profile.gstNumber}</span>
              )}
            </div>
          )}
          {about && (
            <div
              className={`rounded-xl bg-white border border-slate-200 p-3.5 text-[13px] leading-relaxed text-slate-700 ${RICH_TEXT_CLASS}`}
              dangerouslySetInnerHTML={{ __html: cleanRichHtml(aboutHtml) }}
            />
          )}
        </section>
      )}

      {/* ─── Nature of Business (business natures; only when saved) ─── */}
      {!vis.hideAboutSection && services.length > 0 && (
        <section style={{ order: aboutRank('services') }}>
          <SectionTitle isMobile={isMobile} first="Nature of" second="Business" />
          <IconTiles items={services} isMobile={isMobile} isTablet={isTablet} keyWithIndex />
        </section>
      )}

      {/* ─── Our Specializations ─── */}
      {!vis.hideAboutSection && specialities.length > 0 && (
        <section style={{ order: aboutRank('specialities') }}>
          <SectionTitle isMobile={isMobile} first="Our" second="Specializations" sub={headings.specialitiesSubheading || undefined} />
          <IconTiles items={specialities} isMobile={isMobile} isTablet={isTablet} />
        </section>
      )}
    </div>
  );
};
