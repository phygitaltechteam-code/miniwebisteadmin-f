import { cardUrlFor } from '@/utils/cardUrl';
import React, { useState, useEffect } from 'react';
import { X, Copy, Smartphone, Monitor } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { PortalThemeId } from '../types/theme';
import { TemplateWebsitePreview, TEMPLATE_PALETTES, paletteForTheme } from './TemplateWebsitePreview';

// Card theme ids behind the four template colors: Orange, Violet, Blue, Green
const TEMPLATE_THEME_IDS: PortalThemeId[] = ['navy-orange', 'violet-white', 'sapphire-cyan', 'emerald-obsidian'];

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
  // Preview offers Mobile and Desktop only; a tablet request opens desktop
  const startMode = initialMode === 'tablet' ? 'desktop' : initialMode;
  const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>(startMode);
  const [activeTheme, setActiveTheme] = useState<PortalThemeId>(
    (profile.theme as PortalThemeId) || 'navy-orange',
  );

  useEffect(() => {
    if (profile.theme) {
      setActiveTheme((profile.theme as PortalThemeId) || 'navy-orange');
    }
  }, [profile.theme]);

  useEffect(() => {
    setViewMode(startMode);
  }, [startMode, isOpen]);

  // Close with the Esc key (the button title already promises it)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const compact = viewMode === 'mobile';

  const handleCopy = () => {
    const url = cardUrlFor(profile.vanityUrl);
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
        {/* Modal Top Control Bar (compact in Mobile view: the frame is only 420px wide whatever the screen size) */}
        <div className={`${compact ? 'px-2.5' : 'px-3 sm:px-6'} py-2 sm:py-2.5 border-b border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2 bg-slate-950 text-white shrink-0 min-w-0`}>
          {/* Left Title & Live Theme Status */}
          {!compact && (
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300 hidden md:inline shrink-0">
                Live Preview:
              </span>
              <span className="font-mono text-xs text-orange-400 truncate max-w-[90px] xs:max-w-[130px] sm:max-w-[200px]">
                /{profile.vanityUrl || 'business'}
              </span>
            </div>
          )}

          {/* Template color pills: Orange / Violet / Blue / Green (try colors in the preview; Change theme saves) */}
          {(
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900 p-0.5 sm:p-1 rounded-xl border border-slate-800 shrink-0">
              {TEMPLATE_THEME_IDS.map((thId) => {
                const pal = TEMPLATE_PALETTES[paletteForTheme(thId)];
                const isSelected = paletteForTheme(activeTheme) === paletteForTheme(thId);
                return (
                  <button
                    key={thId}
                    type="button"
                    onClick={() => {
                      setActiveTheme(thId);
                      onToast(`Preview color: ${pal.label}`);
                    }}
                    title={pal.label}
                    className={`${compact ? 'p-1.5' : 'p-1.5 sm:px-2.5 sm:py-1'} rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className={`${compact ? 'w-3 h-3' : 'w-3 h-3 sm:w-2 sm:h-2'} rounded-full`} style={{ backgroundColor: pal.primary }} />
                    <span className={compact ? 'hidden' : 'hidden lg:inline'}>{pal.label}</span>
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
              <span className={compact ? 'hidden' : 'hidden md:inline'}>Mobile</span>
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
              <span className={compact ? 'hidden' : 'hidden md:inline'}>Desktop</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className={`${compact ? 'p-1.5' : 'p-1.5 sm:px-3 sm:py-1.5'} rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-white font-medium flex items-center gap-1.5 transition-colors border border-slate-800 shrink-0`}
              title="Copy Link"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className={compact ? 'hidden' : 'hidden sm:inline'}>Copy Link</span>
            </button>
            <button
              onClick={onClose}
              className={`${compact ? 'p-1.5' : 'p-1.5 sm:p-2'} rounded-xl bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white transition-all shrink-0 flex items-center justify-center font-bold`}
              title="Close Preview (ESC)"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Website Page Preview */}
        <div className="flex-1 overflow-y-auto custom-scroll p-0 bg-slate-50">
          <TemplateWebsitePreview profile={profile} themeId={activeTheme} viewMode={viewMode} />
        </div>
      </div>
    </div>
  );
};
export default FullCardModal;
