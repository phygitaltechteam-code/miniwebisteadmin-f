import React from 'react';
import { Code, Save, Eye, Check } from 'lucide-react';
import { ProfileData } from '../types/profile';

interface FooterActionDockProps {
  profile: ProfileData;
  onExportJson: () => void;
  onPreviewFullCard: () => void;
  onSaveAll: () => void;
  isSaving: boolean;
}

export const FooterActionDock: React.FC<FooterActionDockProps> = ({
  profile,
  onExportJson,
  onPreviewFullCard,
  onSaveAll,
  isSaving,
}) => {
  return (
    <footer className="w-full h-16 bg-white border-t border-[#c5c6cd]/60 px-4 md:px-8 flex items-center justify-between fixed bottom-0 left-0 right-0 z-40 shadow-lg">
      {/* Left: Profile Identification & Ready Status */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#45474c] hidden sm:inline">
          Profile: <strong className="text-[#091426] font-bold">{profile.businessName}</strong>
        </span>
        <span className="text-[#c5c6cd] hidden sm:inline">•</span>
        <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
          {profile.products.length} Products Ready
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onExportJson}
          className="px-3 sm:px-4 py-2 rounded-xl border border-[#c5c6cd] bg-[#f8f9ff] text-[#091426] hover:bg-[#EFF6FF] text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Code className="w-4 h-4 text-[#2563EB]" />
          <span className="hidden sm:inline">Export JSON</span>
          <span className="sm:hidden">Export</span>
        </button>

        <button
          type="button"
          onClick={onPreviewFullCard}
          className="px-3 sm:px-4 py-2 rounded-xl border border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Preview Full Card</span>
          <span className="sm:hidden">Preview</span>
        </button>

        <button
          type="button"
          onClick={onSaveAll}
          disabled={isSaving}
          className="px-4 sm:px-5 py-2 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-bold shadow-md transition-all active:scale-98 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save All Changes</span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
};
