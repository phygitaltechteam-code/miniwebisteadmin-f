import React from 'react';
import {
  Bold, Italic, Link2, List, ListOrdered,
  Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Underline, Strikethrough, RemoveFormatting,
  Sparkles, Minus, Plus, Check, ChevronDown,
} from 'lucide-react';
import { AVAILABLE_FONTS } from '@/types/typography';
import { RichTextEditorModel } from './useRichTextEditor';

const COLOR_PALETTE = [
  { label: 'Black', hex: '#091426' },
  { label: 'Slate', hex: '#475569' },
  { label: 'Blue', hex: '#2563EB' },
  { label: 'Indigo', hex: '#4F46E5' },
  { label: 'Sky', hex: '#0284C7' },
  { label: 'Emerald', hex: '#059669' },
  { label: 'Red', hex: '#DC2626' },
  { label: 'Orange', hex: '#EA580C' },
  { label: 'Amber', hex: '#D97706' },
  { label: 'Purple', hex: '#9333EA' },
];

const STYLE_BTN = 'w-7 h-7 rounded hover:bg-gray-200/80 border border-transparent hover:border-gray-300 flex items-center justify-center text-sm text-[#212121] transition-colors';
const PLAIN_BTN = 'w-7 h-7 rounded hover:bg-gray-200/80 flex items-center justify-center text-gray-700 transition-colors';
const SELECT_CLASS = 'h-7 px-2 rounded border border-[#CBD5E1] bg-white text-xs font-semibold text-slate-800 focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none cursor-pointer shadow-2xs';

/** Toolbar button that runs on mousedown so the editor keeps its selection */
const ToolButton: React.FC<{ title: string; className: string; onRun: () => void; children: React.ReactNode }> = ({ title, className, onRun, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onRun(); }}
    className={className}
    title={title}
  >
    {children}
  </button>
);

const Divider = () => <div className="h-4 w-px bg-gray-300 mx-0.5 shrink-0" />;

/** Text colour button with the palette / custom colour popover */
const ColorPicker: React.FC<{ e: RichTextEditorModel }> = ({ e }) => {
  const { colorPickerRef, textColor, colorPickerOpen, setColorPickerOpen, applyColorToSelection, saveSelection } = e;
  return (
    <div className="relative shrink-0" ref={colorPickerRef}>
      <button
        type="button"
        onMouseDown={(ev) => {
          ev.preventDefault();
          saveSelection();
          setColorPickerOpen(!colorPickerOpen);
        }}
        className="h-7 px-2 rounded border border-[#CBD5E1] bg-white hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-2xs"
        title="Text Color"
      >
        <span className="font-black text-xs" style={{ color: textColor }}>A</span>
        <span className="w-3 h-3 rounded-full border border-gray-400 shadow-2xs shrink-0" style={{ backgroundColor: textColor }} />
        <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
      </button>

      {colorPickerOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 p-2.5 bg-white rounded-lg shadow-xl border border-gray-200 w-48 space-y-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
            Select Text Color
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                type="button"
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  applyColorToSelection(c.hex);
                }}
                className="w-7 h-7 rounded-md border border-gray-200 hover:scale-110 transition-transform flex items-center justify-center relative shadow-2xs"
                style={{ backgroundColor: c.hex }}
                title={c.label}
              >
                {textColor === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow-xs" />}
              </button>
            ))}
          </div>
          <div className="pt-1.5 border-t border-gray-100 flex items-center gap-1.5">
            <span className="text-[11px] text-gray-500 font-medium">Custom:</span>
            <input
              type="color"
              value={textColor}
              onMouseDown={saveSelection}
              onChange={(ev) => applyColorToSelection(ev.target.value)}
              className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0 bg-transparent"
            />
            <span className="text-[10px] font-mono text-gray-600">{textColor}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/** Compact responsive toolbar: heading, font, size, styles, colour, alignment, lists, link, quote, clear */
export const Toolbar: React.FC<{ e: RichTextEditorModel }> = ({ e }) => {
  const { currentHeading, setHeading, currentFont, applyFontToSelection, fontSize, applyFontSizeToSelection, executeCommand, applyList, handleInsertLink, handleRemoveFormat, selectedText, saveSelection } = e;
  return (
    <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5 flex flex-wrap items-center gap-1 sm:gap-1.5 text-gray-700 select-none">
      {/* 1. Heading Dropdown (Paragraph, H1, H2, H3) */}
      <div className="flex items-center shrink-0">
        <select
          value={currentHeading}
          onMouseDown={saveSelection}
          onChange={(ev) => setHeading(ev.target.value as any)}
          className={SELECT_CLASS}
          title="Heading Style"
        >
          <option value="Paragraph">Paragraph</option>
          <option value="Heading 1">Heading 1 (H1)</option>
          <option value="Heading 2">Heading 2 (H2)</option>
          <option value="Heading 3">Heading 3 (H3)</option>
        </select>
      </div>

      <Divider />

      {/* 2. Font Family Dropdown */}
      <div className="flex items-center shrink-0">
        <select
          value={currentFont}
          onMouseDown={saveSelection}
          onChange={(ev) => applyFontToSelection(ev.target.value)}
          className={`${SELECT_CLASS} max-w-[110px] sm:max-w-[125px] truncate`}
          title="Font Family"
        >
          {AVAILABLE_FONTS.map((font) => (
            <option key={font} value={font} style={{ fontFamily: `'${font}', sans-serif` }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Font Size Stepper */}
      <div className="flex items-center border border-[#CBD5E1] rounded bg-white h-7 shrink-0 shadow-2xs">
        <ToolButton
          title="Decrease font size"
          onRun={() => applyFontSizeToSelection(-1)}
          className="px-1.5 h-full hover:bg-gray-100 text-gray-600 font-bold text-xs transition-colors rounded-l border-r border-gray-200 flex items-center justify-center"
        >
          <Minus className="w-3 h-3" />
        </ToolButton>
        <span className="px-1.5 text-xs font-mono font-bold text-[#2196F3] select-none min-w-[32px] text-center">
          {fontSize}px
        </span>
        <ToolButton
          title="Increase font size"
          onRun={() => applyFontSizeToSelection(1)}
          className="px-1.5 h-full hover:bg-gray-100 text-gray-600 font-bold text-xs transition-colors rounded-r border-l border-gray-200 flex items-center justify-center"
        >
          <Plus className="w-3 h-3" />
        </ToolButton>
      </div>

      <Divider />

      {/* 4. Text Styles: Bold, Italic, Underline, Strikethrough */}
      <div className="flex items-center gap-0.5 shrink-0">
        <ToolButton title="Bold (Ctrl+B)" onRun={() => executeCommand('bold')} className={`${STYLE_BTN} font-black`}>
          <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
        </ToolButton>
        <ToolButton title="Italic (Ctrl+I)" onRun={() => executeCommand('italic')} className={STYLE_BTN}>
          <Italic className="w-3.5 h-3.5 stroke-[2.2]" />
        </ToolButton>
        <ToolButton title="Underline (Ctrl+U)" onRun={() => executeCommand('underline')} className={STYLE_BTN}>
          <Underline className="w-3.5 h-3.5 stroke-[2.2]" />
        </ToolButton>
        <ToolButton title="Strikethrough" onRun={() => executeCommand('strikeThrough')} className={STYLE_BTN}>
          <Strikethrough className="w-3.5 h-3.5 stroke-[2.2]" />
        </ToolButton>
      </div>

      <Divider />

      {/* 5. Colour palette popover */}
      <ColorPicker e={e} />

      <Divider />

      {/* 6. Alignment Buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <ToolButton title="Align Left" onRun={() => executeCommand('justifyLeft')} className={PLAIN_BTN}>
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton title="Align Center" onRun={() => executeCommand('justifyCenter')} className={PLAIN_BTN}>
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton title="Align Right" onRun={() => executeCommand('justifyRight')} className={PLAIN_BTN}>
          <AlignRight className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton title="Justify" onRun={() => executeCommand('justifyFull')} className={PLAIN_BTN}>
          <AlignJustify className="w-3.5 h-3.5" />
        </ToolButton>
      </div>

      <Divider />

      {/* 7. Lists, Link, Quote, Clear Format */}
      <div className="flex items-center gap-0.5 shrink-0">
        <ToolButton title="Bullet list" onRun={() => applyList(false)} className={PLAIN_BTN}>
          <List className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton title="Numbered list" onRun={() => applyList(true)} className={PLAIN_BTN}>
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton title="Insert Link" onRun={handleInsertLink} className={PLAIN_BTN}>
          <Link2 className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton title="Quote" onRun={() => executeCommand('formatBlock', '<blockquote>')} className={PLAIN_BTN}>
          <Quote className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton
          title="Clear Format"
          onRun={handleRemoveFormat}
          className="w-7 h-7 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 flex items-center justify-center transition-colors"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </ToolButton>
      </div>

      {/* 8. Selection Status Indicator */}
      <div className="ml-auto shrink-0 pl-1">
        {selectedText ? (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 select-none shadow-2xs"
            title={`Selected: "${selectedText.slice(0, 30)}..."`}
          >
            <Check className="w-3 h-3 text-emerald-600" />
            <span>{selectedText.length} chars</span>
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 select-none"
            title="Select text to apply font, size or color"
          >
            <Sparkles className="w-2.5 h-2.5 text-blue-500" />
            <span>Select text</span>
          </span>
        )}
      </div>
    </div>
  );
};
