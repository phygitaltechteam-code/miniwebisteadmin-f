import React from 'react';
import { Tag, UserPlus, ChevronRight, Shield, X } from 'lucide-react';

export type SuperAdminView = 'categories' | 'admins' | 'card-builder';

interface SuperAdminSidebarProps {
  currentView: SuperAdminView;
  onSelectView: (view: SuperAdminView) => void;
  onClose?: () => void;
}

const navItems = [
  {
    id: 'categories' as SuperAdminView,
    label: 'Category Master',
    subtitle: 'Categories & Types',
    tag: 'CRUD',
    icon: Tag,
  },
  {
    id: 'admins' as SuperAdminView,
    label: 'Admin Create Master',
    subtitle: 'Admin Accounts & Roles',
    tag: 'MANAGE',
    icon: UserPlus,
  },
];

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  currentView,
  onSelectView,
  onClose,
}) => {
  return (
    <aside className="w-64 sm:w-60 shrink-0 h-screen bg-white text-slate-800 flex flex-col border-r border-stroke shadow-xs overflow-hidden select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-stroke flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-md shadow-[#2563EB]/20 shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-[#091426] tracking-tight leading-none truncate">
              Super Admin
            </h2>
            <span className="text-[9px] font-bold tracking-wider text-[#2563EB] uppercase mt-0.5 block">
              MANAGEMENT PORTAL
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Section Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          CORE MASTERS
        </p>
      </div>

      {/* Navigation Items (No Scroll, tightly spaced) */}
      <nav className="px-2.5 py-1 space-y-1.5 flex-1">
        {navItems.map(({ id, label, subtitle, tag, icon: Icon }) => {
          const active = currentView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onSelectView(id);
                if (onClose) onClose();
              }}
              className={`w-full group flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 ${active
                  ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/25 font-bold'
                  : 'text-slate-600 hover:bg-blue-50/70 hover:text-[#2563EB] font-semibold'
                }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100/60 group-hover:text-[#2563EB]'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs truncate leading-tight">
                    {label}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default SuperAdminSidebar;
