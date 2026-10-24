import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  CheckCircle2, Upload, MapPin, Phone, ArrowRight,
  Image as ImageIcon, Palette, Check, Loader2
} from 'lucide-react';
import { ProfileData } from '../../types/profile';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericTextArea from '@/components/Forms/TextArea/GenericTextArea';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { step1BasicDetailsSchema } from '@/schemas/cardProfileSchema';
import { compressImage } from '@/utils/imageCompressor';
import { lookupPincode } from '@/utils/pincodeHelper';
import { 
  getCustomerInfo, 
  createCustomerInfo, 
  updateCustomerInfo, 
  formatAdminInfoPayload,
} from '@/lib/api/customerInfoApi';

interface Step1Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

const cleanServiceString = (s: any): string => {
  if (!s) return '';
  return String(s)
    .replace(/[\[\]]/g, '')
    .replace(/^['"`\s]+|['"`\s]+$/g, '')
    .trim();
};

export const Step1BasicDetails: React.FC<Step1Props> = ({
  profile,
  onChange,
  onNext,
  onToast,
  adminId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);

  // Auto-fetch existing customer info on mount (GET customers/info or superAdmin/admin/:adminId/info)
  useEffect(() => {
    let isMounted = true;
    const loadCustomerInfo = async () => {
      try {
        const res = await getCustomerInfo(adminId);
        const data = (res as any)?.data || (res as any)?.customer || (res as any)?.info || res;
        if (isMounted && data && typeof data === 'object') {
          if (data._id || data.id || data.businessName || data.contactName) {
            setHasExistingRecord(true);
          }
          if (data.businessName && !profile.businessName) onChange('businessName', data.businessName);
          if (data.vanityUrl && !profile.vanityUrl) onChange('vanityUrl', data.vanityUrl);
          if (data.prefix) onChange('prefix', data.prefix);
          if (data.contactName && !profile.contactName) onChange('contactName', data.contactName);
          if (data.designation && !profile.designation) onChange('designation', data.designation);
          if (data.primaryPhone && !profile.primaryPhone) onChange('primaryPhone', data.primaryPhone);
          if (data.whatsappNumber || data.whatsappPhone) {
            onChange('whatsappPhone', data.whatsappNumber || data.whatsappPhone);
            onChange('whatsappNumber', data.whatsappNumber || data.whatsappPhone);
          }
          if (data.email && !profile.email) onChange('email', data.email);
          if (data.address && !profile.address) onChange('address', data.address);
          if (data.city && !profile.city) onChange('city', data.city);
          if (data.state && !profile.state) onChange('state', data.state);
          if (data.district && !profile.district) onChange('district', data.district);
          if (data.pincode && !profile.pincode) onChange('pincode', data.pincode);
          if (data.theme) onChange('theme', data.theme);
          if (data.logoUrl) onChange('logoUrl', data.logoUrl);
          if (data.bannerUrl) onChange('bannerUrl', data.bannerUrl);
          if (data.mapLink) onChange('mapLink', data.mapLink);
          if (data.hasLogoBorder !== undefined) onChange('hasGoldenBorder', Boolean(data.hasLogoBorder));
          if (data.showCategoryInCard !== undefined) onChange('showCategoryInCard', Boolean(data.showCategoryInCard));

          // NOTE: Categories & services are now managed exclusively in Step 2 (About & Specialities).
          // Step 2's useEffect independently hydrates them from the API.
        }
      } catch (err: any) {
        // Normal if no customer profile exists yet or during offline dev
      }
    };
    loadCustomerInfo();
    return () => {
      isMounted = false;
    };
  }, [adminId]);

  // Auto-generate the vanity link from the business name until the user edits the link manually
  const toVanitySlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

  const handleBusinessNameChange = (name: string) => {
    onChange('businessName', name);
    onChange('vanityUrl', toVanitySlug(name));
  };

  const handleCheckUrl = () => {
    setCheckingUrl(true);
    setTimeout(() => {
      setCheckingUrl(false);
      onToast(`digiwebcard.in/${profile.vanityUrl} is available & reserved!`);
    }, 350);
  };

  const handleTestPin = () => {
    if (profile.mapLink) {
      window.open(profile.mapLink, '_blank', 'noopener,noreferrer');
    } else {
      onToast('Please enter a valid Google Maps location link.');
    }
  };

  // Image Uploads with Canvas Compression
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedUrl = await compressImage(file, 800, 800, 0.85);
        onChange('logoUrl', compressedUrl);
        onToast('Business logo compressed and uploaded successfully!');
      } catch {
        onChange('logoUrl', URL.createObjectURL(file));
        onToast('Custom logo uploaded successfully!');
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedUrl = await compressImage(file, 1400, 600, 0.82);
        onChange('bannerUrl', compressedUrl);
        onToast('Header banner compressed and uploaded successfully!');
      } catch {
        onChange('bannerUrl', URL.createObjectURL(file));
        onToast('Profile header banner uploaded!');
      }
    }
  };

  // Pincode auto-lookup
  const handlePincodeChange = async (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    onChange('pincode', digits);

    if (digits.length === 6) {
      setIsLookingUpPin(true);
      const result = await lookupPincode(digits);
      setIsLookingUpPin(false);
      if (result) {
        if (result.city) onChange('city', result.city);
        if (result.district) onChange('district', result.district);
        if (result.state) onChange('state', result.state);
        onToast(`Auto-detected: ${result.city}, ${result.district}, ${result.state}`);
      }
    }
  };

  const handleSaveAndNext = async () => {
    const finalCatIds: string[] = [];
    if (Array.isArray(profile.categoryIds)) {
      profile.categoryIds.forEach(id => {
        if (id && typeof id === 'string' && !finalCatIds.includes(id.trim())) {
          finalCatIds.push(id.trim());
        }
      });
    }
    if (finalCatIds.length === 0 && Array.isArray(profile.categories)) {
      profile.categories.forEach(name => {
        if (name && typeof name === 'string' && !finalCatIds.includes(name.trim())) {
          finalCatIds.push(name.trim());
        }
      });
    }

    // Client-side schema validation check
    const result = step1BasicDetailsSchema.safeParse({
      prefix: profile.prefix || 'Mr.',
      businessName: profile.businessName || '',
      vanityUrl: profile.vanityUrl || '',
      contactName: profile.contactName || '',
      designation: profile.designation || '',
      primaryPhone: profile.primaryPhone || '',
      whatsappPhone: profile.whatsappPhone || profile.whatsappNumber || '',
      whatsappNumber: profile.whatsappNumber || profile.whatsappPhone || '',
      email: profile.email || '',
      address: profile.address || '',
      mapLink: profile.mapLink || '',
      logoUrl: profile.logoUrl || '',
      bannerUrl: profile.bannerUrl || '',
      category: profile.category || (finalCatIds[0] || ''),
      categories: profile.categories || finalCatIds,
      categoryIds: finalCatIds,
      adminCategoryIds: finalCatIds,
      servicesOffered: profile.servicesOffered || [],
      theme: profile.theme || 'clean-white',
      pincode: profile.pincode || '',
      city: profile.city || '',
      district: profile.district || '',
      state: profile.state || '',
      showCategoryInCard: profile.showCategoryInCard ?? true,
      hasLogoBorder: profile.hasGoldenBorder ?? true,
    });

    if (!result.success) {
      const msg = result.error.errors[0]?.message || 'Please fill in required fields correctly';
      toast.error(`Validation: ${msg}`, { id: 'save-step1' });
      onToast(`⚠️ Validation: ${msg}`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting basic details to customers/info API...');
    onToast('Submitting basic details to server...');

    try {
      const payload = formatAdminInfoPayload(profile);
      console.log('[Step1BasicDetails] Submitting payload to customers/info:', payload);

      let response: any;
      let usedMethod = 'POST';

      if (hasExistingRecord) {
        usedMethod = 'PATCH';
        try {
          response = await updateCustomerInfo(payload, adminId);
        } catch (patchErr: any) {
          if (patchErr?.response?.status === 404) {
            usedMethod = 'POST';
            response = await createCustomerInfo(payload, adminId);
            setHasExistingRecord(true);
          } else {
            throw patchErr;
          }
        }
      } else {
        usedMethod = 'POST';
        try {
          response = await createCustomerInfo(payload, adminId);
          setHasExistingRecord(true);
        } catch (postErr: any) {
          const status = postErr?.response?.status;
          const msg = String(postErr?.response?.data?.message || '').toLowerCase();
          if (status === 409 || status === 405 || (status === 400 && msg.includes('already'))) {
            usedMethod = 'PATCH';
            response = await updateCustomerInfo(payload, adminId);
            setHasExistingRecord(true);
          } else {
            throw postErr;
          }
        }
      }

      const serverMsg = response?.message || response?.data?.message || 'Basic details successfully saved to server!';
      const displayMsg = `${serverMsg}`;

      toast.success(displayMsg, { id: toastId, duration: 4000 });
      onToast(`✅ ${displayMsg}`);

      // Advance to next step
      onNext();
    } catch (error: any) {
      console.error('[Step1BasicDetails] Failed to save customers/info:', error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to connect to customers/info API. Please verify server status.';
      const statusCode = error?.response?.status ? ` [HTTP ${error.response.status}]` : '';

      const errText = `API Error${statusCode}: ${backendMessage}`;
      toast.error(errText, { id: toastId, duration: 5000 });
      onToast(`❌ ${errText}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const themes: { id: ProfileData['theme']; name: string; previewClass: string; desc: string; colors: string }[] = [
    {
      id: 'navy-orange',
      name: 'Midnight Navy & Radiant Orange',
      previewClass: 'bg-gradient-to-r from-[#07162C] to-[#0B2144] border-orange-500 text-orange-400',
      desc: 'Midnight Navy base paired with high-impact Radiant Orange accents',
      colors: '#07162C + #F97316',
    },
    {
      id: 'emerald-obsidian',
      name: 'Deep Obsidian & Royal Emerald',
      previewClass: 'bg-gradient-to-r from-[#061C18] to-[#0B2E26] border-emerald-500 text-emerald-400',
      desc: 'Prestigious Deep Obsidian Forest base with luminous Royal Emerald accents',
      colors: '#061C18 + #10B981',
    },
    {
      id: 'sapphire-cyan',
      name: 'Imperial Sapphire & Electric Cyan',
      previewClass: 'bg-gradient-to-r from-[#07132B] to-[#0D2040] border-sky-400 text-sky-300',
      desc: 'Imperial Sapphire Navy base with crisp Electric Cyan accents',
      colors: '#07132B + #0284C7',
    },
    {
      id: 'amber-gold',
      name: 'Charcoal Onyx & Royal Amber Gold',
      previewClass: 'bg-gradient-to-r from-[#141416] to-[#222328] border-amber-500 text-amber-300',
      desc: 'Executive Charcoal Onyx base with prestigious Amber Gold luster',
      colors: '#141416 + #D97706',
    },
  ];

  return (
    <section className="bg-white border border-[#c5c6cd]/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs scroll-mt-28" id="sec-1">
      {/* Step Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between pb-2.5 border-b border-stroke mb-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
            1
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            Basic Details
          </h2>
        </div>

        <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] text-[10px] sm:text-[11px] font-semibold border border-[#BFDBFE] flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
          <CheckCircle2 className="w-3 h-3 text-[#2563EB]" />
          <span>Active Profile</span>
        </span>
      </div>

      <div className="space-y-3">
        {/* ─── Business Name & Vanity URL ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GenericInputField
            label="Business Name"
            value={profile.businessName}
            onChange={(e) => handleBusinessNameChange(e.target.value)}
            placeholder="e.g. MARATHA ENTREPRENEUR ASSOCIATION"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Display Link Name <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 flex items-center rounded-xl border border-stroke bg-[#EFF6FF]/30 overflow-hidden focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]/25">
                <span className="px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-mono text-gray-500 border-r border-stroke bg-gray-50 shrink-0">
                  digiwebcard.in/
                </span>
                <input
                  type="text"
                  value={profile.vanityUrl}
                  onChange={(e) => onChange('vanityUrl', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 min-w-0 h-10 px-2 sm:px-3 bg-white text-[#091426] text-xs font-mono font-medium focus:outline-none border-none"
                  placeholder="vanity-url"
                />
              </div>
              <button
                type="button"
                onClick={handleCheckUrl}
                disabled={checkingUrl}
                className="h-10 px-2.5 sm:px-3 rounded-xl bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors shrink-0"
              >
                {checkingUrl ? 'Checking...' : 'Check'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Executive Details ──────────────────────────────────── */}
        <div className="pt-3 border-t border-stroke">
          <div className="grid grid-cols-12 gap-2 sm:gap-3">
            <div className="col-span-4 sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Prefix
              </label>
              <select
                value={profile.prefix}
                onChange={(e) => onChange('prefix', e.target.value)}
                className="w-full h-10 px-2 rounded-xl border border-stroke bg-white text-xs font-medium focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/25 focus:outline-none shadow-2xs"
              >
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Ms">Ms</option>
                <option value="Miss">Miss</option>
                <option value="Dr.">Dr.</option>
                <option value="Adv.">Adv.</option>
                <option value="Prof.">Prof.</option>
              </select>
            </div>

            <div className="col-span-8 sm:col-span-5">
              <GenericInputField
                label="Full Name"
                value={profile.contactName}
                onChange={(e) => onChange('contactName', e.target.value)}
                placeholder="e.g. Ravindra Khilare-pawar"
                required
              />
            </div>

            <div className="col-span-12 sm:col-span-5">
              <GenericInputField
                label="Official Designation"
                value={profile.designation}
                onChange={(e) => onChange('designation', e.target.value)}
                placeholder="e.g. President / Founder"
                required
              />
            </div>
          </div>

          {/* Contact Numbers & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3">
            <GenericInputField
              label="Primary Phone"
              value={profile.primaryPhone}
              onChange={(e) => {
                onChange('primaryPhone', e.target.value);
                // WhatsApp field removed from the form — keep it synced with the primary number
                onChange('whatsappPhone', e.target.value);
              }}
              placeholder="e.g. 9876543210"
              prefix={<Phone className="w-3.5 h-3.5 text-gray-400" />}
              required
            />

            <GenericInputField
              label="Official Email"
              type="email"
              value={profile.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="info@company.com"
              required
            />
          </div>
        </div>

        {/* ─── Card Theme (color buttons on one line only, no name text) ── */}
        <div className="pt-3 border-t border-stroke">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-bold text-[#091426] flex items-center gap-1.5 shrink-0">
              <Palette className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Card Theme:</span>
            </label>

            <div className="flex items-center gap-2 sm:gap-2.5">
              {themes.map((th) => {
                const [primary, accent] = th.colors.split('+').map((c) => c.trim());
                const isActive = (profile.theme || 'navy-orange') === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => onChange('theme', th.id)}
                    title={`${th.name} (${th.colors})`}
                    className={`relative p-1.5 rounded-xl border transition-all flex items-center justify-center ${
                      isActive
                        ? 'border-[#2563EB] ring-2 ring-[#2563EB]/25 bg-[#EFF6FF] shadow-xs'
                        : 'border-stroke bg-white hover:border-[#2563EB]/50 hover:bg-[#f8f9fc]'
                    }`}
                  >
                    <span className="flex shrink-0 -space-x-1.5">
                      <span
                        className="w-5 h-5 rounded-full border-2 border-white shadow-2xs"
                        style={{ backgroundColor: primary }}
                      />
                      <span
                        className="w-5 h-5 rounded-full border-2 border-white shadow-2xs"
                        style={{ backgroundColor: accent }}
                      />
                    </span>
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[8px] font-bold shadow-2xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Branding Images Uploads (with Compression) ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-stroke">
          {/* Logo Upload */}
          <div className="p-3 rounded-xl border border-stroke bg-[#f8f9fc] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#091426]">
                Business Logo / Profile Pic
              </label>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white shadow-2xs flex items-center justify-center p-1.5 relative overflow-hidden transition-all shrink-0 border border-stroke">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="font-bold text-[#2563EB] text-xs">LOGO</span>
                )}
              </div>

              <label
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stroke bg-white text-[#091426] text-xs font-semibold hover:bg-[#EFF6FF] hover:border-[#2563EB] transition-colors shadow-2xs"
                title="Compressed automatically for optimal mobile speed"
              >
                <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Hero Showcase Image Upload (Used on website hero section) */}
          <div className="p-3 rounded-xl border border-stroke bg-[#f8f9fc] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#091426]">
                Hero Showcase Image / Card
              </label>
              <span className="text-[10px] text-gray-400 font-medium">(Website Hero Card)</span>
            </div>
            <label
              title="Auto-compressed JPEG/PNG up to 5MB (Used as the main hero showcase card on website)"
              className="h-14 rounded-lg border-2 border-dashed border-stroke bg-white hover:bg-[#EFF6FF] flex items-center justify-center gap-2 cursor-pointer transition-colors p-2 text-center group">
              <ImageIcon className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs text-gray-500 group-hover:text-[#2563EB]">
                {profile.bannerUrl ? 'Showcase image loaded (click to replace)' : 'Browse showcase image'}
              </span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBannerUpload} 
                className="hidden" 
              />
            </label>
          </div>
        </div>

        {/* ─── Location & Automatic Pincode Lookup ─────────────────── */}
        <div className="pt-3 border-t border-stroke space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <div>
              <GenericInputField
                label="Pincode (Auto City)"
                value={profile.pincode || ''}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder="e.g. 416416"
                prefix={<MapPin className="w-3.5 h-3.5 text-[#2563EB]" />}
              />
              {isLookingUpPin && (
                <span className="text-[10px] text-[#2563EB] animate-pulse">Detecting...</span>
              )}
            </div>

            <GenericInputField
              label="City"
              value={profile.city || ''}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="e.g. Sangli"
            />

            <GenericInputField
              label="District"
              value={profile.district || ''}
              onChange={(e) => onChange('district', e.target.value)}
              placeholder="e.g. Sangli"
            />

            <GenericInputField
              label="State"
              value={profile.state || ''}
              onChange={(e) => onChange('state', e.target.value)}
              placeholder="e.g. Maharashtra"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
            <GenericTextArea
              label="Head Office Address"
              rows={2}
              value={profile.address}
              onChange={(e) => onChange('address', e.target.value)}
              placeholder="Enter full office or registered address"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Google Maps Link
              </label>
              <div className="flex gap-2">
                <GenericInputField
                  value={profile.mapLink}
                  onChange={(e) => onChange('mapLink', e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                />
                <button
                  type="button"
                  onClick={handleTestPin}
                  className="px-2.5 sm:px-3.5 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors flex items-center gap-1.5 shrink-0"
                  title="Test Pin"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Test Pin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Footer Navigation */}
      <div className="mt-4 pt-3 border-t border-stroke flex justify-end">
        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="w-full sm:w-auto !px-4 sm:!px-6 !py-2.5 !text-xs !font-bold flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-[#2563EB]/25 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
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
  );
};
