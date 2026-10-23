import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Eye } from 'lucide-react';
import QueryProvider from './lib/react-query/QueryProvider';
import AuthContextProvider from './context/AuthContextProvider';

// Auth
import Signin from './features/Registration/pages/Signin';

// Super Admin
import CategoryMaster from './pages/superadmin/CategoryMaster';
import CreateAdmin from './pages/superadmin/CreateAdmin';
import { SuperAdminSidebar, SuperAdminView } from './components/superadmin/SuperAdminSidebar';

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

// ─── Super Admin Layout (sidebar only, no header) ─────────────────────────────
function SuperAdminPortal({ onSignOut }: { onSignOut: () => void }) {
  const [activeView, setActiveView] = useState<SuperAdminView>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return (p.get('view') as SuperAdminView) || 'categories';
    } catch {
      return 'categories';
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

  const handleSelectView = (view: SuperAdminView) => {
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

  return (
    <div className="h-screen overflow-hidden flex bg-[#f8f9fc] font-satoshi">
      {/* Desktop Sidebar (Fixed on the left, does NOT scroll) */}
      <div className="hidden md:block h-screen sticky top-0 shrink-0 z-30">
        <SuperAdminSidebar
          currentView={activeView}
          onSelectView={handleSelectView}
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
            />
          </div>
        </div>
      )}

      {/* Main Content Area (Only page content scrolls smoothly) */}
      <main className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        {/* Top Breadcrumb & Actions Bar */}
        <div className="bg-white border-b border-stroke px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-xs shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 text-sm min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl border border-stroke text-gray-700 hover:bg-gray-100 transition-colors"
              title="Open menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-[#2563EB] font-bold text-[11px] sm:text-xs border border-blue-200 shrink-0">
              Super Admin Area
            </span>
            <span className="text-gray-400 font-medium">/</span>
            <span className="font-bold text-gray-800 text-xs sm:text-sm truncate">
              {activeView === 'categories'
                ? 'Category Master'
                : activeView === 'admins'
                ? 'Admin Create Master'
                : selectedAdminForCard
                ? `Card Forge: ${selectedAdminForCard.fullname || selectedAdminForCard.user?.fullname || 'Admin'}`
                : 'Digital Card Forge'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeView === 'card-builder' && (
              <button
                type="button"
                onClick={() => handleSelectView('admins')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
              >
                <span>←</span>
                <span>Back to Admins</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all shadow-2xs shrink-0"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {activeView === 'categories' && (
          <div className="max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 flex-1">
            <CategoryMaster />
          </div>
        )}
        {activeView === 'admins' && (
          <div className="max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 flex-1">
            <CreateAdmin onOpenCardForge={handleOpenCardForge} />
          </div>
        )}
        {activeView === 'card-builder' && (
          <div className="w-full flex-1">
            <SuperAdminCardForge
              selectedAdmin={selectedAdminForCard}
              onBackToAdmins={() => setActiveView('admins')}
              onSignOut={onSignOut}
            />
          </div>
        )}
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
      setIsFullCardModalOpen(true);
    }, 450);
  };

  return (
    <div className={`text-[#0b1c30] flex flex-col font-sans overflow-x-hidden w-full max-w-full ${
      isInsideSuperAdmin ? 'bg-transparent' : 'min-h-screen bg-[#f8f9ff]'
    }`}>
      {!isInsideSuperAdmin && (
        <Header
          profile={profile}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectStep={handleSelectStep}
          onSignOut={onSignOut}
        />
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
      return parsed?.user?.role || parsed?.role || '';
    } catch { return ''; }
  });

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('token_key');
    setIsAuthenticated(false);
    setUserRole('');
    toast.success('Signed out successfully');
  };

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Signin onSuccess={(role) => { setIsAuthenticated(true); setUserRole(role || ''); }} />
      </>
    );
  }

  const isSuperAdmin = userRole?.trim().toUpperCase() === 'SUPERADMIN';

  return (
    <>
      <Toaster position="top-right" />
      {isSuperAdmin
        ? <SuperAdminPortal onSignOut={handleSignOut} />
        : <AdminCardBuilder onSignOut={handleSignOut} />
      }
    </>
  );
}

export default function App() {
  return (
    <AuthContextProvider>
      <QueryProvider>
        <AppContent />
      </QueryProvider>
    </AuthContextProvider>
  );
}
