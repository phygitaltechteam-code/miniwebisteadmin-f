import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRight, ArrowLeft, ExternalLink, Globe, MapPin, Store,
  MessageCircle, Send, Twitter, Facebook, Instagram, Linkedin,
  Youtube, Mail, Phone, Loader2, X, Link2, Save, ShoppingBag,
  FileText, Video, Image as ImageIcon, Music, ShoppingCart,
  Smartphone, Hash, Slack, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { ProfileData } from '../../types/profile';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { step4LinksSocialSchema } from '@/schemas/cardProfileSchema';
import {
  getCustomerLinks,
  saveOrUpdateCustomerLinks,
  parseCustomerLinksResponse
} from '@/lib/api/customerSocialApi';

// ─── Link Entry Popup ─────────────────────────────────────────────────────────

interface LinkPopupConfig {
  title: string;
  label: string;
  placeholder: string;
  helperText?: string;
  type?: 'url' | 'text' | 'tel' | 'email';
}

interface LinkPopupProps {
  config: LinkPopupConfig;
  currentValue: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

const LinkPopup: React.FC<LinkPopupProps> = ({ config, currentValue, onSave, onClose }) => {
  const [value, setValue] = useState(currentValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') { onSave(value.trim()); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [value]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>
            <span className="text-sm font-bold text-[#091426]">{config.title}</span>
          </div>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <label className="block text-xs font-semibold text-[#45474c] mb-1.5">{config.label}</label>
        <input
          ref={inputRef}
          type={config.type || 'url'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={config.placeholder}
          className="w-full px-3 py-2.5 rounded-xl border border-[#c5c6cd] text-sm text-[#091426] placeholder:text-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
        />
        {config.helperText && (
          <p className="text-[11px] text-gray-400 mt-1.5">{config.helperText}</p>
        )}

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#c5c6cd] text-xs font-semibold text-[#45474c] hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button type="button"
            onClick={() => { onSave(value.trim()); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#1D4ED8] active:scale-[0.98] transition-all shadow-md shadow-[#2563EB]/25">
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Link Row ─────────────────────────────────────────────────────────────────

interface LinkRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  onEdit: () => void;
}

const LinkRow: React.FC<LinkRowProps> = ({ icon, label, value, onEdit }) => {
  const isLinked = !!value;
  return (
    <div className="flex items-center justify-between text-xs p-2 sm:p-2.5 rounded-xl bg-white border border-stroke hover:border-[#2563EB]/40 transition-colors">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-[#091426] block truncate">{label}</span>
          {isLinked && (
            <span className="text-[10px] text-gray-400 font-mono truncate block max-w-[140px] sm:max-w-xs">
              {value!.replace(/^https?:\/\//, '').replace(/^mailto:/, '').replace(/^tel:/, '')}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className={`text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-lg transition-colors shrink-0 ml-1.5 ${
          isLinked
            ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
            : 'text-gray-600 bg-gray-100 hover:bg-[#EFF6FF] hover:text-[#2563EB]'
        }`}
      >
        {isLinked ? 'LINKED ✓' : '+ ADD'}
      </button>
    </div>
  );
};

// ─── Popup Configs ─────────────────────────────────────────────────────────────

type PopupKey = keyof typeof POPUP_CONFIGS;

const POPUP_CONFIGS = {
  webSiteLink:       { title: 'Website', label: 'Website URL', placeholder: 'https://www.yourbusiness.com', helperText: 'Include https://' },
  location:          { title: 'Location / Google Maps', label: 'Google Maps Link', placeholder: 'https://maps.app.goo.gl/...', helperText: 'Paste your Google Maps or GMB location link' },
  googleMyBussiness: { title: 'Google My Business', label: 'GMB Profile Link', placeholder: 'https://g.page/yourbusiness', helperText: 'Your Google My Business profile URL' },
  instagramLink:     { title: 'Instagram', label: 'Instagram Profile URL', placeholder: 'https://instagram.com/yourhandle' },
  facebookLink:      { title: 'Facebook Page', label: 'Facebook Page URL', placeholder: 'https://facebook.com/yourpage' },
  youTubeLink:       { title: 'YouTube Channel', label: 'YouTube URL', placeholder: 'https://youtube.com/@yourchannel' },
  linkedinLink:      { title: 'LinkedIn', label: 'LinkedIn Profile / Company URL', placeholder: 'https://linkedin.com/in/yourprofile' },
  twitter:           { title: 'X (Twitter)', label: 'Twitter Profile URL or @handle', placeholder: 'https://twitter.com/yourhandle' },
  whatsappLinks:     { title: 'WhatsApp Direct', label: 'WhatsApp Chat Link', placeholder: 'https://wa.me/919876543210', helperText: 'Format: https://wa.me/<countrycode><number>' },
  emailLinks:        { title: 'Email', label: 'Email Address or mailto link', placeholder: 'mailto:you@business.com', type: 'email' as const },
  callLinks:         { title: 'Phone Call', label: 'Phone Number or tel link', placeholder: 'tel:+919876543210', type: 'tel' as const },
  whatsappGroup:     { title: 'WhatsApp Group', label: 'WhatsApp Group Invite Link', placeholder: 'https://chat.whatsapp.com/...', helperText: 'Group invite link from WhatsApp' },
  facebookGroup:     { title: 'Facebook Group', label: 'Facebook Group URL', placeholder: 'https://facebook.com/groups/yourgroup' },
  telegram:          { title: 'Telegram', label: 'Telegram Channel / Group Link', placeholder: 'https://t.me/yourchannel' },
  slackLink:         { title: 'Slack', label: 'Slack Workspace Link', placeholder: 'https://yourteam.slack.com' },
  discordLink:       { title: 'Discord', label: 'Discord Server Invite', placeholder: 'https://discord.gg/yourserver' },
  catalogue:         { title: 'Catalogue / Store', label: 'Catalogue or Online Store URL', placeholder: 'https://yourstore.com' },
  shopify:           { title: 'Shopify Store', label: 'Shopify Store URL', placeholder: 'https://yourstore.myshopify.com' },
  amazonLink:        { title: 'Amazon Store', label: 'Amazon Seller / Product URL', placeholder: 'https://amazon.in/...' },
  zomatoLink:        { title: 'Zomato', label: 'Zomato Restaurant Link', placeholder: 'https://zomato.com/...' },
  swiggyLink:        { title: 'Swiggy', label: 'Swiggy Restaurant Link', placeholder: 'https://swiggy.com/...' },
  uberLink:          { title: 'Uber Eats', label: 'Uber Eats Link', placeholder: 'https://ubereats.com/...' },
  bookingLink:       { title: 'Booking / Appointment', label: 'Booking Link', placeholder: 'https://calendly.com/yourname' },
  meshowLink:        { title: 'Meshow', label: 'Meshow Profile Link', placeholder: 'https://meshow.in/...' },
  appStoreLink:      { title: 'App Store', label: 'App Store / Play Store URL', placeholder: 'https://apps.apple.com/...' },
  goLink:            { title: 'Go Link', label: 'Go / Short URL', placeholder: 'https://go.yourdomain.com/...' },
  pdfLink:           { title: 'PDF / Brochure', label: 'PDF or Document Link', placeholder: 'https://drive.google.com/...' },
  videoLink:         { title: 'Video Link', label: 'Video URL', placeholder: 'https://youtu.be/...' },
  imageLink:         { title: 'Image / Portfolio', label: 'Image or Portfolio URL', placeholder: 'https://...' },
  spotifyLink:       { title: 'Spotify', label: 'Spotify Profile / Playlist Link', placeholder: 'https://open.spotify.com/...' },
  customLink:        { title: 'Custom Link', label: 'Custom Destination URL', placeholder: 'https://yoursite.com/page' },
} as const satisfies Record<string, LinkPopupConfig>;

// ─── Step 4 Component ─────────────────────────────────────────────────────────

interface Step4Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

export const Step4LinksSocial: React.FC<Step4Props> = ({
  profile, onChange, onNext, onPrev, onToast, adminId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePopup, setActivePopup] = useState<PopupKey | null>(null);
  const [showMore, setShowMore] = useState(false);

  // Hydrate from API on mount (GET customers/links or superAdmin/admin/:adminId/links)
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await getCustomerLinks(adminId);
        // The response wrapper: { statusCode, status, message, data: { ... } }
        const raw = res?.data || res;
        if (!isMounted || !raw || typeof raw !== 'object') return;

        const parsed = parseCustomerLinksResponse(raw);
        (Object.entries(parsed) as [keyof ProfileData, any][]).forEach(([key, val]) => {
          if (val !== undefined && val !== null) onChange(key, val);
        });
      } catch {
        // fine — no existing links
      }
    };
    load();
    return () => { isMounted = false; };
  }, [adminId]);

  // ── Popup helpers ────────────────────────────────────────────────────────

  const openPopup = (key: PopupKey) => setActivePopup(key);
  const closePopup = () => setActivePopup(null);

  const getCurrentValue = (key: PopupKey): string =>
    ((profile as any)[key] as string | undefined | null) ?? '';

  const handlePopupSave = (key: PopupKey, value: string) => {
    onChange(key as keyof ProfileData, value || undefined as any);
    onToast(value ? `✅ ${POPUP_CONFIGS[key].title} saved!` : `${POPUP_CONFIGS[key].title} cleared.`);
  };

  // ── Save & Next ──────────────────────────────────────────────────────────

  const handleSaveAndNext = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading('Saving links...');
    try {
      const res = await saveOrUpdateCustomerLinks(profile, adminId);
      const msg = res?.message || 'Links saved successfully!';
      toast.success(msg, { id: toastId, duration: 4000 });
      onToast(`✅ ${msg}`);
      onNext();
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message || error?.message || 'Failed to save links.';
      const statusCode = error?.response?.status ? ` [HTTP ${error.response.status}]` : '';
      const errText = `API Error${statusCode}: ${backendMessage}`;
      toast.error(errText, { id: toastId, duration: 5000 });
      onToast(`❌ ${errText}`);
      onNext(); // non-fatal
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Icon helpers ─────────────────────────────────────────────────────────

  const ico = (el: React.ReactNode) => <span className="w-4 h-4 shrink-0 flex items-center justify-center">{el}</span>;

  return (
    <>
      {/* Link Entry Popup */}
      {activePopup && (
        <LinkPopup
          config={POPUP_CONFIGS[activePopup]}
          currentValue={getCurrentValue(activePopup)}
          onSave={(val) => handlePopupSave(activePopup, val)}
          onClose={closePopup}
        />
      )}

      <section className="bg-white border border-[#c5c6cd]/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs scroll-mt-28" id="sec-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#c5c6cd]/40 mb-3.5 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">4</div>
            <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">Links & Social Store</h2>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">

          {/* ── Core Web & Location ── */}
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2.5">Web & Location</span>
            <div className="space-y-2">
              <LinkRow icon={ico(<Globe className="w-4 h-4 text-[#2563EB]" />)} label="Website" value={profile.webSiteLink || profile.website} onEdit={() => openPopup('webSiteLink')} />
              <LinkRow icon={ico(<MapPin className="w-4 h-4 text-[#2563EB]" />)} label="Location / Maps" value={profile.location || profile.mapLink} onEdit={() => openPopup('location')} />
              <LinkRow icon={ico(<MapPin className="w-4 h-4 text-emerald-600" />)} label="Google My Business" value={profile.googleMyBussiness} onEdit={() => openPopup('googleMyBussiness')} />
            </div>
          </div>

          {/* ── Contact / Messaging ── */}
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2.5">Contact & Messaging</span>
            <div className="space-y-2">
              <LinkRow icon={ico(<MessageCircle className="w-4 h-4 text-emerald-600" />)} label="WhatsApp Direct" value={profile.whatsappLinks} onEdit={() => openPopup('whatsappLinks')} />
              <LinkRow icon={ico(<Mail className="w-4 h-4 text-rose-500" />)} label="Email" value={profile.emailLinks} onEdit={() => openPopup('emailLinks')} />
              <LinkRow icon={ico(<Phone className="w-4 h-4 text-[#2563EB]" />)} label="Phone Call" value={profile.callLinks} onEdit={() => openPopup('callLinks')} />
            </div>
          </div>

          {/* ── Social Media ── */}
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2.5">Social Media</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <LinkRow icon={ico(<Instagram className="w-4 h-4 text-pink-600" />)} label="Instagram" value={profile.instagramLink} onEdit={() => openPopup('instagramLink')} />
              <LinkRow icon={ico(<Facebook className="w-4 h-4 text-blue-600" />)} label="Facebook" value={profile.facebookLink} onEdit={() => openPopup('facebookLink')} />
              <LinkRow icon={ico(<Youtube className="w-4 h-4 text-red-600" />)} label="YouTube" value={profile.youTubeLink} onEdit={() => openPopup('youTubeLink')} />
              <LinkRow icon={ico(<Linkedin className="w-4 h-4 text-sky-600" />)} label="LinkedIn" value={profile.linkedinLink} onEdit={() => openPopup('linkedinLink')} />
              <LinkRow icon={ico(<Twitter className="w-4 h-4 text-slate-700" />)} label="X (Twitter)" value={profile.twitter} onEdit={() => openPopup('twitter')} />
            </div>
          </div>

          {/* ── Groups & Channels ── */}
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2.5">Groups & Channels</span>
            <div className="space-y-2">
              <LinkRow icon={ico(<MessageCircle className="w-4 h-4 text-emerald-500" />)} label="WhatsApp Group" value={profile.whatsappGroup} onEdit={() => openPopup('whatsappGroup')} />
              <LinkRow icon={ico(<Send className="w-4 h-4 text-sky-500" />)} label="Telegram" value={profile.telegram} onEdit={() => openPopup('telegram')} />
              <LinkRow icon={ico(<Facebook className="w-4 h-4 text-blue-500" />)} label="Facebook Group" value={profile.facebookGroup} onEdit={() => openPopup('facebookGroup')} />
            </div>
          </div>

          {/* ── Store & Catalogue ── */}
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2.5">Store & Catalogue</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <LinkRow icon={ico(<Store className="w-4 h-4 text-[#2563EB]" />)} label="Catalogue / Store" value={profile.catalogue} onEdit={() => openPopup('catalogue')} />
              <LinkRow icon={ico(<ShoppingBag className="w-4 h-4 text-green-600" />)} label="Shopify" value={profile.shopify} onEdit={() => openPopup('shopify')} />
              <LinkRow icon={ico(<ShoppingCart className="w-4 h-4 text-orange-500" />)} label="Amazon" value={profile.amazonLink} onEdit={() => openPopup('amazonLink')} />
              <LinkRow icon={ico(<Calendar className="w-4 h-4 text-violet-600" />)} label="Booking / Appointment" value={profile.bookingLink} onEdit={() => openPopup('bookingLink')} />
            </div>
          </div>

          {/* ── Food Delivery ── */}
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2.5">Food Delivery</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <LinkRow icon={ico(<ShoppingCart className="w-4 h-4 text-red-500" />)} label="Zomato" value={profile.zomatoLink} onEdit={() => openPopup('zomatoLink')} />
              <LinkRow icon={ico(<ShoppingCart className="w-4 h-4 text-orange-600" />)} label="Swiggy" value={profile.swiggyLink} onEdit={() => openPopup('swiggyLink')} />
              <LinkRow icon={ico(<ShoppingCart className="w-4 h-4 text-gray-700" />)} label="Uber Eats" value={profile.uberLink} onEdit={() => openPopup('uberLink')} />
            </div>
          </div>

          {/* ── More Links (collapsible) ── */}
          <div>
            <button
              type="button"
              onClick={() => setShowMore((p) => !p)}
              className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 hover:text-[#2563EB] transition-colors"
            >
              {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              More Links {showMore ? '(hide)' : '(show)'}
            </button>

            {showMore && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-150">
                <LinkRow icon={ico(<Slack className="w-4 h-4 text-purple-600" />)} label="Slack" value={profile.slackLink} onEdit={() => openPopup('slackLink')} />
                <LinkRow icon={ico(<Hash className="w-4 h-4 text-indigo-600" />)} label="Discord" value={profile.discordLink} onEdit={() => openPopup('discordLink')} />
                <LinkRow icon={ico(<Music className="w-4 h-4 text-green-500" />)} label="Spotify" value={profile.spotifyLink} onEdit={() => openPopup('spotifyLink')} />
                <LinkRow icon={ico(<Smartphone className="w-4 h-4 text-blue-500" />)} label="App Store / Play Store" value={profile.appStoreLink} onEdit={() => openPopup('appStoreLink')} />
                <LinkRow icon={ico(<Store className="w-4 h-4 text-pink-500" />)} label="Meshow" value={profile.meshowLink} onEdit={() => openPopup('meshowLink')} />
                <LinkRow icon={ico(<ExternalLink className="w-4 h-4 text-gray-500" />)} label="Go Link / Short URL" value={profile.goLink} onEdit={() => openPopup('goLink')} />
                <LinkRow icon={ico(<FileText className="w-4 h-4 text-rose-500" />)} label="PDF / Brochure" value={profile.pdfLink} onEdit={() => openPopup('pdfLink')} />
                <LinkRow icon={ico(<Video className="w-4 h-4 text-red-500" />)} label="Video Link" value={profile.videoLink} onEdit={() => openPopup('videoLink')} />
                <LinkRow icon={ico(<ImageIcon className="w-4 h-4 text-teal-500" />)} label="Image / Portfolio" value={profile.imageLink} onEdit={() => openPopup('imageLink')} />
                <LinkRow icon={ico(<ExternalLink className="w-4 h-4 text-[#2563EB]" />)} label="Custom Link" value={profile.customLink} onEdit={() => openPopup('customLink')} />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-5 pt-4 sm:mt-8 sm:pt-5 border-t border-[#c5c6cd]/40 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-stroke bg-white text-[#091426] text-xs font-semibold hover:bg-[#f8f9ff] flex items-center gap-1.5 sm:gap-2 transition-all shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Previous: Products & Services</span>
            <span className="sm:hidden">Previous</span>
          </button>

          <GenericButton
            type="button"
            onClick={handleSaveAndNext}
            disabled={isSubmitting}
            className="!px-6 !py-2.5 !text-xs !font-bold flex items-center gap-2 shadow-md shadow-[#2563EB]/25 disabled:opacity-60"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving Links...</span></>
            ) : (
              <><span>Save & Next</span><ArrowRight className="w-4 h-4" /></>
            )}
          </GenericButton>
        </div>
      </section>
    </>
  );
};
