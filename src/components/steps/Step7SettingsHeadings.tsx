import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Sliders, Eye, EyeOff, Save, 
  ArrowLeft, CheckCircle2, RotateCcw, Loader2, Type
} from 'lucide-react';
import { ProfileData } from '../../types/profile';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import TypographyCustomizerModal from '@/components/TypographyCustomizerModal';
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
  const [isTypographyModalOpen, setIsTypographyModalOpen] = useState(false);

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
    <section className="bg-white border border-[#E0E0E0] rounded-lg p-2.5 sm:p-3.5 shadow-none scroll-mt-28 font-['Roboto',Helvetica,Arial,sans-serif]" id="sec-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E0E0E0] mb-2.5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded bg-[#2196F3]/10 text-[#2196F3] flex items-center justify-center font-bold text-xs shrink-0">
            8
          </div>
          <h2 className="text-sm font-semibold text-[#000000DE] leading-tight">
            Card Settings
          </h2>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-xs text-[#757575] hover:text-[#2196F3] flex items-center gap-1 font-medium shrink-0 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Defaults</span>
          <span className="sm:hidden">Reset</span>
        </button>
      </div>

      {/* Pricing & Renewal Amount Configuration */}
      <div className="mb-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <GenericInputField
            label="Card Price (₹)"
            type="number"
            value={profile.amount}
            onChange={(e) => onChange('amount', Number(e.target.value) || 0)}
            placeholder="e.g. 1499"
          />

          <GenericInputField
            label="Annual Renewal (₹)"
            type="number"
            value={profile.renewalAmount}
            onChange={(e) => onChange('renewalAmount', Number(e.target.value) || 0)}
            placeholder="e.g. 999"
          />
        </div>
      </div>

      {/* Typography & Font Studio Section */}
      <div className="mb-2.5 pt-2.5 border-t border-[#E0E0E0]">
        <div className="p-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#2196F3]/10 text-[#2196F3] flex items-center justify-center shrink-0">
              <Type className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-[14px] font-bold text-[#000000DE]">
                  Typography & Font Customizer
                </h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2196F3] border border-blue-200">
                  {profile.typography?.primaryFont || 'Roboto'}
                </span>
                <span className="text-[10px] text-[#757575] bg-white px-1.5 py-0.5 rounded border border-[#E0E0E0]">
                  Weight: {profile.typography?.globalFontWeight || '400'}
                </span>
              </div>
              <p className="text-[12px] text-[#757575] mt-0.5 truncate">
                20 Fonts • 28 HTML Elements • 9 Weights • Text Transform • Line Heights • Colors
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsTypographyModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-[#2196F3] hover:bg-[#1E88E5] text-white text-[13px] font-medium shadow-none transition-colors shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Typography</span>
          </button>
        </div>
      </div>

      {/* 11 Visibility Toggles */}
      <div className="mb-2.5 pt-2.5 border-t border-[#E0E0E0]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-2.5 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA]">
          {visibilityItems.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2 cursor-pointer text-[13px] font-medium text-[#000000DE] hover:text-[#2196F3] transition-colors"
            >
              <input
                type="checkbox"
                checked={profile.visibility[item.key]}
                onChange={() => handleToggleVisibility(item.key)}
                className="w-4 h-4 text-[#2196F3] rounded border-[#C4C4C4] focus:ring-[#2196F3]"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Customise Section Headings — COMMENTED OUT (not needed in current flow) */}
      {/* <div className="mb-3 pt-3 border-t border-[#c5c6cd]/40">
        <label className="block text-xs font-bold text-[#091426] mb-2">Section Headings</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
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
      </div> */}

      {/* Customise Footer Labels */}
      <div className="pt-2.5 border-t border-[#E0E0E0]">
        <label className="block text-[12px] font-medium text-[#000000DE] mb-1.5">Bottom Nav Labels</label>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
          {navFields.map((field) => (
            <div key={field.key}>
              <label className="block text-[10px] font-medium text-[#757575] uppercase mb-0.5 truncate">
                {field.label}
              </label>
              <input
                type="text"
                value={profile.navLabels[field.key]}
                onChange={(e) => handleNavLabelChange(field.key, e.target.value.toUpperCase())}
                className="w-full h-8 px-1 rounded border border-[#C4C4C4] bg-white text-[11px] text-center font-medium text-[#000000DE] focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Step Navigation Buttons */}
      <div className="mt-3.5 pt-2.5 border-t border-[#E0E0E0] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-3 sm:px-4 py-2 rounded border border-[#C4C4C4] bg-white text-[#000000DE] text-[13px] sm:text-[14px] font-medium hover:bg-gray-50 flex items-center gap-1.5 sm:gap-2 transition-all shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Previous: YouTube Videos</span>
          <span className="sm:hidden">Previous</span>
        </button>

        <GenericButton
          type="button"
          onClick={handleSaveAndFinish}
          disabled={isSubmitting}
          className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-4 sm:!px-6 !py-2 !text-[13px] sm:!text-[14px] !font-medium rounded flex items-center gap-2 whitespace-nowrap text-white shadow-none disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Finalizing Card...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save All & Complete Card</span>
              <span className="sm:hidden">Save All</span>
            </>
          )}
        </GenericButton>
      </div>

      {/* Typography Customizer Studio Modal */}
      <TypographyCustomizerModal
        isOpen={isTypographyModalOpen}
        onClose={() => setIsTypographyModalOpen(false)}
        settings={profile.typography}
        onApplySettings={(newSettings) => onChange('typography', newSettings)}
      />
    </section>
  );
};
