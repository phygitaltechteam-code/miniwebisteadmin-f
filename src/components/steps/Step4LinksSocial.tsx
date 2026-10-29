import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRight, ArrowLeft, ExternalLink, Globe, MapPin, Store,
  MessageCircle, Send, Twitter, Facebook, Instagram, Linkedin,
  Youtube, Loader2, X, Link2, Save, ShoppingBag,
  Music, ShoppingCart, Smartphone, Hash, Slack, Calendar,
  Mail, Phone, Star, BookOpen, PhoneCall, Pin, Video,
  Award, Plane, Compass, FileText, Film, Image as ImageIcon,
  Utensils, UtensilsCrossed, Sparkles, Package, Baby,
  Tag, Play, Palette, MessageSquare, AtSign, Search
} from 'lucide-react';
import { ProfileData } from '../../types/profile';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { AddLinkModal } from '@/components/AddLinkModal';
import { saveSettingsOrder, sortByOrder } from '@/lib/api/customerSettingsApi';
import { useDragReorder, moveItem } from '@/hooks/useDragReorder';
import {
  getCustomerLinks,
  saveOrUpdateCustomerLinks,
  parseCustomerLinksResponse,
  customLinkKeys,
  toBackendLinkOrder
} from '@/lib/api/customerSocialApi';
import { reorderLinks, reorderErrorText } from '@/lib/api/reorderApi';

// ─── Link Item Definition ─────────────────────────────────────────────────────

export interface LinkItemDef {
  key: string;
  name: string;
  defaultDescription: string;
  category: string;
  icon: React.ReactNode;
}

const ALL_LINK_ITEMS: LinkItemDef[] = [
  // 1. Recommended Links
  { key: 'customLink', name: 'Custom Link', defaultDescription: 'Visit our featured custom page', category: 'Recommended Links', icon: <ExternalLink className="w-4 h-4 text-[#2563EB]" /> },
  { key: 'whatsappLinks', name: 'Whatsapp', defaultDescription: 'Chat with us directly on WhatsApp', category: 'Recommended Links', icon: <MessageCircle className="w-4 h-4 text-emerald-500" /> },
  { key: 'emailLinks', name: 'Email', defaultDescription: 'Send us an email enquiry', category: 'Recommended Links', icon: <Mail className="w-4 h-4 text-red-500" /> },
  { key: 'callLinks', name: 'Phone', defaultDescription: 'Call our primary contact line', category: 'Recommended Links', icon: <Phone className="w-4 h-4 text-blue-500" /> },
  { key: 'instagramLink', name: 'Instagram', defaultDescription: 'Follow our official Instagram feed', category: 'Recommended Links', icon: <Instagram className="w-4 h-4 text-pink-600" /> },
  { key: 'linkedinLink', name: 'LinkedIn', defaultDescription: 'Connect with our corporate profile', category: 'Recommended Links', icon: <Linkedin className="w-4 h-4 text-sky-600" /> },
  { key: 'youTubeLink', name: 'Youtube', defaultDescription: 'Watch our video tutorials & stories', category: 'Recommended Links', icon: <Youtube className="w-4 h-4 text-red-600" /> },
  { key: 'facebookLink', name: 'Facebook', defaultDescription: 'Like and follow our Facebook community', category: 'Recommended Links', icon: <Facebook className="w-4 h-4 text-blue-600" /> },
  { key: 'googleMyBussiness', name: 'Google Reviews', defaultDescription: 'Rate & review our business on Google', category: 'Recommended Links', icon: <Star className="w-4 h-4 text-amber-500" /> },

  // 2. Contact Info
  { key: 'whatsappLinks', name: 'Whatsapp', defaultDescription: 'Chat with us on WhatsApp', category: 'Contact Info', icon: <MessageCircle className="w-4 h-4 text-emerald-500" /> },
  { key: 'emailLinks', name: 'Email', defaultDescription: 'Email us directly', category: 'Contact Info', icon: <Mail className="w-4 h-4 text-red-500" /> },
  { key: 'callLinks', name: 'Phone', defaultDescription: 'Call our direct phone line', category: 'Contact Info', icon: <Phone className="w-4 h-4 text-blue-500" /> },
  { key: 'messageLink', name: 'Message', defaultDescription: 'Send us a direct SMS or message', category: 'Contact Info', icon: <MessageSquare className="w-4 h-4 text-blue-500" /> },
  { key: 'waBusinessLink', name: 'WA Business', defaultDescription: 'Connect on WhatsApp Business', category: 'Contact Info', icon: <MessageCircle className="w-4 h-4 text-emerald-600" /> },
  { key: 'skypeLink', name: 'Skype', defaultDescription: 'Connect with us on Skype', category: 'Contact Info', icon: <MessageSquare className="w-4 h-4 text-sky-500" /> },
  { key: 'weChatLink', name: 'WeChat', defaultDescription: 'Message us on WeChat', category: 'Contact Info', icon: <MessageCircle className="w-4 h-4 text-green-600" /> },

  // 3. Business Info
  { key: 'webSiteLink', name: 'Website', defaultDescription: 'Visit our official business website', category: 'Business Info', icon: <Globe className="w-4 h-4 text-teal-600" /> },
  { key: 'location', name: 'Location', defaultDescription: 'Get directions on Google Maps', category: 'Business Info', icon: <MapPin className="w-4 h-4 text-red-500" /> },
  { key: 'bookingLink', name: 'Calendly', defaultDescription: 'Schedule a consultation meeting', category: 'Business Info', icon: <Calendar className="w-4 h-4 text-blue-500" /> },
  { key: 'catalogue', name: 'Catalogue', defaultDescription: 'Explore our product catalogue', category: 'Business Info', icon: <BookOpen className="w-4 h-4 text-indigo-500" /> },
  { key: 'indiamartLink', name: 'IndiaMART', defaultDescription: 'Visit our verified IndiaMART storefront', category: 'Business Info', icon: <Store className="w-4 h-4 text-orange-500" /> },
  { key: 'justdialLink', name: 'Justdial', defaultDescription: 'Find our listings on Justdial', category: 'Business Info', icon: <PhoneCall className="w-4 h-4 text-blue-600" /> },
  { key: 'googleMyBussiness', name: 'Google my Business', defaultDescription: 'Find us on Google Business profile', category: 'Business Info', icon: <Star className="w-4 h-4 text-amber-500" /> },

  // 4. Social Media
  { key: 'instagramLink', name: 'Instagram', defaultDescription: 'Follow our stories and posts', category: 'Social Media', icon: <Instagram className="w-4 h-4 text-pink-600" /> },
  { key: 'linkedinLink', name: 'LinkedIn', defaultDescription: 'Connect with our professional network', category: 'Social Media', icon: <Linkedin className="w-4 h-4 text-sky-600" /> },
  { key: 'youTubeLink', name: 'Youtube', defaultDescription: 'Subscribe to our YouTube channel', category: 'Social Media', icon: <Youtube className="w-4 h-4 text-red-600" /> },
  { key: 'facebookLink', name: 'Facebook', defaultDescription: 'Like our Facebook page', category: 'Social Media', icon: <Facebook className="w-4 h-4 text-blue-600" /> },
  { key: 'twitter', name: 'X (Twitter)', defaultDescription: 'Follow our real-time updates on X', category: 'Social Media', icon: <Twitter className="w-4 h-4 text-slate-800" /> },
  { key: 'pinterestLink', name: 'Pinterest', defaultDescription: 'Pin and explore our design ideas', category: 'Social Media', icon: <Pin className="w-4 h-4 text-rose-600" /> },
  { key: 'tiktokLink', name: 'Tiktok', defaultDescription: 'Watch our TikTok videos', category: 'Social Media', icon: <Video className="w-4 h-4 text-slate-900" /> },
  { key: 'snapchatLink', name: 'Snapchat', defaultDescription: 'Add us on Snapchat', category: 'Social Media', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
  { key: 'telegram', name: 'Telegram', defaultDescription: 'Join our public Telegram channel', category: 'Social Media', icon: <Send className="w-4 h-4 text-sky-500" /> },
  { key: 'waChannelLink', name: 'WA Channel', defaultDescription: 'Follow our official WhatsApp Channel', category: 'Social Media', icon: <MessageCircle className="w-4 h-4 text-emerald-600" /> },
  { key: 'threadsLink', name: 'Threads', defaultDescription: 'Join discussions on Threads', category: 'Social Media', icon: <AtSign className="w-4 h-4 text-slate-800" /> },

  // 5. Reviews
  { key: 'googleMyBussiness', name: 'Google Reviews', defaultDescription: 'Leave a 5-star review on Google', category: 'Reviews', icon: <Star className="w-4 h-4 text-amber-500" /> },
  { key: 'trustpilotLink', name: 'Trustpilot', defaultDescription: 'Read our verified Trustpilot reviews', category: 'Reviews', icon: <Award className="w-4 h-4 text-emerald-600" /> },
  { key: 'bookingLink', name: 'Booking', defaultDescription: 'Book your spot directly', category: 'Reviews', icon: <Plane className="w-4 h-4 text-indigo-500" /> },
  { key: 'tripadvisorLink', name: 'Tripadvisor', defaultDescription: 'View our traveler ratings on Tripadvisor', category: 'Reviews', icon: <Compass className="w-4 h-4 text-emerald-500" /> },
  { key: 'goibiboLink', name: 'Goibibo', defaultDescription: 'Check our bookings on Goibibo', category: 'Reviews', icon: <Plane className="w-4 h-4 text-orange-500" /> },
  { key: 'makeMyTripLink', name: 'Make My Trip', defaultDescription: 'Explore our MakeMyTrip presence', category: 'Reviews', icon: <Plane className="w-4 h-4 text-red-500" /> },

  // 6. Content
  { key: 'pdfLink', name: 'PDF', defaultDescription: 'Download our documents & brochure', category: 'Content', icon: <FileText className="w-4 h-4 text-red-600" /> },
  { key: 'videoLink', name: 'Video', defaultDescription: 'Watch our featured video', category: 'Content', icon: <Film className="w-4 h-4 text-purple-600" /> },
  { key: 'imageLink', name: 'Image', defaultDescription: 'View our high-res image portfolio', category: 'Content', icon: <ImageIcon className="w-4 h-4 text-sky-600" /> },

  // 7. Food
  { key: 'zomatoLink', name: 'Zomato', defaultDescription: 'Order your favorite food on Zomato', category: 'Food', icon: <Utensils className="w-4 h-4 text-red-500" /> },
  { key: 'swiggyLink', name: 'Swiggy', defaultDescription: 'Order delicious meals on Swiggy', category: 'Food', icon: <UtensilsCrossed className="w-4 h-4 text-orange-500" /> },
  { key: 'uberLink', name: 'Uber Eats', defaultDescription: 'Get meals delivered by Uber Eats', category: 'Food', icon: <ShoppingBag className="w-4 h-4 text-emerald-700" /> },

  // 8. Communication Group
  { key: 'slackLink', name: 'Slack', defaultDescription: 'Join our team Slack workspace', category: 'Communication Group', icon: <Slack className="w-4 h-4 text-purple-600" /> },
  { key: 'whatsappGroup', name: 'Whatsapp Group', defaultDescription: 'Join our VIP WhatsApp group', category: 'Communication Group', icon: <MessageCircle className="w-4 h-4 text-emerald-500" /> },
  { key: 'facebookGroup', name: 'Facebook Group', defaultDescription: 'Join our active Facebook group', category: 'Communication Group', icon: <Facebook className="w-4 h-4 text-blue-500" /> },

  // 9. Music
  { key: 'spotifyLink', name: 'Spotify', defaultDescription: 'Listen to our curated Spotify playlist', category: 'Music', icon: <Music className="w-4 h-4 text-emerald-500" /> },

  // 10. Shopping
  { key: 'amazonLink', name: 'Amazon', defaultDescription: 'Shop our official store on Amazon', category: 'Shopping', icon: <ShoppingCart className="w-4 h-4 text-amber-600" /> },
  { key: 'flipkartLink', name: 'Flipkart', defaultDescription: 'Explore our catalog on Flipkart', category: 'Shopping', icon: <ShoppingBag className="w-4 h-4 text-blue-500" /> },
  { key: 'myntraLink', name: 'Mynta', defaultDescription: 'Discover our fashion collection on Myntra', category: 'Shopping', icon: <ShoppingBag className="w-4 h-4 text-pink-500" /> },
  { key: 'nykaaLink', name: 'Nykaa', defaultDescription: 'Shop beauty & wellness on Nykaa', category: 'Shopping', icon: <Sparkles className="w-4 h-4 text-rose-500" /> },
  { key: 'meshowLink', name: 'Meesho', defaultDescription: 'Order affordable products on Meesho', category: 'Shopping', icon: <Package className="w-4 h-4 text-pink-600" /> },
  { key: 'firstCryLink', name: 'FirstCry', defaultDescription: 'Shop kids & baby products on FirstCry', category: 'Shopping', icon: <Baby className="w-4 h-4 text-yellow-500" /> },
  { key: 'shopify', name: 'Shopify', defaultDescription: 'Explore our online store', category: 'Shopping', icon: <ShoppingBag className="w-4 h-4 text-green-600" /> },
  { key: 'ajioLink', name: 'Ajio', defaultDescription: 'Shop trendy styles on Ajio', category: 'Shopping', icon: <Tag className="w-4 h-4 text-slate-800" /> },

  // 11. More
  { key: 'playStoreLink', name: 'PlayStore', defaultDescription: 'Download our Android app on Play Store', category: 'More', icon: <Play className="w-4 h-4 text-emerald-600" /> },
  { key: 'appStoreLink', name: 'App Store', defaultDescription: 'Download our iOS app on App Store', category: 'More', icon: <Smartphone className="w-4 h-4 text-blue-600" /> },
  { key: 'mediumLink', name: 'Medium', defaultDescription: 'Read our blog and articles on Medium', category: 'More', icon: <BookOpen className="w-4 h-4 text-slate-900" /> },
  { key: 'discordLink', name: 'Discord', defaultDescription: 'Hang out on our Discord server', category: 'More', icon: <Hash className="w-4 h-4 text-indigo-500" /> },
  { key: 'behanceLink', name: 'Beh', defaultDescription: 'Explore our creative work on Behance', category: 'More', icon: <Palette className="w-4 h-4 text-blue-600" /> },
];

const CATEGORIES = [
  'All Links',
  'Recommended Links',
  'Contact Info',
  'Business Info',
  'Social Media',
  'Reviews',
  'Content',
  'Food',
  'Communication Group',
  'Music',
  'Shopping',
  'More',
];

// ─── Step 4 Main Component ────────────────────────────────────────────────────

interface Step4Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

export const Step4LinksSocial: React.FC<Step4Props> = ({
  profile,
  onChange,
  onNext,
  onPrev,
  onToast,
  adminId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Links');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeItem, setActiveItem] = useState<LinkItemDef | null>(null);

  // Hydrate from API on mount
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await getCustomerLinks(adminId);
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

  const getCurrentValue = (key: string): string => {
    return ((profile as any)[key] as string) || (profile.linksDetails?.[key]?.url) || '';
  };

  const getCurrentDescription = (key: string, fallback: string): string => {
    return profile.linksDetails?.[key]?.description || fallback;
  };

  const getCurrentIcon = (key: string): string | undefined => {
    return profile.linksDetails?.[key]?.icon;
  };

  const handleModalSave = async (data: { name: string; description: string; url: string; icon?: string }) => {
    if (!activeItem) return false;

    const updatedDetails = {
      ...(profile.linksDetails || {}),
      [activeItem.key]: {
        id: activeItem.key,
        name: data.name,
        description: data.description,
        url: data.url,
        icon: data.icon,
      },
    };
    const nextProfile = { ...profile, [activeItem.key]: data.url, linksDetails: updatedDetails } as ProfileData;

    // Save this link to the links API right away from the popup
    try {
      const res = await saveOrUpdateCustomerLinks(nextProfile, adminId);
      onChange(activeItem.key as keyof ProfileData, data.url as any);
      onChange('linksDetails' as any, updatedDetails);
      toast.success(res?.message || `${data.name} link saved!`);
      onToast(`✓ ${data.name} link saved!`);
      setActiveItem(null);
      return true;
    } catch (error: any) {
      const fieldErrors = error?.response?.data?.errors;
      const backendMessage =
        (Array.isArray(fieldErrors) && fieldErrors.length > 0
          ? fieldErrors.map((e: any) => `${e.field ? e.field + ': ' : ''}${e.message}`).join(', ')
          : '') ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save link.';
      const statusCode = error?.response?.status ? ` [HTTP ${error.response.status}]` : '';
      toast.error(`API Error${statusCode}: ${backendMessage}`);
      onToast(`❌ API Error${statusCode}: ${backendMessage}`);
      return false;
    }
  };

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
      onNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom links: every saved one (customLink, customLink2, …) plus one empty slot to add another
  const savedCustomKeys = customLinkKeys(profile).filter((key) => getCurrentValue(key).trim());
  const emptyCustomKey = ['customLink', ...Array.from({ length: savedCustomKeys.length + 1 }, (_, i) => `customLink${i + 2}`)]
    .find((key) => !savedCustomKeys.includes(key))!;
  const linkItems = ALL_LINK_ITEMS.flatMap((item) =>
    item.key === 'customLink' ? [...savedCustomKeys, emptyCustomKey].map((key) => ({ ...item, key })) : [item]
  );

  // Show / hide a link on the card, saved to the settings API as hiddenLinks
  const hiddenLinks = profile.hiddenLinks || [];
  const toggleLinkVisibility = async (key: string, name: string) => {
    const isHidden = hiddenLinks.includes(key);
    const next = isHidden ? hiddenLinks.filter((k) => k !== key) : [...hiddenLinks, key];
    onChange('hiddenLinks', next);
    try {
      await saveSettingsOrder({ hiddenLinks: next }, adminId);
      toast.success(`${name} ${isHidden ? 'shown on' : 'hidden from'} card`);
    } catch (error: any) {
      onChange('hiddenLinks', hiddenLinks);
      toast.error(`API Error: ${error?.response?.data?.message || error?.message || 'Failed to save link visibility'}`);
    }
  };

  // Links sorted by the saved linkOrder (drag & drop), then filtered by category & search query
  const orderedLinkItems = sortByOrder(linkItems, profile.linkOrder, (item) => item.key);
  const filteredLinks = orderedLinkItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All Links' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Drag & drop link order: the full key list is kept locally; the links that hold a value are saved
  // with PATCH links/reorder as linkOrder (custom links as custom:<n>)
  const { dragProps: linkDragProps, dragClass: linkDragClass } = useDragReorder(async (from, to) => {
    const fromKey = filteredLinks[from]?.key;
    const toKey = filteredLinks[to]?.key;
    if (!fromKey || !toKey || fromKey === toKey) return;
    const previous = profile.linkOrder;
    const keys = Array.from(new Set(orderedLinkItems.map((i) => i.key)));
    const order = moveItem(keys, keys.indexOf(fromKey), keys.indexOf(toKey));
    onChange('linkOrder', order);
    const backendOrder = toBackendLinkOrder(order, profile);
    if (backendOrder.length === 0) return; // nothing saved yet to order on the server
    try {
      await reorderLinks(backendOrder, adminId);
      toast.success('Link order saved');
    } catch (error: any) {
      onChange('linkOrder', previous);
      toast.error(`API Error: ${reorderErrorText(error, 'Failed to save link order')}`);
    }
  });

  return (
    <>
      {/* Add Link Details Modal (Matching Attached Image) */}
      {activeItem && (
        <AddLinkModal
          isOpen={Boolean(activeItem)}
          onClose={() => setActiveItem(null)}
          linkKey={activeItem.key}
          defaultName={activeItem.name}
          defaultDescription={getCurrentDescription(activeItem.key, activeItem.defaultDescription)}
          currentValue={getCurrentValue(activeItem.key)}
          currentDescription={getCurrentDescription(activeItem.key, activeItem.defaultDescription)}
          currentIcon={getCurrentIcon(activeItem.key)}
          currentName={profile.linksDetails?.[activeItem.key]?.name}
          onSave={handleModalSave}
        />
      )}

      <section
        className="bg-white border border-[#E0E0E0] rounded-lg p-2.5 sm:p-3.5 shadow-xs scroll-mt-28 font-['Roboto',Helvetica,Arial,sans-serif]"
        id="sec-4"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-[#E0E0E0] mb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2196F3] flex items-center justify-center font-bold text-xs shrink-0">
              4
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
                Link Store
              </h2>
              <p className="text-[11px] text-gray-500">
                Choose and configure destination links across various categories
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search links (e.g. Shopify)..."
              className="w-full h-9 pl-8 pr-3 text-[14px] bg-white rounded border border-[#C4C4C4] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] focus:outline-none focus:border-[#2196F3]"
            />
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-[#f4f7fa] text-gray-600 hover:bg-[#eaf1fb] hover:text-[#2563EB]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Links Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredLinks.map((item, idx) => {
              const val = getCurrentValue(item.key);
              const customIcon = getCurrentIcon(item.key);
              const isLinked = Boolean(val && val.trim());
              const displayName = (item.key.startsWith('customLink') && profile.linksDetails?.[item.key]?.name) || item.name;

              return (
                <div
                  key={`${item.category}-${item.name}-${idx}`}
                  {...linkDragProps(idx)}
                  title="Drag to reorder"
                  className={`flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-[#2563EB]/40 hover:shadow-xs transition-all group cursor-grab active:cursor-grabbing ${linkDragClass(idx)}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isLinked && !hiddenLinks.includes(item.key)}
                      disabled={!isLinked}
                      onChange={() => toggleLinkVisibility(item.key, displayName)}
                      title={isLinked ? 'Show this link on the card' : 'Add the link first'}
                      className="w-4 h-4 shrink-0 accent-[#2563EB] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    />
                    <div className="w-8 h-8 rounded-lg bg-[#f8f9fc] border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {customIcon ? (
                        <img
                          src={customIcon}
                          alt={item.name}
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        item.icon
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#091426] truncate">
                        {displayName}
                      </h4>
                      <p className="text-[10px] text-gray-500 truncate" title={val || item.defaultDescription}>
                        {val || item.category}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveItem(item)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ml-2 shadow-2xs ${
                      isLinked
                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#DBEAFE]'
                        : 'bg-gray-100 text-gray-700 hover:bg-[#2563EB] hover:text-white'
                    }`}
                  >
                    {isLinked ? 'LINKED ✓' : '+ ADD'}
                  </button>
                </div>
              );
            })}
          </div>

          {filteredLinks.length === 0 && (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-500 font-medium">
                No links found matching &ldquo;{searchQuery}&rdquo; in {selectedCategory}.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="px-4 py-2 rounded border border-[#C4C4C4] bg-white text-[#000000DE] text-[14px] font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous: Products</span>
          </button>

          <GenericButton
            type="button"
            onClick={handleSaveAndNext}
            disabled={isSubmitting}
            className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-6 !py-2 !text-[14px] font-medium text-white shadow-none flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Links...</span>
              </>
            ) : (
              <>
                <span>Save & Next</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </GenericButton>
        </div>
      </section>
    </>
  );
};

export default Step4LinksSocial;
