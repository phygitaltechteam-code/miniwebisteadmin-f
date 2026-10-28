import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Briefcase,
  Users,
  Building2,
  Tag,
  Receipt,
  DollarSign,
  BarChart3,
  Image as ImageIcon,
  ReceiptText,
  LogOut,
  CreditCard,
} from 'lucide-react';

export type SuperAdminView =
  | 'home'
  | 'admins'
  | 'categories'
  | 'franchise'
  | 'billing'
  | 'pricing'
  | 'report'
  | 'greetings'
  | 'ai-ledger'
  | 'card-builder';

interface SuperAdminSidebarProps {
  currentView: SuperAdminView;
  onSelectView: (view: SuperAdminView) => void;
  onClose?: () => void;
  userRole?: string;
  onSignOut?: () => void;
}

interface NavItemConfig {
  id: SuperAdminView;
  label: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
}

const navItems: NavItemConfig[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
  },
  {
    id: 'admins',
    label: 'All Businesses',
    icon: Briefcase,
  },
  // Note: 'All Projects' intentionally omitted per user specification
  {
    id: 'franchise',
    label: 'Franchisee List',
    icon: Users,
    superAdminOnly: true,
  },
  {
    id: 'categories',
    label: 'Category Master',
    icon: Tag,
    superAdminOnly: true,
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: Receipt,
  },
  {
    id: 'pricing',
    label: 'Customer plans & pricing management',
    icon: DollarSign,
  },
  {
    id: 'report',
    label: 'Report',
    icon: BarChart3,
  },
  {
    id: 'greetings',
    label: 'Greetings Management',
    icon: ImageIcon,
  },
  {
    id: 'ai-ledger',
    label: 'AI Credit Ledger',
    icon: ReceiptText,
  },
];

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  currentView,
  onSelectView,
  onClose,
  userRole,
  onSignOut,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isFranchise = userRole?.trim().toUpperCase() === 'FRANCHISE';
  const visibleItems = navItems.filter((item) => !(isFranchise && item.superAdminOnly));

  const handleToggleCollapse = () => {
    if (onClose) {
      onClose();
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <aside
      className={`h-screen bg-white text-slate-800 flex flex-col border-r border-[#E0E0E0] shadow-none select-none transition-all duration-200 font-['Roboto',Helvetica,Arial,sans-serif] ${
        isCollapsed ? 'w-16' : 'w-64 sm:w-72'
      }`}
    >
      {/* Top Header - Matches the delicate "DIGI WEB CARD" logo with collapse arrow */}
      <div className="h-16 px-3 border-b border-[#E0E0E0] flex items-center justify-between shrink-0 bg-white">
        {/* Collapse / Close Chevron Button */}
        <button
          type="button"
          onClick={handleToggleCollapse}
          className="p-1 rounded text-[#616161] hover:text-black hover:bg-[#F5F5F5] transition-colors shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 stroke-[2]" />
          ) : (
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
          )}
        </button>

        {/* Brand Logo & Title (hidden when collapsed) */}
        {!isCollapsed && (
          <div className="flex-1 flex flex-col items-center justify-center pr-6">
            {/* Logo Icon (Thin stroked card badge with inner line) */}
            <div className="w-7 h-5 border-[1.5px] border-[#212121] rounded-xs flex flex-col justify-start p-[2px] bg-white">
              <div className="h-[2px] bg-[#212121] w-full rounded-xs"></div>
            </div>
            {/* Clean Brand Name */}
            <span className="text-[10px] font-bold tracking-[0.1em] text-[#212121] uppercase mt-1 leading-none">
              DIGI WEB CARD
            </span>
          </div>
        )}
      </div>

      {/* Navigation List - Delicate 1px border-b separator between items */}
      <nav className="flex-1 overflow-y-auto">
        {visibleItems.map(({ id, label, icon: Icon }) => {
          const active = currentView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onSelectView(id);
                if (onClose) onClose();
              }}
              title={label}
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-left border-b border-[#E0E0E0] transition-colors duration-150 font-['Roboto',Helvetica,Arial,sans-serif] ${
                active
                  ? 'bg-[#E3F2FD] text-[#1976D2] font-medium'
                  : 'text-[#212121] hover:bg-[#F5F5F5] font-normal'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon
                className={`w-[19px] h-[19px] shrink-0 transition-colors ${
                  active ? 'text-[#1976D2]' : 'text-[#616161]'
                }`}
              />
              {!isCollapsed && (
                <span className="text-[14px] leading-snug">
                  {label}
                </span>
              )}
            </button>
          );
        })}

        {/* Logout Row at bottom of list */}
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            title="Logout"
            className={`w-full flex items-center gap-3.5 px-4 py-3 text-left text-[#212121] hover:bg-rose-50 hover:text-rose-600 transition-colors duration-150 font-normal border-b border-[#E0E0E0] font-['Roboto',Helvetica,Arial,sans-serif] ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="w-[19px] h-[19px] text-[#616161] hover:text-rose-600 shrink-0" />
            {!isCollapsed && <span className="text-[14px]">Logout</span>}
          </button>
        )}
      </nav>

      {/* Bottom Horizontal Scroll Indicator Bar */}
      <div className="h-4 bg-[#F5F5F5] border-t border-[#E0E0E0] flex items-center justify-between px-1 shrink-0">
        <span className="text-[8px] text-[#9E9E9E] font-bold">◀</span>
        <div className="flex-1 mx-2 h-1 bg-[#BDBDBD] rounded-full"></div>
        <span className="text-[8px] text-[#9E9E9E] font-bold">▶</span>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
