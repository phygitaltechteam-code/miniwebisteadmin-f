import { CARD_HOST_LABEL } from '@/utils/cardUrl';
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  CheckCircle2, Upload, MapPin, Phone, ArrowRight,
  Image as ImageIcon, Loader2, Plus, Trash2, Globe, Mail,
  ExternalLink, UserPlus, PhoneCall, Building
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
  formatCustomerInfoFormData,
  submitCustomerInfoFormData,
  checkVanityUrl,
  VanityCheckResult,
} from '@/lib/api/customerInfoApi';

interface Step1Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

const PREFIX_OPTIONS = ['None', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.', 'Adv.', 'Prof.'];

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

  // Initialize firstName and lastName from contactName if not already split
  useEffect(() => {
    if (profile.contactName && (!profile.firstName || !profile.lastName)) {
      const parts = profile.contactName.trim().split(/\s+/);
      if (!profile.firstName && parts[0]) onChange('firstName', parts[0]);
      if (!profile.lastName && parts.length > 1) onChange('lastName', parts.slice(1).join(' '));
    }
  }, [profile.contactName]);

  // Auto-fetch existing customer info on mount
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
          if (data.tagline && !profile.tagline) {
            onChange('tagline', data.tagline);
            onChange('businessTagline', data.tagline);
          } else if (data.businessTagline && !profile.businessTagline) {
            onChange('tagline', data.businessTagline);
            onChange('businessTagline', data.businessTagline);
          }
          if (data.vanityUrl && !profile.vanityUrl) onChange('vanityUrl', data.vanityUrl);
          if (data.prefix) onChange('prefix', data.prefix);
          if (data.contactName && !profile.contactName) onChange('contactName', data.contactName);
          if (data.firstName && !profile.firstName) onChange('firstName', data.firstName);
          if (data.lastName && !profile.lastName) onChange('lastName', data.lastName);
          if (data.designation && !profile.designation) onChange('designation', data.designation);
          if (data.extraOwners && Array.isArray(data.extraOwners)) onChange('extraOwners', data.extraOwners);
          if (data.primaryPhone && !profile.primaryPhone) onChange('primaryPhone', data.primaryPhone);
          if (data.whatsappNumber || data.whatsappPhone) {
            onChange('whatsappPhone', data.whatsappNumber || data.whatsappPhone);
            onChange('whatsappNumber', data.whatsappNumber || data.whatsappPhone);
          }
          if (data.altPhone && !profile.altPhone) onChange('altPhone', data.altPhone);
          if (data.landline && !profile.landline) onChange('landline', data.landline);
          if (data.extraPhones && Array.isArray(data.extraPhones)) onChange('extraPhones', data.extraPhones);
          if (data.email && !profile.email) onChange('email', data.email);
          if (data.extraEmails && Array.isArray(data.extraEmails)) onChange('extraEmails', data.extraEmails);
          if (data.address && !profile.address) onChange('address', data.address);
          if (data.extraAddresses && Array.isArray(data.extraAddresses)) onChange('extraAddresses', data.extraAddresses);
          if (data.website && !profile.website) onChange('website', data.website);
          if (data.websiteProtocol && !profile.websiteProtocol) onChange('websiteProtocol', data.websiteProtocol);
          if (data.city && !profile.city) onChange('city', data.city);
          if (data.state && !profile.state) onChange('state', data.state);
          if (data.district && !profile.district) onChange('district', data.district);
          if (data.pincode && !profile.pincode) onChange('pincode', data.pincode);
          if (data.theme) onChange('theme', data.theme);
          if (data.logoUrl) onChange('logoUrl', data.logoUrl);
          if (data.bannerUrl) onChange('bannerUrl', data.bannerUrl);
          // Full saved banner list (bannerUrls); kept as is when banners are already loaded or being added
          if (Array.isArray(data.bannerUrls) && data.bannerUrls.length > 0 && !(profile.banners?.length)) {
            onChange('banners', data.bannerUrls);
          }
          if (data.mapLink) onChange('mapLink', data.mapLink);
          if (data.hasLogoBorder !== undefined) onChange('hasGoldenBorder', Boolean(data.hasLogoBorder));
          if (data.showCategoryInCard !== undefined) onChange('showCategoryInCard', Boolean(data.showCategoryInCard));
        }
      } catch {
        // Normal if new record
      }
    };
    loadCustomerInfo();
    return () => {
      isMounted = false;
    };
  }, [adminId]);

  // Auto-generate the vanity link from the business name
  const toVanitySlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

  const handleBusinessNameChange = (name: string) => {
    onChange('businessName', name);
  };

  // Display link availability (vanity-check API): on Check, and automatically 600ms after typing stops
  const [vanityResult, setVanityResult] = useState<VanityCheckResult | null>(null);
  const [vanityError, setVanityError] = useState('');
  const vanityRequestRef = useRef(0);

  const runVanityCheck = async (value: string, showToast: boolean) => {
    const link = value.trim();
    if (!link) {
      setVanityResult(null);
      setVanityError('');
      return;
    }
    const requestId = ++vanityRequestRef.current;
    setCheckingUrl(true);
    try {
      const result = await checkVanityUrl(link, adminId);
      if (requestId !== vanityRequestRef.current) return; // a newer check started
      setVanityResult(result);
      setVanityError('');
      if (showToast) {
        if (result.available) toast.success(`${CARD_HOST_LABEL}${result.vanityUrl} is available`);
        else toast.error(`${CARD_HOST_LABEL}${result.vanityUrl} is already taken`);
      }
    } catch (error: any) {
      if (requestId !== vanityRequestRef.current) return;
      const msg = error?.response?.data?.message || error?.message || 'Could not check the display link';
      setVanityResult(null);
      setVanityError(msg);
      if (showToast) toast.error(msg);
    } finally {
      if (requestId === vanityRequestRef.current) setCheckingUrl(false);
    }
  };

  useEffect(() => {
    setVanityResult(null);
    setVanityError('');
    if (!profile.vanityUrl?.trim()) return;
    const t = setTimeout(() => runVanityCheck(profile.vanityUrl, false), 600);
    return () => clearTimeout(t);
  }, [profile.vanityUrl, adminId]);

  const handleCheckUrl = () => {
    if (!profile.vanityUrl?.trim()) {
      toast.error('Enter a display link first');
      return;
    }
    runVanityCheck(profile.vanityUrl, true);
  };

  const handleTestPin = (link?: string) => {
    const targetLink = link || profile.mapLink;
    if (targetLink) {
      window.open(targetLink, '_blank', 'noopener,noreferrer');
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

  const bannersList: string[] = Array.isArray(profile.banners) && profile.banners.length > 0
    ? profile.banners
    : profile.bannerUrl
    ? [profile.bannerUrl]
    : [];

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        try {
          const compressedUrl = await compressImage(file, 1400, 600, 0.82);
          newUrls.push(compressedUrl);
        } catch {
          newUrls.push(URL.createObjectURL(file));
        }
      }
      const updated = [...bannersList, ...newUrls].slice(0, 8);
      onChange('banners', updated);
      if (!profile.bannerUrl && updated[0]) {
        onChange('bannerUrl', updated[0]);
      } else if (updated.length > 0 && !bannersList.includes(profile.bannerUrl)) {
        onChange('bannerUrl', updated[0]);
      }
      onToast(`Uploaded ${newUrls.length} header banner(s) successfully!`);
    } catch {
      onToast('Error uploading header banner');
    } finally {
      e.target.value = '';
    }
  };

  const handleSetPrimaryBanner = (url: string) => {
    const remaining = bannersList.filter((b) => b !== url);
    const reordered = [url, ...remaining];
    onChange('banners', reordered);
    onChange('bannerUrl', url);
    onToast('Primary header banner selected!');
  };

  const handleRemoveBanner = (index: number) => {
    const updated = bannersList.filter((_, i) => i !== index);
    onChange('banners', updated);
    onChange('bannerUrl', updated[0] || '');
    onToast('Banner image removed');
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

  // ─── Multi-Item Handlers (Owners, Phones, Addresses, Emails) ─────────────────
  // 1. Extra Owners (limit 3)
  const extraOwners = profile.extraOwners || [];
  const handleAddOwner = () => {
    if (extraOwners.length >= 3) {
      onToast('Maximum 3 additional names allowed.');
      return;
    }
    const updated = [...extraOwners, { prefix: 'Mr.', firstName: '', lastName: '', designation: '' }];
    onChange('extraOwners', updated);
  };

  const handleUpdateOwner = (index: number, field: string, value: string) => {
    const updated = extraOwners.map((owner, i) => (i === index ? { ...owner, [field]: value } : owner));
    onChange('extraOwners', updated);
  };

  const handleRemoveOwner = (index: number) => {
    const updated = extraOwners.filter((_, i) => i !== index);
    onChange('extraOwners', updated);
  };

  // 2. Extra Phones (limit 3)
  const extraPhones = profile.extraPhones || [];
  const handleAddPhone = () => {
    if (extraPhones.length >= 3) {
      onToast('Maximum 3 additional phone numbers allowed.');
      return;
    }
    const updated = [...extraPhones, { code: '+91', phone: '', type: 'Alternate' }];
    onChange('extraPhones', updated);
  };

  const handleUpdatePhone = (index: number, field: string, value: string) => {
    const finalVal = field === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    const updated = extraPhones.map((item, i) => (i === index ? { ...item, [field]: finalVal } : item));
    onChange('extraPhones', updated);
  };

  const handleRemovePhone = (index: number) => {
    const updated = extraPhones.filter((_, i) => i !== index);
    onChange('extraPhones', updated);
  };

  // 3. Extra Addresses (limit 3)
  const extraAddresses = profile.extraAddresses || [];
  const handleAddAddress = () => {
    if (extraAddresses.length >= 3) {
      onToast('Maximum 3 additional addresses allowed.');
      return;
    }
    const updated = [...extraAddresses, { address: '', mapLink: '' }];
    onChange('extraAddresses', updated);
  };

  const handleUpdateAddress = (index: number, field: string, value: string) => {
    const updated = extraAddresses.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange('extraAddresses', updated);
  };

  const handleRemoveAddress = (index: number) => {
    const updated = extraAddresses.filter((_, i) => i !== index);
    onChange('extraAddresses', updated);
  };

  // 4. Extra Emails (limit 3)
  const extraEmails = profile.extraEmails || [];
  const handleAddEmail = () => {
    if (extraEmails.length >= 3) {
      onToast('Maximum 3 additional emails allowed.');
      return;
    }
    const updated = [...extraEmails, { email: '' }];
    onChange('extraEmails', updated);
  };

  const handleUpdateEmail = (index: number, value: string) => {
    const updated = extraEmails.map((item, i) => (i === index ? { email: value } : item));
    onChange('extraEmails', updated);
  };

  const handleRemoveEmail = (index: number) => {
    const updated = extraEmails.filter((_, i) => i !== index);
    onChange('extraEmails', updated);
  };

  // ─── Primary Name Sync Helper ───
  const updatePrimaryFirstName = (first: string) => {
    onChange('firstName', first);
    const combined = `${first} ${profile.lastName || ''}`.trim();
    onChange('contactName', combined);
  };

  const updatePrimaryLastName = (last: string) => {
    onChange('lastName', last);
    const combined = `${profile.firstName || ''} ${last}`.trim();
    onChange('contactName', combined);
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

    const fullContactName = profile.contactName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();

    // Client-side schema validation check
    const result = step1BasicDetailsSchema.safeParse({
      prefix: profile.prefix || 'None',
      businessName: profile.businessName || '',
      vanityUrl: profile.vanityUrl || '',
      contactName: fullContactName,
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      designation: profile.designation || '',
      extraOwners: profile.extraOwners || [],
      primaryPhone: profile.primaryPhone || '',
      whatsappPhone: profile.whatsappPhone || profile.whatsappNumber || '',
      whatsappNumber: profile.whatsappNumber || profile.whatsappPhone || '',
      altPhone: profile.altPhone || '',
      landline: profile.landline || '',
      extraPhones: profile.extraPhones || [],
      email: profile.email || '',
      extraEmails: profile.extraEmails || [],
      address: profile.address || '',
      extraAddresses: profile.extraAddresses || [],
      mapLink: profile.mapLink || '',
      website: profile.website || '',
      websiteProtocol: profile.websiteProtocol || 'http',
      logoUrl: profile.logoUrl || '',
      bannerUrl: profile.bannerUrl || (bannersList[0] || ''),
      banners: bannersList,
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
      hasLogoBorder: profile.hasGoldenBorder ?? false,
    });

    if (!result.success) {
      const msg = result.error.errors[0]?.message || 'Please fill in required fields correctly';
      toast.error(`Validation: ${msg}`, { id: 'save-step1' });
      onToast(`⚠️ Validation: ${msg}`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting basic details...');
    onToast('Submitting basic details to server...');

    try {
      const updatedProfile = {
        ...profile,
        contactName: fullContactName,
      };

      const formData = formatCustomerInfoFormData(updatedProfile);
      const isFirstSave = !hasExistingRecord;

      let response: any;
      try {
        response = await submitCustomerInfoFormData(formData, isFirstSave, adminId);
        setHasExistingRecord(true);
      } catch (formErr: any) {
        console.warn('[Step1BasicDetails] FormData submit error, trying JSON payload fallback:', formErr);
        const payload = formatAdminInfoPayload(updatedProfile);
        if (hasExistingRecord) {
          response = await updateCustomerInfo(payload, adminId);
        } else {
          response = await createCustomerInfo(payload, adminId);
          setHasExistingRecord(true);
        }
      }

      toast.success('Basic details saved successfully!', { id: toastId });
      onToast('✓ Step 1 basic details successfully updated.');
      onNext();
    } catch (err: any) {
      console.error('[Step1BasicDetails] Save error:', err);
      toast.dismiss(toastId);
      toast.error('Failed to save basic details to server.', { id: 'save-step1-err' });
      onToast('Failed to save basic details. Continuing to next step in local state...');
      onNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white border border-[#E0E0E0] rounded-lg p-2.5 sm:p-3.5 shadow-xs scroll-mt-28 font-['Roboto',Helvetica,Arial,sans-serif]" id="sec-1">
      {/* Step Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between pb-2.5 border-b border-[#E0E0E0] mb-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2196F3] flex items-center justify-center font-bold text-xs shrink-0">
            1
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            Basic Details
          </h2>
        </div>

        <span className="px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2196F3] text-[11px] font-semibold border border-[#BFDBFE] flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2196F3]" />
          <span>Active Profile</span>
        </span>
      </div>

      <div className="space-y-3">
        {/* ─── 1. Business Name & Display Link Name ───────────────── */}
        <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] space-y-2.5">
          <h3 className="text-[13px] font-bold text-[#091426] uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#2196F3]" />
            Business Name & Identity
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-3">
            <div>
              <GenericInputField
                label="Enter Company Name (Required)"
                value={profile.businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                placeholder="e.g. ASSA O LIVING"
                required
              />
            </div>

            <div>
              <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
                Enter Display Link Name (Required) <span className="text-red-500 font-bold">*</span>
              </label>

              <div className="flex">
                <span className="h-9 px-2.5 text-[14px] font-mono text-gray-500 border border-r-0 border-[#C4C4C4] bg-gray-50 rounded-l flex items-center shrink-0">
                  {CARD_HOST_LABEL}
                </span>
                <input
                  type="text"
                  value={profile.vanityUrl}
                  onChange={(e) => onChange('vanityUrl', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 min-w-0 h-9 px-2.5 bg-white text-[14px] text-[#000000DE] font-mono border-y border-[#C4C4C4] focus:outline-none focus:border-[#2196F3]"
                  placeholder="assa-o-living"
                />
                <button
                  type="button"
                  onClick={handleCheckUrl}
                  disabled={checkingUrl}
                  className="h-9 px-3 rounded-r bg-[#2196F3] text-white text-[14px] font-medium hover:bg-[#1E88E5] transition-colors shrink-0"
                >
                  {checkingUrl ? 'Checking...' : 'Check'}
                </button>
              </div>
              {/* Result of the vanity-check API */}
              {vanityResult && !checkingUrl && (
                vanityResult.available ? (
                  <p className="mt-1 text-[12px] text-emerald-600">✓ {CARD_HOST_LABEL}{vanityResult.vanityUrl} is available</p>
                ) : (
                  <p className="mt-1 text-[12px] text-red-600">
                    ✕ {CARD_HOST_LABEL}{vanityResult.vanityUrl} is already taken
                    {vanityResult.suggestion && (
                      <>
                        {' · '}
                        <button
                          type="button"
                          onClick={() => onChange('vanityUrl', vanityResult.suggestion as string)}
                          className="font-semibold text-[#2196F3] hover:underline"
                        >
                          Use {vanityResult.suggestion}
                        </button>
                      </>
                    )}
                  </p>
                )
              )}
              {vanityError && !checkingUrl && <p className="mt-1 text-[12px] text-red-600">{vanityError}</p>}
            </div>

            <div>
              <GenericInputField
                label="Enter Business Tagline (Optional)"
                value={profile.tagline || profile.businessTagline || ''}
                onChange={(e) => {
                  onChange('tagline', e.target.value);
                  onChange('businessTagline', e.target.value);
                }}
                placeholder="e.g. Elevating Quality, Redefining Standards"
              />
            </div>
          </div>

          {/* Logo & Multiple Banner Uploads */}
          <div className="space-y-3 pt-2.5 border-t border-[#E0E0E0]">
            {/* Logo Upload + Add logo border */}
            <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-white flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-medium text-[#000000DE]">
                  Upload Logo / Profile Pic
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(profile.hasGoldenBorder)}
                    onChange={(e) => onChange('hasGoldenBorder', e.target.checked)}
                    className="w-3.5 h-3.5 text-[#2196F3] rounded border-gray-300 focus:ring-[#2196F3]"
                  />
                  <span>Add logo border</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center p-1 relative overflow-hidden shrink-0 border ${
                  profile.hasGoldenBorder ? 'border-amber-400 ring-2 ring-amber-300/40 shadow-xs' : 'border-[#E0E0E0]'
                }`}>
                  {profile.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="font-bold text-[#2196F3] text-xs">LOGO</span>
                  )}
                </div>

                <label
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#C4C4C4] bg-white text-[#000000DE] text-[13px] font-medium hover:bg-gray-50 hover:border-[#2196F3] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#2196F3]" />
                  <span>Choose Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Multiple Banner Images (Responsive Dimensions) */}
            <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-white space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#2196F3]" />
                  <label className="text-[14px] font-medium text-[#000000DE]">
                    Header Banners (Multiple Supported)
                  </label>
                  <span className="text-[11px] font-bold text-[#2196F3] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                    {bannersList.length}/8
                  </span>
                </div>
                <span className="text-[11px] text-[#757575] font-normal">
                  Responsive: 16:9 Mobile • 21:9 Desktop • Recommended 1200×500 px
                </span>
              </div>

              {bannersList.length > 0 ? (
                <div className="space-y-2.5">
                  {/* Primary Banner Large Responsive Display */}
                  <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[3/1] max-h-52 sm:max-h-60 rounded-lg overflow-hidden border border-[#E0E0E0] bg-black shadow-2xs group select-none">
                    <img
                      src={bannersList[0]}
                      alt="Primary Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[11px] font-medium backdrop-blur-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Primary Header Banner</span>
                    </div>

                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#2196F3] text-white text-[11px] font-bold shadow-xs">
                      Active
                    </div>

                    {/* Actions */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRemoveBanner(0)}
                        className="p-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-white transition-colors text-xs flex items-center gap-1"
                        title="Delete this banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Additional Banners Thumbnails Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {bannersList.map((bannerUrl, idx) => {
                      const isPrimary = idx === 0;
                      return (
                        <div
                          key={idx}
                          className={`relative aspect-[16/9] w-24 sm:w-28 rounded-md overflow-hidden border ${
                            isPrimary ? 'border-[#2196F3] ring-2 ring-[#2196F3]/30' : 'border-[#E0E0E0]'
                          } group bg-black shrink-0`}
                        >
                          <img
                            src={bannerUrl}
                            alt={`Banner ${idx + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => !isPrimary && handleSetPrimaryBanner(bannerUrl)}
                          />
                          {isPrimary ? (
                            <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-[#2196F3] text-white text-[9px] font-bold">
                              Primary
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryBanner(bannerUrl)}
                              className="absolute inset-0 bg-black/60 text-white text-[10px] font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBanner(idx);
                            }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                            title="Remove banner"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Upload More Banners Button */}
                    {bannersList.length < 8 && (
                      <label className="cursor-pointer aspect-[16/9] w-24 sm:w-28 rounded-md border border-dashed border-[#C4C4C4] hover:border-[#2196F3] bg-[#FAFAFA] hover:bg-[#EFF6FF] flex flex-col items-center justify-center text-center transition-colors shrink-0">
                        <Plus className="w-4 h-4 text-[#2196F3] mb-0.5" />
                        <span className="text-[10px] font-medium text-[#000000DE]">Add More</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty state dropzone */
                <label className="cursor-pointer border border-dashed border-[#C4C4C4] hover:border-[#2196F3] rounded-lg p-5 flex flex-col items-center justify-center text-center bg-white hover:bg-[#EFF6FF]/30 transition-all w-full group">
                  <ImageIcon className="w-8 h-8 text-[#2196F3] mb-1.5 group-hover:scale-105 transition-transform" />
                  <span className="text-[14px] font-medium text-[#000000DE]">
                    Click or Drag to Upload Multiple Header Banners
                  </span>
                  <span className="text-[12px] text-[#757575] mt-1">
                    Auto-responsive: 16:9 on Mobile • 21:9 on Desktop. Recommended: 1200 × 500 px.
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* ─── 2. Owner Details (Multiple Owners) ─────────────────── */}
        <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-[#091426] uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-[#2196F3]" />
              Owner Details (Optional)
            </h3>
            <button
              type="button"
              onClick={handleAddOwner}
              disabled={extraOwners.length >= 3}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#2196F3] text-white text-[13px] font-medium hover:bg-[#1E88E5] transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Name</span>
              <span className="text-[11px] opacity-80 ml-0.5">({extraOwners.length}/3)</span>
            </button>
          </div>

          {/* Primary Owner Form */}
          <div className="grid grid-cols-12 gap-2 sm:gap-2.5 bg-white p-2.5 rounded-lg border border-[#E0E0E0]">
            <div className="col-span-4 sm:col-span-2">
              <label className="block text-[13px] sm:text-[14px] font-normal text-[#000000DE] mb-1 truncate">
                Prefix
              </label>
              <select
                value={profile.prefix || 'None'}
                onChange={(e) => onChange('prefix', e.target.value)}
                className="w-full h-9 px-2 rounded border border-[#C4C4C4] bg-white text-[13px] sm:text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none"
              >
                {PREFIX_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="col-span-8 sm:col-span-4">
              <GenericInputField
                label="Enter First Name"
                value={profile.firstName || ''}
                onChange={(e) => updatePrimaryFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <GenericInputField
                label="Enter Last Name"
                value={profile.lastName || ''}
                onChange={(e) => updatePrimaryLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <GenericInputField
                label="Enter Designation"
                value={profile.designation || ''}
                onChange={(e) => onChange('designation', e.target.value)}
                placeholder="e.g. President / Founder"
              />
            </div>
          </div>

          {/* Another Name Details (Dynamic Extra Owners, up to 3) */}
          {extraOwners.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between border-t border-[#E0E0E0] pt-2">
                <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">
                  Additional Owners
                </span>
                <span className="text-[11px] text-gray-500 font-mono">
                  {extraOwners
                    .filter((o) => o.firstName)
                    .map((o) => `(${o.prefix !== 'None' ? o.prefix + ' ' : ''}${o.firstName} ${o.lastName})`)
                    .join(', ')}
                </span>
              </div>

              {extraOwners.map((owner, idx) => (
                <div key={idx} className="p-2.5 bg-white rounded-lg border border-[#E0E0E0] space-y-2 relative">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                    <span className="text-[12px] font-bold text-gray-600">
                      Owner #{idx + 2} Details
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOwner(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remove Owner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-2 sm:gap-2.5">
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[13px] sm:text-[14px] font-normal text-[#000000DE] mb-1 truncate">
                        Prefix
                      </label>
                      <select
                        value={owner.prefix || 'None'}
                        onChange={(e) => handleUpdateOwner(idx, 'prefix', e.target.value)}
                        className="w-full h-9 px-2 rounded border border-[#C4C4C4] bg-white text-[13px] sm:text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none"
                      >
                        {PREFIX_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-8 sm:col-span-4">
                      <GenericInputField
                        label="Enter First Name"
                        value={owner.firstName}
                        onChange={(e) => handleUpdateOwner(idx, 'firstName', e.target.value)}
                        placeholder="First name"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <GenericInputField
                        label="Enter Last Name"
                        value={owner.lastName}
                        onChange={(e) => handleUpdateOwner(idx, 'lastName', e.target.value)}
                        placeholder="Last name"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <GenericInputField
                        label="Enter Designation"
                        value={owner.designation}
                        onChange={(e) => handleUpdateOwner(idx, 'designation', e.target.value)}
                        placeholder="e.g. Partner / Director"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ─── 3. Phone Number Details (Multiple Phones) ─────────── */}
        <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-[#091426] uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#2196F3]" />
              Phone number Details
            </h3>
            <button
              type="button"
              onClick={handleAddPhone}
              disabled={extraPhones.length >= 3}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#2196F3] text-white text-[13px] font-medium hover:bg-[#1E88E5] transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Multiple Phone Number</span>
              <span className="text-[11px] opacity-80 ml-0.5">({extraPhones.length}/3)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Primary Phone */}
            <div>
              <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
                Enter Phone No (Required) <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-2.5 h-9 rounded-l border border-r-0 border-[#C4C4C4] bg-gray-50 text-[14px] font-medium text-gray-700 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={profile.primaryPhone}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                    onChange('primaryPhone', clean);
                    if (!profile.whatsappPhone) onChange('whatsappPhone', clean);
                  }}
                  placeholder="9930000993"
                  className="flex-1 min-w-0 h-9 px-2.5 rounded-r border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]"
                  required
                />
              </div>
            </div>

            {/* Alternate Phone */}
            <div>
              <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
                Enter Alternate No (Optional)
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-2.5 h-9 rounded-l border border-r-0 border-[#C4C4C4] bg-gray-50 text-[14px] font-medium text-gray-700 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={profile.altPhone || ''}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                    onChange('altPhone', clean);
                  }}
                  placeholder="Alternate phone"
                  className="flex-1 min-w-0 h-9 px-2.5 rounded-r border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]"
                />
              </div>
            </div>

            {/* Whatsapp Phone */}
            <div>
              <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
                Enter Whatsapp No (Optional)
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-2.5 h-9 rounded-l border border-r-0 border-[#C4C4C4] bg-gray-50 text-[14px] font-medium text-gray-700 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={profile.whatsappPhone || profile.whatsappNumber || ''}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                    onChange('whatsappPhone', clean);
                    onChange('whatsappNumber', clean);
                  }}
                  placeholder="9930000993"
                  className="flex-1 min-w-0 h-9 px-2.5 rounded-r border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]"
                />
              </div>
            </div>

            {/* Landline */}
            <div>
              <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
                Landline No (Optional)
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-2.5 h-9 rounded-l border border-r-0 border-[#C4C4C4] bg-gray-50 text-[14px] font-medium text-gray-700 select-none">
                  022
                </span>
                <input
                  type="tel"
                  maxLength={12}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={profile.landline || ''}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 12);
                    onChange('landline', clean);
                  }}
                  placeholder="Landline number"
                  className="flex-1 min-w-0 h-9 px-2.5 rounded-r border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Extra Phones (limit 3) */}
          {extraPhones.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E0E0E0]">
              <span className="text-[12px] font-bold text-gray-700">Additional Phone Numbers</span>
              {extraPhones.map((ph, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-20">
                    <input
                      type="text"
                      value={ph.code || '+91'}
                      onChange={(e) => handleUpdatePhone(idx, 'code', e.target.value)}
                      placeholder="+91"
                      className="w-full h-9 px-2 rounded border border-[#C4C4C4] bg-gray-50 text-[14px] font-medium text-center focus:outline-none focus:border-[#2196F3]"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="tel"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={ph.phone}
                      onChange={(e) => handleUpdatePhone(idx, 'phone', e.target.value)}
                      placeholder={`Additional Phone #${idx + 1}`}
                      className="w-full h-9 px-2.5 rounded border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(idx)}
                    className="p-2 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors"
                    title="Remove Phone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── 4. Address Details (Multiple Addresses) ───────────── */}
        <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-[#091426] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2196F3]" />
              Address Details
            </h3>
            <button
              type="button"
              onClick={handleAddAddress}
              disabled={extraAddresses.length >= 3}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#2196F3] text-white text-[13px] font-medium hover:bg-[#1E88E5] transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Address</span>
              <span className="text-[11px] opacity-80 ml-0.5">({extraAddresses.length}/3)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <GenericTextArea
                label="Enter Address *"
                rows={2}
                value={profile.address}
                onChange={(e) => onChange('address', e.target.value)}
                placeholder="Add- assaoliving, bouta waddo, assagao, north goa"
                required
              />
            </div>

            <div className="flex flex-col justify-between gap-2">
              <div>
                <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
                  Enter Map Location link (Optional)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <GenericInputField
                      value={profile.mapLink}
                      onChange={(e) => onChange('mapLink', e.target.value)}
                      placeholder="https://maps.google.com/?q=..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestPin()}
                    className="px-3 h-9 rounded bg-[#2196F3] text-white text-[14px] font-medium hover:bg-[#1E88E5] transition-colors flex items-center gap-1 shrink-0"
                    title="Test Google Map Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test</span>
                  </button>
                </div>
              </div>

              {/* Pincode & City Auto-Lookup (Helper) */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    Pincode {isLookingUpPin && '...'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    value={profile.pincode || ''}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="416416"
                    className="w-full h-9 px-2 rounded border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={profile.city || ''}
                    onChange={(e) => onChange('city', e.target.value)}
                    placeholder="City"
                    className="w-full h-9 px-2 rounded border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={profile.state || ''}
                    onChange={(e) => onChange('state', e.target.value)}
                    placeholder="State"
                    className="w-full h-9 px-2 rounded border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Extra Addresses (limit 3) */}
          {extraAddresses.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E0E0E0]">
              <span className="text-[12px] font-bold text-gray-700">Additional Addresses</span>
              {extraAddresses.map((addr, idx) => (
                <div key={idx} className="p-2.5 bg-white rounded-lg border border-[#E0E0E0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-gray-700">Address #{idx + 2}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAddress(idx)}
                      className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors"
                      title="Remove Address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <GenericTextArea
                      label="Enter Address"
                      rows={2}
                      value={addr.address}
                      onChange={(e) => handleUpdateAddress(idx, 'address', e.target.value)}
                      placeholder="Branch or warehouse address"
                    />
                    <div>
                      <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
                        Map Location link (Optional)
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <GenericInputField
                            value={addr.mapLink}
                            onChange={(e) => handleUpdateAddress(idx, 'mapLink', e.target.value)}
                            placeholder="https://maps.google.com/?q=..."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTestPin(addr.mapLink)}
                          className="px-3 h-9 rounded bg-[#2196F3] text-white text-[14px] font-medium hover:bg-[#1E88E5] shrink-0"
                          title="Test Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── 5. Email Details (Multiple Emails) ─────────────────── */}
        <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-[#091426] uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#2196F3]" />
              Email Details (Optional)
            </h3>
            <button
              type="button"
              onClick={handleAddEmail}
              disabled={extraEmails.length >= 3}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#2196F3] text-white text-[13px] font-medium hover:bg-[#1E88E5] transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Email</span>
              <span className="text-[11px] opacity-80 ml-0.5">({extraEmails.length}/3)</span>
            </button>
          </div>

          <div>
            <GenericInputField
              label="Enter E-mail (Optional)"
              type="email"
              value={profile.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="Info@assaoliving.com"
            />
          </div>

          {/* Dynamic Extra Emails (limit 3) */}
          {extraEmails.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E0E0E0]">
              <span className="text-[12px] font-bold text-gray-700">Additional E-mails</span>
              {extraEmails.map((em, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={em.email}
                      onChange={(e) => handleUpdateEmail(idx, e.target.value)}
                      placeholder={`Additional Email #${idx + 1}`}
                      className="w-full h-9 px-2.5 rounded border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(idx)}
                    className="p-2 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors"
                    title="Remove Email"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── 6. Website Details (Optional) ─────────────────────── */}
        <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] space-y-2.5">
          <h3 className="text-[13px] font-bold text-[#091426] uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#2196F3]" />
            Website Details (Optional)
          </h3>

          <div className="flex gap-2">
            <div className="w-28 sm:w-32 shrink-0">
              <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
                Protocol
              </label>
              <select
                value={profile.websiteProtocol || 'http'}
                onChange={(e) => onChange('websiteProtocol', e.target.value)}
                className="w-full h-9 px-2 rounded border border-[#C4C4C4] bg-white text-[14px] font-medium text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] focus:border-[#2196F3] focus:outline-none"
              >
                <option value="http">http://</option>
                <option value="https">https://</option>
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
                Enter Website link (Optional)
              </label>
              <input
                type="text"
                value={profile.website || ''}
                onChange={(e) => onChange('website', e.target.value)}
                placeholder="www.assaoliving.com"
                className="w-full h-9 px-2.5 rounded border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step Footer Navigation */}
      <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex justify-end">
        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="w-full sm:w-auto !bg-[#2196F3] hover:!bg-[#1E88E5] !px-6 !py-2 !text-[14px] font-medium text-white shadow-none flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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

export default Step1BasicDetails;
