import React from 'react';
import { Phone, MessageCircle, Mail, MapPin } from 'lucide-react';
import { SectionProps } from '../useTemplateModel';
import { LINK_BRAND_COLORS } from '../linkDefs';
import { displayPhone, linkHref, mapsHref, telHref } from '../helpers';

/** Footer: brand + social icons, quick links, contact info */
export const FooterSection: React.FC<SectionProps> = ({ t }) => {
  const { profile, isMobile, isTablet, pad, businessName, tagline, vis, savedLinks, navItems, goTo, whatsapp, whatsappUrl, whatsappGreeting, fullAddress } = t;
  return (
    <footer className={`bg-gradient-to-r from-[var(--b1)] to-[var(--b2)] text-white ${pad} py-6`}>
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'}`}>
        <div>
          <div className="flex items-center gap-2">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-white" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[var(--c)] flex items-center justify-center font-bold">{businessName.charAt(0)}</div>
            )}
            <div className="leading-tight">
              <div className="text-[15px] font-bold">{businessName}</div>
              {tagline && <div className="text-[10px] text-white/70">{tagline}</div>}
            </div>
          </div>
          {/* Hidden with the Links section (Card Settings) */}
          {!vis.hideLinksSection && savedLinks.length > 0 && (
            <>
              <h4 className="mt-4 text-[13px] font-bold mb-2">Connect With Us</h4>
              <div className="flex flex-wrap gap-2">
                {savedLinks.map(({ key, label, url, logo, Icon }) => {
                  const href = linkHref(key, url, whatsappGreeting);
                  return (
                    <a
                      key={key}
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      title={label}
                      aria-label={label}
                      style={{ backgroundColor: LINK_BRAND_COLORS[key] || 'var(--c)' }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ring-1 ring-white/10 hover:scale-110 hover:ring-white/40 transition-transform"
                    >
                      {logo ? <img src={logo} alt="" className="w-[18px] h-[18px] object-contain" /> : <Icon className="w-4 h-4" />}
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div>
          <h4 className="text-[13px] font-bold mb-2">Quick Links</h4>
          <div className="grid grid-cols-2 gap-y-1 text-[12px] text-white/75">
            {navItems.map((n) => (
              <button key={n.id} type="button" onClick={() => goTo(n.id)} className="text-left hover:text-white">
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[13px] font-bold mb-2">Contact Info</h4>
          <ul className="space-y-1.5 text-[12px] text-white/80">
            {/* Each line opens its app: dialler, WhatsApp chat, mail, Google Maps */}
            {profile.primaryPhone && (
              <li>
                <a href={telHref(profile.primaryPhone)} className="flex items-center gap-2 hover:text-white">
                  <Phone className="w-3.5 h-3.5 text-[var(--c)]" /> {displayPhone(profile.primaryPhone)}
                </a>
              </li>
            )}
            {whatsapp && (
              <li>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white">
                  <MessageCircle className="w-3.5 h-3.5 text-[var(--c)]" /> {displayPhone(whatsapp.slice(-10))}
                </a>
              </li>
            )}
            {profile.email && (
              <li>
                <a href={`mailto:${profile.email.trim()}`} className="flex items-center gap-2 break-all hover:text-white">
                  <Mail className="w-3.5 h-3.5 text-[var(--c)] shrink-0" /> {profile.email}
                </a>
              </li>
            )}
            {fullAddress && (
              <li>
                <a href={mapsHref(fullAddress, profile.mapLink)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-white">
                  <MapPin className="w-3.5 h-3.5 text-[var(--c)] shrink-0 mt-0.5" /> {fullAddress}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="mt-5 pt-3 border-t border-white/10 text-center text-[11px] text-white/60">
        © {new Date().getFullYear()} {businessName}. All Rights Reserved.
      </div>
    </footer>
  );
};
