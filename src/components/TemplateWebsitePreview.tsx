import React, { useEffect, useMemo, useState } from 'react';
import {
  Phone, MessageCircle, Send, ArrowRight, ChevronLeft, ChevronRight, Mail, MapPin, Menu,
  Home, Building2, Factory, Briefcase, Camera, Fingerprint, Zap, Settings, ShieldCheck, Lightbulb,
  Sparkles, Leaf, Play, Facebook, Instagram, Youtube, Linkedin, Globe, Share2, Package,
} from 'lucide-react';
import { ProfileData } from '../types/profile';
import { getPortalTheme } from '../types/theme';

// ─── Color variants ─────────────────────────────────────────────────────────────
// Each card theme maps to one of four template palettes. Colors are applied through CSS variables,
// so the same markup renders in orange, violet, blue or green.
export type TemplatePaletteKey = 'orange' | 'violet' | 'blue' | 'green';

interface TemplatePalette {
  label: string;
  primary: string; // buttons, headings accent, icons
  dark: string; // button hover
  soft: string; // light tinted backgrounds
  bannerFrom: string; // hero + footer gradient
  bannerTo: string;
}

export const TEMPLATE_PALETTES: Record<TemplatePaletteKey, TemplatePalette> = {
  orange: { label: 'Orange', primary: '#F97316', dark: '#EA580C', soft: '#FFF7ED', bannerFrom: '#07162C', bannerTo: '#123058' },
  violet: { label: 'Violet', primary: '#7C3AED', dark: '#6D28D9', soft: '#F5F3FF', bannerFrom: '#1A0A38', bannerTo: '#3B1773' },
  blue: { label: 'Blue', primary: '#0284C7', dark: '#0369A1', soft: '#F0F9FF', bannerFrom: '#07132B', bannerTo: '#0F2E5C' },
  green: { label: 'Green', primary: '#10B981', dark: '#059669', soft: '#ECFDF5', bannerFrom: '#061C18', bannerTo: '#0E3B30' },
};

/** Card theme id (navy-orange, violet-white, sapphire-cyan, emerald-obsidian, …) -> template palette */
export const paletteForTheme = (themeId?: string): TemplatePaletteKey => {
  const id = getPortalTheme(themeId).id;
  if (id === 'violet-white') return 'violet';
  if (id === 'sapphire-cyan') return 'blue';
  if (id === 'emerald-obsidian') return 'green';
  return 'orange';
};

// Slide / fade animations for the auto-sliding carousels and banner (no animation plugin in this project)
const TEMPLATE_KEYFRAMES = `
@keyframes tplSlideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
@keyframes tplFadeIn { from { opacity: 0; } to { opacity: 1; } }
.tpl-slide-in { animation: tplSlideIn 0.5s ease both; }
.tpl-fade-in { animation: tplFadeIn 0.6s ease both; }
`;

// ─── Helpers ────────────────────────────────────────────────────────────────────
const stripHtml = (html?: string) =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const firstSentences = (text: string, max = 160) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '));
  return end > 60 ? cut.slice(0, end + 1) : `${cut.trim()}…`;
};

const youtubeId = (url?: string) => {
  if (!url) return '';
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : '';
};

const formatPrice = (price?: string | number, currency?: string) => {
  if (price === undefined || price === null || price === '') return '';
  const num = Number(price);
  const value = Number.isNaN(num) ? String(price) : num.toLocaleString('en-IN');
  return (currency || 'INR') === 'INR' ? `₹ ${value}` : `${currency} ${value}`;
};

const ICON_SET = [Home, Building2, Factory, Briefcase, Camera, Fingerprint, Zap, Settings, ShieldCheck, Lightbulb, Leaf, Sparkles];

/** Pick an icon that matches the words in a label, falling back to a rotating set */
const iconFor = (label: string, index: number) => {
  const l = label.toLowerCase();
  if (/home|resident|house/.test(l)) return Home;
  if (/commerc|office|shop|retail/.test(l)) return Building2;
  if (/industr|factory|plant/.test(l)) return Factory;
  if (/cctv|camera|surveil|video/.test(l)) return Camera;
  if (/access|biometric|finger|attendance|lock/.test(l)) return Fingerprint;
  if (/electric|power|wiring|energy|solar/.test(l)) return Zap;
  if (/maint|repair|amc|service|support/.test(l)) return Settings;
  if (/secur|safe|alarm|guard/.test(l)) return ShieldCheck;
  if (/light|led|lamp/.test(l)) return Lightbulb;
  if (/eco|green|garden/.test(l)) return Leaf;
  return ICON_SET[index % ICON_SET.length];
};

/** Auto-advancing carousel index; pauses while hovered */
const useAutoSlide = (count: number, visible: number, intervalMs = 3500) => {
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const canSlide = count > visible;

  useEffect(() => {
    if (!canSlide || paused) return;
    const t = setInterval(() => setStart((s) => (s + 1) % count), intervalMs);
    return () => clearInterval(t);
  }, [canSlide, paused, count, intervalMs]);

  useEffect(() => {
    if (start >= count) setStart(0);
  }, [count, start]);

  // Items currently on screen, wrapping around the end
  const indices = Array.from({ length: Math.min(visible, count) }, (_, i) => (start + i) % Math.max(count, 1));

  return {
    indices,
    start,
    canSlide,
    next: () => setStart((s) => (s + 1) % count),
    prev: () => setStart((s) => (s - 1 + count) % count),
    goTo: (i: number) => setStart(i),
    hoverProps: { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) },
  };
};

// ─── Component ──────────────────────────────────────────────────────────────────
interface TemplateWebsitePreviewProps {
  profile: ProfileData;
  /** Card theme id; mapped to the orange / violet / blue / green palette */
  themeId?: string;
  viewMode?: 'mobile' | 'tablet' | 'desktop';
}

export const TemplateWebsitePreview: React.FC<TemplateWebsitePreviewProps> = ({ profile, themeId, viewMode = 'desktop' }) => {
  const palette = TEMPLATE_PALETTES[paletteForTheme(themeId || profile.theme)];
  const isMobile = viewMode === 'mobile';
  const isTablet = viewMode === 'tablet';
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Data from the builder profile ──
  const businessName = profile.businessName || 'Your Business Name';
  const tagline = profile.tagline || profile.businessTagline || (profile.categories || []).slice(0, 2).join(' & ') || 'Smart solutions for your business';
  const categories = (profile.categories || []).filter(Boolean);
  const kicker = (categories.length ? categories : (profile.servicesOffered || []).slice(0, 3)).slice(0, 3).join(' | ').toUpperCase();
  const about = stripHtml(profile.aboutNarrative || profile.aboutUsText);
  const heroText = about ? firstSentences(about) : `Welcome to ${businessName}. Get in touch with us for the best service.`;
  const banners = [...(profile.banners || []), profile.bannerUrl].filter((b, i, arr): b is string => Boolean(b) && arr.indexOf(b) === i);
  const phone = (profile.primaryPhone || '').replace(/[^\d+]/g, '');
  const whatsapp = (profile.whatsappPhone || profile.whatsappNumber || profile.primaryPhone || '').replace(/\D/g, '');
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.length === 10 ? `91${whatsapp}` : whatsapp}` : '#';
  const enquireUrl = (subject: string) =>
    whatsapp ? `${whatsappUrl}?text=${encodeURIComponent(`Hi ${businessName}, I want to enquire about ${subject}.`)}` : '#';
  const cardUrl = `https://digiwebcard.in/${profile.vanityUrl || 'business'}`;
  const vis = profile.visibility || ({} as ProfileData['visibility']);

  const services = (profile.servicesOffered || []).map((s) => String(s).trim()).filter(Boolean);
  const specialities = (profile.specialities || [])
    .map((s: any) => (typeof s === 'object' ? String(s.specialities || s.name || s.title || '') : String(s)).trim())
    .filter(Boolean);
  const products = (profile.products || []).filter((p) => p.status !== 'Draft');
  const gallery = (profile.galleryImages || []).filter((g) => g.url || g.image);
  const videos = (profile.youtubeVideos || []).filter((v) => v.url || v.videoUrl || v.embedUrl || v.videoId);

  // Bullet points under each service: specialities that mention a word of the service, else the next few
  const serviceBullets = useMemo(() => {
    return services.map((srv, i) => {
      const words = srv.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const matched = specialities.filter((sp) => words.some((w) => sp.toLowerCase().includes(w)));
      const pool = matched.length >= 2 ? matched : specialities.slice((i * 3) % Math.max(specialities.length, 1)).concat(specialities);
      return Array.from(new Set(pool)).slice(0, 4);
    });
  }, [services.join('|'), specialities.join('|')]);

  const socials = [
    { url: profile.facebookLink, Icon: Facebook, bg: '#1877F2' },
    { url: profile.instagramLink, Icon: Instagram, bg: '#E4405F' },
    { url: profile.youTubeLink, Icon: Youtube, bg: '#FF0000' },
    { url: profile.linkedinLink, Icon: Linkedin, bg: '#0A66C2' },
    { url: profile.webSiteLink || profile.website, Icon: Globe, bg: '#334155' },
  ].filter((s) => s.url);

  // ── Carousels (visible count depends on the preview device) ──
  const serviceSlider = useAutoSlide(services.length, isMobile ? 1 : isTablet ? 2 : 4);
  const productSlider = useAutoSlide(products.length, isMobile ? 1 : isTablet ? 3 : 6, 3000);
  const gallerySlider = useAutoSlide(gallery.length, isMobile ? 4 : 6, 4000);
  const bannerSlider = useAutoSlide(banners.length, 1, 5000);

  const cssVars = {
    '--c': palette.primary,
    '--cd': palette.dark,
    '--cs': palette.soft,
    '--b1': palette.bannerFrom,
    '--b2': palette.bannerTo,
  } as React.CSSProperties;

  const navItems = ['Home', 'About', 'Services', 'Products', 'Gallery', 'Videos', 'Contact'];

  // ── Small building blocks ──
  const SectionTitle: React.FC<{ first: string; second: string; sub?: string; action?: string }> = ({ first, second, sub, action }) => (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div className="min-w-0 border-l-4 border-[var(--c)] pl-2.5">
        <h2 className={`${isMobile ? 'text-[19px]' : 'text-[24px]'} font-extrabold text-[#0B1B33] leading-tight`}>
          {first} <span className="text-[var(--c)]">{second}</span>
        </h2>
        {sub && <p className="text-[12px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {action && (
        <span className="shrink-0 inline-flex items-center gap-1 rounded-md border border-[var(--c)] px-2.5 py-1 text-[11px] font-semibold text-[var(--c)]">
          {action} <ArrowRight className="w-3 h-3" />
        </span>
      )}
    </div>
  );

  const ArrowButton: React.FC<{ dir: 'left' | 'right'; onClick: () => void }> = ({ dir, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 ${dir === 'left' ? '-left-2' : '-right-2'} z-10 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:text-[var(--c)]`}
      aria-label={dir === 'left' ? 'Previous' : 'Next'}
    >
      {dir === 'left' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
  );

  const Dots: React.FC<{ count: number; active: number; onSelect: (i: number) => void }> = ({ count, active, onSelect }) =>
    count > 1 ? (
      <div className="flex justify-center gap-1.5 mt-2">
        {Array.from({ length: Math.min(count, 8) }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`h-1.5 rounded-full transition-all ${i === active % Math.min(count, 8) ? 'w-4 bg-[var(--c)]' : 'w-1.5 bg-slate-300'}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    ) : null;

  const pad = isMobile ? 'px-4' : 'px-8';

  return (
    <div style={cssVars} className="w-full bg-[#F4F7FB] text-[#0B1B33] font-['Poppins','Roboto',Helvetica,Arial,sans-serif]">
      <style>{TEMPLATE_KEYFRAMES}</style>

      {/* ─── Header ─── */}
      <header className={`sticky top-0 z-30 bg-white border-b border-slate-200 ${pad} py-2.5 flex items-center justify-between gap-3`}>
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
            <div className="text-[10px] text-slate-500 truncate">{tagline}</div>
          </div>
        </div>
        {!isMobile && !isTablet && (
          <nav className="flex items-center gap-1 text-[12px] font-medium text-slate-700">
            {navItems.map((n, i) => (
              <span key={n} className={`px-2.5 py-1.5 rounded-md ${i === 0 ? 'bg-[var(--cs)] text-[var(--c)]' : ''}`}>{n}</span>
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
      {isMobile && menuOpen && (
        <div className="bg-white border-b border-slate-200 px-4 py-2 grid grid-cols-2 gap-1 text-[13px]">
          {navItems.map((n) => <span key={n} className="py-1.5 text-slate-700">{n}</span>)}
        </div>
      )}

      {/* ─── Hero banner ─── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[var(--b1)] to-[var(--b2)] text-white">
        {banners.length > 0 && (
          <img
            key={banners[bannerSlider.start]}
            src={banners[bannerSlider.start]}
            alt=""
            className={`absolute inset-y-0 right-0 h-full object-cover tpl-fade-in ${isMobile ? 'w-full opacity-25' : 'w-[55%] opacity-90'}`}
            style={isMobile ? undefined : { maskImage: 'linear-gradient(to right, transparent, black 35%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 35%)' }}
          />
        )}
        <div className={`relative ${pad} ${isMobile ? 'py-6' : 'py-10'} flex gap-6`}>
          <div className={isMobile ? 'w-full' : 'w-[58%]'}>
            {kicker && <p className="text-[11px] font-semibold tracking-widest text-white/80 mb-2">{kicker}</p>}
            <h1 className={`${isMobile ? 'text-[22px]' : 'text-[34px]'} font-extrabold leading-tight`}>
              {businessName}
              <span className="block text-[var(--c)]">{tagline}</span>
            </h1>
            <p className={`mt-3 ${isMobile ? 'text-[13px]' : 'text-[14px]'} text-white/85 max-w-xl`}>{heroText}</p>
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
            </div>
          </div>
          {!isMobile && specialities.length > 0 && (
            <ul className="ml-auto self-center space-y-3 rounded-xl bg-black/35 backdrop-blur-sm p-4">
              {specialities.slice(0, 4).map((sp, i) => {
                const Icon = iconFor(sp, i);
                return (
                  <li key={sp} className="flex items-center gap-2.5 text-[12px] font-medium">
                    <span className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-[var(--c)] bg-white/10">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="max-w-[150px] leading-tight">{sp}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {banners.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button key={i} type="button" onClick={() => bannerSlider.goTo(i)} className={`h-1.5 rounded-full ${i === bannerSlider.start ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} aria-label={`Banner ${i + 1}`} />
            ))}
          </div>
        )}
      </section>

      <main className={`${pad} py-6 space-y-8`}>
        {/* ─── Our Services (auto-sliding) ─── */}
        {!vis.hideAboutSection && services.length > 0 && (
          <section>
            <SectionTitle first="Our" second="Services" sub={`We provide end-to-end ${categories[0]?.toLowerCase() || 'professional'} solutions for homes, offices and commercial spaces.`} action="View All" />
            <div className="relative" {...serviceSlider.hoverProps}>
              {serviceSlider.canSlide && <ArrowButton dir="left" onClick={serviceSlider.prev} />}
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${serviceSlider.indices.length}, minmax(0, 1fr))` }}>
                {serviceSlider.indices.map((idx) => {
                  const srv = services[idx];
                  const Icon = iconFor(srv, idx);
                  const img = products[idx % Math.max(products.length, 1)]?.image || gallery[idx % Math.max(gallery.length, 1)]?.url;
                  return (
                    <div key={`${srv}-${idx}-${serviceSlider.start}`} className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col tpl-slide-in">
                      <div className="h-24 bg-[var(--cs)] relative">
                        {img ? <img src={img} alt={srv} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon className="w-10 h-10 text-[var(--c)] opacity-60" /></div>}
                        <span className="absolute -bottom-4 left-3 w-9 h-9 rounded-full bg-[var(--b1)] text-white border-2 border-white flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="pt-5 px-3 pb-3 flex-1 flex flex-col">
                        <h3 className="text-[14px] font-bold text-[#0B1B33] leading-tight">{srv}</h3>
                        <ul className="mt-1.5 space-y-0.5 text-[11px] text-slate-600 list-disc pl-4 flex-1">
                          {serviceBullets[idx].map((b) => <li key={b} className="leading-snug">{b}</li>)}
                        </ul>
                        <a href={enquireUrl(srv)} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-flex items-center justify-center gap-1.5 rounded-md bg-[var(--c)] hover:bg-[var(--cd)] py-1.5 text-[12px] font-semibold text-white">
                          <Mail className="w-3.5 h-3.5" /> Enquire Now
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
              {serviceSlider.canSlide && <ArrowButton dir="right" onClick={serviceSlider.next} />}
            </div>
            {isMobile && <Dots count={services.length} active={serviceSlider.start} onSelect={serviceSlider.goTo} />}
          </section>
        )}

        {/* ─── Our Specializations ─── */}
        {!vis.hideAboutSection && specialities.length > 0 && (
          <section>
            <SectionTitle first="Our" second="Specializations" sub="We specialize in customized solutions with expert installation and support." />
            <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${isMobile || isTablet ? 4 : 8}, minmax(0, 1fr))` }}>
              {specialities.slice(0, 8).map((sp, i) => {
                const Icon = iconFor(sp, i);
                return (
                  <div key={sp} className="rounded-xl bg-white border border-slate-200 px-1.5 py-3 flex flex-col items-center text-center gap-1.5 hover:border-[var(--c)] transition-colors">
                    <Icon className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'} text-[var(--c)]`} />
                    <span className={`${isMobile ? 'text-[9.5px]' : 'text-[11.5px]'} font-semibold text-[#0B1B33] leading-tight line-clamp-2`}>{sp}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Our Products (auto-sliding) ─── */}
        {!vis.hideProductsSection && products.length > 0 && (
          <section>
            <SectionTitle first="Our" second="Products" sub={`Explore our range of ${categories[0] ? `${categories[0].toLowerCase()} ` : ''}products.`} action="View All" />
            <div className="relative" {...productSlider.hoverProps}>
              {productSlider.canSlide && <ArrowButton dir="left" onClick={productSlider.prev} />}
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${productSlider.indices.length}, minmax(0, 1fr))` }}>
                {productSlider.indices.map((idx) => {
                  const p = products[idx];
                  const name = p.name || p.title;
                  const price = formatPrice(p.price, p.currency);
                  const img = p.image || p.images?.[0];
                  return (
                    <div key={`${p.id}-${idx}-${productSlider.start}`} className={`rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden flex ${isMobile ? 'flex-row' : 'flex-col'} tpl-slide-in`}>
                      <div className={`${isMobile ? 'w-32 shrink-0' : 'h-24'} bg-[var(--cs)] flex items-center justify-center`}>
                        {img ? <img src={img} alt={name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-[var(--c)] opacity-60" />}
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col min-w-0">
                        <h3 className="text-[12.5px] font-bold text-[#0B1B33] leading-tight line-clamp-1">{name}</h3>
                        {p.description && <p className="mt-0.5 text-[10.5px] text-slate-500 leading-snug line-clamp-2">{stripHtml(p.description)}</p>}
                        <div className="mt-auto pt-2 flex items-center justify-between gap-1.5">
                          {price && <span className="text-[13px] font-extrabold text-[#0B1B33]">{price}</span>}
                          {!(p.isHideEnquiry ?? p.hideEnquiry) && (
                            <a href={enquireUrl(name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-[var(--c)] hover:bg-[var(--cd)] px-2 py-1 text-[10.5px] font-semibold text-white">
                              <Mail className="w-3 h-3" /> Enquire
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {productSlider.canSlide && <ArrowButton dir="right" onClick={productSlider.next} />}
            </div>
            {isMobile && <Dots count={products.length} active={productSlider.start} onSelect={productSlider.goTo} />}
          </section>
        )}

        {/* ─── Photo Gallery + YouTube Videos (side by side on desktop) ─── */}
        {((!vis.hideGallerySection && gallery.length > 0) || (!vis.hideYoutubeSection && videos.length > 0)) && (
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {!vis.hideGallerySection && gallery.length > 0 && (
              <section>
                <SectionTitle first="Photo" second="Gallery" sub="A glimpse of our installations and projects." action="View All" />
                <div className="relative" {...gallerySlider.hoverProps}>
                  {gallerySlider.canSlide && <ArrowButton dir="left" onClick={gallerySlider.prev} />}
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(gallerySlider.indices.length, isMobile ? 4 : 3)}, minmax(0, 1fr))` }}>
                    {gallerySlider.indices.slice(0, isMobile ? 4 : 6).map((idx) => {
                      const g = gallery[idx];
                      return (
                        <img key={`${g.id}-${idx}-${gallerySlider.start}`} src={g.url || g.image} alt={g.title || ''} className="w-full aspect-[4/3] object-cover rounded-lg border border-slate-200 tpl-fade-in" />
                      );
                    })}
                  </div>
                  {gallerySlider.canSlide && <ArrowButton dir="right" onClick={gallerySlider.next} />}
                </div>
              </section>
            )}

            {!vis.hideYoutubeSection && videos.length > 0 && (
              <section>
                <SectionTitle first="YouTube" second="Videos" sub="Watch our latest videos, product demos and helpful tips." action="View All" />
                <div className="grid grid-cols-2 gap-2.5">
                  {videos.slice(0, 4).map((v) => {
                    const id = v.videoId || youtubeId(v.url || v.videoUrl || v.embedUrl);
                    const thumb = v.thumbnailUrl || (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '');
                    return (
                      <a key={v.id} href={v.url || v.videoUrl || '#'} target="_blank" rel="noopener noreferrer" className="group block">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800">
                          {thumb && <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-10 h-7 rounded-lg bg-[#FF0000] flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </span>
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] font-semibold text-[#0B1B33] line-clamp-1">{v.title}</p>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className={`bg-gradient-to-r from-[var(--b1)] to-[var(--b2)] text-white ${pad} py-6`}>
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <div>
            <div className="flex items-center gap-2">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-white" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[var(--c)] flex items-center justify-center font-bold">{businessName.charAt(0)}</div>
              )}
              <div className="leading-tight">
                <div className="text-[15px] font-bold">{businessName}</div>
                <div className="text-[10px] text-white/70">{tagline}</div>
              </div>
            </div>
            <p className="mt-2 text-[11.5px] text-white/75">Your trusted partner for {categories[0]?.toLowerCase() || 'quality service'}.</p>
            {socials.length > 0 && (
              <div className="mt-3 flex gap-2">
                {socials.map(({ url, Icon, bg }) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: bg }} className="w-7 h-7 rounded-md flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-[13px] font-bold mb-2">Quick Links</h4>
            <div className="grid grid-cols-2 gap-y-1 text-[12px] text-white/75">
              {navItems.slice(0, 6).map((n) => <span key={n}>{n}</span>)}
            </div>
          </div>

          <div>
            <h4 className="text-[13px] font-bold mb-2">Contact Info</h4>
            <ul className="space-y-1.5 text-[12px] text-white/80">
              {profile.primaryPhone && <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[var(--c)]" /> +91 {profile.primaryPhone}</li>}
              {whatsapp && <li className="flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5 text-[var(--c)]" /> +91 {whatsapp.slice(-10)}</li>}
              {profile.email && <li className="flex items-center gap-2 break-all"><Mail className="w-3.5 h-3.5 text-[var(--c)] shrink-0" /> {profile.email}</li>}
              {(profile.address || profile.city) && (
                <li className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-[var(--c)] shrink-0 mt-0.5" /> {[profile.address, profile.city, profile.state, profile.pincode].filter(Boolean).join(', ')}</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-[13px] font-bold mb-2">Share Our Profile</h4>
            <div className="flex items-center gap-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(cardUrl)}`}
                alt="Profile QR code"
                className="w-20 h-20 rounded-md bg-white p-1"
              />
              <div className="space-y-2">
                <p className="text-[11px] text-white/75">Scan QR to open profile</p>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white text-[var(--c)] px-3 py-1.5 text-[12px] font-semibold">
                  <Share2 className="w-3.5 h-3.5" /> Share Profile
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-3 border-t border-white/10 text-center text-[11px] text-white/60">
          © {new Date().getFullYear()} {businessName}. All Rights Reserved.
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      {whatsapp && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sticky bottom-4 float-right mr-4 -mt-14 w-12 h-12 rounded-full bg-[#25D366] text-white shadow-xl flex items-center justify-center z-20"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}
    </div>
  );
};

export default TemplateWebsitePreview;
