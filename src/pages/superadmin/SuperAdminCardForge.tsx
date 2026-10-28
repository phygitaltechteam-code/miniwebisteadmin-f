import React, { useState, useEffect } from 'react';
import { initialProfileData } from '@/data/initialProfile';
import { ProfileData } from '@/types/profile';
import { TabStepper } from '@/components/TabStepper';
import { FullCardModal } from '@/components/FullCardModal';
import { SelectThemeModal } from '@/components/SelectThemeModal';
import { TypographyCustomizerModal } from '@/components/TypographyCustomizerModal';
import { Type } from 'lucide-react';
import { Step1BasicDetails } from '@/components/steps/Step1BasicDetails';
import { Step2AboutSpecialities } from '@/components/steps/Step2AboutSpecialities';
import { Step3ProductsServices } from '@/components/steps/Step3ProductsServices';
import { Step4LinksSocial } from '@/components/steps/Step4LinksSocial';
import { Step5PaymentQR } from '@/components/steps/Step5PaymentQR';
import { Step6GalleryMedia } from '@/components/steps/Step6GalleryMedia';
import { Step7YoutubeVideos } from '@/components/steps/Step7YoutubeVideos';
import { Step7SettingsHeadings } from '@/components/steps/Step7SettingsHeadings';
import { useGetAdmin } from '@/lib/react-query/superadmin/admin';
import { getCustomerInfo } from '@/lib/api/customerInfoApi';
import { getCustomerAbout } from '@/lib/api/customerAboutApi';
import { getCustomerProducts, normalizeBackendProduct } from '@/lib/api/customerProductsApi';
import { getCustomerLinks, parseCustomerLinksResponse } from '@/lib/api/customerSocialApi';
import { getCustomerPayment, parseCustomerPaymentResponse } from '@/lib/api/customerPaymentApi';
import { getCustomerGallery, parseCustomerGalleryResponse } from '@/lib/api/customerGalleryApi';
import { getCustomerVideos, parseCustomerVideosResponse } from '@/lib/api/customerVideosApi';
import { getCustomerSettings } from '@/lib/api/customerSettingsApi';

export interface SuperAdminCardForgeProps {
  selectedAdmin?: any;
  onBackToAdmins?: () => void;
  onSignOut?: () => void;
}

export const SuperAdminCardForge: React.FC<SuperAdminCardForgeProps> = ({
  selectedAdmin: initialAdmin,
  onBackToAdmins,
}) => {
  const { data: adminData } = useGetAdmin();
  const rawAdminList: any[] = Array.isArray(adminData)
    ? adminData
    : (adminData as any)?.data?.admins ||
      (adminData as any)?.admins ||
      (Array.isArray((adminData as any)?.data) ? (adminData as any).data : []);

  const [currentAdmin, setCurrentAdmin] = useState<any>(initialAdmin || null);

  const buildProfileFromAdmin = (adm: any): ProfileData => {
    if (!adm) return { ...initialProfileData };
    const adminCats = Array.isArray(adm.adminCategories) ? adm.adminCategories : [];
    const catNames: string[] = [];
    const catIds: string[] = [];

    adminCats.forEach((ac: any) => {
      const name = ac.adminCategory?.name || ac.name || ac.categoryName;
      const id = ac.adminCategoryId || ac.adminCategory?.id || ac.id;
      if (name && !catNames.includes(name)) catNames.push(name);
      if (id && !catIds.includes(id)) catIds.push(id);
    });

    if (adm.categoryNames && Array.isArray(adm.categoryNames)) {
      adm.categoryNames.forEach((n: string) => {
        if (n && !catNames.includes(n)) catNames.push(n);
      });
    }

    const cat = catNames[0] || adm.categoryName || adm.adminCategory?.name || adm.category?.name || adm.category || '';
    const catId = catIds[0] || adm.adminCategoryId || adm.category?.id || adm.adminCategory?.id || '';
    const price = adm.amount ?? adm.price ?? 0;
    const renewal = adm.renewalAmount ?? 0;
    const fullName = adm.fullname || adm.user?.fullname || '';
    const phone = adm.phoneNumber || adm.user?.phoneNumber || adm.phone || '';
    const email = adm.email || adm.user?.email || '';
    const address = adm.address || adm.user?.address || '';
    // Do NOT put personal name (fullName) into businessName; keep it in contactName
    const businessName = adm.cardBusinessName || adm.businessName || adm.companyName || '';
    const contactName = adm.cardContactName || adm.contactName || fullName || '';
    const vanitySlug = businessName
      ? businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      : '';

    return {
      ...initialProfileData,
      categoryId: catId,
      categoryIds: catIds.length > 0 ? catIds : (catId ? [catId] : []),
      categoryName: cat,
      category: cat,
      categories: catNames.length > 0 ? catNames : (cat ? [cat] : []),
      amount: Number(price) || 0,
      renewalAmount: Number(renewal) || 0,
      contactName,
      businessName,
      primaryPhone: phone,
      whatsappPhone: phone,
      whatsappNumber: phone,
      email,
      address,
      vanityUrl: adm.vanityUrl || vanitySlug || '',
    };
  };

  const [profile, setProfile] = useState<ProfileData>(() => buildProfileFromAdmin(initialAdmin));
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFullCardModalOpen, setIsFullCardModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isTypographyModalOpen, setIsTypographyModalOpen] = useState<boolean>(false);

  const urlAdminId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('adminId') || '' : '';
  const effectiveAdminId = currentAdmin?.id || currentAdmin?._id || initialAdmin?.id || initialAdmin?._id || urlAdminId || '';

  // When initialAdmin changes, sync URL route with adminId
  useEffect(() => {
    if (initialAdmin) {
      const targetId = initialAdmin.id || initialAdmin._id;
      if (targetId) {
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'card-builder');
        url.searchParams.set('adminId', targetId);
        window.history.pushState({ view: 'card-builder', adminId: targetId }, '', url.toString());
      }
      setCurrentAdmin(initialAdmin);
      setProfile(buildProfileFromAdmin(initialAdmin));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [initialAdmin]);

  // 1. Resolve full admin object from rawAdminList if initialAdmin was just an ID or missing fields
  useEffect(() => {
    if (effectiveAdminId && rawAdminList.length > 0) {
      const found = rawAdminList.find((a: any) => (a.id || a._id) === effectiveAdminId);
      if (found) {
        setCurrentAdmin(found);
        setProfile((prev) => {
          const base = buildProfileFromAdmin(found);
          return {
            ...base,
            ...prev,
            businessName: prev.businessName || base.businessName,
            contactName: prev.contactName || base.contactName,
            primaryPhone: prev.primaryPhone || base.primaryPhone,
            whatsappPhone: prev.whatsappPhone || base.whatsappPhone,
            whatsappNumber: prev.whatsappNumber || base.whatsappNumber,
            email: prev.email || base.email,
            address: prev.address || base.address,
            categoryName: prev.categoryName || base.categoryName,
            category: prev.category || base.category,
            categoryId: prev.categoryId || base.categoryId,
            categoryIds: prev.categoryIds?.length ? prev.categoryIds : base.categoryIds,
            vanityUrl: prev.vanityUrl || base.vanityUrl,
          };
        });
      }
    }
  }, [effectiveAdminId, rawAdminList]);

  // 2. Fetch existing saved card data from backend for this adminId
  useEffect(() => {
    if (!effectiveAdminId) return;
    let isMounted = true;

    const loadBackendCardData = async () => {
      try {
        const [infoRes, aboutRes, prodRes, linksRes, payRes, galRes, vidRes, settRes] = await Promise.allSettled([
          getCustomerInfo(effectiveAdminId),
          getCustomerAbout(effectiveAdminId),
          getCustomerProducts({ page: 1, limit: 100 }, effectiveAdminId),
          getCustomerLinks(effectiveAdminId),
          getCustomerPayment(effectiveAdminId),
          getCustomerGallery(effectiveAdminId),
          getCustomerVideos(effectiveAdminId),
          getCustomerSettings(effectiveAdminId),
        ]);

        if (!isMounted) return;

        setProfile((prev) => {
          const updated = { ...prev };

          // 1. Info
          if (infoRes.status === 'fulfilled' && infoRes.value) {
            const data = (infoRes.value as any)?.data || (infoRes.value as any)?.customer || (infoRes.value as any)?.info || infoRes.value;
            if (data && typeof data === 'object') {
              if (data.businessName) updated.businessName = data.businessName;
              if (data.contactName) updated.contactName = data.contactName;
              else if (prev.contactName) updated.contactName = prev.contactName;
              if (data.prefix) updated.prefix = data.prefix;
              if (data.designation) updated.designation = data.designation;
              if (data.primaryPhone) updated.primaryPhone = data.primaryPhone;
              if (data.whatsappNumber || data.whatsappPhone) {
                updated.whatsappPhone = data.whatsappNumber || data.whatsappPhone;
                updated.whatsappNumber = data.whatsappNumber || data.whatsappPhone;
              }
              if (data.email) updated.email = data.email;
              if (data.address) updated.address = data.address;
              if (data.city) updated.city = data.city;
              if (data.state) updated.state = data.state;
              if (data.district) updated.district = data.district;
              if (data.pincode) updated.pincode = data.pincode;
              if (data.theme) updated.theme = data.theme;
              if (data.logoUrl) updated.logoUrl = data.logoUrl;
              if (data.bannerUrl) updated.bannerUrl = data.bannerUrl;
              if (Array.isArray(data.banners) && data.banners.length > 0) {
                updated.banners = data.banners;
              } else if (data.bannerUrl) {
                updated.banners = [data.bannerUrl];
              }
              if (data.vanityUrl) updated.vanityUrl = data.vanityUrl;
              if (data.mapLink) updated.mapLink = data.mapLink;
              if (data.hasLogoBorder !== undefined) updated.hasGoldenBorder = Boolean(data.hasLogoBorder);
              if (data.showCategoryInCard !== undefined) updated.showCategoryInCard = Boolean(data.showCategoryInCard);
            }
          }

          // 2. About
          if (aboutRes.status === 'fulfilled' && aboutRes.value) {
            const raw = (aboutRes.value as any)?.data || (aboutRes.value as any)?.about || aboutRes.value;
            const about = raw?.aboutUs || raw?.about || (raw && !raw.basicDetailsServices ? raw : null);
            if (about && typeof about === 'object') {
              if (about.establishmentYear) updated.establishmentYear = String(about.establishmentYear);
              if (about.gstNumber) updated.gstNumber = about.gstNumber;
              const narrative = about.aboutUsText || about.aboutNarrative;
              if (narrative) updated.aboutNarrative = narrative;
              if (Array.isArray(about.specialities) && about.specialities.length > 0) {
                updated.specialities = about.specialities.map((s: any) => typeof s === 'string' ? s : s.specialities || s.name || s.title).filter(Boolean);
              }
              const rawDocs = about.officialDocuments || about.documents;
              if (Array.isArray(rawDocs) && rawDocs.length > 0) {
                updated.documents = rawDocs.map((d: any, idx: number) => ({
                  id: d.id || d._id || `doc_${idx}`,
                  name: d.fileName || d.name || `Document_${idx + 1}`,
                  fileName: d.fileName || d.name || `Document_${idx + 1}`,
                  url: d.fileUrl || d.url || '',
                  size: d.size || '',
                  uploadedAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : d.uploadedAt || '',
                  type: d.type || (String(d.fileUrl || '').match(/\.(jpeg|jpg|png|webp)/i) ? 'IMAGE' : String(d.fileUrl || '').toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'),
                }));
              }
            }
          }

          // 3. Products
          if (prodRes.status === 'fulfilled' && prodRes.value) {
            const rawProds = (prodRes.value as any)?.data?.products || (prodRes.value as any)?.data || (prodRes.value as any)?.products || (Array.isArray(prodRes.value) ? prodRes.value : []);
            if (Array.isArray(rawProds) && rawProds.length > 0) {
              updated.products = rawProds.map(normalizeBackendProduct);
            }
          }

          // 4. Links
          if (linksRes.status === 'fulfilled' && linksRes.value) {
            const rawLinks = (linksRes.value as any)?.data || linksRes.value;
            if (rawLinks && typeof rawLinks === 'object') {
              const parsed = parseCustomerLinksResponse(rawLinks);
              Object.assign(updated, parsed);
            }
          }

          // 5. Payment
          if (payRes.status === 'fulfilled' && payRes.value) {
            const parsed = parseCustomerPaymentResponse(payRes.value);
            if (parsed && typeof parsed === 'object') {
              if (parsed.upiId) updated.upiId = parsed.upiId;
              if (parsed.paymentPhoneNo || parsed.upiNumber) {
                const phone = parsed.paymentPhoneNo || parsed.upiNumber || '';
                updated.paymentPhoneNo = phone;
                updated.upiNumber = phone;
              }
              if (parsed.bankName) updated.bankName = parsed.bankName;
              if (parsed.bankHolderName || parsed.accountHolderName) {
                const holder = parsed.bankHolderName || parsed.accountHolderName || '';
                updated.bankHolderName = holder;
                updated.accountHolderName = holder;
              }
              if (parsed.bankAccountNumber || parsed.accountNumber) {
                const acc = parsed.bankAccountNumber || parsed.accountNumber || '';
                updated.bankAccountNumber = acc;
                updated.accountNumber = acc;
              }
              if (parsed.bankIfscCode || parsed.ifscCode) {
                const ifsc = parsed.bankIfscCode || parsed.ifscCode || '';
                updated.bankIfscCode = ifsc;
                updated.ifscCode = ifsc;
              }
              if (parsed.accountType) updated.accountType = parsed.accountType;
            }
          }

          // 6. Gallery
          if (galRes.status === 'fulfilled' && galRes.value) {
            const normalized = parseCustomerGalleryResponse(galRes.value);
            if (Array.isArray(normalized) && normalized.length > 0) {
              updated.galleryImages = normalized;
            }
          }

          // 7. Videos
          if (vidRes.status === 'fulfilled' && vidRes.value) {
            const normalized = parseCustomerVideosResponse(vidRes.value);
            if (Array.isArray(normalized) && normalized.length > 0) {
              updated.youtubeVideos = normalized;
            }
          }

          // 8. Settings
          if (settRes.status === 'fulfilled' && settRes.value) {
            const rawSett = (settRes.value as any)?.data || (settRes.value as any)?.settings || settRes.value;
            if (rawSett && typeof rawSett === 'object') {
              if (rawSett.headings) updated.headings = { ...updated.headings, ...rawSett.headings };
              if (rawSett.navLabels) updated.navLabels = { ...updated.navLabels, ...rawSett.navLabels };
              if (rawSett.visibility) updated.visibility = { ...updated.visibility, ...rawSett.visibility };
              if (rawSett.amount !== undefined) updated.amount = rawSett.amount;
              if (rawSett.renewalAmount !== undefined) updated.renewalAmount = rawSett.renewalAmount;
            }
          }

          return updated;
        });
      } catch {
        // Silent
      }
    };

    loadBackendCardData();
    return () => { isMounted = false; };
  }, [effectiveAdminId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((p) => (p === msg ? null : p)), 3200);
  };

  const handleFieldChange = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectStep = (n: number) => {
    setCurrentStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => { if (currentStep < 8) handleSelectStep(currentStep + 1); };
  const prev = () => { if (currentStep > 1) handleSelectStep(currentStep - 1); };

  const handleSaveAll = () => {
    showToast('🎉 Digital Card configured successfully for this administrator!');
    setIsFullCardModalOpen(true);
  };

  const handleSwitchAdmin = (adminId: string) => {
    const found = rawAdminList.find((a: any) => (a.id || a._id) === adminId);
    if (found) {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'card-builder');
      url.searchParams.set('adminId', adminId);
      window.history.pushState({ view: 'card-builder', adminId }, '', url.toString());

      setCurrentAdmin(found);
      setProfile(buildProfileFromAdmin(found));
      showToast(`Switched to administrator: ${found.fullname || found.user?.fullname}`);
    }
  };

  const handleBackToAdmins = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('adminId');
    url.searchParams.set('view', 'admins');
    window.history.pushState({}, '', url.toString());
    onBackToAdmins?.();
  };

  return (
    <div className="w-full text-[#0b1c30] flex flex-col font-sans overflow-x-hidden">
      {/* ─── Main Builder Process Area ───────────────────────────────── */}
      <main className="flex-1 w-full mx-auto px-1 sm:px-3 flex flex-col gap-2 pb-44 md:pb-24 overflow-x-hidden">
        <TabStepper
          currentStep={currentStep}
          onSelectStep={handleSelectStep}
          productCount={profile.products.length}
        />

        {/* Form Process Step Area (Full Width) */}
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 min-w-0 pb-6">

          {(() => {
            const urlAdminId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('adminId') || '' : '';
            const adminId = currentAdmin?.id || currentAdmin?._id || initialAdmin?.id || initialAdmin?._id || urlAdminId || '';

            if (!adminId) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
                  <p className="text-sm font-bold text-slate-800 mb-1">No Administrator Selected</p>
                  <p className="text-xs text-slate-500 mb-4">Please select an administrator from the Admins Table to configure their digital business card.</p>
                  {onBackToAdmins && (
                    <button
                      type="button"
                      onClick={onBackToAdmins}
                      className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-sm hover:bg-[#1D4ED8] transition-colors"
                    >
                      ← Go to Admins Table
                    </button>
                  )}
                </div>
              );
            }

            return (
              <>
                {currentStep === 1 && <Step1BasicDetails profile={profile} onChange={handleFieldChange} onNext={next} onToast={showToast} adminId={adminId} />}
                {currentStep === 2 && <Step2AboutSpecialities profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} adminId={adminId} />}
                {currentStep === 3 && <Step3ProductsServices profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} adminId={adminId} />}
                {currentStep === 4 && <Step4LinksSocial profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} adminId={adminId} />}
                {currentStep === 5 && <Step5PaymentQR profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} adminId={adminId} />}
                {currentStep === 6 && <Step6GalleryMedia profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} adminId={adminId} />}
                {currentStep === 7 && <Step7YoutubeVideos profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} adminId={adminId} />}
                {currentStep === 8 && <Step7SettingsHeadings profile={profile} onChange={handleFieldChange} onPrev={prev} onSaveAll={handleSaveAll} onToast={showToast} adminId={adminId} />}
              </>
            );
          })()}
        </div>
      </main>

      {/* Floating Dark Action Bar matching Image 2 */}
      <div className="fixed bottom-16 md:bottom-3 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] bg-[#212121] text-white px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col items-center gap-1.5 transition-all">

        <div className="text-xs sm:text-[13px] font-medium tracking-wide flex items-center gap-1.5 flex-wrap justify-center">
          <span className="text-[#0288d1] font-bold">Your Card:</span>
          <a
            href={`https://digiwebcard.in/${profile.vanityUrl || 'assa-o-living'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-bold underline hover:text-blue-300 transition-colors"
          >
            https://digiwebcard.in/{profile.vanityUrl || 'assa-o-living'}
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 pt-0.5 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => setIsThemeModalOpen(true)}
            className="px-4 sm:px-5 py-1.5 rounded-full bg-white text-[#212121] text-xs font-bold shadow-md hover:bg-gray-100 active:scale-95 transition-all"
          >
            Change theme
          </button>
          <button
            type="button"
            onClick={() => {
              setModalMode('mobile');
              setIsFullCardModalOpen(true);
            }}
            className="px-5 sm:px-6 py-1.5 rounded-full bg-[#1e88e5] text-white text-xs font-bold shadow-md hover:bg-[#1976d2] active:scale-95 transition-all"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Select Theme Modal matching Image 1 */}
      <SelectThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={profile.theme}
        onSelectTheme={(th) => handleFieldChange('theme', th)}
        onOpenTypography={() => setIsTypographyModalOpen(true)}
      />

      {/* Typography & Font Customizer Modal */}
      <TypographyCustomizerModal
        isOpen={isTypographyModalOpen}
        onClose={() => setIsTypographyModalOpen(false)}
        settings={profile.typography}
        onApplySettings={(typo) => {
          handleFieldChange('typography', typo);
          showToast('Typography and styling updated successfully!');
        }}
      />


      {/* Full Screen Whole-Screen Card Modal */}
      <FullCardModal
        isOpen={isFullCardModalOpen}
        onClose={() => setIsFullCardModalOpen(false)}
        initialMode={modalMode}
        profile={profile}
        onToast={showToast}
      />

      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-12 left-1/2 -translate-x-1/2 z-50 w-max max-w-[calc(100vw-2rem)] bg-[#091426] text-white px-4 sm:px-5 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCardForge;
