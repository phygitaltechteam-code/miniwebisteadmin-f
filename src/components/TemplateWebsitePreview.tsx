import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cardUrlFor } from '@/utils/cardUrl';
import {
  Phone, MessageCircle, Send, ArrowRight, ChevronLeft, ChevronRight, Mail, MapPin, Menu, Star,
  Home, Building2, Factory, Briefcase, Camera, Fingerprint, Zap, Settings, ShieldCheck, Lightbulb,
  Sparkles, Leaf, Play, Facebook, Instagram, Youtube, Linkedin, Globe, Share2, Package,
  Link2, Twitter, Users, BookOpen, Calendar, ShoppingBag, Smartphone, Music, FileText, Image as ImageIcon,
  QrCode, Copy, Check, Landmark, Wallet, X, ZoomIn, Download,
} from 'lucide-react';
import { ProfileData, CardSectionKey, AboutBlockKey, DEFAULT_SECTION_ORDER, DEFAULT_ABOUT_BLOCK_ORDER } from '../types/profile';
import { getPortalTheme } from '../types/theme';
import { customLinkKeys } from '@/lib/api/customerSocialApi';
import { sortByOrder } from '@/lib/api/customerSettingsApi';

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

/** Trimmed, non-empty, de-duplicated values */
const uniq = (list: Array<string | undefined | null>) =>
  Array.from(new Set(list.map((v) => String(v ?? '').trim()).filter(Boolean)));

/** Show a saved phone number with +91 only when it has no country code of its own */
const displayPhone = (num: string) => (num.startsWith('+') || num.replace(/\D/g, '').length > 10 ? num : `+91-${num}`);

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

/** Link Store keys shown in the Links section, with their default label and icon */
const LINK_DEFS: Array<{ key: string; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'customLink', label: 'Custom Link', Icon: Link2 },
  { key: 'whatsappLinks', label: 'WhatsApp', Icon: MessageCircle },
  { key: 'emailLinks', label: 'Email', Icon: Mail },
  { key: 'callLinks', label: 'Call', Icon: Phone },
  { key: 'instagramLink', label: 'Instagram', Icon: Instagram },
  { key: 'facebookLink', label: 'Facebook', Icon: Facebook },
  { key: 'youTubeLink', label: 'YouTube', Icon: Youtube },
  { key: 'linkedinLink', label: 'LinkedIn', Icon: Linkedin },
  { key: 'twitter', label: 'Twitter / X', Icon: Twitter },
  { key: 'webSiteLink', label: 'Website', Icon: Globe },
  { key: 'location', label: 'Location', Icon: MapPin },
  { key: 'googleMyBussiness', label: 'Google Business', Icon: Star },
  { key: 'telegram', label: 'Telegram', Icon: Send },
  { key: 'whatsappGroup', label: 'WhatsApp Group', Icon: Users },
  { key: 'facebookGroup', label: 'Facebook Group', Icon: Users },
  { key: 'catalogue', label: 'Catalogue', Icon: BookOpen },
  { key: 'bookingLink', label: 'Booking', Icon: Calendar },
  { key: 'shopify', label: 'Shopify', Icon: ShoppingBag },
  { key: 'amazonLink', label: 'Amazon', Icon: ShoppingBag },
  { key: 'meshowLink', label: 'Meesho', Icon: ShoppingBag },
  { key: 'zomatoLink', label: 'Zomato', Icon: ShoppingBag },
  { key: 'swiggyLink', label: 'Swiggy', Icon: ShoppingBag },
  { key: 'uberLink', label: 'Uber', Icon: Link2 },
  { key: 'appStoreLink', label: 'App Store', Icon: Smartphone },
  { key: 'playStoreLink', label: 'Play Store', Icon: Play },
  { key: 'spotifyLink', label: 'Spotify', Icon: Music },
  { key: 'discordLink', label: 'Discord', Icon: MessageCircle },
  { key: 'slackLink', label: 'Slack', Icon: MessageCircle },
  { key: 'pdfLink', label: 'PDF', Icon: FileText },
  { key: 'videoLink', label: 'Video', Icon: Play },
  { key: 'imageLink', label: 'Image', Icon: ImageIcon },
  { key: 'goLink', label: 'Link', Icon: Link2 },
];

/** Preview section order when the builder has no saved sectionOrder */
const PREVIEW_DEFAULT_SECTION_ORDER: CardSectionKey[] = ['links', 'about', 'products', 'payment', 'gallery', 'youtube'];

/** Brand colours for the footer link icons; other links use the theme colour */
const LINK_BRAND_COLORS: Record<string, string> = {
  whatsappLinks: '#25D366',
  whatsappGroup: '#25D366',
  emailLinks: '#EA4335',
  callLinks: '#0EA5E9',
  instagramLink: '#E4405F',
  facebookLink: '#1877F2',
  facebookGroup: '#1877F2',
  youTubeLink: '#FF0000',
  linkedinLink: '#0A66C2',
  twitter: '#000000',
  telegram: '#229ED9',
  location: '#34A853',
  googleMyBussiness: '#4285F4',
  spotifyLink: '#1DB954',
  discordLink: '#5865F2',
  amazonLink: '#FF9900',
  zomatoLink: '#E23744',
  swiggyLink: '#FC8019',
};

/** Turn a saved link value into something clickable (email → mailto, number → tel / wa.me, bare domain → https) */
const linkHref = (key: string, value: string) => {
  const v = value.trim();
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
  if (key === 'emailLinks' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  if (/^\+?[\d\s-]{7,}$/.test(v)) {
    const digits = v.replace(/\D/g, '');
    return key.startsWith('whatsapp') ? `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}` : `tel:${v.replace(/[^\d+]/g, '')}`;
  }
  return `https://${v}`;
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

/**
 * Auto-advancing carousel index. With pauseOnHover it stops while the mouse is over it.
 * The timer restarts after every move, so a manual arrow/dot click gets a full interval before the next slide.
 */
const useAutoSlide = (count: number, visible: number, intervalMs = 3500, pauseOnHover = true) => {
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const canSlide = count > visible;

  useEffect(() => {
    if (!canSlide || (pauseOnHover && paused)) return;
    const t = setTimeout(() => setStart((s) => (s + 1) % count), intervalMs);
    return () => clearTimeout(t);
  }, [start, canSlide, paused, pauseOnHover, count, intervalMs]);

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
  const businessName = profile.businessName || '';
  const tagline = profile.tagline || profile.businessTagline || (profile.categories || []).slice(0, 2).join(' & ');
  const categories = (profile.categories || []).filter(Boolean);
  const hideBusinessNature = Boolean(profile.visibility?.hideBusinessNature);
  const kicker = (categories.length ? categories : hideBusinessNature ? [] : (profile.servicesOffered || []).slice(0, 3)).slice(0, 3).join(' | ').toUpperCase();
  const aboutHtml = profile.aboutNarrative || profile.aboutUsText || '';
  const about = stripHtml(aboutHtml);
  const heroText = about ? firstSentences(about) : '';
  const headings = profile.headings || ({} as ProfileData['headings']);

  // ── Contact details for the mobile profile card ──
  // Add the prefix (Mr. / Mrs. …) only when the saved name doesn't already start with it
  const baseName = ([profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.contactName || '').trim();
  const prefix = (profile.prefix || '').trim();
  const ownerName = prefix && baseName && !baseName.toLowerCase().startsWith(prefix.toLowerCase().replace(/\.$/, ''))
    ? `${prefix} ${baseName}`
    : baseName;
  // Designation is shown inside brackets, so drop any brackets it was saved with
  const designation = (profile.designation || '').trim().replace(/^\(+|\)+$/g, '').trim();
  const phones = uniq([
    profile.primaryPhone,
    profile.altPhone,
    profile.alternatePhone,
    ...(profile.extraPhones || []).map((p) => p?.phone),
    ...(profile.additionalPhones || []),
  ]);
  const emails = uniq([profile.email, ...(profile.extraEmails || []).map((e) => e?.email), ...(profile.additionalEmails || [])]);
  // City / state / pincode are added only when the address line doesn't already contain them
  const fullAddress = [
    profile.address,
    ...[profile.city, profile.state, profile.pincode].filter(
      (part) => part && !String(profile.address || '').toLowerCase().includes(String(part).toLowerCase())
    ),
  ].filter(Boolean).join(', ');
  const banners = [...(profile.banners || []), profile.bannerUrl].filter((b, i, arr): b is string => Boolean(b) && arr.indexOf(b) === i);
  const phone = (profile.primaryPhone || '').replace(/[^\d+]/g, '');
  const whatsapp = (profile.whatsappPhone || profile.whatsappNumber || profile.primaryPhone || '').replace(/\D/g, '');
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.length === 10 ? `91${whatsapp}` : whatsapp}` : '#';
  const enquireUrl = (subject: string) =>
    whatsapp ? `${whatsappUrl}?text=${encodeURIComponent(`Hi ${businessName}, I want to enquire about ${subject}.`)}` : '#';
  /** Product Enquire: WhatsApp with the product's saved enquiry message; no saved message = chat opens empty */
  const productEnquiryUrl = (message: string | undefined) => {
    const text = message?.trim();
    if (!whatsapp) return '#';
    return text ? `${whatsappUrl}?text=${encodeURIComponent(text)}` : whatsappUrl;
  };
  /** Saves the product image; opens it in a new tab when the file can't be fetched (CORS) */
  const downloadImage = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const a = document.createElement('a');
      a.href = href;
      a.download = `${(name || 'product').replace(/[^\w\s-]+/g, '').trim() || 'product'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  const cardUrl = cardUrlFor(profile.vanityUrl);
  const vis = profile.visibility || ({} as ProfileData['visibility']);

  // Business natures ("Our Services"); empty when Hide Business Nature is ticked in Card Settings
  const services = hideBusinessNature ? [] : (profile.servicesOffered || []).map((s) => String(s).trim()).filter(Boolean);
  const specialities = (profile.specialities || [])
    .map((s: any) => (typeof s === 'object' ? String(s.specialities || s.name || s.title || '') : String(s)).trim())
    .filter(Boolean);
  const products = (profile.products || []).filter((p) => p.status !== 'Draft');
  const gallery = (profile.galleryImages || []).filter((g) => g.url || g.image);
  const videos = (profile.youtubeVideos || []).filter((v) => v.url || v.videoUrl || v.embedUrl || v.videoId);

  const hiddenLinks = profile.hiddenLinks || [];

  // ── Gallery: View All toggles the full grid; clicking a photo opens the lightbox ──
  const bannerTouchX = useRef<number | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  // Single image popup (product photos)
  const [imagePopup, setImagePopup] = useState<{ src: string; title?: string } | null>(null);
  const stepLightbox = (dir: 1 | -1) =>
    setLightbox((i) => (i === null || gallery.length === 0 ? null : (i + dir + gallery.length) % gallery.length));
  const touchX = useRef<number | null>(null);
  useEffect(() => {
    if (lightbox === null) return;
    // Capture phase + stopPropagation so Esc closes only the photo, not the preview modal around it
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setLightbox(null);
      }
      if (e.key === 'ArrowRight') stepLightbox(1);
      if (e.key === 'ArrowLeft') stepLightbox(-1);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [lightbox, gallery.length]);

  // Mobile: the header stays hidden while the top of the profile card (logo + name) is on screen
  // and slides in as soon as that part is scrolled past (not only after the whole contact list)
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardInView, setCardInView] = useState(true);
  useEffect(() => {
    if (!isMobile || !cardRef.current) {
      setCardInView(false);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setCardInView(entry.isIntersecting));
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isMobile]);
  const headerHidden = isMobile && cardInView;

  // Enquiry + feedback forms
  const [enquiry, setEnquiry] = useState({ name: '', phone: '', email: '', message: '' });
  const [feedback, setFeedback] = useState({ rating: 0, hover: 0, name: '', message: '', sent: false });
  const sendEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const text = [
      `Hi ${businessName}, I have an enquiry.`,
      `Name: ${enquiry.name}`,
      `Phone: ${enquiry.phone}`,
      enquiry.email && `Email: ${enquiry.email}`,
      enquiry.message && `Message: ${enquiry.message}`,
    ].filter(Boolean).join('\n');
    if (whatsapp) window.open(`${whatsappUrl}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    else if (profile.email) window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent('Enquiry')}&body=${encodeURIComponent(text)}`;
    setEnquiry({ name: '', phone: '', email: '', message: '' });
  };
  const inputClass = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] text-[#0B1B33] placeholder:text-slate-400 transition-colors focus:outline-none focus:bg-white focus:border-[var(--c)] focus:ring-2 focus:ring-[var(--cs)]';

  // ── Carousels (visible count depends on the preview device) ──
  // Banners keep sliding even under the mouse (the banner fills the width where the pointer usually rests,
  // and on touch screens a tap counts as a hover that never ends)
  const bannerSlider = useAutoSlide(banners.length, 1, 4000, false);

  const cssVars = {
    '--c': palette.primary,
    '--cd': palette.dark,
    '--cs': palette.soft,
    '--b1': palette.bannerFrom,
    '--b2': palette.bannerTo,
  } as React.CSSProperties;

  // ── Links saved in Link Store (not unticked), in the saved link order ──
  const savedLinks = sortByOrder(
    LINK_DEFS.flatMap((d) => (d.key === 'customLink' ? customLinkKeys(profile).map((key) => ({ ...d, key })) : [d])),
    profile.linkOrder,
    (d) => d.key
  )
    .map((d) => {
      const url = String((profile as any)[d.key] || profile.linksDetails?.[d.key]?.url || '').trim();
      return { ...d, url, label: profile.linksDetails?.[d.key]?.name || d.label, logo: profile.linksDetails?.[d.key]?.icon };
    })
    .filter((l) => l.url && !hiddenLinks.includes(l.key));

  // ── Payment details (wallets unticked in Payment & QR are left out) ──
  const hiddenPayments = profile.hiddenPayments || [];
  const wallets = [
    { id: 'paytm', name: profile.paytmQrProviderName || 'Paytm', phone: profile.paytmPhone, qr: profile.paytmQrUrl },
    { id: 'phonePe', name: profile.phonePeQrProviderName || 'PhonePe', phone: profile.phonePePhone, qr: profile.phonePeQrUrl },
    { id: 'gPay', name: profile.gPayQrProviderName || 'Google Pay', phone: profile.gPayPhone, qr: profile.gPayQrUrl },
  ].filter((w) => !hiddenPayments.includes(w.id) && (w.phone || w.qr));
  const upiPhone = profile.paymentPhoneNo || profile.upiNumber;
  const bankRows = [
    ['Bank Name', profile.bankName],
    ['Account Holder', profile.bankHolderName || profile.accountHolderName],
    ['Account Number', profile.bankAccountNumber || profile.accountNumber],
    ['IFSC Code', profile.bankIfscCode || profile.ifscCode],
    ['Account Type', (profile.bankName || profile.bankAccountNumber || profile.accountNumber) && profile.accountType],
  ].filter((r): r is [string, string] => Boolean(r[1]));
  // No QR code saved → only the bank details are shown (UPI / phone / wallets left out)
  const showUpiBlock = wallets.some((w) => w.qr) || bankRows.length === 0;

  // ── Which sections render (the nav only lists these) ──
  const show = {
    home: true,
    links: !vis.hideLinksSection && savedLinks.length > 0,
    about: !vis.hideAboutSection && ((isMobile && Boolean(about || profile.establishmentYear || profile.gstNumber)) || services.length > 0 || specialities.length > 0),
    products: !vis.hideProductsSection && products.length > 0,
    payment: !vis.hidePaymentSection && (wallets.length > 0 || Boolean(profile.upiId || upiPhone) || bankRows.length > 0),
    gallery: !vis.hideGallerySection && gallery.length > 0,
    videos: !vis.hideYoutubeSection && videos.length > 0,
    feedback: !vis.hideFeedbackSection,
    enquiry: !vis.hideEnquirySection,
    share: !vis.hideShareSection,
  };
  // ── Section order from the builder's drag & drop (sectionOrder / aboutBlockOrder, settings API) ──
  // Without a saved order: Links, About, Products, Payment, Gallery, Videos. Feedback, Enquiry and Share stay last.
  const sectionOrder: CardSectionKey[] = [
    ...(profile.sectionOrder?.length ? profile.sectionOrder : PREVIEW_DEFAULT_SECTION_ORDER),
    ...DEFAULT_SECTION_ORDER.filter((k) => !(profile.sectionOrder || []).includes(k)),
  ].filter((k, i, arr) => arr.indexOf(k) === i);
  const sectionRank = (key: CardSectionKey) => sectionOrder.indexOf(key) + 1;
  const aboutBlockOrder: AboutBlockKey[] = [
    ...(profile.aboutBlockOrder || []),
    ...DEFAULT_ABOUT_BLOCK_ORDER.filter((k) => !(profile.aboutBlockOrder || []).includes(k)),
  ];
  const aboutRank = (key: AboutBlockKey) => aboutBlockOrder.indexOf(key) + 1;
  const navRank = (id: string) =>
    id === 'home' ? 0
      : id === 'videos' ? sectionRank('youtube')
      : (sectionOrder as string[]).includes(id) ? sectionRank(id as CardSectionKey)
      : 100 + ['feedback', 'enquiry', 'share'].indexOf(id);

  const labels = profile.navLabels || ({} as ProfileData['navLabels']);
  const navItems = [
    { id: 'home', label: labels.home || 'Home' },
    { id: 'links', label: labels.links || 'Links' },
    { id: 'about', label: labels.about || 'About Us' },
    { id: 'products', label: labels.products || 'Products' },
    { id: 'payment', label: labels.payment || 'Payment' },
    { id: 'gallery', label: labels.gallery || 'Image Gallery' },
    { id: 'videos', label: labels.videos || 'Videos' },
    { id: 'feedback', label: labels.feedback || 'Feedback' },
    { id: 'enquiry', label: labels.enquiry || 'Enquiry Form' },
    { id: 'share', label: 'Share' },
  ]
    .filter((n) => show[n.id as keyof typeof show])
    .sort((a, b) => navRank(a.id) - navRank(b.id));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeNav, setActiveNav] = useState('home');
  const goTo = (id: string) => {
    setActiveNav(id);
    setMenuOpen(false);
    rootRef.current?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [copied, setCopied] = useState(false);

  // ── Small building blocks ──
  const SectionTitle: React.FC<{ first: string; second: string; sub?: string; action?: string; onAction?: () => void }> = ({ first, second, sub, action, onAction }) => (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div className="min-w-0 border-l-4 border-[var(--c)] pl-2.5">
        <h2 className={`${isMobile ? 'text-[19px]' : 'text-[24px]'} font-extrabold text-[#0B1B33] leading-tight`}>
          {first} <span className="text-[var(--c)]">{second}</span>
        </h2>
        {sub && <p className="text-[12px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 inline-flex items-center gap-1 rounded-md border border-[var(--c)] px-2.5 py-1 text-[11px] font-semibold text-[var(--c)] hover:bg-[var(--c)] hover:text-white transition-colors"
        >
          {action} <ArrowRight className="w-3 h-3" />
        </button>
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

  /** Saved section heading (or the default) split into the plain first part and the accent-coloured last word */
  const titleParts = (saved: string | undefined, fallback: string) => {
    const words = (saved?.trim() || fallback).split(/\s+/);
    return { first: words.slice(0, -1).join(' '), second: words[words.length - 1] };
  };

  const pad = isMobile ? 'px-4' : 'px-8';

  return (
    <div ref={rootRef} style={cssVars} className="w-full bg-[#F4F7FB] text-[#0B1B33] font-['Poppins','Roboto',Helvetica,Arial,sans-serif]">
      <style>{TEMPLATE_KEYFRAMES}</style>

      {/* ─── Header (on mobile it takes no space and slides in after the profile card) ─── */}
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

      {/* ─── Mobile: profile card (logo, name, owner, contacts) ─── */}
      {isMobile && (
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
              { Icon: Phone, items: phones.map((p) => ({ label: displayPhone(p), href: `tel:${p.replace(/[^\d+]/g, '')}` })) },
              { Icon: Mail, items: emails.map((e) => ({ label: e, href: `mailto:${e}` })) },
              { Icon: MessageCircle, items: whatsapp ? [{ label: displayPhone(whatsapp.slice(-10)), href: whatsappUrl }] : [] },
              { Icon: MapPin, items: fullAddress ? [{ label: fullAddress, href: profile.mapLink || '' }] : [] },
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
      )}

      {/* ─── Banner carousel: auto-sliding (mobile: under the profile card; desktop: full width above the hero) ─── */}
      {banners.length > 0 && (
        <section className={isMobile ? 'bg-white px-4 pb-5' : 'bg-[var(--b1)]'}>
          <div
            className={`group relative overflow-hidden bg-slate-100 ${isMobile ? 'rounded-2xl shadow-lg aspect-[16/9]' : 'aspect-[3/1]'}`}
            {...bannerSlider.hoverProps}
            onTouchStart={(e) => { bannerTouchX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (bannerTouchX.current === null) return;
              const dx = e.changedTouches[0].clientX - bannerTouchX.current;
              if (Math.abs(dx) > 40) (dx < 0 ? bannerSlider.next : bannerSlider.prev)();
              bannerTouchX.current = null;
            }}
          >
            {/* Sliding track: every banner side by side, moved by translateX */}
            <div
              className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `translateX(-${bannerSlider.start * 100}%)` }}
            >
              {banners.map((b, i) => (
                // A single banner stays still; two or more slide
                <img key={`${b}-${i}`} src={b} alt="" className="w-full h-full shrink-0 object-cover" draggable={false} />
              ))}
            </div>
            {!isMobile && banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={bannerSlider.prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/35 hover:bg-[var(--c)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={bannerSlider.next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/35 hover:bg-[var(--c)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Next banner"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            {banners.length > 1 && (
              <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => bannerSlider.goTo(i)}
                    className={`h-1.5 rounded-full shadow transition-all duration-300 ${i === bannerSlider.start ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
                    aria-label={`Banner ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Hero banner ─── */}
      {!isMobile && (
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
            </div>
          </div>
        </div>
      </section>
      )}

      <main className={`${pad} py-6 flex flex-col gap-8 [&_[data-section]]:scroll-mt-16`}>
        {/* ─── Links (saved in Link Store and ticked to show) ─── */}
        {show.links && (
          <section data-section="links" style={{ order: sectionRank("links") }}>
            <SectionTitle {...titleParts(headings.linksHeading, 'Quick Links')} />
            <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${isMobile ? 2 : isTablet ? 3 : 4}, minmax(0, 1fr))` }}>
              {savedLinks.map(({ key, label, url, logo, Icon }) => {
                const href = linkHref(key, url);
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
        )}

        {show.about && (
        <div data-section="about" className="flex flex-col gap-8" style={{ order: sectionRank("about") }}>
        {/* ─── Mobile: full About Us ─── */}
        {isMobile && !vis.hideAboutSection && (about || profile.establishmentYear || profile.gstNumber) && (
          <section style={{ order: aboutRank("about") }}>
            <SectionTitle {...titleParts(headings.aboutUsHeading, 'About Us')} />
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
                className="rounded-xl bg-white border border-slate-200 p-3.5 text-[13px] leading-relaxed text-slate-700 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: aboutHtml }}
              />
            )}
          </section>
        )}

        {/* ─── Our Services: simple tiles like Specializations (no images) ─── */}
        {!vis.hideAboutSection && services.length > 0 && (
          <section style={{ order: aboutRank("services") }}>
            <SectionTitle first="Our" second="Services" />
            <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${isMobile || isTablet ? 4 : 8}, minmax(0, 1fr))` }}>
              {services.map((srv, i) => {
                const Icon = iconFor(srv, i);
                return (
                  <div key={`${srv}-${i}`} className="rounded-xl bg-white border border-slate-200 px-1.5 py-3 flex flex-col items-center text-center gap-1.5 hover:border-[var(--c)] transition-colors">
                    <Icon className={`${isMobile ? "w-5 h-5" : "w-7 h-7"} text-[var(--c)]`} />
                    <span className={`${isMobile ? "text-[9.5px]" : "text-[11.5px]"} font-semibold text-[#0B1B33] leading-tight line-clamp-2`}>{srv}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Our Specializations ─── */}
        {!vis.hideAboutSection && specialities.length > 0 && (
          <section style={{ order: aboutRank("specialities") }}>
            <SectionTitle first="Our" second="Specializations" sub={headings.specialitiesSubheading || undefined} />
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
        </div>
        )}

        {/* ─── Our Products (every product: list on mobile, grid on desktop) ─── */}
        {show.products && (
          <section data-section="products" style={{ order: sectionRank("products") }}>
            <SectionTitle {...titleParts(headings.productsHeading, 'Our Products')} />
            <div>
              <div className="grid gap-3" style={{ gridTemplateColumns: isMobile ? '1fr' : `repeat(${isTablet ? 3 : 4}, minmax(0, 1fr))` }}>
                {products.map((p, idx) => {
                  const name = p.name || p.title;
                  const price = formatPrice(p.price, p.currency);
                  const img = p.image || p.images?.[0];
                  return (
                    <div key={`${p.id}-${idx}`} className={`group rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[var(--c)] transition-all overflow-hidden flex ${isMobile ? 'flex-row' : 'flex-col'}`}>
                      <div className={`${isMobile ? 'w-32 shrink-0' : 'aspect-[4/3]'} bg-[var(--cs)] flex items-center justify-center overflow-hidden`}>
                        {img ? <img src={img} alt={name} onClick={() => setImagePopup({ src: img, title: name })} className="w-full h-full object-contain cursor-zoom-in" /> : <Package className="w-8 h-8 text-[var(--c)] opacity-60" />}
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col min-w-0">
                        <h3 className="text-[12.5px] font-bold text-[#0B1B33] leading-tight line-clamp-1">{name}</h3>
                        {p.description && <p className="mt-0.5 text-[10.5px] text-slate-500 leading-snug line-clamp-2">{stripHtml(p.description)}</p>}
                        <div className="mt-auto pt-2 flex items-center justify-between gap-1.5">
                          {price && <span className="text-[13px] font-extrabold text-[#0B1B33]">{price}</span>}
                          <div className="ml-auto flex items-center gap-1.5">
                            {/* Download shown only while the product's "hide download" option is off */}
                            {img && !(p.isHideDownloadProductCart ?? p.hideDownload) && (
                              <button
                                type="button"
                                onClick={() => downloadImage(img, name)}
                                title="Download"
                                aria-label={`Download ${name}`}
                                className="w-6 h-6 rounded-full border border-[var(--c)] text-[var(--c)] hover:bg-[var(--c)] hover:text-white flex items-center justify-center transition-colors"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            )}
                            {!(p.isHideEnquiry ?? p.hideEnquiry) && (
                              <a href={productEnquiryUrl(p.customEnquiryMessage)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-[var(--c)] hover:bg-[var(--cd)] px-2 py-1 text-[10.5px] font-semibold text-white">
                                <Mail className="w-3 h-3" /> Enquire
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ─── Payment (UPI, wallets ticked to show, bank details) ─── */}
        {show.payment && (
          <section data-section="payment" style={{ order: sectionRank("payment") }}>
            <SectionTitle {...titleParts(headings.paymentHeading, 'Payment Details')} />
            {/* Desktop: UPI + wallets on the left, bank details on the right; mobile: stacked */}
            <div
              className={
                !isMobile && bankRows.length > 0 && showUpiBlock && (wallets.length > 0 || profile.upiId || upiPhone)
                  ? 'grid grid-cols-2 gap-4 items-start'
                  : 'space-y-3'
              }
            >
              {showUpiBlock && (profile.upiId || upiPhone || wallets.length > 0) && (
              <div className="space-y-3 min-w-0">
              {(profile.upiId || upiPhone) && (
                <div className="flex flex-wrap gap-2">
                  {profile.upiId && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-2 text-[12.5px]">
                      <Wallet className="w-4 h-4 text-[var(--c)]" /> UPI ID: <b className="font-semibold">{profile.upiId}</b>
                    </span>
                  )}
                  {upiPhone && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-2 text-[12.5px]">
                      <Phone className="w-4 h-4 text-[var(--c)]" /> {displayPhone(upiPhone)}
                    </span>
                  )}
                </div>
              )}
              {wallets.length > 0 && (
                <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${isMobile ? Math.min(wallets.length, 2) : 3}, minmax(0, 1fr))` }}>
                  {wallets.map((w) => (
                    <div key={w.id} className="rounded-xl bg-white border border-slate-200 shadow-sm p-3 flex flex-col items-center text-center gap-1.5">
                      <span className="text-[13px] font-bold text-[#0B1B33]">{w.name}</span>
                      {w.qr ? (
                        <img src={w.qr} alt={`${w.name} QR`} className="w-28 h-28 object-contain rounded-md border border-slate-100 bg-white p-1" />
                      ) : (
                        <span className="w-28 h-28 rounded-md bg-[var(--cs)] flex items-center justify-center">
                          <QrCode className="w-10 h-10 text-[var(--c)] opacity-50" />
                        </span>
                      )}
                      {w.phone && <span className="text-[12px] text-slate-600">{displayPhone(w.phone)}</span>}
                    </div>
                  ))}
                </div>
              )}
              </div>
              )}
              {bankRows.length > 0 && (
                <div className={`rounded-xl bg-white border border-slate-200 border-t-4 border-t-[var(--c)] shadow-sm p-4 min-w-0 ${isMobile ? '' : 'max-w-2xl'}`}>
                  <div className="flex items-center gap-2 mb-3 text-[14px] font-bold text-[#0B1B33]">
                    <span className="w-8 h-8 rounded-full bg-[var(--cs)] flex items-center justify-center">
                      <Landmark className="w-4 h-4 text-[var(--c)]" />
                    </span>
                    Bank Details
                  </div>
                  <dl className="divide-y divide-slate-100 text-[13px]">
                    {bankRows.map(([label, value]) => (
                      <div key={label} className="flex items-baseline justify-between gap-4 py-2">
                        <dt className="text-slate-500 shrink-0">{label}</dt>
                        <dd className="font-semibold text-[#0B1B33] text-right break-all">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── Photo Gallery (every photo; click opens the lightbox) ─── */}
            {show.gallery && (
              <section data-section="gallery" style={{ order: sectionRank("gallery") }}>
                <SectionTitle {...titleParts(headings.galleryHeading, 'Photo Gallery')} />
                  <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${isMobile ? 3 : isTablet ? 4 : 5}, minmax(0, 1fr))` }}>
                    {gallery.map((g, idx) => (
                      <button
                        key={`${g.id}-${idx}`}
                        type="button"
                        onClick={() => setLightbox(idx)}
                        aria-label={g.title || `Open photo ${idx + 1}`}
                        className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md text-left tpl-fade-in"
                      >
                        <img src={g.url || g.image} alt={g.title || ''} className="w-full aspect-[4/3] object-contain bg-[var(--cs)]" />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-[#0B1B33] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </span>
                        {g.title && (
                          <span className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 text-[11px] font-semibold text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                            {g.title}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
              </section>
            )}

        {/* ─── YouTube Videos (every video) ─── */}
            {show.videos && (
              <section data-section="videos" style={{ order: sectionRank("youtube") }}>
                <SectionTitle {...titleParts(headings.youtubeVideosHeading, 'YouTube Videos')} />
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${isMobile ? 2 : isTablet ? 3 : 4}, minmax(0, 1fr))` }}>
                  {videos.map((v) => {
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

        {/* ─── Feedback + Enquiry forms (feedback first via grid order) ─── */}
        {(show.enquiry || show.feedback) && (
          <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`} style={{ order: 100 }}>
            {show.enquiry && (
              <section data-section="enquiry" className="order-2">
                <SectionTitle {...titleParts(headings.enquirySectionHeading, 'Send Enquiry')} />
                <form onSubmit={sendEnquiry} className="rounded-2xl border border-slate-200 border-t-4 border-t-[var(--c)] bg-white p-5 shadow-sm space-y-3">
                  <input required value={enquiry.name} onChange={(e) => setEnquiry({ ...enquiry, name: e.target.value })} placeholder="Enter Full Name" className={inputClass} />
                  <input required type="tel" value={enquiry.phone} onChange={(e) => setEnquiry({ ...enquiry, phone: e.target.value })} placeholder="Enter Mobile Number" className={inputClass} />
                  <input type="email" value={enquiry.email} onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })} placeholder="Enter Email" className={inputClass} />
                  <textarea value={enquiry.message} onChange={(e) => setEnquiry({ ...enquiry, message: e.target.value })} placeholder="Enter your comment" rows={3} className={inputClass} />
                  <button type="submit" className="w-full rounded-lg bg-[var(--c)] hover:bg-[var(--cd)] px-5 py-3 shadow-sm transition-colors text-[13px] font-semibold text-white">
                    Send Enquiry
                  </button>
                </form>
              </section>
            )}

            {show.feedback && (
              <section data-section="feedback" className="order-1">
                <SectionTitle {...titleParts(headings.feedbackHeading, 'Give Feedback')} />
                <div className="rounded-2xl border border-slate-200 border-t-4 border-t-[var(--c)] bg-white p-5 shadow-sm">
                  {feedback.sent ? (
                    <p className="py-6 text-center text-[13px] font-semibold text-[var(--c)]">Thank you for your feedback!</p>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setFeedback({ rating: 0, hover: 0, name: '', message: '', sent: true });
                      }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <div className="flex" onMouseLeave={() => setFeedback({ ...feedback, hover: 0 })}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setFeedback({ ...feedback, rating: n })}
                              onMouseEnter={() => setFeedback({ ...feedback, hover: n })}
                              aria-label={`${n} star${n > 1 ? 's' : ''}`}
                            >
                              <Star className={`w-6 h-6 text-amber-400 ${n <= (feedback.hover || feedback.rating) ? 'fill-amber-400' : ''}`} />
                            </button>
                          ))}
                        </div>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                          {feedback.rating ? `${feedback.rating} / 5` : 'Select a Rating'}
                        </span>
                      </div>
                      <input required value={feedback.name} onChange={(e) => setFeedback({ ...feedback, name: e.target.value })} placeholder="Enter Full Name" className={inputClass} />
                      <textarea required value={feedback.message} onChange={(e) => setFeedback({ ...feedback, message: e.target.value })} placeholder="Enter your feedback" rows={3} className={inputClass} />
                      <button
                        type="submit"
                        disabled={!feedback.rating}
                        className="w-full rounded-lg bg-[var(--c)] hover:bg-[var(--cd)] px-5 py-3 shadow-sm transition-colors text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Give Feedback
                      </button>
                    </form>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ─── Share ─── */}
        {show.share && (
          <section data-section="share" style={{ order: 101 }}>
            <SectionTitle first="Share Our" second="Profile" />
            <div className="rounded-xl bg-white border border-slate-200 p-4 flex items-center gap-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(cardUrl)}`}
                alt="Profile QR code"
                className="w-24 h-24 shrink-0 rounded-md border border-slate-100 p-1"
              />
              <div className="min-w-0 space-y-2">
                <p className="text-[12px] text-slate-500">Scan the QR or share the link</p>
                <p className="text-[12px] font-semibold text-[#0B1B33] truncate">{cardUrl}</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${businessName} ${cardUrl}`.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-[12px] font-semibold text-white"
                  >
                    <Share2 className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(cardUrl).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }).catch(() => {});
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--c)] hover:bg-[var(--cd)] px-3 py-1.5 text-[12px] font-semibold text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ─── Footer ─── */}
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
            {savedLinks.length > 0 && (
              <>
                <h4 className="mt-4 text-[13px] font-bold mb-2">Connect With Us</h4>
                <div className="flex flex-wrap gap-2">
                  {savedLinks.map(({ key, label, url, logo, Icon }) => {
                    const href = linkHref(key, url);
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
              {profile.primaryPhone && <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[var(--c)]" /> {displayPhone(profile.primaryPhone)}</li>}
              {whatsapp && <li className="flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5 text-[var(--c)]" /> {displayPhone(whatsapp.slice(-10))}</li>}
              {profile.email && <li className="flex items-center gap-2 break-all"><Mail className="w-3.5 h-3.5 text-[var(--c)] shrink-0" /> {profile.email}</li>}
              {fullAddress && (
                <li className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-[var(--c)] shrink-0 mt-0.5" /> {fullAddress}</li>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-5 pt-3 border-t border-white/10 text-center text-[11px] text-white/60">
          © {new Date().getFullYear()} {businessName}. All Rights Reserved.
        </div>
      </footer>

      {/* ─── Gallery lightbox ─── */}
      {lightbox !== null && gallery[lightbox] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[80] flex flex-col bg-black/90 backdrop-blur-sm text-white tpl-fade-in"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <span className="text-[13px] font-medium text-white/80">
              {lightbox + 1} / {gallery.length}
            </span>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image + arrows (swipe on touch) */}
          <div
            className={`relative flex-1 min-h-0 flex items-center justify-center ${isMobile ? 'px-3' : 'px-16'}`}
            onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 40) stepLightbox(dx < 0 ? 1 : -1);
              touchX.current = null;
            }}
          >
            <img
              key={lightbox}
              src={gallery[lightbox].url || gallery[lightbox].image}
              alt={gallery[lightbox].title || ''}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl tpl-fade-in"
            />
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); stepLightbox(-1); }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-[var(--c)] flex items-center justify-center transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); stepLightbox(1); }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-[var(--c)] flex items-center justify-center transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Caption + thumbnails */}
          <div className="px-4 pt-3 pb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            {(gallery[lightbox].title || gallery[lightbox].description) && (
              <div className="text-center">
                {gallery[lightbox].title && <p className="text-[14px] font-semibold">{gallery[lightbox].title}</p>}
                {gallery[lightbox].description && <p className="text-[12px] text-white/70 mt-0.5">{gallery[lightbox].description}</p>}
              </div>
            )}
            {gallery.length > 1 && (
              <div className="overflow-x-auto pb-1">
                <div className="flex w-max mx-auto gap-2">
                {gallery.map((g, i) => (
                  <button
                    key={`${g.id}-thumb-${i}`}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className={`shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${i === lightbox ? 'border-[var(--c)] opacity-100' : 'border-transparent opacity-50 hover:opacity-90'}`}
                    aria-label={`Photo ${i + 1}`}
                  >
                    <img src={g.url || g.image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Product image popup ─── */}
      {imagePopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={() => setImagePopup(null)}
          className="fixed inset-0 z-[80] flex flex-col bg-black/90 backdrop-blur-sm text-white tpl-fade-in"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-[14px] font-semibold truncate">{imagePopup.title}</span>
            <button
              type="button"
              onClick={() => setImagePopup(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className={`flex-1 min-h-0 flex items-center justify-center pb-6 ${isMobile ? "px-3" : "px-16"}`}>
            <img src={imagePopup.src} alt={imagePopup.title || ""} onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl tpl-fade-in" />
          </div>
        </div>
      )}

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
