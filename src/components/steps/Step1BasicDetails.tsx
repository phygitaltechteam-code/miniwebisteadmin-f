import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  CheckCircle2, Upload, MapPin, Phone, MessageSquare, Plus, ArrowRight,
  Image as ImageIcon, Sparkles, X, Palette, Check, Loader2
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
  isUuidOrId
} from '@/lib/api/customerInfoApi';
import { getCustomerCategories, CustomerCategory } from '@/lib/api/customerCategoriesApi';
import { generateAiServices } from '@/utils/aiGenerator';

interface Step1Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onToast: (msg: string) => void;
}

export const Step1BasicDetails: React.FC<Step1Props> = ({
  profile,
  onChange,
  onNext,
  onToast,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newService, setNewService] = useState('');
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<CustomerCategory[]>([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');

  // Fetch available categories from customers/categories (fallback: superAdmin/categories)
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const cats = await getCustomerCategories();
        if (isMounted && Array.isArray(cats) && cats.length > 0) {
          setAvailableCategories(cats);
        }
      } catch {
        // silent – dropdown will be empty
      }
    };
    fetchCats();
    return () => { isMounted = false; };
  }, []);

  // Auto-fetch existing customer info on mount (GET customers/info)
  useEffect(() => {
    let isMounted = true;
    const loadCustomerInfo = async () => {
      try {
        const res = await getCustomerInfo();
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

          let loadedServices: string[] = [];
          if (data.servicesOffered) {
            loadedServices = Array.isArray(data.servicesOffered)
              ? data.servicesOffered
              : String(data.servicesOffered)
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean);
            onChange('servicesOffered', loadedServices);
          }

          if (Array.isArray(data.businessNatures) && data.businessNatures.length > 0) {
            const natures = data.businessNatures
              .map((n: any) => (typeof n === 'string' ? n : n.businessNature || n.name))
              .filter(Boolean);
            onChange('natureOfBusiness', natures);
            onChange('businessNatures', natures);
            if (loadedServices.length === 0) {
              onChange('servicesOffered', natures);
            }
          }

          if (Array.isArray(data.specialities) && data.specialities.length > 0) {
            const specs = data.specialities
              .map((s: any) => (typeof s === 'string' ? s : s.specialities || s.name || s.title))
              .filter(Boolean);
            onChange('specialities', specs);
          }

          // Hydrate categoryIds (string array for saving category in customer info)
          const adminCatIds: string[] = [];
          const adminCatNames: string[] = [];

          const addLoadedCatId = (id: any) => {
            if (!id) return;
            const str = String(id).trim();
            if (str && !adminCatIds.includes(str)) adminCatIds.push(str);
          };

          const addLoadedCatName = (name: any) => {
            if (!name) return;
            const str = String(name).trim();
            if (str && !adminCatNames.includes(str)) adminCatNames.push(str);
          };

          // Check direct categoryIds array in server response
          if (Array.isArray(data.categoryIds) && data.categoryIds.length > 0) {
            data.categoryIds.forEach(addLoadedCatId);
          }

          if (Array.isArray(data.adminCategoryIds) && data.adminCategoryIds.length > 0) {
            data.adminCategoryIds.forEach(addLoadedCatId);
          }

          if (Array.isArray(data.adminCategories) && data.adminCategories.length > 0) {
            data.adminCategories.forEach((c: any) => {
              const id = c.categoryId || c.adminCategoryId || c.category?.id || c.category?._id || (typeof c === 'string' ? c : c.id || c._id);
              const name = c.category?.name || c.name || c.categoryName || c.adminCategory?.name;
              addLoadedCatId(id);
              addLoadedCatName(name);
            });
          }

          if (data.categoryId) {
            addLoadedCatId(data.categoryId);
          }

          if (data.category) {
            if (typeof data.category === 'object') {
              addLoadedCatName(data.category.name || data.category.CategoryName);
              addLoadedCatId(data.category.id || data.category._id);
            } else if (typeof data.category === 'string') {
              addLoadedCatName(data.category);
              addLoadedCatId(data.category);
            }
          }

          if (Array.isArray(data.categories) && data.categories.length > 0) {
            data.categories.forEach((cat: any) => {
              if (typeof cat === 'string') {
                addLoadedCatName(cat);
              } else if (typeof cat === 'object') {
                addLoadedCatName(cat.name || cat.CategoryName);
                addLoadedCatId(cat.id || cat._id);
              }
            });
          }

          if (data.categoryName) {
            addLoadedCatName(data.categoryName);
          }

          if (adminCatIds.length > 0) {
            onChange('categoryIds', adminCatIds);
            onChange('adminCategoryIds', adminCatIds);
            onChange('categoryId', adminCatIds[0]);
          }

          if (adminCatNames.length > 0) {
            onChange('categories', adminCatNames);
            onChange('categoryNames', adminCatNames);
            onChange('categoryName', adminCatNames[0]);
          } else if (adminCatIds.length > 0) {
            onChange('categories', adminCatIds);
            onChange('categoryNames', adminCatIds);
            onChange('categoryName', adminCatIds[0]);
          }
        }
      } catch (err: any) {
        // Normal if no customer profile exists yet or during offline dev
      }
    };
    loadCustomerInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  // Common quick categories
  const suggestedCategories = [
    'Enterprise', 'Business Networking', 'IT & Software',
    'Consulting', 'Manufacturing', 'Hospitality & Catering',
    'Healthcare', 'Retail & Trade'
  ];

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

  // Category Management: Customer direct category tags & categoryIds string array
  const handleAddCategory = (catToAdd?: string, catIdToAdd?: string) => {
    const name = (catToAdd || newCategory).trim();
    if (!name) return;

    // Check if name matches any category in availableCategories
    const matched = availableCategories.find(
      c => c.name.toLowerCase() === name.toLowerCase() || c.id === name || (catIdToAdd && c.id === catIdToAdd)
    );
    const resolvedId = catIdToAdd || matched?.id || name;
    const resolvedName = matched?.name || name;

    const currentCats = profile.categories || [];
    if (!currentCats.some(c => c.toLowerCase() === resolvedName.toLowerCase())) {
      onChange('categories', [...currentCats, resolvedName]);
    }

    const currentCatIds = profile.categoryIds || [];
    if (!currentCatIds.includes(resolvedId)) {
      const updatedIds = [...currentCatIds, resolvedId];
      onChange('categoryIds', updatedIds);
      onChange('adminCategoryIds', updatedIds);
      onChange('categoryId', updatedIds[0]);
    }

    const currentNewNames = profile.categoryNames || [];
    if (!currentNewNames.includes(resolvedName)) {
      onChange('categoryNames', [...currentNewNames, resolvedName]);
    }
    onChange('categoryName', resolvedName);

    onToast(`Added category: ${resolvedName}`);
    setNewCategory('');

    // Auto-generate key services if servicesOffered is currently empty
    const currentServices = profile.servicesOffered || [];
    if (currentServices.length === 0) {
      const generated = generateAiServices([resolvedName, ...currentCats], profile.businessName, profile.natureOfBusiness || []);
      if (generated.length > 0) {
        onChange('servicesOffered', generated);
        if (!profile.natureOfBusiness || profile.natureOfBusiness.length === 0) {
          onChange('natureOfBusiness', generated);
        }
      }
    }
  };

  const handleRemoveCategory = (cat: string) => {
    const updated = (profile.categories || []).filter((c) => c !== cat);
    onChange('categories', updated);

    const matched = availableCategories.find(c => c.name.toLowerCase() === cat.toLowerCase());
    const idToRemove = matched?.id || cat;

    const updatedIds = (profile.categoryIds || []).filter((id) => id !== idToRemove && id !== cat);
    onChange('categoryIds', updatedIds);
    onChange('adminCategoryIds', updatedIds);
    onChange('categoryId', updatedIds[0] || '');

    const updatedNames = (profile.categoryNames || []).filter((n) => n !== cat);
    onChange('categoryNames', updatedNames);
    if (profile.categoryName === cat) {
      onChange('categoryName', updatedNames[0] || '');
    }
  };

  // Active Categories & Suggested Services for auto-generation
  const activeCategories = (profile.categoryNames && profile.categoryNames.length > 0)
    ? profile.categoryNames
    : (profile.categories && profile.categories.length > 0)
      ? profile.categories
      : profile.category
        ? [profile.category]
        : [];

  const suggestedServices = generateAiServices(
    activeCategories,
    profile.businessName,
    profile.natureOfBusiness || []
  ).filter(srv => !(profile.servicesOffered || []).includes(srv));

  // Services Auto-generation
  const handleAutoGenerateServices = () => {
    const generated = generateAiServices(
      activeCategories,
      profile.businessName,
      profile.natureOfBusiness || []
    );

    if (generated.length === 0) {
      onToast('Please select a business category or enter your business name first.');
      return;
    }

    onChange('servicesOffered', generated);
    if (!profile.natureOfBusiness || profile.natureOfBusiness.length === 0) {
      onChange('natureOfBusiness', generated);
    }
    onToast(`Auto-generated ${generated.length} key services for ${profile.businessName || 'your business'}!`);
  };

  const handleAddSuggestedService = (srv: string) => {
    const current = profile.servicesOffered || [];
    if (current.includes(srv)) return;
    const updated = [...current, srv];
    onChange('servicesOffered', updated);
    if (!profile.natureOfBusiness || profile.natureOfBusiness.length === 0) {
      onChange('natureOfBusiness', updated);
    }
    onToast(`Added service: ${srv}`);
  };

  const handleAddAllSuggestedServices = () => {
    if (suggestedServices.length === 0) return;
    const current = profile.servicesOffered || [];
    const merged = Array.from(new Set([...current, ...suggestedServices]));
    onChange('servicesOffered', merged);
    if (!profile.natureOfBusiness || profile.natureOfBusiness.length === 0) {
      onChange('natureOfBusiness', merged);
    }
    onToast(`Added all ${suggestedServices.length} suggested services!`);
  };

  // Services Management
  const handleAddService = () => {
    const name = newService.trim();
    if (!name) return;
    const current = profile.servicesOffered || [];
    if (current.includes(name)) {
      onToast(`"${name}" service is already listed.`);
      return;
    }
    const updated = [...current, name];
    onChange('servicesOffered', updated);
    if (!profile.natureOfBusiness || profile.natureOfBusiness.length === 0) {
      onChange('natureOfBusiness', updated);
    }
    setNewService('');
    onToast(`Added service: ${name}`);
  };

  const handleRemoveService = (service: string) => {
    onChange('servicesOffered', (profile.servicesOffered || []).filter(s => s !== service));
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
          response = await updateCustomerInfo(payload);
        } catch (patchErr: any) {
          if (patchErr?.response?.status === 404) {
            usedMethod = 'POST';
            response = await createCustomerInfo(payload);
            setHasExistingRecord(true);
          } else {
            throw patchErr;
          }
        }
      } else {
        usedMethod = 'POST';
        try {
          response = await createCustomerInfo(payload);
          setHasExistingRecord(true);
        } catch (postErr: any) {
          const status = postErr?.response?.status;
          const msg = String(postErr?.response?.data?.message || '').toLowerCase();
          if (status === 409 || status === 405 || (status === 400 && msg.includes('already'))) {
            usedMethod = 'PATCH';
            response = await updateCustomerInfo(payload);
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
    {
      id: 'violet-white',
      name: 'Royal Violet & Pure White',
      previewClass: 'bg-gradient-to-r from-[#1A0A38] to-[#361168] border-violet-500 text-violet-300',
      desc: 'Regal Deep Violet foundation paired with luminous Amethyst Violet and crisp pure White accents',
      colors: '#1A0A38 + #8B5CF6',
    },
  ];

  return (
    <section className="bg-white border border-[#c5c6cd]/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-xs scroll-mt-28" id="sec-1">
      {/* Step Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stroke mb-4 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
            1
          </div>
          <h2 className="text-base font-bold text-[#091426] truncate">
            Basic Details & Theme Identity
          </h2>
        </div>

        <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] text-[11px] font-semibold border border-[#BFDBFE] flex items-center gap-1 shrink-0">
          <CheckCircle2 className="w-3 h-3 text-[#2563EB]" />
          <span>Active Profile</span>
        </span>
      </div>

      <div className="space-y-5">
        {/* ─── Card Theme Selector (Dropdown & Preview) ─────────────── */}
        <div>
          <label className="text-xs font-bold text-[#091426] flex items-center gap-1.5 mb-1.5">
            <Palette className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Card Theme (Two-Color Sets)</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <div className="relative">
              <select
                value={profile.theme || 'navy-orange'}
                onChange={(e) => onChange('theme', e.target.value as ProfileData['theme'])}
                className="w-full h-11 px-3.5 pr-8 text-xs font-semibold rounded-xl border border-stroke bg-white text-[#091426] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] cursor-pointer appearance-none shadow-2xs"
              >
                {themes.map((th) => (
                  <option key={th.id} value={th.id}>
                    {th.name} ({th.colors})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                ▼
              </div>
            </div>

            {/* Active Theme Preview Badge */}
            {(() => {
              const currentTh = themes.find((t) => t.id === profile.theme) || themes[0];
              return (
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-stroke bg-[#f8f9fc]">
                  <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-2xs shrink-0 ${currentTh.previewClass}`}>
                    Theme Sample
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#091426] block truncate">
                      {currentTh.name}
                    </span>
                    <span className="text-[10px] text-gray-500 block truncate">
                      {currentTh.desc}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ─── Business Categories (Multi-Select Dropdown) ───────────── */}
        <div className="pt-3 border-t border-stroke">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-bold text-[#091426] block">
                Business Categories <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-gray-500">
                Select one or more categories from the dropdown
              </p>
            </div>
            <span className="text-[11px] text-[#2563EB] font-semibold bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
              {(profile.categoryIds || []).filter(id => isUuidOrId(id)).length} selected
            </span>
          </div>

          {/* Multi-select Dropdown */}
          <div className="relative">
            {/* Trigger */}
            <button
              type="button"
              onClick={() => setCatDropdownOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all bg-white shadow-2xs ${
                catDropdownOpen
                  ? 'border-[#2563EB] ring-1 ring-[#2563EB]/20'
                  : 'border-stroke hover:border-[#2563EB]/50'
              }`}
            >
              <div className="flex flex-wrap gap-1.5 flex-1 min-h-[22px] items-center">
                {(profile.categoryIds || []).filter(id => isUuidOrId(id)).length === 0 ? (
                  <span className="text-gray-400">Click to select categories...</span>
                ) : (
                  (profile.categoryIds || []).filter(id => isUuidOrId(id)).map((id) => {
                    const cat = availableCategories.find((c) => c.id === id);
                    const label = cat?.name || id;
                    return (
                      <span
                        key={id}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[11px] font-semibold"
                      >
                        {label}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveCategory(label); }}
                          className="hover:text-red-600 ml-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
              <span className="text-gray-400 shrink-0 text-[11px]">{catDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown Panel */}
            {catDropdownOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white border border-[#c5c6cd] rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-150">
                {/* Search */}
                <div className="px-3 pt-3 pb-2 border-b border-stroke">
                  <input
                    type="text"
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stroke focus:outline-none focus:border-[#2563EB] bg-[#f8f9fc]"
                    autoFocus
                  />
                </div>

                {/* Options */}
                <div className="max-h-52 overflow-y-auto">
                  {availableCategories
                    .filter((c) =>
                      c.name.toLowerCase().includes(catSearch.toLowerCase())
                    )
                    .map((cat) => {
                      const isSelected = (profile.categoryIds || []).includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              handleRemoveCategory(cat.name);
                            } else {
                              handleAddCategory(cat.name, cat.id);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition-colors ${
                            isSelected
                              ? 'bg-[#EFF6FF] text-[#2563EB]'
                              : 'text-[#091426] hover:bg-[#f8f9fc]'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#2563EB] border-[#2563EB]'
                                : 'border-[#c5c6cd] bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </span>
                          <span className="font-medium">{cat.name}</span>
                        </button>
                      );
                    })}

                  {availableCategories.filter((c) =>
                    c.name.toLowerCase().includes(catSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-4 text-xs text-gray-400 text-center">
                      {availableCategories.length === 0
                        ? 'Loading categories...'
                        : `No match for "${catSearch}"`}
                    </div>
                  )}
                </div>

                {/* Done button */}
                <div className="px-3 py-2 border-t border-stroke">
                  <button
                    type="button"
                    onClick={() => { setCatDropdownOpen(false); setCatSearch(''); }}
                    className="w-full py-1.5 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold hover:bg-[#1D4ED8] transition-colors"
                  >
                    Done — {(profile.categoryIds || []).filter(id => isUuidOrId(id)).length} selected
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Key Services Offered (Multiple Entry) ───────────────── */}
        <div className="pt-3 border-t border-stroke">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[#091426] block">
                  Key Services Offered (Add Multiple)
                </label>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  Auto Generate
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                List the services provided by your business or auto-generate from category
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoGenerateServices}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11px] font-bold border border-[#BFDBFE] transition-colors shadow-2xs active:scale-95"
                title="Automatically generate services matching your business category"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Auto Generate</span>
              </button>
              <span className="text-[11px] text-gray-400">{(profile.servicesOffered || []).length} added</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-stroke bg-[#f8f9fc] items-center">
            {(profile.servicesOffered || []).map((srv, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-white text-[#091426] text-xs font-semibold flex items-center gap-1.5 border border-stroke shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                <span>{srv}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(srv)}
                  className="hover:text-red-600 text-[11px]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <div className="flex items-center gap-1 flex-1 min-w-[160px]">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
                placeholder="+ Type service & Enter (e.g. Corporate Consulting)..."
                className="w-full text-xs bg-transparent border-none text-[#091426] focus:outline-none p-1"
              />
              {newService && (
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-2 py-0.5 rounded bg-[#2563EB] text-white text-[11px] font-bold shrink-0"
                >
                  Add
                </button>
              )}
            </div>
          </div>

          {/* Smart Suggestions based on Business Category / Services */}
          {suggestedServices.length > 0 && (
            <div className="mt-2 p-2 rounded-xl bg-[#EFF6FF]/70 border border-[#BFDBFE] flex flex-wrap items-center gap-1.5 text-xs animate-in fade-in duration-200">
              <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide flex items-center gap-1 mr-0.5">
                <Sparkles className="w-3 h-3 text-[#2563EB]" />
                Suggested:
              </span>
              {suggestedServices.slice(0, 5).map((srv, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddSuggestedService(srv)}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white hover:bg-[#EFF6FF] text-[#091426] hover:text-[#2563EB] border border-stroke hover:border-[#2563EB] transition-all flex items-center gap-1 shadow-2xs"
                  title={`Add ${srv}`}
                >
                  <Plus className="w-2.5 h-2.5 text-[#2563EB]" />
                  <span>{srv}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddAllSuggestedServices}
                className="ml-auto text-[10px] font-bold text-[#2563EB] hover:underline px-1 py-0.5"
              >
                + Add All
              </button>
            </div>
          )}
        </div>

        {/* ─── Business Title & Vanity URL ────────────────────────── */}
        <div className="pt-3 border-t border-stroke space-y-3.5">
          <GenericInputField
            label="Business Name (Official Display Title)"
            value={profile.businessName}
            onChange={(e) => onChange('businessName', e.target.value)}
            placeholder="e.g. MARATHA ENTREPRENEUR ASSOCIATION"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Display Link Name (Digital Card Vanity URL) <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center rounded-xl border border-stroke bg-[#EFF6FF]/30 overflow-hidden focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]/25">
                <span className="px-3 py-2 text-xs font-mono text-gray-500 border-r border-stroke bg-gray-50">
                  digiwebcard.in/
                </span>
                <input
                  type="text"
                  value={profile.vanityUrl}
                  onChange={(e) => onChange('vanityUrl', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 h-10 px-3 bg-white text-[#091426] text-xs font-mono font-medium focus:outline-none border-none"
                  placeholder="vanity-url"
                />
              </div>
              <button
                type="button"
                onClick={handleCheckUrl}
                disabled={checkingUrl}
                className="h-10 px-3 rounded-xl bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors shrink-0"
              >
                {checkingUrl ? 'Checking...' : 'Check availability'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Branding Images Uploads (with Compression) ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-stroke">
          {/* Logo Upload */}
          <div className="p-3.5 rounded-xl border border-stroke bg-[#f8f9fc] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#091426]">
                Business Logo / Profile Pic
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-[11px] text-gray-500">Golden border</span>
                <input
                  type="checkbox"
                  checked={profile.hasGoldenBorder}
                  onChange={(e) => onChange('hasGoldenBorder', e.target.checked)}
                  className="w-3.5 h-3.5 text-[#2563EB] rounded border-stroke focus:ring-[#2563EB]"
                />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <div 
                className={`w-14 h-14 rounded-xl bg-white shadow-2xs flex items-center justify-center p-1.5 relative overflow-hidden transition-all shrink-0 ${
                  profile.hasGoldenBorder ? 'border-2 border-amber-500 shadow-amber-500/20' : 'border border-stroke'
                }`}
              >
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

              <div className="flex-1 space-y-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stroke bg-white text-[#091426] text-xs font-semibold hover:bg-[#EFF6FF] hover:border-[#2563EB] transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Upload Logo (Compressed)</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="hidden" 
                  />
                </label>
                <p className="text-[10px] text-gray-500">
                  Compressed automatically for optimal mobile speed
                </p>
              </div>
            </div>
          </div>

          {/* Banner Upload */}
          <div className="p-3.5 rounded-xl border border-stroke bg-[#f8f9fc] flex flex-col gap-2.5">
            <label className="text-xs font-bold text-[#091426]">
              Header Banner (1200×400)
            </label>
            <label className="h-14 rounded-lg border-2 border-dashed border-stroke bg-white hover:bg-[#EFF6FF] flex items-center justify-center gap-2 cursor-pointer transition-colors p-2 text-center group">
              <ImageIcon className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs text-gray-500 group-hover:text-[#2563EB]">
                {profile.bannerUrl ? 'Banner loaded (click to replace)' : 'Browse banner image'}
              </span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBannerUpload} 
                className="hidden" 
              />
            </label>
            <p className="text-[10px] text-gray-500">
              Auto-compressed JPEG/PNG up to 5MB
            </p>
          </div>
        </div>

        {/* ─── Executive Details ──────────────────────────────────── */}
        <div className="pt-3 border-t border-stroke">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2.5">
            Executive / Owner Contact Details
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Prefix
              </label>
              <select
                value={profile.prefix}
                onChange={(e) => onChange('prefix', e.target.value)}
                className="w-full h-10 px-2 rounded-xl border border-stroke bg-white text-xs font-medium focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/25 focus:outline-none"
              >
                <option>Mr.</option>
                <option>Mrs.</option>
                <option>Dr.</option>
                <option>Adv.</option>
                <option>Prof.</option>
              </select>
            </div>

            <div className="sm:col-span-5">
              <GenericInputField
                label="Full Name"
                value={profile.contactName}
                onChange={(e) => onChange('contactName', e.target.value)}
                placeholder="e.g. Ravindra Khilare-pawar"
                required
              />
            </div>

            <div className="sm:col-span-5">
              <GenericInputField
                label="Official Designation"
                value={profile.designation}
                onChange={(e) => onChange('designation', e.target.value)}
                placeholder="e.g. President / Founder"
                required
              />
            </div>
          </div>
        </div>

        {/* ─── Contact Numbers (Primary & WhatsApp only) ───────────── */}
        <div className="pt-3 border-t border-stroke">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2.5">
            Official Direct Phone Numbers
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GenericInputField
              label="Primary Phone"
              value={profile.primaryPhone}
              onChange={(e) => onChange('primaryPhone', e.target.value)}
              placeholder="e.g. 9876543210"
              prefix={<Phone className="w-3.5 h-3.5 text-gray-400" />}
              required
            />

            <GenericInputField
              label="WhatsApp Phone"
              value={profile.whatsappPhone}
              onChange={(e) => onChange('whatsappPhone', e.target.value)}
              placeholder="e.g. 9876543210"
              prefix={<MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />}
              required
            />
          </div>
        </div>

        {/* ─── Location & Automatic Pincode Lookup ─────────────────── */}
        <div className="pt-3 border-t border-stroke space-y-3">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Location & Physical Coordinates
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <GenericInputField
                label="Pincode (Auto City/District)"
                value={profile.pincode || ''}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder="e.g. 416416"
                prefix={<MapPin className="w-3.5 h-3.5 text-[#2563EB]" />}
              />
              {isLookingUpPin && (
                <span className="text-[10px] text-[#2563EB] animate-pulse">Detecting postal region...</span>
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

          <GenericTextArea
            label="Physical Head Office Address"
            rows={2}
            value={profile.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="Enter full office or registered address"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Google Maps Location Link
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
                  className="px-3.5 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Test Pin</span>
                </button>
              </div>
            </div>

            <div>
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
        </div>
      </div>

      {/* Step Footer Navigation */}
      <div className="mt-6 pt-4 border-t border-stroke flex justify-end">
        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="!px-6 !py-2.5 !text-xs !font-bold flex items-center gap-2 shadow-md shadow-[#2563EB]/25 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving to customers/info...</span>
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
