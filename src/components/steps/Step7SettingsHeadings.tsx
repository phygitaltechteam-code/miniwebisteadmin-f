import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Sliders, Eye, EyeOff, Save, 
  ArrowLeft, CheckCircle2, RotateCcw, Loader2
} from 'lucide-react';
import { ProfileData } from '../../types/profile';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { step7SettingsHeadingsSchema } from '@/schemas/cardProfileSchema';
import { 
  getCustomerSettings, 
  saveOrUpdateCustomerSettings,
  resetCustomerSettings 
} from '@/lib/api/customerSettingsApi';

interface Step7Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onPrev: () => void;
  onSaveAll: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

export const Step7SettingsHeadings: React.FC<Step7Props> = ({
  profile,
  onChange,
  onPrev,
  onSaveAll,
  onToast,
  adminId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fetch existing card settings & headings on mount (GET customers/settings or superAdmin/admin/:adminId/settings)
  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const res = await getCustomerSettings(adminId);
        const raw = (res as any)?.data || (res as any)?.settings || res;
        if (!isMounted || !raw || typeof raw !== 'object') return;

        if (raw.headings && typeof raw.headings === 'object') {
          onChange('headings', { ...profile.headings, ...raw.headings });
        }
        if (raw.navLabels && typeof raw.navLabels === 'object') {
          onChange('navLabels', { ...profile.navLabels, ...raw.navLabels });
        }
        if (raw.visibility && typeof raw.visibility === 'object') {
          onChange('visibility', { ...profile.visibility, ...raw.visibility });
        }
        if (raw.amount !== undefined) onChange('amount', raw.amount);
        if (raw.renewalAmount !== undefined) onChange('renewalAmount', raw.renewalAmount);
      } catch (err) {
        // Normal if settings are not saved yet
      }
    };
    loadSettings();
    return () => { isMounted = false; };
  }, [adminId]);

  const handleToggleVisibility = (key: keyof ProfileData['visibility']) => {
    const updated = {
      ...profile.visibility,
      [key]: !profile.visibility[key],
    };
    onChange('visibility', updated);
  };

  const handleHeadingChange = (key: keyof ProfileData['headings'], value: string) => {
    onChange('headings', {
      ...profile.headings,
      [key]: value,
    });
  };

  const handleNavLabelChange = (key: keyof ProfileData['navLabels'], value: string) => {
    onChange('navLabels', {
      ...profile.navLabels,
      [key]: value,
    });
  };

  const handleResetDefaults = () => {
    onChange('headings', {
      linksHeading: 'Quick Links & Connect',
      aboutUsHeading: 'About Association',
      productsHeading: 'Services & Key Benefits',
      paymentHeading: 'Payment Methods',
      galleryHeading: 'Media & Events',
      youtubeVideosHeading: 'Video Highlights',
      feedbackHeading: 'Member Reviews',
      enquirySectionHeading: 'Send Business Enquiry',
      specialitiesSubheading: 'Key Areas of Expertise',
    });
    onChange('navLabels', {
      home: 'HOME',
      links: 'LINKS',
      about: 'ABOUT US',
      products: 'PRODUCTS',
      payment: 'PAYMENT',
      enquiry: 'ENQUIRY',
      gallery: 'GALLERY',
      videos: 'VIDEOS',
      feedback: 'FEEDBACK',
    });
    if (adminId) {
      resetCustomerSettings(adminId).catch(() => {});
    }
    onToast('Reset headings and bottom labels to default values.');
  };

  const handleSaveAndFinish = async () => {
    const result = step7SettingsHeadingsSchema.safeParse({
      amount: Number(profile.amount || 0),
      renewalAmount: Number(profile.renewalAmount || 0),
      headings: {
        aboutUsHeading: profile.headings.aboutUsHeading || 'About Us',
        productsServicesHeading: profile.headings.productsHeading || 'Products & Services',
        paymentHeading: profile.headings.paymentHeading || 'Payment Options',
        galleryHeading: profile.headings.galleryHeading || 'Gallery & Media',
      },
      navLabels: profile.navLabels,
      visibility: profile.visibility,
    });

    if (!result.success) {
      const msg = result.error.errors[0]?.message || 'Please check configuration values';
      toast.error(`Validation: ${msg}`, { id: 'save-step8' });
      onToast(`⚠️ Validation: ${msg}`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Syncing card settings to customers/settings API...');
    onToast('Finalizing & submitting card settings to server...');

    try {
      const res = await saveOrUpdateCustomerSettings(profile, adminId);
      const serverMsg = res?.message || 'Step 8: Card settings and headings saved successfully!';
      const displayMsg = `${serverMsg} (customers/settings)`;

      toast.success(displayMsg, { id: toastId, duration: 4000 });
      onToast(`✅ ${displayMsg}`);
      onSaveAll();
    } catch (error: any) {
      console.error('[Step7SettingsHeadings] API Error on customers/settings:', error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to sync settings to customers/settings API.';
      const statusCode = error?.response?.status ? ` [HTTP ${error.response.status}]` : '';

      const errText = `API Error${statusCode}: ${backendMessage}`;
      toast.error(errText, { id: toastId, duration: 5000 });
      onToast(`❌ ${errText}`);
      // Proceed on non-fatal error so complete flow can finish
      onSaveAll();
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityItems: { key: keyof ProfileData['visibility']; label: string }[] = [
    { key: 'hideLinksSection', label: 'Hide Links Section' },
    { key: 'hideAboutSection', label: 'Hide About Us Section' },
    { key: 'hideProductsSection', label: 'Hide Products/Services Section' },
    { key: 'hidePaymentSection', label: 'Hide Payment Options Section' },
    { key: 'hideGallerySection', label: 'Hide Gallery Section' },
    { key: 'hideYoutubeSection', label: 'Hide Youtube Videos Section' },
    { key: 'hideFeedbackSection', label: 'Hide Feedback Section' },
    { key: 'hideEnquirySection', label: 'Hide Enquiry Form Section' },
    { key: 'hideShareSection', label: 'Hide Share Section' },
    { key: 'hideUnenteredSocialMediaLinks', label: 'Hide Unentered Social Media Links' },
    { key: 'hideViewsCounter', label: 'Hide Views Counter' },
  ];

  const headingFields: { key: keyof ProfileData['headings']; label: string }[] = [
    { key: 'linksHeading', label: 'Links Heading' },
    { key: 'aboutUsHeading', label: 'About Us Heading' },
    { key: 'productsHeading', label: 'Products Heading' },
    { key: 'paymentHeading', label: 'Payment Heading' },
    { key: 'galleryHeading', label: 'Gallery Heading' },
    { key: 'youtubeVideosHeading', label: 'Youtube Videos Heading' },
    { key: 'feedbackHeading', label: 'Feedback Heading' },
    { key: 'enquirySectionHeading', label: 'Enquiry Section Heading' },
    { key: 'specialitiesSubheading', label: 'Specialities Subheading' },
  ];

  const navFields: { key: keyof ProfileData['navLabels']; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'links', label: 'Links' },
    { key: 'about', label: 'About' },
    { key: 'products', label: 'Products' },
    { key: 'payment', label: 'Payment' },
    { key: 'enquiry', label: 'Enquiry' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'videos', label: 'Videos' },
    { key: 'feedback', label: 'Feedback' },
  ];

  return (
    <section className="bg-white border border-[#c5c6cd]/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs scroll-mt-28" id="sec-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-[#c5c6cd]/40 mb-3.5 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
            8
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            Card Settings & Section Headings
          </h2>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-xs text-[#75777d] hover:text-[#2563EB] flex items-center gap-1 font-medium shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Defaults</span>
          <span className="sm:hidden">Reset</span>
        </button>
      </div>

      {/* Pricing & Renewal Amount Configuration */}
      <div className="mb-6 p-4 rounded-xl border border-stroke bg-[#f8f9fc]">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3">
          Card Pricing & Renewal Configuration
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GenericInputField
            label="Card Creation Pricing Amount (₹)"
            type="number"
            value={profile.amount}
            onChange={(e) => onChange('amount', Number(e.target.value) || 0)}
            placeholder="e.g. 1499"
          />

          <GenericInputField
            label="Annual Renewal Pricing Amount (₹)"
            type="number"
            value={profile.renewalAmount}
            onChange={(e) => onChange('renewalAmount', Number(e.target.value) || 0)}
            placeholder="e.g. 999"
          />
        </div>
      </div>

      {/* 11 Visibility Toggles */}
      <div className="mb-6">
        <span className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider block mb-3">
          Visibility & Privacy Flags
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-xl border border-stroke bg-[#f8f9ff]">
          {visibilityItems.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-[#091426] hover:text-[#2563EB] transition-colors"
            >
              <input
                type="checkbox"
                checked={profile.visibility[item.key]}
                onChange={() => handleToggleVisibility(item.key)}
                className="w-4 h-4 text-[#2563EB] rounded border-[#c5c6cd] focus:ring-[#2563EB]"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Customise Section Headings */}
      <div className="mb-6 pt-4 border-t border-[#c5c6cd]/40">
        <span className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider block mb-3">
          Customise Card Section Headings
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {headingFields.map((field) => (
            <div key={field.key}>
              <GenericInputField
                label={field.label}
                value={profile.headings[field.key]}
                onChange={(e) => handleHeadingChange(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Customise Footer Labels */}
      <div className="pt-4 border-t border-[#c5c6cd]/40">
        <span className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider block mb-3">
          Customise Live Card Bottom Navigation Labels
        </span>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {navFields.map((field) => (
            <div key={field.key}>
              <label className="block text-[10px] font-bold text-[#75777d] uppercase mb-1 truncate">
                {field.label}
              </label>
              <input
                type="text"
                value={profile.navLabels[field.key]}
                onChange={(e) => handleNavLabelChange(field.key, e.target.value.toUpperCase())}
                className="w-full h-9 px-1.5 rounded-xl border border-stroke bg-white text-[11px] text-center font-bold text-[#091426] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/25 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Step Navigation Buttons */}
      <div className="mt-5 pt-4 sm:mt-8 sm:pt-5 border-t border-[#c5c6cd]/40 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-stroke bg-white text-[#091426] text-xs font-semibold hover:bg-[#f8f9ff] flex items-center gap-1.5 sm:gap-2 transition-all shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Previous: YouTube Videos</span>
          <span className="sm:hidden">Previous</span>
        </button>

        <GenericButton
          type="button"
          onClick={handleSaveAndFinish}
          disabled={isSubmitting}
          className="!px-6 !py-2.5 !text-xs !font-bold flex items-center gap-2 shadow-md shadow-[#2563EB]/25 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Finalizing Card...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save All & Complete Card</span>
            </>
          )}
        </GenericButton>
      </div>
    </section>
  );
};
