import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { CARD_HOST_LABEL } from '@/utils/cardUrl';
import { ProfileData } from '@/types/profile';
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

export interface Step1Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

/** State, loaders and every handler of Step 1 (Basic Details) */
export const useStep1Model = ({ profile, onChange, onNext, onToast, adminId }: Step1Props) => {
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
          // Landline: full number with STD code (older cards saved the UI default "022" as the code)
          const savedLandline =
            data.landline ||
            (data.landlineNumber
              ? `${data.landlineCode && data.landlineCode !== '022' ? data.landlineCode : ''}${data.landlineNumber}`
              : '');
          if (savedLandline && !profile.landline) onChange('landline', savedLandline);
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

  const handleBusinessNameChange = (name: string) => {
    onChange('businessName', name);
  };

  // ─── Display link availability (vanity-check API): on Check, and automatically 600ms after typing stops ───
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

  // ─── Image uploads with canvas compression ───
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

  // ─── Multi-Item Handlers (Owners, Phones, Addresses, Emails), 3 extra entries each ───
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

  // ─── Save & Next ───
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

      try {
        await submitCustomerInfoFormData(formData, isFirstSave, adminId);
        setHasExistingRecord(true);
      } catch (formErr: any) {
        console.warn('[Step1BasicDetails] FormData submit error, trying JSON payload fallback:', formErr);
        const payload = formatAdminInfoPayload(updatedProfile);
        if (hasExistingRecord) {
          await updateCustomerInfo(payload, adminId);
        } else {
          await createCustomerInfo(payload, adminId);
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

  return {
    profile, onChange, isSubmitting, handleSaveAndNext,
    handleBusinessNameChange, checkingUrl, vanityResult, vanityError, handleCheckUrl,
    handleLogoUpload, bannersList, handleBannerUpload, handleSetPrimaryBanner, handleRemoveBanner,
    extraOwners, handleAddOwner, handleUpdateOwner, handleRemoveOwner, updatePrimaryFirstName, updatePrimaryLastName,
    extraPhones, handleAddPhone, handleUpdatePhone, handleRemovePhone,
    extraAddresses, handleAddAddress, handleUpdateAddress, handleRemoveAddress, handleTestPin, isLookingUpPin, handlePincodeChange,
    extraEmails, handleAddEmail, handleUpdateEmail, handleRemoveEmail,
  };
};

export type Step1Model = ReturnType<typeof useStep1Model>;
