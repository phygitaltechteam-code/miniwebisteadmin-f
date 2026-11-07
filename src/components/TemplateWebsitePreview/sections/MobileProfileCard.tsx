import React from 'react';
import { Phone, MessageCircle, Mail, MapPin } from 'lucide-react';
import { SectionProps } from '../useTemplateModel';
import { displayPhone, mapsHref, telHref } from '../helpers';

/** Mobile only: profile card (logo, name, owner, contacts) */
export const MobileProfileCard: React.FC<SectionProps> = ({ t }) => {
  const { profile, cardRef, businessName, ownerName, designation, phones, emails, whatsapp, whatsappUrl, fullAddress } = t;
  return (
    <section data-section="home" className="bg-[var(--b1)]">
      <div ref={cardRef} className="px-6 pt-8 pb-12 flex flex-col items-center text-center text-white">
        <div className="p-1.5 border-[3px] border-[var(--c)]">
          {profile.logoUrl ? (
            <img src={profile.logoUrl} alt={businessName} className="w-28 h-28 object-contain bg-white" />
          ) : (
            <div className="w-28 h-28 bg-[var(--c)] flex items-center justify-center text-4xl font-bold">{businessName.charAt(0)}</div>
          )}
        </div>
        {businessName && <h1 className="mt-5 text-[17px] font-bold uppercase leading-snug">{businessName}</h1>}
        {(ownerName || designation) && <span className="block w-24 h-[3px] bg-[var(--c)] my-3" />}
        {ownerName && <p className="text-[15px]">{ownerName}</p>}
        {designation && <p className="text-[12px] italic text-white/80 mt-0.5">({designation})</p>}
      </div>
      <div className="relative bg-white rounded-t-[28px] -mt-6 px-6 pt-6 pb-4 space-y-6">
        {[
          { Icon: Phone, items: phones.map((p) => ({ label: displayPhone(p), href: telHref(p) })) },
          { Icon: Mail, items: emails.map((e) => ({ label: e, href: `mailto:${e}` })) },
          { Icon: MessageCircle, items: whatsapp ? [{ label: displayPhone(whatsapp.slice(-10)), href: whatsappUrl }] : [] },
          { Icon: MapPin, items: fullAddress ? [{ label: fullAddress, href: mapsHref(fullAddress, profile.mapLink) }] : [] },
        ]
          .filter((row) => row.items.length > 0)
          .map(({ Icon, items }, i) => (
            <div key={i} className="text-center">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex-1 h-px bg-[var(--c)] opacity-60" />
                <span className="w-9 h-9 rounded-full bg-[var(--c)] text-white flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 h-px bg-[var(--c)] opacity-60" />
              </div>
              {items.map((it, j) => (
                <a
                  key={it.label}
                  href={it.href || undefined}
                  target={it.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className={`block text-[13.5px] leading-relaxed break-words ${j === 0 ? 'text-slate-700' : 'text-[var(--c)]'}`}
                >
                  {it.label}
                </a>
              ))}
            </div>
          ))}
      </div>
    </section>
  );
};
