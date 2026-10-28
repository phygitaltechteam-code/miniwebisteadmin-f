import React, { useState } from 'react';
import { X, Check, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

interface SelectThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: string;
  onSelectTheme: (themeId: string) => void;
  onOpenTypography?: () => void;
}

export const SelectThemeModal: React.FC<SelectThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme = 'theme_3',
  onSelectTheme,
  onOpenTypography,
}) => {

  const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme);

  if (!isOpen) return null;

  const themes = [
    {
      id: 'theme_1',
      name: 'Dark Wood Header',
      bgColor: 'bg-[#1e1e24]',
      headerImage: '🪵 Wood Header',
      textColor: 'text-white',
      accentColor: '#e91e63',
    },
    {
      id: 'theme_2',
      name: 'Light Cork Header',
      bgColor: 'bg-[#f4f7f6]',
      headerImage: '🪵 Cork Header',
      textColor: 'text-[#212121]',
      accentColor: '#00bcd4',
    },
    {
      id: 'theme_3',
      name: 'Modern Soft Gray',
      bgColor: 'bg-[#eceff1]',
      headerImage: '',
      textColor: 'text-[#212121]',
      accentColor: '#e91e63',
    },
    {
      id: 'theme_4',
      name: 'Charcoal Minimal',
      bgColor: 'bg-[#18191a]',
      headerImage: '',
      textColor: 'text-white',
      accentColor: '#f44336',
    },
    {
      id: 'theme_5',
      name: 'Clean Lilac White',
      bgColor: 'bg-[#f8f7ff]',
      headerImage: '',
      textColor: 'text-[#212121]',
      accentColor: '#673ab7',
    },
    {
      id: 'theme_6',
      name: 'Royal Midnight Violet',
      bgColor: 'bg-[#120e24]',
      headerImage: '',
      textColor: 'text-white',
      accentColor: '#7c4dff',
    },
  ];

  const handleSave = () => {
    onSelectTheme(selectedTheme);
    toast.success('Theme applied successfully!');
    onClose();
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

        {/* Scrollable Templates Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-3 gap-3.5 pb-3">
          {themes.map((th) => {
            const isSelected = selectedTheme === th.id;
            return (
              <div key={th.id} className="flex flex-col items-center">
                <div
                  onClick={() => setSelectedTheme(th.id)}
                  className={`w-full aspect-[9/16] rounded-md border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col p-2 select-none shadow-xs hover:shadow-md ${
                    isSelected
                      ? 'border-gray-800 ring-2 ring-[#2196F3]'
                      : 'border-dashed border-gray-400 hover:border-gray-600'
                  } ${th.bgColor}`}
                >
                  {/* Selected checkmark badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white text-gray-800 shadow-md flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  {/* Mock Phone Card Preview */}
                  {th.headerImage ? (
                    <div className="w-full h-8 bg-amber-800/40 rounded-t flex items-center justify-center text-[8px] text-amber-200">
                      {th.headerImage}
                    </div>
                  ) : null}

                  <div className="p-1.5 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded border border-gray-400/40 bg-white/80 flex items-center justify-center text-[7px] font-bold text-gray-800">
                      demo
                    </div>
                    <div className="leading-tight">
                      <div className={`text-[8px] font-bold ${th.textColor}`}>Demo Company</div>
                      <div className="text-[6px] text-gray-400">Mr. Demo Name</div>
                    </div>
                  </div>

                  {/* Rows mockup */}
                  <div className="space-y-1 mt-1 flex-1">
                    <div className="h-3 rounded bg-white/10 border border-white/10 px-1 flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60 mr-1" />
                      <div className="h-1 w-10 bg-current opacity-30 rounded" />
                    </div>
                    <div className="h-3 rounded bg-white/10 border border-white/10 px-1 flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60 mr-1" />
                      <div className="h-1 w-12 bg-current opacity-30 rounded" />
                    </div>
                    <div className="h-3 rounded bg-white/10 border border-white/10 px-1 flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60 mr-1" />
                      <div className="h-1 w-14 bg-current opacity-30 rounded" />
                    </div>
                  </div>

                  {/* Bottom Nav mock */}
                  <div className="pt-1 border-t border-white/10 flex justify-around text-[6px] opacity-60">
                    <span>Home</span>
                    <span>Links</span>
                    <span>About</span>
                    <span>Product</span>
                  </div>
                </div>

                {/* Pink COLOR button under the selected theme (Image 1) */}
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenTypography) {
                        onClose();
                        onOpenTypography();
                      } else {
                        toast.success('Color & typography customizer opened');
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
            className="rounded bg-[#2196F3] hover:bg-[#1E88E5] px-6 py-1.5 text-[13px] font-bold text-white uppercase tracking-wide shadow-xs transition-colors"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectThemeModal;
