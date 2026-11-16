import React, { useEffect, useRef, useState } from 'react';
import { cardUrlFor } from '@/utils/cardUrl';
import {
  submitPublicFeedback,
  submitPublicEnquiry,
  submitContactExchange,
  feedbackErrorText,
  exchangeErrorText,
  PublicFeedback,
  trackCardEvent,
  cardEventForHref,
  vcardUrl,
} from '@/lib/api/publicFeedbackApi';
import { customLinkKeys } from '@/lib/api/customerSocialApi';
import { sortByOrder } from '@/lib/api/customerSettingsApi';
import { ProfileData, CardSectionKey, AboutBlockKey, DEFAULT_SECTION_ORDER, DEFAULT_ABOUT_BLOCK_ORDER } from '@/types/profile';
import { TEMPLATE_PALETTES, paletteForTheme } from './palette';
import { LINK_DEFS, PREVIEW_DEFAULT_SECTION_ORDER } from './linkDefs';
import { stripHtml, firstSentences, uniq } from './helpers';
import { useAutoSlide } from './useAutoSlide';

export type ViewMode = 'mobile' | 'tablet' | 'desktop';

/** ?review=1 (the {review_link} in follow-up messages) or #feedback / #reviews in the page URL */
export const wantsReviewSection = (): boolean => {
  try {
    const review = new URLSearchParams(window.location.search).get('review');
    return review === '1' || review === 'true' || /^#(feedback|reviews?)$/i.test(window.location.hash);
  } catch {
    return false;
  }
};

/** Everything the website template renders: data from the builder profile, UI state and form handlers */
export const useTemplateModel = (
  profile: ProfileData,
  themeId: string | undefined,
  viewMode: ViewMode,
  feedbackTarget: string | undefined,
  initialFeedbacks: PublicFeedback[]
) => {
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
  const savedHeadings = profile.headings || ({} as ProfileData['headings']);
  // The section is called Reviews now; cards still holding the old default heading show the new one
  const headings = /^customer feedback$/i.test(String(savedHeadings.feedbackHeading || '').trim())
    ? { ...savedHeadings, feedbackHeading: 'Customer Reviews' }
    : savedHeadings;

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
  const whatsappBase = `https://wa.me/${whatsapp.length === 10 ? `91${whatsapp}` : whatsapp}`;
  /** Prefilled message for the plain WhatsApp buttons, so the business knows where the contact came from */
  const whatsappGreeting = `Hi ${businessName}, I got your contact from your digital card.`;
  const whatsappUrl = whatsapp ? `${whatsappBase}?text=${encodeURIComponent(whatsappGreeting)}` : '#';
  const enquireUrl = (subject: string) =>
    whatsapp ? `${whatsappBase}?text=${encodeURIComponent(`Hi ${businessName}, I want to enquire about ${subject}.`)}` : '#';
  /** Product Enquire: WhatsApp with the product's saved enquiry message; no saved message = chat opens empty */
  const productEnquiryUrl = (message: string | undefined) => {
    const text = message?.trim();
    if (!whatsapp) return '#';
    return text ? `${whatsappBase}?text=${encodeURIComponent(text)}` : whatsappBase;
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

  // ── Gallery: clicking a photo opens the lightbox ──
  const [lightbox, setLightbox] = useState<number | null>(null);
  // Single image popup (product photos)
  const [imagePopup, setImagePopup] = useState<{ src: string; title?: string } | null>(null);
  // Product details popup (image, price, full formatted description, Enquire / Download)
  const [productPopup, setProductPopup] = useState<ProfileData['products'][number] | null>(null);
  const stepLightbox = (dir: 1 | -1) =>
    setLightbox((i) => (i === null || gallery.length === 0 ? null : (i + dir + gallery.length) % gallery.length));
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
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  // Reviews shown on the card: saved ones plus the one just sent (newest first)
  const [reviews, setReviews] = useState<PublicFeedback[]>(initialFeedbacks);
  useEffect(() => setReviews(initialFeedbacks), [initialFeedbacks]);
  const sendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.rating) return;
    const body = { rating: feedback.rating, fullName: feedback.name.trim(), message: feedback.message.trim() };
    setFeedbackError('');
    if (!feedbackTarget) {
      // Builder preview: nothing is saved
      setFeedback({ rating: 0, hover: 0, name: '', message: '', sent: true });
      return;
    }
    setFeedbackBusy(true);
    try {
      const saved = await submitPublicFeedback(feedbackTarget, body);
      setReviews((prev) => [saved, ...prev]);
      setFeedback({ rating: 0, hover: 0, name: '', message: '', sent: true });
    } catch (err) {
      setFeedbackError(feedbackErrorText(err));
    } finally {
      setFeedbackBusy(false);
    }
  };
  // Thank-you lines under the forms disappear after a few seconds (the forms stay open for the next one)
  useEffect(() => {
    if (!feedback.sent) return;
    const t = setTimeout(() => setFeedback((f) => ({ ...f, sent: false })), 4000);
    return () => clearTimeout(t);
  }, [feedback.sent]);

  // Enquiry form saves to the business (its Enquiries list); it does not open WhatsApp
  const [enquiryState, setEnquiryState] = useState<{ busy: boolean; sent: boolean; error: string }>({ busy: false, sent: false, error: '' });
  useEffect(() => {
    if (!enquiryState.sent) return;
    const t = setTimeout(() => setEnquiryState((st) => ({ ...st, sent: false })), 4000);
    return () => clearTimeout(t);
  }, [enquiryState.sent]);
  const sendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTarget) {
      // Builder preview: nothing is saved
      setEnquiry({ name: '', phone: '', email: '', message: '' });
      setEnquiryState({ busy: false, sent: true, error: '' });
      return;
    }
    setEnquiryState({ busy: true, sent: false, error: '' });
    try {
      await submitPublicEnquiry(feedbackTarget, { fullName: enquiry.name, phone: enquiry.phone, email: enquiry.email, message: enquiry.message });
      setEnquiry({ name: '', phone: '', email: '', message: '' });
      setEnquiryState({ busy: false, sent: true, error: '' });
    } catch (err) {
      setEnquiryState({ busy: false, sent: false, error: feedbackErrorText(err) });
    }
  };

  // "Share your details" popup: the visitor's contact is saved as a lead for the business
  const EMPTY_EXCHANGE = { name: '', mobile: '', email: '', company: '', jobTitle: '', message: '' };
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchange, setExchange] = useState(EMPTY_EXCHANGE);
  const [exchangeState, setExchangeState] = useState<{ busy: boolean; sent: boolean; error: string }>({ busy: false, sent: false, error: '' });
  useEffect(() => {
    if (!exchangeState.sent) return;
    const t = setTimeout(() => setExchangeState((st) => ({ ...st, sent: false })), 4000);
    return () => clearTimeout(t);
  }, [exchangeState.sent]);
  const openExchange = () => {
    setExchangeState({ busy: false, sent: false, error: '' });
    setExchangeOpen(true);
  };
  const sendExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = exchange.mobile.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      setExchangeState({ busy: false, sent: false, error: 'Please enter a valid mobile number.' });
      return;
    }
    if (!feedbackTarget) {
      // Builder preview: nothing is saved
      setExchange(EMPTY_EXCHANGE);
      setExchangeOpen(false);
      setExchangeState({ busy: false, sent: true, error: '' });
      return;
    }
    setExchangeState({ busy: true, sent: false, error: '' });
    try {
      await submitContactExchange(feedbackTarget, exchange);
      setExchange(EMPTY_EXCHANGE);
      setExchangeOpen(false);
      setExchangeState({ busy: false, sent: true, error: '' });
    } catch (err) {
      setExchangeState({ busy: false, sent: false, error: exchangeErrorText(err) });
    }
  };

  // Save Contact (.vcf) only on the public card; the builder previews have no card to download
  const vcardHref = feedbackTarget ? vcardUrl(feedbackTarget) : '';

  // ── Carousels ──
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
  // Desktop with nothing beside the bank card: lay its fields out across the row
  const bankAlone = !isMobile && bankRows.length > 0 && !(showUpiBlock && (wallets.length > 0 || profile.upiId || upiPhone));

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
  // Desktop: Write a Review, Send Enquiry and Share sit in one row
  const shareInRow = !isMobile && !isTablet && show.share && (show.enquiry || show.feedback);
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
    // Old default label "FEEDBACK" shows as Reviews
    { id: 'feedback', label: !labels.feedback || /^feedback$/i.test(labels.feedback.trim()) ? 'Reviews' : labels.feedback },
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

  // Review link (card link + ?review=1, or #feedback) from follow-up messages: open at the reviews.
  // Public card only, once, after the sections have rendered.
  const reviewJumpDone = useRef(false);
  useEffect(() => {
    if (!feedbackTarget || !show.feedback || reviewJumpDone.current) return;
    if (!wantsReviewSection()) return;
    const t = window.setTimeout(() => {
      reviewJumpDone.current = true;
      goTo('feedback');
    }, 400);
    return () => window.clearTimeout(t);
  }, [feedbackTarget, show.feedback]);
  const [copied, setCopied] = useState(false);

  // ── Card analytics (public card only; builder previews send nothing) ──
  // One VIEW per browser tab, and one event per call / WhatsApp / email tap anywhere in the template
  useEffect(() => {
    if (!feedbackTarget) return;
    try {
      const key = `card-view:${feedbackTarget}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        trackCardEvent(feedbackTarget, 'VIEW');
      }
    } catch {
      trackCardEvent(feedbackTarget, 'VIEW');
    }
  }, [feedbackTarget]);
  useEffect(() => {
    const root = rootRef.current;
    if (!feedbackTarget || !root) return;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href]');
      const type = link ? cardEventForHref(link.getAttribute('href') || '') : null;
      if (type) trackCardEvent(feedbackTarget, type);
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [feedbackTarget]);

  const pad = isMobile ? 'px-4' : 'px-8';

  return {
    profile, isMobile, isTablet, pad, cssVars, rootRef, cardRef,
    menuOpen, setMenuOpen, headerHidden, navItems, activeNav, goTo,
    businessName, tagline, kicker, about, aboutHtml, heroText, headings, vis,
    ownerName, designation, phones, emails, fullAddress, banners, bannerSlider,
    phone, whatsapp, whatsappUrl, whatsappGreeting, enquireUrl, productEnquiryUrl, cardUrl,
    services, specialities, products, gallery, videos, savedLinks,
    wallets, upiPhone, bankRows, showUpiBlock, bankAlone,
    show, shareInRow, sectionRank, aboutRank,
    lightbox, setLightbox, stepLightbox, imagePopup, setImagePopup, productPopup, setProductPopup,
    enquiry, setEnquiry, enquiryState, sendEnquiry,
    feedback, setFeedback, feedbackBusy, feedbackError, sendFeedback, reviews,
    copied, setCopied,
    vcardHref, exchangeOpen, setExchangeOpen, openExchange, exchange, setExchange, exchangeState, sendExchange,
  };
};

export type TemplateModel = ReturnType<typeof useTemplateModel>;

/** Props shared by every template section */
export interface SectionProps {
  t: TemplateModel;
}
