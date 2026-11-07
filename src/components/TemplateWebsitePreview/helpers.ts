import { htmlToText } from '@/utils/richText';
import { Home, Building2, Factory, Briefcase, Camera, Fingerprint, Zap, Settings, ShieldCheck, Lightbulb, Sparkles, Leaf } from 'lucide-react';

export const stripHtml = (html?: string) => htmlToText(html);

export const firstSentences = (text: string, max = 160) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '));
  return end > 60 ? cut.slice(0, end + 1) : `${cut.trim()}…`;
};

/** Trimmed, non-empty, de-duplicated values */
export const uniq = (list: Array<string | undefined | null>) =>
  Array.from(new Set(list.map((v) => String(v ?? '').trim()).filter(Boolean)));

/** Show a saved phone number with +91 only when it has no country code of its own */
export const displayPhone = (num: string) => (num.startsWith('+') || num.replace(/\D/g, '').length > 10 ? num : `+91-${num}`);

export const youtubeId = (url?: string) => {
  if (!url) return '';
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : '';
};

export const formatPrice = (price?: string | number, currency?: string) => {
  if (price === undefined || price === null || price === '') return '';
  const num = Number(price);
  const value = Number.isNaN(num) ? String(price) : num.toLocaleString('en-IN');
  return (currency || 'INR') === 'INR' ? `₹ ${value}` : `${currency} ${value}`;
};

/** Add a prefilled message to a WhatsApp chat link that doesn't carry one already */
const withWhatsappText = (url: string, text?: string) => {
  if (!text || !/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(url) || /[?&]text=/i.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`;
};

/** Phone number → tel: link (dialler) */
export const telHref = (num: string) => `tel:${num.replace(/[^\d+]/g, '')}`;

/** Phone number → WhatsApp chat (10 digits get the 91 country code), optionally with a prefilled message */
export const whatsappHref = (num: string, text?: string) => {
  const digits = num.replace(/\D/g, '');
  return withWhatsappText(`https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`, text);
};

/** Address → saved map link when it is a URL, otherwise a Google Maps search for the address */
export const mapsHref = (address: string, mapLink?: string) => {
  const link = String(mapLink ?? '').trim();
  if (/^https?:\/\//i.test(link)) return link;
  if (link && /^[\w-]+(\.[\w-]+)+(\/|$)/.test(link)) return `https://${link}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
};

/** Profile URL prefix for a bare username / @handle saved in a social link */
const SOCIAL_BASE: Record<string, string> = {
  instagramLink: 'https://instagram.com/',
  facebookLink: 'https://facebook.com/',
  facebookGroup: 'https://facebook.com/groups/',
  twitter: 'https://x.com/',
  youTubeLink: 'https://youtube.com/@',
  linkedinLink: 'https://linkedin.com/in/',
  telegram: 'https://t.me/',
};

/**
 * Turn a saved link value into something clickable: email → mailto, number → tel / wa.me,
 * address (Location) → Google Maps, @handle → the social profile, bare domain → https.
 * `whatsappText` is prefilled in WhatsApp chat links.
 */
export const linkHref = (key: string, value: string, whatsappText?: string) => {
  const v = value.trim();
  if (!v) return '#';
  if (/^(https?:|mailto:|tel:|sms:|whatsapp:|geo:)/i.test(v)) return withWhatsappText(v, whatsappText);
  if (key === 'emailLinks' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v.replace(/^mailto:/i, '')}`;
  // Phone number: WhatsApp keys open a chat, everything else (Call) opens the dialler
  if (/^\+?[\d\s()-]{7,}$/.test(v)) {
    return key.startsWith('whatsapp') ? whatsappHref(v, whatsappText) : telHref(v);
  }
  const looksLikeDomain = /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v) || /^www\./i.test(v);
  // Location / Google Business saved as an address (not a URL) → Maps search
  if ((key === 'location' || key === 'googleMyBussiness') && !looksLikeDomain) return mapsHref(v);
  // Social link saved as a username or @handle → that profile
  if (SOCIAL_BASE[key] && !looksLikeDomain && !v.includes('/') && !/\s/.test(v)) {
    return `${SOCIAL_BASE[key]}${v.replace(/^@/, '')}`;
  }
  return withWhatsappText(`https://${v}`, whatsappText);
};

const ICON_SET = [Home, Building2, Factory, Briefcase, Camera, Fingerprint, Zap, Settings, ShieldCheck, Lightbulb, Leaf, Sparkles];

/** Pick an icon that matches the words in a label, falling back to a rotating set */
export const iconFor = (label: string, index: number) => {
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

/** All distinct images of a product (main image first) */
export const productImages = (p: { image?: string; images?: string[] }) =>
  Array.from(new Set([p.image, ...(p.images || [])].filter((u): u is string => Boolean(u))));

/** Saves the product image; opens it in a new tab when the file can't be fetched (CORS) */
export const downloadImage = async (url: string, name: string) => {
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

/** Saved section heading (or the default) split into the plain first part and the accent-coloured last word */
export const titleParts = (saved: string | undefined, fallback: string) => {
  const words = (saved?.trim() || fallback).split(/\s+/);
  return { first: words.slice(0, -1).join(' '), second: words[words.length - 1] };
};

/** Copies the card link and flips the "Copied" flag for 1.5 s */
export const copyCardLink = (cardUrl: string, setCopied: (v: boolean) => void) => {
  navigator.clipboard?.writeText(cardUrl).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }).catch(() => {});
};

export const INPUT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] text-[#0B1B33] placeholder:text-slate-400 transition-colors focus:outline-none focus:bg-white focus:border-[var(--c)] focus:ring-2 focus:ring-[var(--cs)]';
