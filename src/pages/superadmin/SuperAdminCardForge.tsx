import { cardUrlFor } from '@/utils/cardUrl';
import React, { useState, useEffect } from 'react';
import { initialProfileData } from '@/data/initialProfile';
import { ProfileData, CardSectionKey } from '@/types/profile';
import { TabStepper, getOrderedSteps } from '@/components/TabStepper';
import { FullCardModal } from '@/components/FullCardModal';
import { SelectThemeModal } from '@/components/SelectThemeModal';
import { TypographyCustomizerModal } from '@/components/TypographyCustomizerModal';
import { CreditCard, UserCheck, Users } from 'lucide-react';
import { Step1BasicDetails } from '@/components/steps/Step1BasicDetails';
import { Step2AboutSpecialities } from '@/components/steps/Step2AboutSpecialities';
import { Step3ProductsServices } from '@/components/steps/Step3ProductsServices';
import { Step4LinksSocial } from '@/components/steps/Step4LinksSocial';
import { Step5PaymentQR } from '@/components/steps/Step5PaymentQR';
import { Step6GalleryMedia } from '@/components/steps/Step6GalleryMedia';
import { Step7YoutubeVideos } from '@/components/steps/Step7YoutubeVideos';
import { Step7SettingsHeadings } from '@/components/steps/Step7SettingsHeadings';
import { useGetAdmin } from '@/lib/react-query/superadmin/admin';
import { updateCustomerInfo, formatAdminInfoPayload } from '@/lib/api/customerInfoApi';
import { saveSectionOrder } from '@/lib/api/customerSettingsApi';
import { loadCardSections, applyCardSections } from '@/lib/api/cardLoader';
import { LeadsPage } from '@/pages/LeadsPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { useDueTodayCount } from '@/lib/react-query/leads';

/** Card builder, or this business's Leads / Customers; kept in ?tab= (?view= is the portal's page) */
export type CardForgePane = 'card' | 'leads' | 'customers';
const readPane = (): CardForgePane => {
  try {
    const tab = new URLSearchParams(window.location.search).get('tab');
    return tab === 'leads' || tab === 'customers' ? tab : 'card';
  } catch {
    return 'card';
  }
};
const PANES: { id: CardForgePane; label: string; Icon: typeof CreditCard }[] = [
  { id: 'card', label: 'Card', Icon: CreditCard },
  { id: 'leads', label: 'Leads', Icon: Users },
  { id: 'customers', label: 'Customers', Icon: UserCheck },
];

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

  // Card | Leads | Customers of this business
  const [pane, setPane] = useState<CardForgePane>(readPane);
  useEffect(() => {
    const onPop = () => setPane(readPane());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const changePane = (next: CardForgePane) => {
    if (next === pane) return;
    setPane(next);
    try {
      const url = new URL(window.location.href);
      if (next === 'card') url.searchParams.delete('tab');
      else url.searchParams.set('tab', next);
      window.history.pushState({ ...(window.history.state || {}), tab: next }, '', url.toString());
    } catch {
      /* URL not writable: the pane still changes */
    }
    window.scrollTo({ top: 0 });
  };
  // Follow-ups due today or overdue, shown on the Leads tab
  const { data: dueCount = 0 } = useDueTodayCount(effectiveAdminId || undefined, !!effectiveAdminId);

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
    loadCardSections(effectiveAdminId).then((sections) => {
      if (isMounted) setProfile((prev) => applyCardSections(prev, sections));
    });
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

  // Next / Previous follow the (possibly reordered) tab order, not the raw step numbers
  const orderedSteps = getOrderedSteps(profile.sectionOrder);
  const stepIndex = orderedSteps.indexOf(currentStep);
  const next = () => { if (stepIndex < orderedSteps.length - 1) handleSelectStep(orderedSteps[stepIndex + 1]); };
  const prev = () => { if (stepIndex > 0) handleSelectStep(orderedSteps[stepIndex - 1]); };

  // Apply the theme to the preview right away, then save it with the info API (theme field)
  const handleSelectTheme = async (themeId: string): Promise<boolean> => {
    const previous = profile.theme;
    handleFieldChange('theme', themeId);

    // The info API needs the Step 1 basics; without them the theme is only applied to the preview
    if (!profile.businessName || !profile.contactName) {
      showToast('🎨 Theme applied to preview. Save Basic Details first to store it on the card.');
      return true;
    }

    try {
      await updateCustomerInfo(formatAdminInfoPayload({ ...profile, theme: themeId }), effectiveAdminId || undefined);
      showToast('✅ Theme saved');
      return true;
    } catch (error: any) {
      handleFieldChange('theme', previous);
      const backendMessage = error?.response?.data?.message || error?.message || 'Failed to save theme';
      showToast(`❌ API Error: ${backendMessage}`);
      return false;
    }
  };

  const handleReorderSections = async (order: CardSectionKey[]) => {
    const previous = profile.sectionOrder;
    handleFieldChange('sectionOrder', order);
    try {
      await saveSectionOrder(order, effectiveAdminId || undefined);
      showToast('✅ Section order saved');
    } catch (error: any) {
      handleFieldChange('sectionOrder', previous);
      const backendMessage = error?.response?.data?.message || error?.message || 'Failed to save section order';
      showToast(`❌ API Error: ${backendMessage}`);
    }
  };

  const handleSaveAll = () => {
    // Only confirm the save; the full preview is not opened automatically
    showToast('🎉 Digital Card configured successfully for this administrator!');
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
    url.searchParams.delete('tab');
    url.searchParams.set('view', 'admins');
    window.history.pushState({}, '', url.toString());
    onBackToAdmins?.();
  };

  return (
    <div className="w-full text-[#0b1c30] flex flex-col font-sans overflow-x-hidden">
      {/* ─── Main Builder Process Area ───────────────────────────────── */}
      <main className={`flex-1 w-full mx-auto px-1 sm:px-3 flex flex-col gap-2 overflow-x-hidden ${pane === 'card' ? 'pb-44 md:pb-24' : 'pb-24 md:pb-6'}`}>
        {effectiveAdminId && (
          <div className="flex items-center justify-between gap-3 pt-1 px-1 sm:px-0">
            <div className="flex items-center rounded-lg border border-[#c5c6cd]/80 bg-white p-0.5 shadow-xs" role="tablist" aria-label="Business section">
              {PANES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={pane === id}
                  onClick={() => changePane(id)}
                  className={`relative flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-semibold transition-colors ${
                    pane === id ? 'bg-[#E3F2FD] text-[#1565C0]' : 'text-[#45474c] hover:text-[#0b1c30]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === 'leads' && dueCount > 0 && (
                    <span
                      className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#F44336] text-white text-[10px] font-bold flex items-center justify-center"
                      title={`${dueCount} follow-up${dueCount === 1 ? '' : 's'} due`}
                    >
                      {dueCount > 99 ? '99+' : dueCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {(profile.businessName || currentAdmin?.fullname) && (
              <span className="hidden sm:block truncate text-[13px] font-medium text-[#45474c]">
                {profile.businessName || currentAdmin?.fullname}
              </span>
            )}
          </div>
        )}

        {effectiveAdminId && pane === 'leads' ? (
          <LeadsPage key={`leads-${effectiveAdminId}`} adminId={effectiveAdminId} />
        ) : effectiveAdminId && pane === 'customers' ? (
          <CustomersPage key={`customers-${effectiveAdminId}`} adminId={effectiveAdminId} />
        ) : (
        <>
        <TabStepper
          currentStep={currentStep}
          onSelectStep={handleSelectStep}
          productCount={profile.products.length}
          sectionOrder={profile.sectionOrder}
          onReorderSections={handleReorderSections}
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
        </>
        )}
      </main>

      {/* Floating Dark Action Bar matching Image 2 (card pane only) */}
      {pane === 'card' && (
      <div className="fixed bottom-16 md:bottom-3 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] bg-[#212121] text-white px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col items-center gap-1.5 transition-all">

        <div className="text-xs sm:text-[13px] font-medium tracking-wide flex items-center gap-1.5 flex-wrap justify-center">
          <span className="text-[#0288d1] font-bold">Your Card:</span>
          <a
            href={cardUrlFor(profile.vanityUrl || effectiveAdminId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-bold underline hover:text-blue-300 transition-colors"
          >
            {/* Without a display link the card opens by its admin id */}
            {cardUrlFor(profile.vanityUrl || effectiveAdminId)}
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
      )}

      {/* Select Theme Modal matching Image 1 */}
      <SelectThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={profile.theme}
        onSelectTheme={handleSelectTheme}
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
