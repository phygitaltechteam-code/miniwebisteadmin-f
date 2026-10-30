import React from 'react';
import { Home, Building2, Tag, Receipt, CreditCard, Menu } from 'lucide-react';
import { SuperAdminView } from './SuperAdminSidebar';

interface MobileBottomNavProps {
  currentView: SuperAdminView;
  onSelectView: (view: SuperAdminView) => void;
  onOpenSidebar: () => void;
  isFranchise?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  onOpenSidebar,
  isFranchise = false,
}) => {
  const secondaryView: SuperAdminView = isFranchise ? 'billing' : 'categories';
  const secondaryLabel = isFranchise ? 'Billing Report' : 'Categories';
  const SecondaryIcon = isFranchise ? Receipt : Tag;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E0E0E0] shadow-[0_-3px_12px_rgba(0,0,0,0.06)] px-2 py-1 select-none font-['Roboto',Helvetica,Arial,sans-serif]"
    >
      <div className="flex items-center justify-around relative">
        {/* 1. Businesses */}
        <button
          type="button"
          onClick={() => onSelectView('admins')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentView === 'admins' ? 'text-[#2196F3]' : 'text-[#757575] hover:text-[#2196F3]'
          }`}
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Businesses</span>
        </button>

        {/* 2. Categories / Billing */}
        <button
          type="button"
          onClick={() => onSelectView(secondaryView)}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentView === secondaryView ? 'text-[#2196F3]' : 'text-[#757575] hover:text-[#2196F3]'
          }`}
        >
          <SecondaryIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">{secondaryLabel}</span>
        </button>

        {/* 3. HOME IN THE MIDDLE (Prominent, raised circular button) */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-5 relative z-10">
          <button
            type="button"
            onClick={() => onSelectView('home')}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all border-2 border-white ${
              currentView === 'home'
                ? 'bg-[#2196F3] text-white shadow-[#2196F3]/40 ring-2 ring-[#2196F3]/30'
                : 'bg-[#2196F3] hover:bg-[#1E88E5] text-white'
            }`}
            title="Go to Home Dashboard"
            aria-label="Home Dashboard"
          >
            <Home className="w-6 h-6 stroke-[2.2]" />
          </button>
          <span
            className={`text-[10px] font-bold mt-0.5 tracking-tight ${
              currentView === 'home' ? 'text-[#2196F3]' : 'text-[#757575]'
            }`}
          >
            Home
          </span>
        </div>

        {/* 4. Card Forge */}
        <button
          type="button"
          onClick={() => onSelectView('card-builder')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentView === 'card-builder' ? 'text-[#2196F3]' : 'text-[#757575] hover:text-[#2196F3]'
          }`}
        >
          <CreditCard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Card Forge</span>
        </button>

        {/* 5. Menu Bar for Sidebar */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex-1 flex flex-col items-center justify-center py-1 text-[#757575] hover:text-[#2196F3] transition-colors"
          title="Open Menu Sidebar"
          aria-label="Open Sidebar Menu"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
