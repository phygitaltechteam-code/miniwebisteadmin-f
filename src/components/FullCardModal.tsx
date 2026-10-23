import React, { useState, useEffect } from 'react';
import { X, Copy, Smartphone, Tablet, Monitor } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { PortalThemeId, PORTAL_THEMES } from '../types/theme';
import { AdminWebsitePage } from './AdminWebsitePage';

interface FullCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  initialMode?: 'mobile' | 'tablet' | 'desktop';
  onToast: (msg: string) => void;
}

export const FullCardModal: React.FC<FullCardModalProps> = ({
  isOpen,
  onClose,
  profile,
  initialMode = 'desktop',
  onToast,
}) => {
  const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>(initialMode);
  const [activeTheme, setActiveTheme] = useState<PortalThemeId>(
    (profile.theme as PortalThemeId) || 'navy-orange',
  );

  useEffect(() => {
    if (profile.theme) {
      setActiveTheme((profile.theme as PortalThemeId) || 'navy-orange');
    }
  }, [profile.theme]);

  useEffect(() => {
    setViewMode(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const url = `https://digiwebcard.in/${profile.vanityUrl || 'business'}`;
    navigator.clipboard.writeText(url);
    onToast(`Copied portal link: ${url}`);
  };

  const modalContainerWidth = {
    mobile: 'max-w-[420px] w-full h-[94vh]',
    tablet: 'max-w-[768px] w-full h-[94vh]',
    desktop: 'max-w-[96vw] xl:max-w-[1400px] h-[95vh]',
  }[viewMode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Mobile Floating Cross Button */}
      <button
        onClick={onClose}
        className="fixed top-3 right-3 sm:hidden z-60 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-xl border border-white/20 transition-all"
        title="Close Preview (ESC)"
        aria-label="Close Preview"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <div
        className={`bg-white w-full ${modalContainerWidth} rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700 relative animate-in zoom-in-95 duration-200 transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar */}
        <div className="px-3 sm:px-6 py-2 sm:py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950 text-white shrink-0 min-w-0">
          {/* Left Title & Live Theme Status */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-300 hidden md:inline shrink-0">
              Live Preview:
            </span>
            <span className="font-mono text-xs text-orange-400 truncate max-w-[90px] xs:max-w-[130px] sm:max-w-[200px]">
              /{profile.vanityUrl || 'business'}
            </span>
          </div>

          {/* 4 Two-Color Combination Themes Pills (Shown on Tablet & Desktop preview, hidden in mobile view to prevent overflowing the 420px frame) */}
          {viewMode !== 'mobile' && (
            <div className="hidden md:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
              {(Object.keys(PORTAL_THEMES) as PortalThemeId[]).map((thId) => {
                const th = PORTAL_THEMES[thId];
                const isSelected = activeTheme === thId;
                return (
                  <button
                    key={thId}
                    type="button"
                    onClick={() => {
                      setActiveTheme(thId);
                      onToast(`Theme switched to ${th.name}`);
                    }}
                    title={`${th.name} (${th.colorCombination})`}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        thId === 'navy-orange'
                          ? 'bg-orange-500'
                          : thId === 'emerald-obsidian'
                          ? 'bg-emerald-500'
                          : thId === 'sapphire-cyan'
                          ? 'bg-sky-400'
                          : thId === 'violet-white'
                          ? 'bg-violet-500'
                          : 'bg-amber-400'
                      }`}
                    />
                    <span>{th.badge}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Device Responsive View Selectors (Mobile / Tab / Desktop) */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900 p-0.5 sm:p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'mobile'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mobile</span>
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'tablet'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tab</span>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'desktop'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Desktop</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-white font-medium flex items-center gap-1.5 transition-colors border border-slate-800 shrink-0"
              title="Copy Link"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy Link</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white transition-all shrink-0 flex items-center justify-center font-bold"
              title="Close Preview (ESC)"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Website Page Preview */}
        <div className="flex-1 overflow-y-auto custom-scroll p-0 bg-slate-50">
          <AdminWebsitePage
            profile={profile}
            themeOverride={activeTheme}
            onThemeChange={setActiveTheme}
            viewMode={viewMode}
          />
        </div>
      </div>
    </div>
  );
};
export default FullCardModal;
