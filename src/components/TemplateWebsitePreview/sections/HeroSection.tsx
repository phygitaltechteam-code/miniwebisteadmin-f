import React from 'react';
import { Phone, MessageCircle, ArrowRight, UserPlus } from 'lucide-react';
import { SectionProps } from '../useTemplateModel';

/** Desktop / tablet hero banner with Call, WhatsApp, Get a Quote and Save Contact */
export const HeroSection: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, pad, kicker, businessName, tagline, heroText, phone, whatsappUrl, enquireUrl, vcardHref } = t;
  return (
    <section data-section="home" className="relative overflow-hidden bg-gradient-to-r from-[var(--b1)] to-[var(--b2)] text-white">
      <div className={`relative ${pad} ${isMobile ? 'py-6' : 'py-10'} flex gap-6`}>
        <div className={isMobile ? 'w-full' : 'w-full max-w-3xl'}>
          {kicker && <p className="text-[11px] font-semibold tracking-widest text-white/80 mb-2">{kicker}</p>}
          <h1 className={`${isMobile ? 'text-[22px]' : 'text-[34px]'} font-extrabold leading-tight`}>
            {businessName}
            {tagline && <span className="block text-[var(--c)]">{tagline}</span>}
          </h1>
          {heroText && <p className={`mt-3 ${isMobile ? 'text-[13px]' : 'text-[14px]'} text-white/85 max-w-xl`}>{heroText}</p>}
          <div className={`mt-5 ${isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-3'}`}>
            <a href={phone ? `tel:${phone}` : '#'} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--c)] hover:bg-[var(--cd)] px-5 py-2.5 text-[13px] font-semibold">
              <Phone className="w-4 h-4" /> Call Now
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1EBE5A] px-5 py-2.5 text-[13px] font-semibold">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a href={enquireUrl('a quote')} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-2 rounded-lg bg-white text-[var(--c)] px-5 py-2.5 text-[13px] font-semibold ${isMobile ? 'col-span-2' : ''}`}>
              Get a Quote <ArrowRight className="w-4 h-4" />
            </a>
            {vcardHref && (
              <a href={vcardHref} download className={`inline-flex items-center justify-center gap-2 rounded-lg border border-white/70 hover:bg-white/10 px-5 py-2.5 text-[13px] font-semibold ${isMobile ? 'col-span-2' : ''}`}>
                <UserPlus className="w-4 h-4" /> Save Contact
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
