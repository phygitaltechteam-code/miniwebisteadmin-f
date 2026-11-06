import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Eye, Menu, LogOut } from 'lucide-react';
import QueryProvider from './lib/react-query/QueryProvider';
import AuthContextProvider from './context/AuthContextProvider';

// Auth
import Signin from './features/Registration/pages/Signin';

// Super Admin
import CategoryMaster from './pages/superadmin/CategoryMaster';
import CreateAdmin from './pages/superadmin/CreateAdmin';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import BillingManagement from './pages/superadmin/BillingManagement';
import { EnquiryNotificationBell } from './components/superadmin/EnquiryNotificationBell';
import { ExpiryAlertsPopup } from './components/superadmin/ExpiryAlertsPopup';
import CustomerPricingManagement from './pages/superadmin/CustomerPricingManagement';
import ReportsAnalytics from './pages/superadmin/ReportsAnalytics';
import GreetingsManagement from './pages/superadmin/GreetingsManagement';
import AiCreditLedger from './pages/superadmin/AiCreditLedger';
import AllReviews from './pages/superadmin/AllReviews';
import { SuperAdminSidebar, SuperAdminView } from './components/superadmin/SuperAdminSidebar';
import { MobileBottomNav } from './components/superadmin/MobileBottomNav';

// Card Builder (Admin)
import { initialProfileData } from './data/initialProfile';
import { ProfileData } from './types/profile';
import { Header } from './components/Header';
import { TabStepper } from './components/TabStepper';
import { MobileSimulator } from './components/MobileSimulator';
import { FullCardModal } from './components/FullCardModal';
import { Step1BasicDetails } from './components/steps/Step1BasicDetails';
import { Step2AboutSpecialities } from './components/steps/Step2AboutSpecialities';
import { Step3ProductsServices } from './components/steps/Step3ProductsServices';
import { Step4LinksSocial } from './components/steps/Step4LinksSocial';
import { Step5PaymentQR } from './components/steps/Step5PaymentQR';
import { Step6GalleryMedia } from './components/steps/Step6GalleryMedia';
import { Step7YoutubeVideos } from './components/steps/Step7YoutubeVideos';
import { Step7SettingsHeadings } from './components/steps/Step7SettingsHeadings';
import { SuperAdminCardForge } from './pages/superadmin/SuperAdminCardForge';
import { FranchiseMaster } from './pages/superadmin/FranchiseMaster';
import { EnquiriesDropdown } from './components/EnquiriesDropdown';
import { PublicCardPage } from './pages/PublicCardPage';
import { PlanExpiryAlert, PlanExpiredGate } from './components/PlanExpiryAlert';
import { loadCardSections, applyCardSections } from './lib/api/cardLoader';

// ─── Super Admin / Franchise Layout ───────────────────────────────────────────
function SuperAdminPortal({
  onSignOut,
  userRole = 'SUPERADMIN',
}: {
  onSignOut: () => void;
  userRole?: string;
}) {
  const isFranchise = userRole?.trim().toUpperCase() === 'FRANCHISE';
  // Franchise users land on All Businesses (create/manage admins) instead of the dashboard
  const defaultInitialView: SuperAdminView = isFranchise ? 'admins' : 'home';

  const [activeView, setActiveView] = useState<SuperAdminView>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const req = p.get('view') as SuperAdminView;
      if (isFranchise && (req === 'categories' || req === 'franchise')) {
        return defaultInitialView;
      }
      return req || defaultInitialView;
    } catch {
      return defaultInitialView;
    }
  });
  const [selectedAdminForCard, setSelectedAdminForCard] = useState<any | null>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const aId = p.get('adminId');
      return aId ? { id: aId } : null;
    } catch {
      return null;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOpenCardForge = (admin: any) => {
    setSelectedAdminForCard(admin);
    setActiveView('card-builder');
    const targetId = admin?.id || admin?._id || '';
    if (targetId) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'card-builder');
        url.searchParams.set('adminId', targetId);
        window.history.pushState({ view: 'card-builder', adminId: targetId }, '', url.toString());
      } catch {}
    }
  };

  // Business open in the card builder (its own enquiries show next to the bell)
  const cardAdminId =
    activeView === 'card-builder'
      ? selectedAdminForCard?.id || selectedAdminForCard?._id || new URLSearchParams(window.location.search).get('adminId') || ''
      : '';
  const openBusinessFromEnquiry = (adminId: string, businessName?: string) =>
    handleOpenCardForge({ id: adminId, fullname: businessName });

  const handleSelectView = (view: SuperAdminView) => {
    if (isFranchise && (view === 'categories' || view === 'franchise')) {
      return;
    }
    setActiveView(view);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', view);
      if (view !== 'card-builder') {
        url.searchParams.delete('adminId');
      }
      window.history.pushState({}, '', url.toString());
    } catch {}
  };

  const getViewTitle = (view: SuperAdminView): string => {
    switch (view) {
      case 'home':
        return 'Dashboard';
      case 'admins':
        return 'All Businesses';
      case 'reviews':
        return 'All Reviews';
      case 'categories':
        return 'Category Master';
      case 'franchise':
        return 'Franchisee List';
      case 'billing':
        return 'Billing Report';
      case 'pricing':
        return 'Customer Pricing';
      case 'report':
        return 'Report';
      case 'greetings':
        return 'Greetings Management';
      case 'ai-ledger':
        return 'AI Credit Ledger';
      case 'card-builder':
        return 'Card Forge';
      default:
        return 'Admin Portal';
    }
  };

  return (
    <div className="h-screen overflow-hidden flex bg-[#f8f9fc] font-satoshi">
      {/* Desktop Sidebar (Fixed on the left, does NOT scroll) */}
      <div className="hidden md:block h-screen sticky top-0 shrink-0 z-30">
        <SuperAdminSidebar
          currentView={activeView}
          onSelectView={handleSelectView}
          userRole={userRole}
          onSignOut={onSignOut}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            <SuperAdminSidebar
              currentView={activeView}
              onSelectView={handleSelectView}
              onClose={() => setIsMobileMenuOpen(false)}
              userRole={userRole}
              onSignOut={onSignOut}
            />
          </div>
        </div>
      )}

      {/* Main Content Area (Only page content scrolls smoothly) */}
      <main className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0 pb-20 md:pb-6">
        {/* Mobile Top Menu Bar Header for Sidebar Drawer */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-[#E0E0E0] px-3 py-2 flex items-center justify-between shadow-xs font-['Roboto',Helvetica,Arial,sans-serif]">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded border border-[#C4C4C4] text-[#000000DE] hover:bg-gray-100 hover:text-[#2196F3] transition-colors shrink-0"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div className="min-w-0">
              <h1 className="font-bold text-[14px] sm:text-[15px] text-[#000000DE] tracking-tight truncate">
                {getViewTitle(activeView)}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <EnquiryNotificationBell onOpenBusiness={openBusinessFromEnquiry} />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2196F3] border border-blue-200 uppercase">
              {userRole}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Plan expiry alerts for the admins (once per session) */}
        <ExpiryAlertsPopup onOpenBusiness={openBusinessFromEnquiry} />

        {/* Desktop top bar: enquiry notifications from every business (outside the page tables) */}
        <div className="hidden md:flex items-center justify-end gap-3 px-6 pt-3">
          {/* Opened business: only its enquiries */}
          {cardAdminId ? (
            <EnquiriesDropdown key={cardAdminId} adminId={cardAdminId} />
          ) : (
            <EnquiryNotificationBell onOpenBusiness={openBusinessFromEnquiry} />
          )}
        </div>

        {activeView === 'home' && (
          <div className="w-full px-4 sm:px-6 py-3.5 flex-1">
            <SuperAdminDashboard onNavigate={handleSelectView} userRole={userRole} />
          </div>
        )}
        {activeView === 'categories' && (
          <div className="w-full px-4 sm:px-6 py-3.5 flex-1">
            <CategoryMaster />
          </div>
        )}
        {activeView === 'admins' && (
          <div className="w-full px-4 sm:px-6 py-3.5 flex-1">
            <CreateAdmin onOpenCardForge={handleOpenCardForge} />
          </div>
        )}
        {activeView === 'reviews' && (
          <div className="w-full px-4 sm:px-6 py-3.5 flex-1">
            <AllReviews
              onOpenBusiness={openBusinessFromEnquiry}
              onBack={() => handleSelectView('home')}
            />
          </div>
        )}
        {activeView === 'franchise' && (
          <div className="w-full px-4 sm:px-6 py-3.5 flex-1">
            <FranchiseMaster />
          </div>
        )}
        {activeView === 'billing' && (
          <div className="w-full px-4 sm:px-6 py-3.5 flex-1">
            <BillingManagement />
          </div>
        )}
        {activeView === 'pricing' && (
          <div className="w-full px-4 sm:px-6 py-3.5 flex-1">
            <CustomerPricingManagement />
          </div>
        )}
        {activeView === 'report' && (
          <div className="w-full px-4 sm:px-6 py-3.5 flex-1">
            <ReportsAnalytics />
          </div>
        )}
        {activeView === 'greetings' && (
          <div className="w-full px-4 sm:px-6 py-3.5 flex-1">
            <GreetingsManagement />
          </div>
        )}
        {activeView === 'ai-ledger' && (
          <div className="w-full px-4 sm:px-6 py-3.5 flex-1">
            <AiCreditLedger />
          </div>
        )}
        {activeView === 'card-builder' && (
          <div className="w-full flex-1">
            <SuperAdminCardForge
              key={cardAdminId || 'card-builder'}
              selectedAdmin={selectedAdminForCard}
              onBackToAdmins={() => setActiveView('admins')}
              onSignOut={onSignOut}
            />
          </div>
        )}

        {/* Mobile Bottom Navigation Footer (HOME in the middle) */}
        <MobileBottomNav
          currentView={activeView}
          onSelectView={handleSelectView}
          onOpenSidebar={() => setIsMobileMenuOpen(true)}
          isFranchise={isFranchise}
        />
      </main>
    </div>
  );
}

// ─── Admin Card Builder ───────────────────────────────────────────────────────
function AdminCardBuilder({
  onSignOut,
  isInsideSuperAdmin = false,
}: {
  onSignOut: () => void;
  isInsideSuperAdmin?: boolean;
}) {
  const [profile, setProfile] = useState<ProfileData>(initialProfileData);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFullCardModalOpen, setIsFullCardModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((p) => (p === msg ? null : p)), 3200);
  };

  const handleFieldChange = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  // Admin's own card loaded up front (customers/… APIs) so the preview shows the full saved card,
  // the same as the super admin builder and the public page
  useEffect(() => {
    if (isInsideSuperAdmin) return;
    let alive = true;
    loadCardSections().then((sections) => {
      if (alive) setProfile((prev) => applyCardSections(prev, sections));
    });
    return () => {
      alive = false;
    };
  }, [isInsideSuperAdmin]);

  const handleSelectStep = (n: number) => {
    setCurrentStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => { if (currentStep < 8) handleSelectStep(currentStep + 1); };
  const prev = () => { if (currentStep > 1) handleSelectStep(currentStep - 1); };

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => { 
      setIsSaving(false); 
      showToast('🎉 Digital Card configuration completed & live!');
    }, 450);
  };

  return (
    <div className={`text-[#0b1c30] flex flex-col font-sans overflow-x-hidden w-full max-w-full ${
      isInsideSuperAdmin ? 'bg-transparent' : 'min-h-screen bg-[#f8f9ff]'
    }`}>
      {/* Admin login: header with enquiries + logout, and the plan expiry alert */}
      {!isInsideSuperAdmin && (
        <>
          <Header
            profile={profile}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectStep={handleSelectStep}
            onSignOut={onSignOut}
          />
          <PlanExpiryAlert />
        </>
      )}

      <main className="flex-1 w-full max-w-[1520px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3.5 flex flex-col gap-2.5 sm:gap-4 pb-24 sm:pb-14 overflow-x-hidden">
        <TabStepper
          currentStep={currentStep}
          onSelectStep={handleSelectStep}
          productCount={profile.products.length}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 xl:gap-6 items-start">
          {/* Left Form Process Step Area */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3.5 sm:gap-5 min-w-0">
            {currentStep === 1 && <Step1BasicDetails profile={profile} onChange={handleFieldChange} onNext={next} onToast={showToast} />}
            {currentStep === 2 && <Step2AboutSpecialities profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} />}
            {currentStep === 3 && <Step3ProductsServices profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} />}
            {currentStep === 4 && <Step4LinksSocial profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} />}
            {currentStep === 5 && <Step5PaymentQR profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} />}
            {currentStep === 6 && <Step6GalleryMedia profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} />}
            {currentStep === 7 && <Step7YoutubeVideos profile={profile} onChange={handleFieldChange} onNext={next} onPrev={prev} onToast={showToast} />}
            {currentStep === 8 && <Step7SettingsHeadings profile={profile} onChange={handleFieldChange} onPrev={prev} onSaveAll={handleSaveAll} onToast={showToast} />}
          </div>

          {/* Right Sticky Mobile Preview on Every Process */}
          <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20 self-start">
            <MobileSimulator
              profile={profile}
              onOpenFullPreview={(mode) => {
                setModalMode(mode || 'desktop');
                setIsFullCardModalOpen(true);
              }}
              onToast={showToast}
            />
          </aside>
        </div>
      </main>

      {/* Sleek compact Floating Action Button for mobile & tablet screens */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => {
            setModalMode('mobile');
            setIsFullCardModalOpen(true);
          }}
          aria-label="Live Card Preview"
          title="Live Card Preview"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2563EB] text-white shadow-xl flex items-center justify-center hover:bg-[#1D4ED8] active:scale-95 transition-all border-2 border-white relative group"
        >
          <Eye className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      </div>

      {/* Full Screen Whole-Screen Card Modal */}
      <FullCardModal
        isOpen={isFullCardModalOpen}
        onClose={() => setIsFullCardModalOpen(false)}
        initialMode={modalMode}
        profile={profile}
        onToast={showToast}
      />

      {toastMessage && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-[#091426] text-white px-5 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('token');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return (
        parsed?.user?.role ||
        parsed?.role ||
        parsed?.data?.user?.role ||
        parsed?.data?.role ||
        ''
      );
    } catch { return ''; }
  });

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('token_key');
    try {
      sessionStorage.removeItem('plan-expiry-alert-dismissed');
      sessionStorage.removeItem('expiry-alerts-seen');
    } catch {}
    setIsAuthenticated(false);
    setUserRole('');
    toast.success('Signed out successfully');
  };

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <PlanExpiredGate isAuthenticated={false} onSignOut={handleSignOut} />
        <Signin onSuccess={(role) => { setIsAuthenticated(true); setUserRole(role || ''); }} />
      </>
    );
  }

  const normalizedRole = userRole?.trim().toUpperCase();
  const isSuperAdmin = normalizedRole === 'SUPERADMIN';
  const isFranchise = normalizedRole === 'FRANCHISE';

  return (
    <>
      <Toaster position="top-right" />
      <PlanExpiredGate isAuthenticated onSignOut={handleSignOut} />
      {isSuperAdmin || isFranchise ? (
        <SuperAdminPortal onSignOut={handleSignOut} userRole={normalizedRole} />
      ) : (
        <AdminCardBuilder onSignOut={handleSignOut} />
      )}
    </>
  );
}

/** Display link from a public card URL (/<vanityUrl>), or null for the app itself */
const publicCardSlug = (): string | null => {
  const match = window.location.pathname.match(/^\/([A-Za-z0-9-]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
};

export default function App() {
  // /<display link> is a business's public website: no login, no admin panel
  const slug = publicCardSlug();
  if (slug) return <PublicCardPage vanityUrl={slug} />;

  return (
    <AuthContextProvider>
      <QueryProvider>
        <AppContent />
      </QueryProvider>
    </AuthContextProvider>
  );
}
