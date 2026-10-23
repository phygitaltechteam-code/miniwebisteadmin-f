import React, { useState, useEffect } from 'react';
import {
  FaBolt,
  FaPhone,
  FaWhatsapp,
  FaEnvelope,
  FaLocationDot,
  FaShieldHalved,
  FaClock,
  FaTag,
  FaHouse,
  FaLightbulb,
  FaFan,
  FaSliders,
  FaCarBattery,
  FaVideo,
  FaArrowRight,
  FaPlay,
  FaChevronLeft,
  FaFacebookF,
  FaYoutube,
  FaInstagram,
  FaLinkedinIn,
  FaGlobe,
  FaXmark,
  FaBars,
  FaCheck,
  FaCopy,
  FaFileLines,
  FaBuildingColumns,
  FaQrcode,
  FaArrowUpRightFromSquare,
  FaShareNodes,
} from 'react-icons/fa6';
import toast from 'react-hot-toast';
import { ProfileData } from '../types/profile';
import { getPortalTheme, PortalThemeId, PORTAL_THEMES } from '../types/theme';

export interface AdminPartner {
  id?: string;
  name?: string;
  businessName?: string;
  contactName?: string;
  designation?: string;
  title?: string;
  primaryPhone?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  categories?: { name: string }[] | string[];
  domain?: string;
  logoUrl?: string;
  img?: string;
  bannerUrl?: string;
}

export interface FullAdminData {
  profile?: any;
  about?: any;
  links?: any;
  payment?: any;
  products?: any[];
  gallery?: any[];
  videos?: any[];
}

export interface AdminWebsitePageProps {
  adminId?: string;
  profile?: ProfileData;
  initialAdminFallback?: AdminPartner | null;
  onBack?: () => void;
  onEnquire?: (partnerName: string) => void;
  themeOverride?: PortalThemeId;
  onThemeChange?: (themeId: PortalThemeId) => void;
  isSimulatorView?: boolean;
  viewMode?: 'mobile' | 'tablet' | 'desktop';
}

export const AdminWebsitePage: React.FC<AdminWebsitePageProps> = ({
  adminId,
  profile: builderProfile,
  initialAdminFallback,
  onBack,
  onEnquire,
  themeOverride,
  onThemeChange,
  isSimulatorView = false,
  viewMode,
}) => {
  const [data, setData] = useState<FullAdminData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [quoteModalOpen, setQuoteModalOpen] = useState<boolean>(false);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  // Gallery Lightbox Modal
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; desc?: string } | null>(null);

  // Video Player Modal
  const [activeVideo, setActiveVideo] = useState<{ title: string; embedUrl?: string; videoUrl?: string } | null>(null);

  // Quote / Enquiry Form state
  const [quoteForm, setQuoteForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    service: 'General Electrical Services',
    message: '',
  });
  const [isSubmittingQuote, setIsSubmittingQuote] = useState<boolean>(false);
  const [quoteSuccess, setQuoteSuccess] = useState<boolean>(false);

  // Container-Aware Responsive View Modes
  // If viewMode is specified (or in simulator view), it strictly forces that device mode
  const currentMode = viewMode || (isSimulatorView ? 'mobile' : undefined);
  const isMobile = currentMode === 'mobile';
  const isTablet = currentMode === 'tablet';
  const isDesktop = currentMode === 'desktop';

  // Load Admin Data if adminId provided and no builderProfile
  useEffect(() => {
    if (!adminId || builderProfile) return;
    let mounted = true;
    try {
      const raw = localStorage.getItem(`admin_data_${adminId}`);
      if (raw && mounted) {
        setData(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Could not read cached admin data:', e);
    }
    return () => {
      mounted = false;
    };
  }, [adminId, builderProfile]);

  // Extract Profile & Real Data from Live State or Backend
  const profileObj = (builderProfile || data?.profile || {}) as any;
  const aboutObj = (data?.about || {}) as any;
  const linksObj = (data?.links || {}) as any;
  const paymentObj = (data?.payment || {}) as any;

  // Active Theme Resolution (supports the 4 new two-color combination themes)
  const activeThemeId: PortalThemeId =
    themeOverride ||
    (builderProfile?.theme as PortalThemeId) ||
    (profileObj?.theme as PortalThemeId) ||
    'navy-orange';

  const themeConfig = getPortalTheme(activeThemeId);

  // Dynamic Profile Fields with Fallbacks
  const businessName =
    builderProfile?.businessName ||
    profileObj?.businessName ||
    initialAdminFallback?.businessName ||
    initialAdminFallback?.name ||
    'Shree Sai Electrical Services';

  const contactName =
    (builderProfile && [builderProfile.prefix, builderProfile.contactName].filter(Boolean).join(' ')) ||
    [profileObj.prefix, profileObj.contactName].filter(Boolean).join(' ') ||
    initialAdminFallback?.contactName ||
    'Rahul Patil';

  const designation =
    builderProfile?.designation ||
    profileObj.designation ||
    initialAdminFallback?.designation ||
    initialAdminFallback?.title ||
    'Owner & Senior Electrician';

  const primaryPhone =
    builderProfile?.primaryPhone ||
    profileObj.primaryPhone ||
    linksObj?.callLinks ||
    initialAdminFallback?.primaryPhone ||
    initialAdminFallback?.phone ||
    '9876543210';

  const cleanDigitsPhone = primaryPhone.replace(/[^0-9]/g, '');

  const whatsappRaw =
    builderProfile?.whatsappPhone ||
    builderProfile?.whatsappNumber ||
    profileObj.whatsappNumber ||
    linksObj?.whatsappLinks ||
    primaryPhone;
  const cleanWhatsappDigits = whatsappRaw.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsappDigits || cleanDigitsPhone}`;

  const email =
    builderProfile?.email ||
    profileObj.email ||
    linksObj?.emailLinks ||
    initialAdminFallback?.email ||
    'rahul.patil@example.com';

  const address =
    builderProfile?.address ||
    profileObj.address ||
    initialAdminFallback?.address ||
    'Shop No. 5, Main Market Road, Kavathe Mahankal, Sangli, Maharashtra';

  const city =
    builderProfile?.city ||
    profileObj.city ||
    initialAdminFallback?.city ||
    'Kavathe Mahankal';

  const district =
    builderProfile?.district ||
    profileObj.district ||
    initialAdminFallback?.district ||
    'Sangli';

  const state =
    builderProfile?.state ||
    profileObj.state ||
    initialAdminFallback?.state ||
    'Maharashtra';

  const locationMapUrl =
    builderProfile?.mapLink ||
    profileObj.mapLink ||
    linksObj?.location ||
    `https://maps.google.com/?q=${encodeURIComponent(address)}`;

  const categoryName =
    (Array.isArray(builderProfile?.categories) && builderProfile.categories[0]) ||
    builderProfile?.categoryName ||
    builderProfile?.category ||
    (profileObj.categories && profileObj.categories[0]?.name) ||
    initialAdminFallback?.domain ||
    'Electrical Services';

  const logoUrl =
    builderProfile?.logoUrl ||
    profileObj.logoUrl ||
    initialAdminFallback?.logoUrl ||
    initialAdminFallback?.img ||
    '';

  const bannerUrl =
    builderProfile?.bannerUrl ||
    profileObj.bannerUrl ||
    initialAdminFallback?.bannerUrl ||
    'https://upload.phygitaltech.in/uploads/1792663446147-7244927.png';

  const establishmentYear =
    builderProfile?.establishmentYear ||
    aboutObj.establishmentYear ||
    2020;

  const currentYear = new Date().getFullYear();

  const gstNumber =
    builderProfile?.gstNumber ||
    aboutObj.gstNumber ||
    '27ABCDE1234F1Z5';

  const aboutUsText =
    builderProfile?.aboutNarrative ||
    aboutObj.aboutUsText ||
    aboutObj.description ||
    `Welcome to ${businessName}. We provide reliable ${categoryName.toLowerCase()} solutions for residential, commercial, and industrial properties. Our experienced team focuses on safety, certified workmanship, and customer satisfaction.\n\nFrom complete wiring installations and custom lighting layouts to prompt maintenance and solar/inverter setups, we ensure every project meets the highest industry benchmarks.`;

  // Helper to map specialization names to icons
  const getSpecialityIcon = (title: string, index: number) => {
    const lower = title.toLowerCase();
    if (lower.includes('wiring') || lower.includes('home') || lower.includes('house')) return FaHouse;
    if (lower.includes('light') || lower.includes('lamp') || lower.includes('illumination')) return FaLightbulb;
    if (lower.includes('fan') || lower.includes('cooling') || lower.includes('vent') || lower.includes('ac')) return FaFan;
    if (lower.includes('switch') || lower.includes('board') || lower.includes('repair') || lower.includes('breaker') || lower.includes('db')) return FaSliders;
    if (lower.includes('inverter') || lower.includes('ups') || lower.includes('battery') || lower.includes('backup') || lower.includes('power')) return FaCarBattery;
    if (lower.includes('cctv') || lower.includes('camera') || lower.includes('security') || lower.includes('video') || lower.includes('surveillance')) return FaVideo;

    const fallbackIcons = [FaHouse, FaLightbulb, FaFan, FaSliders, FaCarBattery, FaVideo];
    return fallbackIcons[index % fallbackIcons.length];
  };

  // Exact 6 specialization cards matching requested design
  const defaultSpecialitiesList = [
    { title: 'Home Wiring', icon: FaHouse },
    { title: 'Lighting Installation', icon: FaLightbulb },
    { title: 'Fan Installation', icon: FaFan },
    { title: 'Switchboard Repair', icon: FaSliders },
    { title: 'Inverter & UPS', icon: FaCarBattery },
    { title: 'CCTV Installation', icon: FaVideo },
  ];

  const rawSpecialities: string[] =
    builderProfile?.specialities && builderProfile.specialities.length > 0
      ? builderProfile.specialities.map((s: any) => (typeof s === 'string' ? s : s.name || s.title || s.specialities || ''))
      : profileObj.specialities && profileObj.specialities.length > 0
      ? profileObj.specialities
      : [];

  const specialitiesItems =
    rawSpecialities.length > 0
      ? rawSpecialities.slice(0, 6).map((title, idx) => ({
          title,
          icon: getSpecialityIcon(title, idx),
        }))
      : defaultSpecialitiesList;

  const specialitiesList: string[] = specialitiesItems.map((item) => item.title);

  // Official Documents
  const officialDocs: any[] =
    builderProfile?.documents && builderProfile.documents.length > 0
      ? builderProfile.documents.map((d: any) => ({
          id: d.id,
          fileName: d.title || d.fileName || 'Official Document',
          fileUrl: d.url || d.fileUrl || '#',
        }))
      : aboutObj.officialDocuments && aboutObj.officialDocuments.length > 0
      ? aboutObj.officialDocuments
      : [
          {
            id: '3471ed82-17fa-4c4d-93bc-290de4d2e216',
            fileName: 'Electrical License & Certificate',
            fileUrl: 'https://upload.phygitaltech.in/uploads/1792575917224-12318949.jpeg',
          },
          {
            id: '805fc6ce-e3a8-4278-ae0c-10df8ceb6c6e',
            fileName: 'Official Trade Registration',
            fileUrl: 'https://upload.phygitaltech.in/uploads/1792654502848-822155076.jpeg',
          },
          {
            id: 'd524430f-9610-4999-81cd-e3f2d7d81c8f',
            fileName: 'Our Official Services Brochure',
            fileUrl: 'https://upload.phygitaltech.in/uploads/1792660291401-934139205.jpeg',
          },
          {
            id: '7103ac2b-6937-40dd-8256-ed3de91caff0',
            fileName: 'Safety & Compliance Document',
            fileUrl: 'https://upload.phygitaltech.in/uploads/1792661378910-554545351.jpeg',
          },
        ];

  // Products from profile or fallbacks
  const productsList =
    builderProfile?.products && builderProfile.products.length > 0
      ? builderProfile.products.map((p: any) => ({
          id: p.id || p._id,
          name: p.title || p.name,
          price: p.price,
          currency: p.currency || 'INR',
          description: p.description,
          image: p.image || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=400&fit=crop',
        }))
      : data?.products && data.products.length > 0
      ? data.products
      : [
          {
            id: '5c4b7eaf-f7fb-430e-898d-cbe83731a1af',
            name: 'Lighting & Fan Installation',
            price: 300,
            currency: 'INR',
            description:
              'Experience top-tier Lighting & Fan Installation with Shree Sai Electrical Services. We combine technical expertise with customer-centric service to deliver measurable results and dependable quality.',
            image: 'https://upload.phygitaltech.in/uploads/1792663446147-7244927.png',
          },
          {
            id: '60c0d85c-e23f-481a-904f-dba9b47cf477',
            name: 'Home Electrical Wiring',
            price: 200,
            currency: 'INR',
            description:
              'Comprehensive and tailored Home Electrical Wiring provided by Shree Sai Electrical Services. Designed for high performance, verified standards, and complete customer satisfaction. Includes dedicated customer support and verified deliverables.',
            image: 'https://upload.phygitaltech.in/uploads/1792663443744-340508963.png',
          },
        ];

  // Gallery items
  const galleryList =
    builderProfile?.gallery && builderProfile.gallery.length > 0
      ? builderProfile.gallery.map((g: any) => ({
          id: g.id || g._id,
          image: g.url || g.image,
          title: g.title || 'Project Work Sample',
          description: g.description || 'Verified execution by partner',
        }))
      : data?.gallery && data.gallery.length > 0
      ? data.gallery
      : [
          {
            id: '58d9fbaf-f7c7-454b-b363-0efb1a1376ba',
            image: 'https://upload.phygitaltech.in/uploads/1792664137013-871217308.png',
            title: 'Neat Inverter and Battery Backup Installation',
            description: 'Professional setup by Shree Sai Electrical Services',
          },
          {
            id: 'e35449ea-2f0d-49e6-bba6-3956d4ef97bd',
            image: 'https://upload.phygitaltech.in/uploads/1792664137004-95472994.png',
            title: 'Inverter & UPS Installation',
            description:
              'Professional inverter and UPS installation with organized wiring, battery backup setup, and safety checks for reliable power supply in homes and businesses',
          },
        ];

  // Videos
  const videoList =
    builderProfile?.youtubeVideos && builderProfile.youtubeVideos.length > 0
      ? builderProfile.youtubeVideos.map((v: any) => {
          let embedUrl = v.embedUrl || v.url;
          if (embedUrl && !embedUrl.includes('embed/') && embedUrl.includes('watch?v=')) {
            const vidId = embedUrl.split('watch?v=')[1]?.split('&')[0];
            embedUrl = `https://www.youtube.com/embed/${vidId}`;
          }
          return {
            id: v.id || v._id,
            title: v.title || 'Official Video Presentation',
            embedUrl: embedUrl || 'https://www.youtube.com/embed/YD2x7FFsFcc',
            thumbnailUrl:
              v.thumbnailUrl ||
              (v.videoId ? `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg` : 'https://img.youtube.com/vi/YD2x7FFsFcc/hqdefault.jpg'),
            duration: '05:32',
          };
        })
      : data?.videos && data.videos.length > 0
      ? data.videos
      : [
          {
            id: 'v-1',
            title: 'Electrical Safety Tips for Modern Homes',
            embedUrl: 'https://www.youtube.com/embed/YD2x7FFsFcc',
            thumbnailUrl: 'https://img.youtube.com/vi/YD2x7FFsFcc/hqdefault.jpg',
            duration: '05:32',
          },
          {
            id: 'v-2',
            title: 'Home Electrical Wiring & Inverter Installation',
            embedUrl: 'https://www.youtube.com/embed/0GjRb4-iaog',
            thumbnailUrl: 'https://img.youtube.com/vi/0GjRb4-iaog/hqdefault.jpg',
            duration: '06:14',
          },
        ];

  // Payment credentials
  const upiId = builderProfile?.upiId || paymentObj.upiId || 'rahulpatil@oksbi';
  const paymentPhoneNo =
    builderProfile?.upiNumber ||
    builderProfile?.primaryPhone ||
    paymentObj.paymentPhoneNo ||
    '9876543210';
  const bankName = builderProfile?.bankName || paymentObj.bankName || 'State Bank of India';
  const bankHolderName =
    builderProfile?.accountHolderName ||
    paymentObj.bankHolderName ||
    businessName;
  const bankAccountNumber =
    builderProfile?.accountNumber ||
    paymentObj.bankAccountNumber ||
    '123456789012';
  const bankIfscCode =
    builderProfile?.ifscCode ||
    paymentObj.bankIfscCode ||
    'SBIN0001234';
  const accountType =
    builderProfile?.accountType ||
    paymentObj.accountType ||
    'Current / Savings Account';

  // Social Links
  const socialLinks = {
    whatsapp: whatsappUrl,
    facebook: builderProfile?.facebookUrl || linksObj?.facebookLink,
    instagram: builderProfile?.instagramUrl || linksObj?.instagramLink,
    youtube: builderProfile?.youtubeUrl || linksObj?.youTubeLink,
    linkedin: builderProfile?.linkedinUrl || linksObj?.linkedinLink,
    website: builderProfile?.websiteUrl || builderProfile?.website || linksObj?.webSiteLink,
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Submit Enquiry
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.fullName.trim() || !quoteForm.phone.trim()) {
      toast.error('Please enter your full name and phone number');
      return;
    }

    setIsSubmittingQuote(true);
    setTimeout(() => {
      setIsSubmittingQuote(false);
      setQuoteSuccess(true);
      toast.success('Your enquiry has been dispatched directly to the business partner!');
      if (onEnquire) onEnquire(businessName);
      setTimeout(() => {
        setQuoteModalOpen(false);
        setQuoteSuccess(false);
        setQuoteForm({ fullName: '', phone: '', email: '', service: 'General Electrical Services', message: '' });
      }, 2200);
    }, 600);
  };

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Products', href: '#products' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Videos', href: '#videos' },
    { label: 'Payments', href: '#payment' },
    { label: 'Documents', href: '#documents' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <div
      className={`min-h-full bg-slate-50 text-slate-800 font-sans selection:bg-orange-500 selection:text-white w-full max-w-full overflow-x-hidden ${
        isSimulatorView ? 'text-xs' : ''
      }`}
      id="home"
    >
      {/* ─── TOP NOTICE BAR (Hidden on mobile for clean screen view) ─────────── */}
      {!isMobile && !isSimulatorView && (
        <div
          className={`${themeConfig.topNoticeBg} text-slate-300 text-xs px-3 sm:px-8 py-2 border-b border-slate-800 hidden sm:flex items-center justify-between z-30 relative`}
        >
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all text-[11px] active:scale-95"
              >
                <FaChevronLeft className="text-[10px]" />
                <span>Back to Directory</span>
              </button>
            )}

            {/* Real-time Theme Switcher Pills */}
            {onThemeChange && !isTablet && (
              <div className="hidden md:flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                {(Object.keys(PORTAL_THEMES) as PortalThemeId[]).map((thId) => {
                  const th = PORTAL_THEMES[thId];
                  const isActive = activeThemeId === thId;
                  return (
                    <button
                      key={thId}
                      type="button"
                      onClick={() => onThemeChange(thId)}
                      title={th.desc}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {th.badge}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleCopy(window.location.href, 'Website Link')}
              className={`inline-flex items-center gap-1 text-[11px] font-bold ${themeConfig.topNoticeAccent} transition-colors`}
            >
              <FaShareNodes className="text-xs" />
              <span>Share Portal</span>
            </button>
            <span className="text-slate-600 hidden xs:inline">|</span>
            <a
              href={`tel:${primaryPhone}`}
              className={`inline-flex items-center gap-1.5 ${themeConfig.topNoticeAccent} font-bold text-[11px]`}
            >
              <FaPhone className="text-[10px]" />
              <span>+91 {primaryPhone}</span>
            </a>
          </div>
        </div>
      )}

      {/* ─── 1. TOP STICKY NAVBAR ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 md:h-20 flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Logo & Brand Name (min-w-0 flex-1 so hamburger button is never clipped on mobile) */}
          <a href="#home" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 flex-1 overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl object-cover ring-1 sm:ring-2 ring-slate-100 shadow-sm shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr ${themeConfig.headerLogoGlow} flex items-center justify-center text-lg sm:text-xl shadow-md border border-slate-200 shrink-0`}
              >
                <FaBolt />
              </div>
            )}
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="text-xs sm:text-base md:text-lg font-black tracking-tight text-slate-900 block leading-tight truncate uppercase">
                {businessName}
              </span>
              <span className={`text-[9px] sm:text-[10px] font-bold ${themeConfig.kickerText} uppercase tracking-wider block truncate`}>
                {categoryName}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav
            className={
              isMobile || isTablet
                ? 'hidden'
                : isDesktop
                ? 'flex items-center gap-5 xl:gap-6'
                : 'hidden lg:flex items-center gap-5 xl:gap-6'
            }
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setActiveSection(link.label.toLowerCase())}
                className={`text-xs sm:text-sm font-semibold transition-colors ${
                  activeSection === link.label.toLowerCase()
                    ? `${themeConfig.headerActiveNav} font-bold`
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs: WhatsApp & Get Quote (Desktop only, Mobile & Tab use clean hamburger menu) */}
          <div
            className={
              isMobile || isTablet
                ? 'hidden'
                : isDesktop
                ? 'flex items-center gap-2.5 shrink-0'
                : 'hidden lg:flex items-center gap-2.5 shrink-0'
            }
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center border border-emerald-200 text-base transition-colors shadow-2xs"
              title="Chat on WhatsApp"
            >
              <FaWhatsapp className="text-[#25D366]" />
            </a>

            <button
              type="button"
              onClick={() => {
                setQuoteForm((prev) => ({ ...prev, service: 'General Enquiry' }));
                setQuoteModalOpen(true);
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-xl ${themeConfig.headerCtaBtn} text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all`}
            >
              <span>Get a Quote</span>
              <FaArrowRight className="text-xs" />
            </button>
          </div>

          {/* Mobile & Tablet Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={
              isMobile || isTablet
                ? 'block p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 shrink-0'
                : isDesktop
                ? 'hidden'
                : 'lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 shrink-0'
            }
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <FaXmark className="text-lg" /> : <FaBars className="text-lg" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="bg-white border-b border-slate-200 px-4 py-4 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => {
                  setActiveSection(link.label.toLowerCase());
                  setMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 ${themeConfig.navActiveBg}`}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`tel:${primaryPhone}`}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <FaPhone className="text-xs text-orange-400" />
                <span>Call +91 {primaryPhone}</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setQuoteModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className={`w-full py-2.5 rounded-xl ${themeConfig.headerCtaBtn} text-xs font-bold flex items-center justify-center gap-2`}
              >
                <span>Get a Free Quote</span>
                <FaArrowRight className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─── 2. HERO SHOWCASE SECTION ────────────────────────────────────────── */}
      <section
        className={`relative overflow-hidden bg-gradient-to-r ${themeConfig.heroBgGradient} text-white pt-6 sm:pt-10 pb-8 sm:pb-12 w-full max-w-full`}
      >
        {/* Glow ambient background ring */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 pointer-events-none overflow-hidden opacity-60 sm:opacity-80 flex items-center justify-end">
          <div
            className={`w-[320px] sm:w-[620px] h-[320px] sm:h-[620px] rounded-full border-[16px] sm:border-[24px] ${themeConfig.heroRingBorder} -mr-16 sm:-mr-24 -mt-10 blur-[1px]`}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div
            className={
              isMobile
                ? 'flex flex-col gap-6 items-stretch w-full'
                : isTablet
                ? 'grid grid-cols-1 gap-6 items-center max-w-2xl mx-auto w-full'
                : isDesktop
                ? 'grid grid-cols-12 gap-8 items-center w-full'
                : 'flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full'
            }
          >
            {/* Left Content Column (Always displays first on all mobile sizes) */}
            <div
              className={
                isMobile || isTablet
                  ? 'w-full space-y-3.5 sm:space-y-4'
                  : isDesktop
                  ? 'col-span-7 space-y-4'
                  : 'w-full lg:col-span-7 space-y-4'
              }
            >
              {/* Partner Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm self-start max-w-full">
                <span className={`w-2 h-2 rounded-full ${themeConfig.heroBadgeDot} animate-ping shrink-0`} />
                <span className={`text-[10px] sm:text-[11px] font-bold ${themeConfig.heroBadgeText} uppercase tracking-wider truncate`}>
                  VERIFIED {categoryName.toUpperCase()} PARTNER
                </span>
              </div>

              {/* Business Name */}
              <h1
                className={
                  isMobile
                    ? 'text-2xl sm:text-3xl font-black tracking-tight leading-[1.18] text-white break-words'
                    : isTablet
                    ? 'text-3xl sm:text-4xl font-black tracking-tight leading-[1.15] text-white'
                    : isDesktop
                    ? 'text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.12] text-white'
                    : 'text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.15] text-white break-words'
                }
              >
                {businessName}
              </h1>

              {/* Designation & Contact Person */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold tracking-wide">
                <span className={themeConfig.heroContactText}>{contactName}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-200">{designation}</span>
              </div>

              {/* Address / Location */}
              <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                <FaLocationDot className="text-rose-400 mt-1 shrink-0 text-xs" />
                <a
                  href={locationMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white hover:underline transition-colors break-words"
                >
                  {address}
                </a>
              </div>

              {/* Action Buttons */}
              <div
                className={
                  isMobile || isTablet
                    ? 'flex flex-col items-stretch gap-2.5 pt-1 w-full'
                    : isDesktop
                    ? 'flex flex-row items-center gap-3 pt-2'
                    : 'flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2 w-full'
                }
              >
                <button
                  type="button"
                  onClick={() => {
                    setQuoteForm((prev) => ({ ...prev, service: 'General Enquiry' }));
                    setQuoteModalOpen(true);
                  }}
                  className={
                    isMobile || isTablet
                      ? `w-full py-3.5 px-6 rounded-xl ${themeConfig.heroPrimaryBtn} font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all`
                      : `px-6 py-3 rounded-xl ${themeConfig.heroPrimaryBtn} font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all shrink-0`
                  }
                >
                  <span>Request Service Quote</span>
                  <FaArrowRight className="text-xs" />
                </button>

                <div
                  className={
                    isMobile || isTablet
                      ? 'grid grid-cols-2 gap-2.5 w-full'
                      : isDesktop
                      ? 'flex items-center gap-2.5 shrink-0'
                      : 'grid grid-cols-2 gap-2.5 w-full sm:w-auto sm:flex sm:items-center'
                  }
                >
                  <a
                    href={`tel:${primaryPhone}`}
                    className="w-full px-3 sm:px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 border border-white/20 active:scale-95 transition-all backdrop-blur-sm truncate text-center"
                  >
                    <FaPhone className={`text-xs ${themeConfig.heroPhoneBtn} shrink-0`} />
                    <span className="truncate">Call {primaryPhone}</span>
                  </a>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-3 sm:px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-md shadow-emerald-600/30 active:scale-95 transition-all truncate text-center"
                  >
                    <FaWhatsapp className="text-sm shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Trust Badges Bar */}
              <div
                className={
                  isMobile
                    ? 'flex flex-col gap-2 pt-3 text-xs font-semibold text-slate-300 border-t border-white/10 w-full'
                    : isTablet
                    ? 'flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-5 pt-3 text-xs font-semibold text-slate-300 border-t border-white/10'
                    : isDesktop
                    ? 'flex flex-wrap items-center gap-5 pt-3 text-xs font-semibold text-slate-300 border-t border-white/10'
                    : 'flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 pt-3 text-xs font-semibold text-slate-300 border-t border-white/10 w-full'
                }
              >
                <div className="flex items-center gap-2">
                  <FaShieldHalved className="text-emerald-400 shrink-0 text-xs sm:text-sm" />
                  <span>Verified Credentials</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className={`${themeConfig.heroContactText} shrink-0 text-xs sm:text-sm`} />
                  <span>Prompt On-Time Execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaTag className="text-cyan-400 shrink-0 text-xs sm:text-sm" />
                  <span>Transparent Pricing</span>
                </div>
              </div>
            </div>

            {/* Right Media Card (Live Banner / Logo - Displays below hero text on mobile) */}
            <div
              className={
                isMobile || isTablet
                  ? 'w-full relative flex justify-center mt-2 sm:mt-6'
                  : isDesktop
                  ? 'col-span-5 relative flex justify-center'
                  : 'w-full lg:col-span-5 relative flex justify-center mt-4 lg:mt-0'
              }
            >
              <div className="relative w-full max-w-md">
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white/10 bg-slate-800">
                  <img
                    src={bannerUrl}
                    alt={businessName}
                    className="w-full h-56 sm:h-80 md:h-96 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://upload.phygitaltech.in/uploads/1792663446147-7244927.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Watermark badge on image */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex items-center justify-between bg-black/60 backdrop-blur-md p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20">
                    <div className="min-w-0 flex-1 mr-2">
                      <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider truncate">
                        {businessName}
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-300 truncate">
                        {city}, {state}
                      </p>
                    </div>
                    <span
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 shadow-sm"
                      title="Verified Practitioner"
                    >
                      <FaCheck />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. SPECIALITIES STRIP (6 White Cards in One Line) ────────────────── */}
      <section className={`${themeConfig.specialitiesBg} border-y ${themeConfig.specialitiesBorder} py-4 sm:py-5 shadow-xs`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={
              isMobile
                ? 'flex gap-3 overflow-x-auto scrollbar-none pb-1'
                : isTablet
                ? 'grid grid-cols-3 gap-3.5'
                : isDesktop
                ? 'grid grid-cols-6 gap-3.5'
                : 'flex gap-3 overflow-x-auto scrollbar-none pb-1 md:pb-0 md:grid md:grid-cols-6'
            }
          >
            {specialitiesItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className={
                    isMobile
                      ? `w-[calc(50%-6px)] shrink-0 bg-white rounded-xl py-4 px-3 flex flex-col items-center justify-center text-center shadow-xs border border-slate-100 ${themeConfig.specialitiesCardHover} hover:shadow-md transition-all duration-200 cursor-default group`
                      : isTablet
                      ? `w-full bg-white rounded-xl py-4 px-3 flex flex-col items-center justify-center text-center shadow-xs border border-slate-100 ${themeConfig.specialitiesCardHover} hover:shadow-md transition-all duration-200 cursor-default group`
                      : isDesktop
                      ? `w-full bg-white rounded-xl py-3.5 px-2.5 flex flex-col items-center justify-center text-center shadow-xs border border-slate-100 ${themeConfig.specialitiesCardHover} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default group`
                      : `w-[calc(50%-6px)] shrink-0 md:w-auto md:flex-1 bg-white rounded-xl py-4 px-3 flex flex-col items-center justify-center text-center shadow-xs border border-slate-100 ${themeConfig.specialitiesCardHover} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default group`
                  }
                >
                  <div
                    className={`${themeConfig.specialitiesIcon} text-2xl sm:text-[26px] mb-2 flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <IconComponent />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug">
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 4. ABOUT ENTERPRISE & OFFICIAL ACCREDITATIONS ────────────────────── */}
      <section className="py-8 sm:py-10 bg-white" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={
              isMobile || isTablet
                ? 'grid grid-cols-1 gap-8 items-center'
                : isDesktop
                ? 'grid grid-cols-12 gap-10 lg:gap-14 items-center'
                : 'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center'
            }
          >
            {/* Left Image / Workshop */}
            <div
              className={
                isMobile || isTablet
                  ? 'w-full relative'
                  : isDesktop
                  ? 'col-span-6 relative'
                  : 'lg:col-span-6 relative'
              }
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
                <img
                  src="https://upload.phygitaltech.in/uploads/1792663443744-340508963.png"
                  alt={`About ${businessName}`}
                  className="w-full h-72 sm:h-[420px] object-cover"
                />

                {/* Floating Badge */}
                <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/80 flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl ${themeConfig.aboutBadgeIconBg} text-white flex items-center justify-center text-xl shrink-0 shadow-md`}
                  >
                    <FaHouse />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-slate-900 leading-tight">
                      Established {establishmentYear}
                    </h5>
                    <p className={`text-xs font-bold ${themeConfig.aboutBadgeSubtitle}`}>
                      Quality • Safety • Satisfaction
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div
              className={
                isMobile || isTablet
                  ? 'w-full space-y-5'
                  : isDesktop
                  ? 'col-span-6 space-y-5'
                  : 'lg:col-span-6 space-y-5'
              }
            >
              <div>
                <span className={`text-xs font-bold ${themeConfig.kickerText} uppercase tracking-widest block mb-1.5`}>
                  ABOUT THE ORGANIZATION
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {businessName}
                </h2>
              </div>

              {/* Formatted About Us Text */}
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3 font-normal whitespace-pre-line">
                {aboutUsText}
              </div>

              {/* Key Business Accreditations */}
              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${themeConfig.aboutRegisterIconBox} flex items-center justify-center text-sm shrink-0`}
                  >
                    <FaBolt />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Business Registration</div>
                    <div className="text-xs font-black text-slate-900">Certified Enterprise</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${themeConfig.aboutGstIconBox} flex items-center justify-center text-sm shrink-0`}
                    >
                      <FaShieldHalved />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">GST Number</div>
                      <div className="text-xs font-mono font-black text-slate-900 truncate">{gstNumber}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(gstNumber, 'GST Number')}
                    className="p-1.5 text-slate-400 hover:text-slate-800"
                    title="Copy GST Number"
                  >
                    <FaCopy className="text-xs" />
                  </button>
                </div>
              </div>

              {/* CTA buttons */}
              <div
                className={
                  isMobile || isTablet
                    ? 'pt-2 flex flex-col items-stretch gap-2.5'
                    : isDesktop
                    ? 'pt-2 flex flex-row items-center gap-3'
                    : 'pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3'
                }
              >
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(true)}
                  className={
                    isMobile || isTablet
                      ? `w-full px-6 py-3.5 rounded-xl ${themeConfig.aboutConnectBtn} font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all`
                      : `px-6 py-3 rounded-xl ${themeConfig.aboutConnectBtn} font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all`
                  }
                >
                  <span>Connect with {contactName}</span>
                  <FaArrowRight className="text-xs" />
                </button>
                <a
                  href={locationMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={
                    isMobile || isTablet
                      ? 'w-full px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors text-center'
                      : 'px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors text-center'
                  }
                >
                  <FaLocationDot className="text-rose-500 text-xs" />
                  <span>View on Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. VERIFIED PRODUCTS & SOLUTIONS ───────────────────────────────── */}
      <section className="py-8 sm:py-10 bg-slate-50/70 border-t border-slate-200/80" id="products">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
            <div>
              <span className={`text-xs font-bold ${themeConfig.kickerText} uppercase tracking-widest block mb-1`}>
                — VERIFIED OFFERINGS —
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Products & Specialized Services
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Authentic products and solutions directly supplied and certified by {businessName}.
              </p>
            </div>
          </div>

          {/* Products Grid */}
          <div
            className={
              isMobile
                ? 'grid grid-cols-1 gap-5'
                : isTablet
                ? 'grid grid-cols-2 gap-5'
                : isDesktop
                ? 'grid grid-cols-3 gap-6'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            }
          >
            {productsList.map((product: any) => (
              <div
                key={product.id || product.name}
                className={`bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl ${themeConfig.productsHoverBorder} transition-all duration-300 flex flex-col justify-between group`}
              >
                <div>
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=400&fit=crop'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=400&fit=crop';
                      }}
                    />
                    {product.price && (
                      <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl font-mono font-bold text-xs shadow-md border border-white/20">
                        {product.currency === 'INR' || !product.currency ? '₹' : product.currency + ' '}
                        {product.price}
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-6">
                    <h3 className={`text-base font-black text-slate-900 mb-2 ${themeConfig.productsHoverTitle} transition-colors`}>
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {product.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. PHOTO GALLERY WITH LIGHTBOX ─────────────────────────────────── */}
      <section className="py-8 sm:py-10 bg-white border-t border-slate-200/80" id="gallery">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
            <div>
              <span className={`text-xs font-bold ${themeConfig.kickerText} uppercase tracking-widest block mb-1`}>
                — PROJECT GALLERY —
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Recent On-Site Work & Installations
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Inspect authentic project photography completed across the region.
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500">
                {galleryList.length} Uploaded Work Samples
              </span>
            </div>
          </div>

          {/* Photos Grid */}
          <div
            className={
              isMobile
                ? 'grid grid-cols-1 gap-5'
                : isTablet
                ? 'grid grid-cols-2 gap-5'
                : isDesktop
                ? 'grid grid-cols-3 gap-6'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            }
          >
            {galleryList.map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                onClick={() => setLightboxImage({ url: item.image, title: item.title, desc: item.description })}
                className="group relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl cursor-pointer bg-slate-900 h-64 sm:h-72 transition-all duration-300"
              >
                <img
                  src={item.image}
                  alt={item.title || `Project Sample ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-90 transition-all duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=700&h=500&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 text-white">
                  <h4 className="text-sm font-black tracking-tight">{item.title}</h4>
                  {item.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1 font-normal">
                      {item.description}
                    </p>
                  )}
                  <span className={`text-[10px] font-bold ${themeConfig.galleryPromptText} mt-2 inline-flex items-center gap-1`}>
                    <span>Click to view full photo</span>
                    <FaArrowUpRightFromSquare className="text-[8px]" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. FEATURED VIDEO PRESENTATIONS ─────────────────────────────────── */}
      <section className="py-8 sm:py-10 bg-slate-50/70 border-t border-slate-200/80" id="videos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
            <div>
              <span className={`text-xs font-bold ${themeConfig.kickerText} uppercase tracking-widest block mb-1`}>
                — VIDEO PRESENTATIONS —
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Watch Official Demonstrations & Safety Guides
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Video tutorials and project overviews published by {businessName}.
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500">
                {videoList.length} Video Guides
              </span>
            </div>
          </div>

          <div
            className={
              isMobile
                ? 'grid grid-cols-1 gap-6'
                : isTablet || isDesktop
                ? 'grid grid-cols-2 gap-8'
                : 'grid grid-cols-1 md:grid-cols-2 gap-8'
            }
          >
            {videoList.map((video: any) => (
              <div
                key={video.id || video.title}
                onClick={() => setActiveVideo({ title: video.title, embedUrl: video.embedUrl, videoUrl: video.videoUrl })}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div className="relative h-56 sm:h-64 bg-slate-900 overflow-hidden">
                  <img
                    src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=500&fit=crop'}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all duration-300"
                  />
                  {/* Big Play Overlay Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-16 h-16 rounded-full ${themeConfig.videoPlayBtnBg} text-white flex items-center justify-center text-xl shadow-2xl group-hover:scale-110 transition-transform`}
                    >
                      <FaPlay className="ml-1 text-base" />
                    </div>
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-md">
                      {video.duration}
                    </div>
                  )}
                </div>

                <div className="p-5 flex items-center justify-between gap-3">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-slate-800 transition-colors line-clamp-1">
                    {video.title}
                  </h4>
                  <span className={`text-xs font-bold ${themeConfig.videoWatchText} shrink-0 flex items-center gap-1`}>
                    <span>Watch Video</span>
                    <FaPlay className="text-[9px]" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. PAYMENT & BANKING SECTION ───────────────────────────────────── */}
      <section className="py-8 sm:py-10 bg-white border-t border-slate-200/80" id="payment">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center max-w-2xl mx-auto">
            <span className={`text-xs font-bold ${themeConfig.kickerText} uppercase tracking-widest block mb-1`}>
              — VERIFIED FINANCIAL CREDENTIALS —
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bank Account & UPI Payment Details
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Transfer funds safely using verified institutional banking credentials.
            </p>
          </div>

          <div
            className={
              isMobile
                ? 'grid grid-cols-1 gap-6 max-w-4xl mx-auto'
                : isTablet || isDesktop
                ? 'grid grid-cols-2 gap-8 max-w-4xl mx-auto'
                : 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto'
            }
          >
            {/* 1. UPI Payment Card */}
            <div
              className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${themeConfig.upiCardGradient} text-white shadow-xl flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-12 h-12 rounded-2xl ${themeConfig.upiCardIconBox} flex items-center justify-center text-xl`}
                  >
                    <FaQrcode />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    UPI Active
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Direct UPI VPA ID
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-1 bg-white/5 p-3 rounded-xl border border-white/10 font-mono text-sm sm:text-base font-bold text-white">
                      <span className="truncate">{upiId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(upiId, 'UPI ID')}
                        className={`p-1.5 ${themeConfig.upiCardAccentText} hover:text-white`}
                        title="Copy UPI ID"
                      >
                        <FaCopy className="text-xs" />
                      </button>
                    </div>
                  </div>

                  {paymentPhoneNo && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        GPay / PhonePe / Paytm Number
                      </span>
                      <div className="flex items-center justify-between gap-2 mt-1 bg-white/5 p-3 rounded-xl border border-white/10 font-mono text-sm font-bold text-white">
                        <span>+91 {paymentPhoneNo}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentPhoneNo, 'Payment Phone')}
                          className={`p-1.5 ${themeConfig.upiCardAccentText} hover:text-white`}
                          title="Copy Phone"
                        >
                          <FaCopy className="text-xs" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400">Accepted: GPay, PhonePe, Paytm, BHIM</span>
                <button
                  type="button"
                  onClick={() => setQrModalOpen(true)}
                  className={`px-4 py-2 rounded-xl ${themeConfig.upiCardBtn} text-white text-xs font-bold transition-all active:scale-95 shadow-md`}
                >
                  View QR Code
                </button>
              </div>
            </div>

            {/* 2. Direct Bank Details Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-12 h-12 rounded-2xl ${themeConfig.bankCardIconBox} flex items-center justify-center text-xl`}
                  >
                    <FaBuildingColumns />
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    NEFT / RTGS / IMPS
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold">Bank Name:</span>
                    <strong className="text-slate-900 font-black">{bankName}</strong>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold">Account Holder:</span>
                    <strong className="text-slate-900 font-bold">{bankHolderName}</strong>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 font-mono font-black">{bankAccountNumber}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankAccountNumber, 'Account Number')}
                        className={themeConfig.bankCardCopyIcon}
                        title="Copy Account Number"
                      >
                        <FaCopy className="text-[11px]" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold">IFSC Code:</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 font-mono font-black">{bankIfscCode}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankIfscCode, 'IFSC Code')}
                        className={themeConfig.bankCardCopyIcon}
                        title="Copy IFSC"
                      >
                        <FaCopy className="text-[11px]" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-400 font-semibold">Account Type:</span>
                    <span className="text-slate-700 font-bold">{accountType}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-400">
                🔒 Verified official institutional bank account. Instant receipt upon transfer.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. OFFICIAL BROCHURES & DOCUMENTS ───────────────────────────────── */}
      {officialDocs.length > 0 && (
        <section className="py-8 sm:py-10 bg-slate-50/70 border-t border-slate-200/80" id="documents">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <span className={`text-xs font-bold ${themeConfig.kickerText} uppercase tracking-widest block mb-1`}>
                — VERIFICATION & BROCHURES —
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Official Certifications & Brochures
              </h2>
            </div>

            <div
              className={
                isMobile
                  ? 'grid grid-cols-1 gap-3'
                  : isTablet
                  ? 'grid grid-cols-2 gap-4'
                  : isDesktop
                  ? 'grid grid-cols-4 gap-4'
                  : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'
              }
            >
              {officialDocs.map((doc: any) => (
                <a
                  key={doc.id || doc.fileName}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md ${themeConfig.docsHoverBorder} transition-all flex items-center justify-between gap-3 group`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl ${themeConfig.docsIconBox} flex items-center justify-center text-lg shrink-0`}
                    >
                      <FaFileLines />
                    </div>
                    <div className="min-w-0">
                      <h4
                        className={`text-xs font-black text-slate-900 ${themeConfig.docsHoverText} transition-colors capitalize truncate`}
                      >
                        {doc.fileName || 'Official Document'}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Click to inspect</p>
                    </div>
                  </div>
                  <FaArrowUpRightFromSquare
                    className={`text-xs text-slate-400 ${themeConfig.docsHoverText} transition-colors shrink-0`}
                  />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 10. COMPREHENSIVE FOOTER ────────────────────────────────────────── */}
      <footer className={`${themeConfig.footerBg} text-slate-400 pt-10 pb-8 border-t border-slate-800`} id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={
              isMobile
                ? 'grid grid-cols-1 gap-8 pb-8 border-b border-slate-800'
                : isTablet
                ? 'grid grid-cols-2 gap-8 pb-8 border-b border-slate-800'
                : isDesktop
                ? 'grid grid-cols-12 gap-8 pb-8 border-b border-slate-800'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-8 border-b border-slate-800'
            }
          >
            {/* Col 1: Brand & Social Circles */}
            <div className={isDesktop ? 'col-span-4 space-y-4' : 'w-full space-y-4'}>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={businessName}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${themeConfig.headerLogoGlow} flex items-center justify-center text-xl border border-slate-700`}
                  >
                    <FaBolt />
                  </div>
                )}
                <div>
                  <span className="text-base font-black tracking-tight text-white block uppercase">
                    {businessName}
                  </span>
                  <span className={`text-[10px] font-bold ${themeConfig.footerCategoryText} uppercase tracking-widest block`}>
                    {categoryName}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Providing verified, safe, and dependable {categoryName.toLowerCase()} solutions for homes, commercial complexes, and institutions.
              </p>

              {/* Social Media Links */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                {socialLinks.whatsapp && (
                  <a
                    href={socialLinks.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-xs transition-colors shadow-sm"
                  >
                    <FaWhatsapp />
                  </a>
                )}
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center text-xs transition-colors shadow-sm"
                  >
                    <FaFacebookF />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center text-xs transition-colors shadow-sm"
                  >
                    <FaInstagram />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="YouTube"
                    className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs transition-colors shadow-sm"
                  >
                    <FaYoutube />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="w-8 h-8 rounded-full bg-[#0077B5] hover:bg-blue-800 text-white flex items-center justify-center text-xs transition-colors shadow-sm"
                  >
                    <FaLinkedinIn />
                  </a>
                )}
                {socialLinks.website && (
                  <a
                    href={socialLinks.website}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Website"
                    className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-xs transition-colors shadow-sm"
                  >
                    <FaGlobe />
                  </a>
                )}
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className={isDesktop ? 'col-span-2 space-y-3' : 'w-full space-y-3'}>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
              <ul className="space-y-2 text-xs">
                {navLinks.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-slate-400 hover:text-white transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Specialities */}
            <div className={isDesktop ? 'col-span-3 space-y-3' : 'w-full space-y-3'}>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Top Capabilities</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {specialitiesList.slice(0, 5).map((spec, i) => (
                  <li key={i} className="truncate">
                    • {spec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Contact & Coordinates */}
            <div className={isDesktop ? 'col-span-3 space-y-3' : 'w-full space-y-3'}>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Verified Contact</h4>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-start gap-2.5">
                  <FaLocationDot className={`text-xs mt-0.5 shrink-0 ${themeConfig.footerContactIcon}`} />
                  <a href={locationMapUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                    {address}
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <FaPhone className={`text-xs shrink-0 ${themeConfig.footerContactIcon}`} />
                  <a href={`tel:${primaryPhone}`} className="hover:text-white transition-colors">
                    +91 {primaryPhone}
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <FaEnvelope className={`text-xs shrink-0 ${themeConfig.footerContactIcon}`} />
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                    {email}
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <FaShieldHalved className="text-emerald-400 text-xs shrink-0" />
                  <span>GSTIN: {gstNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {currentYear} {businessName}. All Rights Reserved.</p>
            <p>Verified Institutional Partner of Aegis Registry</p>
          </div>
        </div>
      </footer>

      {/* ─── MODAL 1: INTERACTIVE QUOTE / ENQUIRY MODAL ──────────────────────── */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setQuoteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 text-lg"
            >
              <FaXmark />
            </button>

            {quoteSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mx-auto border border-emerald-200">
                  <FaCheck />
                </div>
                <h3 className="text-xl font-black text-slate-900">Enquiry Dispatched!</h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  {contactName} from <strong>{businessName}</strong> has received your project details and will call you at <strong>{quoteForm.phone}</strong>.
                </p>
              </div>
            ) : (
              <div>
                <span className={`text-[11px] font-bold ${themeConfig.kickerText} uppercase tracking-widest block mb-1`}>
                  OFFICIAL ENQUIRY PORTAL
                </span>
                <h3 className="text-xl font-black text-slate-900 mb-1">
                  Contact {businessName}
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  Send your requirements directly to the registered executive.
                </p>

                <form onSubmit={handleQuoteSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Full Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={quoteForm.fullName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, fullName: e.target.value })}
                      className={`w-full h-10 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none ${themeConfig.modalInputFocus}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Phone Number *</label>
                      <input
                        required
                        type="tel"
                        placeholder="9876543210"
                        value={quoteForm.phone}
                        onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                        className={`w-full h-10 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none font-mono ${themeConfig.modalInputFocus}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="client@example.com"
                        value={quoteForm.email}
                        onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                        className={`w-full h-10 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none ${themeConfig.modalInputFocus}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Project Message / Location</label>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe your requirements or site address..."
                      value={quoteForm.message}
                      onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                      className={`w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none ${themeConfig.modalInputFocus}`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingQuote}
                    className={`w-full h-11 rounded-xl ${themeConfig.modalSubmitBtn} text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50`}
                  >
                    <span>{isSubmittingQuote ? 'Dispatched to Partner...' : 'Submit Official Enquiry'}</span>
                    <FaArrowRight className="text-xs" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 2: GALLERY LIGHTBOX ───────────────────────────────────────── */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative border border-slate-700"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black"
            >
              <FaXmark />
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="w-full max-h-[70vh] object-contain bg-black"
            />
            <div className="p-5 text-white">
              <h4 className="text-base font-black">{lightboxImage.title}</h4>
              {lightboxImage.desc && <p className="text-xs text-slate-300 mt-1">{lightboxImage.desc}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: VIDEO PLAYER MODAL ─────────────────────────────────────── */}
      {activeVideo && (
        <div
          onClick={() => setActiveVideo(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-slate-700"
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs hover:bg-white/40"
            >
              <FaXmark />
            </button>
            <div className="relative pt-[56.25%] w-full">
              <iframe
                src={activeVideo.embedUrl || `https://www.youtube.com/embed/${activeVideo.videoUrl?.split('v=')[1] || ''}?autoplay=1`}
                title={activeVideo.title}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 bg-slate-900 text-white">
              <h4 className="text-sm font-black">{activeVideo.title}</h4>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: QR CODE MODAL ──────────────────────────────────────────── */}
      {qrModalOpen && (
        <div
          onClick={() => setQrModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative border border-slate-200"
          >
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 text-base"
            >
              <FaXmark />
            </button>
            <h4 className="text-base font-black text-slate-900 mb-1">UPI Payment QR</h4>
            <p className="text-xs text-slate-500 mb-4">{businessName}</p>

            <div className="w-56 h-56 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center p-4 border border-slate-200 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessName)}`}
                alt="Payment QR"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="mt-4 font-mono font-bold text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {upiId}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(upiId, 'UPI ID')}
              className="w-full mt-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Copy UPI ID
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWebsitePage;
