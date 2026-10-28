import React, { useEffect, useState } from 'react';
import { X, Check, Palette, Loader2 } from 'lucide-react';
import { PORTAL_THEMES, PortalThemeId, getPortalTheme } from '@/types/theme';

interface SelectThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: string;
  /** Applies the theme (preview + API). Return false or throw to keep the popup open. */
  onSelectTheme: (themeId: string) => void | boolean | Promise<void | boolean>;
  onOpenTypography?: () => void;
}

// The four card themes offered here (Orange, Violet, Blue, Green); ids are the ones the preview understands
const THEME_CHOICES: PortalThemeId[] = ['navy-orange', 'violet-white', 'sapphire-cyan', 'emerald-obsidian'];

/** "#07162C + #F97316" -> ['#07162C', '#F97316'] */
const themeColors = (id: PortalThemeId): [string, string] => {
  const [primary, accent] = PORTAL_THEMES[id].colorCombination.split('+').map((c) => c.trim());
  return [primary || '#07162C', accent || '#F97316'];
};

export const SelectThemeModal: React.FC<SelectThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  onOpenTypography,
}) => {
  // Map any saved/legacy theme value onto one of the offered themes
  const resolveTheme = (val?: string): PortalThemeId => {
    const id = getPortalTheme(val).id;
    return THEME_CHOICES.includes(id) ? id : THEME_CHOICES[0];
  };

  const [selectedTheme, setSelectedTheme] = useState<PortalThemeId>(() => resolveTheme(currentTheme));
  const [isSaving, setIsSaving] = useState(false);

  // Re-sync with the card's current theme every time the popup opens
  useEffect(() => {
    if (isOpen) setSelectedTheme(resolveTheme(currentTheme));
  }, [isOpen, currentTheme]);

  if (!isOpen) return null;

  const themes = THEME_CHOICES.map((id) => {
    const [primary, accent] = themeColors(id);
    return { id, name: PORTAL_THEMES[id].name, badge: PORTAL_THEMES[id].badge, primary, accent };
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await onSelectTheme(selectedTheme);
      if (result !== false) onClose();
    } catch {
      // caller reports the error; keep the popup open
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-['Roboto',Helvetica,Arial,sans-serif]">
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <h3 className="text-[18px] font-bold text-[#212121]">Select any theme</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[13px] text-gray-600 pt-2 pb-3">
          Click on template to select.
        </p>

        {/* Templates Grid — the four card themes, drawn in their real colors */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-4 gap-3.5 pb-3">
          {themes.map((th) => {
            const isSelected = selectedTheme === th.id;
            return (
              <div key={th.id} className="flex flex-col items-center">
                <div
                  onClick={() => setSelectedTheme(th.id)}
                  style={{ backgroundColor: th.primary }}
                  className={`w-full aspect-[9/16] rounded-md border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col p-2 select-none shadow-xs hover:shadow-md text-white ${
                    isSelected
                      ? 'border-gray-800 ring-2 ring-[#2196F3]'
                      : 'border-dashed border-gray-400 hover:border-gray-600'
                  }`}
                >
                  {/* Selected checkmark badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white text-gray-800 shadow-md flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  <div className="p-1.5 flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded border flex items-center justify-center text-[7px] font-bold bg-white/90 text-gray-800"
                      style={{ borderColor: th.accent }}
                    >
                      demo
                    </div>
                    <div className="leading-tight">
                      <div className="text-[8px] font-bold">Demo Company</div>
                      <div className="text-[6px]" style={{ color: th.accent }}>Mr. Demo Name</div>
                    </div>
                  </div>

                  {/* Rows mockup in the accent color */}
                  <div className="space-y-1 mt-1 flex-1">
                    {[10, 12, 14].map((w) => (
                      <div key={w} className="h-3 rounded bg-white/10 border border-white/10 px-1 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: th.accent }} />
                        <div className="h-1 bg-white/40 rounded" style={{ width: `${w * 4}px` }} />
                      </div>
                    ))}
                    <div className="mt-1.5 h-3.5 rounded text-[6px] font-bold flex items-center justify-center" style={{ backgroundColor: th.accent }}>
                      Contact
                    </div>
                  </div>

                  {/* Bottom Nav mock */}
                  <div className="pt-1 border-t border-white/10 flex justify-around text-[6px] opacity-70">
                    <span style={{ color: th.accent }}>Home</span>
                    <span>Links</span>
                    <span>About</span>
                    <span>Product</span>
                  </div>
                </div>

                <span className="mt-1.5 text-[11px] font-semibold text-[#212121] text-center leading-tight">{th.badge}</span>

                {/* Pink COLOR button under the selected theme (Image 1) */}
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenTypography) {
                        onClose();
                        onOpenTypography();
                      }
                    }}
                    className="mt-2 flex items-center justify-center gap-1.5 rounded bg-[#e91e63] hover:bg-[#d81b60] text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm transition-all"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>COLOR & FONTS</span>
                  </button>
                )}

              </div>
            );
          })}
        </div>

        {/* Footer Buttons (Image 1) */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-[13px] font-bold text-[#2196F3] hover:text-[#1976D2] uppercase tracking-wide transition-colors"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded bg-[#2196F3] hover:bg-[#1E88E5] px-6 py-1.5 text-[13px] font-bold text-white uppercase tracking-wide shadow-xs transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSaving ? 'SAVING...' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectThemeModal;
