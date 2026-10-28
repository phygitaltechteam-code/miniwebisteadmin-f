import React, { useState } from 'react';
import {
  X,
  Type,
  RotateCcw,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Italic,
  Underline,
  Strikethrough,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AVAILABLE_FONTS,
  FONT_WEIGHTS,
  TYPOGRAPHY_ELEMENTS,
  TypographySettings,
  ElementTypographyStyle,
  defaultTypographySettings,
} from '../types/typography';

interface TypographyCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: TypographySettings;
  onApplySettings: (settings: TypographySettings) => void;
}

export const TypographyCustomizerModal: React.FC<TypographyCustomizerModalProps> = ({
  isOpen,
  onClose,
  settings = defaultTypographySettings,
  onApplySettings,
}) => {
  const [currentSettings, setCurrentSettings] = useState<TypographySettings>(() => ({
    ...defaultTypographySettings,
    ...settings,
    elements: { ...(settings?.elements || {}) },
  }));

  const [selectedTarget, setSelectedTarget] = useState<string>('global');

  if (!isOpen) return null;

  // Active element configuration if target is specific element
  const activeElementConfig = TYPOGRAPHY_ELEMENTS.find((el) => el.id === selectedTarget);

  // Active values for current target (either specific override or global fallback)
  const isGlobal = selectedTarget === 'global';
  const targetOverride: ElementTypographyStyle = (!isGlobal && currentSettings.elements[selectedTarget]) || {};

  const activeFontFamily = targetOverride.fontFamily || currentSettings.primaryFont;
  const activeFontSize = targetOverride.fontSize || (activeElementConfig ? activeElementConfig.defaultSize : 16);
  const activeFontWeight = targetOverride.fontWeight || currentSettings.globalFontWeight;
  const activeTextAlign = targetOverride.textAlign || currentSettings.globalTextAlign;
  const activeFontStyle = targetOverride.fontStyle || currentSettings.globalFontStyle;
  const activeTextDecoration = targetOverride.textDecoration || currentSettings.globalTextDecoration;
  const activeTextTransform = targetOverride.textTransform || currentSettings.globalTextTransform;
  const activeLineHeight = targetOverride.lineHeight !== undefined ? targetOverride.lineHeight : currentSettings.globalLineHeight;
  const activeLetterSpacing = targetOverride.letterSpacing !== undefined ? targetOverride.letterSpacing : currentSettings.globalLetterSpacing;
  const activeColor = targetOverride.color || currentSettings.globalColor || '#212121';
  const activeBgColor = targetOverride.backgroundColor || currentSettings.globalBackgroundColor || 'transparent';

  // Handler to update setting for either global or selected element
  const handleUpdate = <K extends keyof ElementTypographyStyle>(key: K, value: ElementTypographyStyle[K]) => {
    if (isGlobal) {
      if (key === 'fontFamily') {
        setCurrentSettings((prev) => ({ ...prev, primaryFont: String(value) }));
      } else if (key === 'fontWeight') {
        setCurrentSettings((prev) => ({ ...prev, globalFontWeight: String(value) }));
      } else if (key === 'textAlign') {
        setCurrentSettings((prev) => ({ ...prev, globalTextAlign: value as any }));
      } else if (key === 'fontStyle') {
        setCurrentSettings((prev) => ({ ...prev, globalFontStyle: value as any }));
      } else if (key === 'textDecoration') {
        setCurrentSettings((prev) => ({ ...prev, globalTextDecoration: value as any }));
      } else if (key === 'textTransform') {
        setCurrentSettings((prev) => ({ ...prev, globalTextTransform: value as any }));
      } else if (key === 'lineHeight') {
        setCurrentSettings((prev) => ({ ...prev, globalLineHeight: Number(value) }));
      } else if (key === 'letterSpacing') {
        setCurrentSettings((prev) => ({ ...prev, globalLetterSpacing: Number(value) }));
      } else if (key === 'color') {
        setCurrentSettings((prev) => ({ ...prev, globalColor: String(value) }));
      } else if (key === 'backgroundColor') {
        setCurrentSettings((prev) => ({ ...prev, globalBackgroundColor: String(value) }));
      }
    } else {
      setCurrentSettings((prev) => ({
        ...prev,
        elements: {
          ...prev.elements,
          [selectedTarget]: {
            ...prev.elements[selectedTarget],
            [key]: value,
          },
        },
      }));
    }
  };

  const handleReset = () => {
    if (isGlobal) {
      setCurrentSettings({ ...defaultTypographySettings, elements: {} });
      toast.success('Reset all typography settings to defaults.');
    } else {
      const updatedElements = { ...currentSettings.elements };
      delete updatedElements[selectedTarget];
      setCurrentSettings((prev) => ({ ...prev, elements: updatedElements }));
      toast.success(`Reset ${activeElementConfig?.name} to inherit global styling.`);
    }
  };

  const handleApply = () => {
    onApplySettings(currentSettings);
    toast.success('Typography styling applied live across your digital card!');
    onClose();
  };

  // Compute CSS Style object for the preview
  const livePreviewStyle: React.CSSProperties = {
    fontFamily: activeFontFamily ? `'${activeFontFamily}', sans-serif` : undefined,
    fontSize: `${activeFontSize}px`,
    fontWeight: activeFontWeight,
    textAlign: activeTextAlign,
    fontStyle: activeFontStyle,
    textDecoration: activeTextDecoration,
    textTransform: activeTextTransform,
    lineHeight: activeLineHeight,
    letterSpacing: `${activeLetterSpacing}px`,
    color: activeColor,
    backgroundColor: activeBgColor === 'transparent' ? undefined : activeBgColor,
  };

  const colorPalette = [
    '#000000', '#212121', '#424242', '#616161', '#757575',
    '#2196F3', '#1976D2', '#0D47A1', '#00BCD4', '#009688',
    '#4CAF50', '#2E7D32', '#FF9800', '#F57C00', '#E91E63',
    '#D81B60', '#9C27B0', '#673AB7', '#F44336', '#FFFFFF',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 sm:p-4 backdrop-blur-xs font-['Roboto',Helvetica,Arial,sans-serif]">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[#E0E0E0] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#E0E0E0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2196F3]/10 text-[#2196F3] flex items-center justify-center shrink-0">
              <Type className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#000000DE]">
                Typography & Font Studio
              </h2>
              <p className="text-xs text-[#757575]">
                Customize fonts, sizes, weights, and text styling with live real-time preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#757575] hover:text-[#2196F3] flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              title="Reset styling"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[#757575] hover:text-black hover:bg-gray-100 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Target Scope Selection Bar */}
          <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#E0E0E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-[12px] font-bold text-[#000000DE] uppercase tracking-wide mb-1">
                Styling Target (Global or Specific Element)
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full h-9 px-3 rounded border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-medium focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none"
              >
                <option value="global">🌐 Global (Applies to all elements by default)</option>
                <optgroup label="Headings">
                  <option value="h1">Heading 1 (H1 • 32–48px)</option>
                  <option value="h2">Heading 2 (H2 • 28–36px)</option>
                  <option value="h3">Heading 3 (H3 • 24–30px)</option>
                  <option value="h4">Heading 4 (H4 • 20–24px)</option>
                  <option value="h5">Heading 5 (H5 • 18–20px)</option>
                  <option value="h6">Heading 6 (H6 • 16–18px)</option>
                  <option value="bannerHeading">Banner Heading (Hero H1 • 40–64px)</option>
                  <option value="sectionHeading">Section Heading (H2 • 28–40px)</option>
                  <option value="cardTitle">Card Title (H3 • 18–24px)</option>
                  <option value="footerHeading">Footer Heading (H4 • 16–20px)</option>
                </optgroup>
                <optgroup label="Body & Text">
                  <option value="p">Paragraph (P • 14–18px)</option>
                  <option value="small">Small Text (Small • 12–14px)</option>
                  <option value="extraSmall">Extra Small Text (Small • 10–12px)</option>
                  <option value="bannerDescription">Banner Description (Hero P • 16–22px)</option>
                  <option value="cardDescription">Card Description (P • 14–16px)</option>
                  <option value="footerText">Footer Text (P • 12–16px)</option>
                  <option value="testimonialText">Testimonial Text (P • 14–18px)</option>
                  <option value="imageCaption">Image Caption (Figcaption • 12–14px)</option>
                  <option value="copyrightText">Copyright Text (Small • 12–14px)</option>
                </optgroup>
                <optgroup label="UI & Navigation">
                  <option value="navLinks">Navigation Links (Nav • 14–18px)</option>
                  <option value="headerLogo">Header Logo Text (Logo • 20–32px)</option>
                  <option value="buttonText">Button Text (Button • 14–18px)</option>
                  <option value="formLabel">Form Label (Label • 14–16px)</option>
                  <option value="inputText">Input Text (Input • 14–16px)</option>
                  <option value="breadcrumb">Breadcrumb (Small • 12–14px)</option>
                  <option value="badgeText">Badge Text (Span • 11–14px)</option>
                  <option value="priceText">Price Text (Span • 18–32px)</option>
                  <option value="linkText">Link Text (A • 14–18px)</option>
                </optgroup>
              </select>
            </div>

            {/* Font Family Dropdown */}
            <div className="flex-1">
              <label className="block text-[12px] font-bold text-[#000000DE] uppercase tracking-wide mb-1">
                Font Family ({AVAILABLE_FONTS.length} Fonts)
              </label>
              <select
                value={activeFontFamily}
                onChange={(e) => handleUpdate('fontFamily', e.target.value)}
                className="w-full h-9 px-3 rounded border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-medium focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none"
              >
                {AVAILABLE_FONTS.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: `'${font}', sans-serif` }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Live Preview Sandbox Card */}
          <div className="rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#757575] pb-1 border-b border-[#E0E0E0]">
              <span className="font-bold flex items-center gap-1.5 text-[#000000DE]">
                <Sparkles className="w-3.5 h-3.5 text-[#2196F3]" />
                Live Preview: {isGlobal ? 'Global Typography' : activeElementConfig?.name}
              </span>
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#E0E0E0]">
                {activeFontFamily} • {activeFontSize}px • {activeFontWeight}
              </span>
            </div>

            {/* Preview Box with styles strictly applied */}
            <div className="p-4 rounded-lg bg-white border border-[#E0E0E0] min-h-[90px] flex items-center justify-center transition-all overflow-hidden">
              <div style={livePreviewStyle} className="transition-all max-w-full truncate px-2">
                {isGlobal
                  ? 'The quick brown fox jumps over the lazy dog. 1234567890'
                  : activeElementConfig?.tag === 'H1' || activeElementConfig?.id === 'bannerHeading'
                  ? 'Premier Architectural & Industrial Engineering Services'
                  : activeElementConfig?.tag === 'H2' || activeElementConfig?.id === 'sectionHeading'
                  ? 'Transforming Concepts Into High-Performance Digital Realities'
                  : activeElementConfig?.tag === 'Button'
                  ? 'Contact Us Today →'
                  : activeElementConfig?.id === 'priceText'
                  ? '₹14,999 / Annual Renewal'
                  : activeElementConfig?.id === 'badgeText'
                  ? 'Verified Official Partner'
                  : 'Delivering world-class digital cards, dynamic websites, and business transformation.'}
              </div>
            </div>
          </div>

          {/* Controls Two-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Size, Weights, Line Height, Letter Spacing */}
            <div className="p-3.5 rounded-lg border border-[#E0E0E0] bg-white space-y-3.5">
              {/* Font Size Slider */}
              <div>
                <div className="flex items-center justify-between text-[13px] font-medium text-[#000000DE] mb-1">
                  <span>Font Size</span>
                  <span className="font-mono text-[#2196F3] font-bold">{activeFontSize}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={activeElementConfig ? activeElementConfig.minSize : 10}
                    max={activeElementConfig ? activeElementConfig.maxSize : 64}
                    value={activeFontSize}
                    onChange={(e) => handleUpdate('fontSize', Number(e.target.value))}
                    className="flex-1 accent-[#2196F3] cursor-pointer"
                  />
                  <input
                    type="number"
                    value={activeFontSize}
                    onChange={(e) => handleUpdate('fontSize', Number(e.target.value))}
                    className="w-14 h-8 px-1 text-center font-mono rounded border border-[#C4C4C4] text-[13px] text-[#000000DE] focus:border-[#2196F3] outline-none"
                  />
                </div>
                {activeElementConfig && (
                  <p className="text-[11px] text-[#757575] mt-1">
                    Recommended standard range for {activeElementConfig.tag}: {activeElementConfig.minSize}px – {activeElementConfig.maxSize}px
                  </p>
                )}
              </div>

              {/* Font Weights (9 Weights from 100 to 900) */}
              <div>
                <label className="block text-[13px] font-medium text-[#000000DE] mb-1.5">
                  Font Weight (9 Values)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {FONT_WEIGHTS.map((w) => {
                    const isSelected = activeFontWeight === w.value;
                    return (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() => handleUpdate('fontWeight', w.value)}
                        className={`py-1.5 px-2 rounded text-[11px] transition-all flex items-center justify-between border ${
                          isSelected
                            ? 'bg-[#2196F3] text-white border-[#2196F3] font-bold shadow-xs'
                            : 'bg-white text-[#000000DE] border-[#C4C4C4] hover:bg-[#FAFAFA]'
                        }`}
                      >
                        <span style={{ fontWeight: Number(w.value) }}>{w.label}</span>
                        <span className="text-[9px] opacity-75">{w.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Line Height (1.0, 1.2, 1.5, 1.8, 2.0) */}
              <div>
                <div className="flex items-center justify-between text-[13px] font-medium text-[#000000DE] mb-1.5">
                  <span>Line Height</span>
                  <span className="font-mono text-[#2196F3] font-bold">{activeLineHeight}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1.0, 1.2, 1.5, 1.8, 2.0].map((lh) => (
                    <button
                      key={lh}
                      type="button"
                      onClick={() => handleUpdate('lineHeight', lh)}
                      className={`py-1 rounded text-xs font-mono font-medium border ${
                        activeLineHeight === lh
                          ? 'bg-[#2196F3] text-white border-[#2196F3]'
                          : 'bg-white text-[#000000DE] border-[#C4C4C4] hover:bg-[#FAFAFA]'
                      }`}
                    >
                      {lh.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Letter Spacing (-2px to 10px) */}
              <div>
                <div className="flex items-center justify-between text-[13px] font-medium text-[#000000DE] mb-1">
                  <span>Letter Spacing</span>
                  <span className="font-mono text-[#2196F3] font-bold">{activeLetterSpacing}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={-2}
                    max={10}
                    step={1}
                    value={activeLetterSpacing}
                    onChange={(e) => handleUpdate('letterSpacing', Number(e.target.value))}
                    className="flex-1 accent-[#2196F3] cursor-pointer"
                  />
                  <input
                    type="number"
                    min={-2}
                    max={10}
                    value={activeLetterSpacing}
                    onChange={(e) => handleUpdate('letterSpacing', Number(e.target.value))}
                    className="w-14 h-8 px-1 text-center font-mono rounded border border-[#C4C4C4] text-[13px] text-[#000000DE] focus:border-[#2196F3] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Alignment, Style, Decoration, Transform, Colors */}
            <div className="p-3.5 rounded-lg border border-[#E0E0E0] bg-white space-y-3.5">
              {/* Text Alignment (Left, Center, Right, Justify) */}
              <div>
                <label className="block text-[13px] font-medium text-[#000000DE] mb-1.5">
                  Text Alignment
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { align: 'left', label: 'Left', icon: AlignLeft },
                    { align: 'center', label: 'Center', icon: AlignCenter },
                    { align: 'right', label: 'Right', icon: AlignRight },
                    { align: 'justify', label: 'Justify', icon: AlignJustify },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = activeTextAlign === item.align;
                    return (
                      <button
                        key={item.align}
                        type="button"
                        onClick={() => handleUpdate('textAlign', item.align as any)}
                        className={`py-1.5 px-2 rounded text-xs flex items-center justify-center gap-1 border ${
                          isSelected
                            ? 'bg-[#2196F3] text-white border-[#2196F3] font-bold shadow-xs'
                            : 'bg-white text-[#000000DE] border-[#C4C4C4] hover:bg-[#FAFAFA]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Style & Decoration */}
              <div className="grid grid-cols-2 gap-3">
                {/* Font Style (Normal, Italic) */}
                <div>
                  <label className="block text-[12px] font-medium text-[#000000DE] mb-1">
                    Font Style
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdate('fontStyle', 'normal')}
                      className={`py-1 rounded text-xs border ${
                        activeFontStyle === 'normal'
                          ? 'bg-[#2196F3] text-white border-[#2196F3] font-bold'
                          : 'bg-white text-[#000000DE] border-[#C4C4C4]'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdate('fontStyle', 'italic')}
                      className={`py-1 rounded text-xs italic flex items-center justify-center gap-0.5 border ${
                        activeFontStyle === 'italic'
                          ? 'bg-[#2196F3] text-white border-[#2196F3] font-bold'
                          : 'bg-white text-[#000000DE] border-[#C4C4C4]'
                      }`}
                    >
                      <Italic className="w-3 h-3" />
                      <span>Italic</span>
                    </button>
                  </div>
                </div>

                {/* Text Decoration (None, Underline, Strikethrough) */}
                <div>
                  <label className="block text-[12px] font-medium text-[#000000DE] mb-1">
                    Decoration
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { val: 'none', label: 'None', icon: null },
                      { val: 'underline', label: 'U', icon: Underline },
                      { val: 'line-through', label: 'S', icon: Strikethrough },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => handleUpdate('textDecoration', item.val as any)}
                        className={`py-1 rounded text-[11px] font-medium border flex items-center justify-center ${
                          activeTextDecoration === item.val
                            ? 'bg-[#2196F3] text-white border-[#2196F3]'
                            : 'bg-white text-[#000000DE] border-[#C4C4C4]'
                        }`}
                        title={item.val}
                      >
                        {item.icon ? <item.icon className="w-3 h-3" /> : 'None'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text Transform (None, Uppercase, Lowercase, Capitalize) */}
              <div>
                <label className="block text-[13px] font-medium text-[#000000DE] mb-1.5">
                  Text Transform
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { val: 'none', label: 'None' },
                    { val: 'uppercase', label: 'UPPER' },
                    { val: 'lowercase', label: 'lower' },
                    { val: 'capitalize', label: 'Capital' },
                  ].map((tt) => (
                    <button
                      key={tt.val}
                      type="button"
                      onClick={() => handleUpdate('textTransform', tt.val as any)}
                      className={`py-1.5 px-1 rounded text-[11px] font-medium border text-center ${
                        activeTextTransform === tt.val
                          ? 'bg-[#2196F3] text-white border-[#2196F3] font-bold'
                          : 'bg-white text-[#000000DE] border-[#C4C4C4]'
                      }`}
                    >
                      {tt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color & Background Color Pickers */}
              <div className="space-y-2.5 pt-1 border-t border-[#E0E0E0]">
                {/* Text Color */}
                <div>
                  <div className="flex items-center justify-between text-[12px] font-medium text-[#000000DE] mb-1">
                    <span>Text Color</span>
                    <span className="font-mono text-xs font-bold">{activeColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeColor.startsWith('#') ? activeColor : '#212121'}
                      onChange={(e) => handleUpdate('color', e.target.value)}
                      className="w-8 h-8 rounded border border-[#C4C4C4] cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <div className="flex items-center gap-1 overflow-x-auto py-0.5 flex-1">
                      {colorPalette.slice(0, 10).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleUpdate('color', c)}
                          style={{ backgroundColor: c }}
                          className={`w-5 h-5 rounded-full border border-black/20 shrink-0 transition-transform ${
                            activeColor.toLowerCase() === c.toLowerCase() ? 'scale-125 ring-2 ring-[#2196F3]' : ''
                          }`}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Text Background Color */}
                <div>
                  <div className="flex items-center justify-between text-[12px] font-medium text-[#000000DE] mb-1">
                    <span>Text Background</span>
                    <span className="font-mono text-xs font-bold">{activeBgColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeBgColor.startsWith('#') ? activeBgColor : '#ffffff'}
                      onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                      className="w-8 h-8 rounded border border-[#C4C4C4] cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdate('backgroundColor', 'transparent')}
                      className={`px-2 py-1 rounded text-[11px] font-medium border ${
                        activeBgColor === 'transparent'
                          ? 'bg-[#2196F3] text-white border-[#2196F3]'
                          : 'bg-white text-[#757575] border-[#C4C4C4]'
                      }`}
                    >
                      Transparent
                    </button>
                    <div className="flex items-center gap-1 overflow-x-auto py-0.5 flex-1">
                      {colorPalette.slice(10, 18).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleUpdate('backgroundColor', c)}
                          style={{ backgroundColor: c }}
                          className={`w-5 h-5 rounded-full border border-black/20 shrink-0 transition-transform ${
                            activeBgColor.toLowerCase() === c.toLowerCase() ? 'scale-125 ring-2 ring-[#2196F3]' : ''
                          }`}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-4 sm:px-6 py-3 border-t border-[#E0E0E0] bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-[#757575]">
            Target: <strong className="text-[#000000DE]">{isGlobal ? 'Global Default' : activeElementConfig?.name}</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded border border-[#C4C4C4] text-[13px] font-medium text-[#000000DE] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-1.5 rounded bg-[#2196F3] hover:bg-[#1E88E5] text-[13px] font-medium text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Typography</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypographyCustomizerModal;
