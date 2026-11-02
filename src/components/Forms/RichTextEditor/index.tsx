import React from 'react';
import { TypographySettings } from '@/types/typography';
import { useRichTextEditor } from './useRichTextEditor';
import { Toolbar } from './Toolbar';

export interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  required?: boolean;
  typography?: TypographySettings;
  onTypographyChange?: (settings: TypographySettings) => void;
}

/** contentEditable rich text editor with formatting toolbar; value / onChange carry HTML */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label = 'About us text',
  value,
  onChange,
  placeholder = 'Write here...',
  minHeight = '140px',
  className = '',
  required = false,
  typography,
  onTypographyChange,
}) => {
  const e = useRichTextEditor(value, onChange, typography, onTypographyChange);
  const { editorRef, baseStyle, handleInput } = e;

  return (
    <div className={`w-full font-['Roboto',Helvetica,Arial,sans-serif] ${className}`}>
      {label && (
        <label className="block text-xs sm:text-[13px] font-bold text-[#091426] mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="border border-[#CBD5E1] rounded-lg overflow-hidden bg-white shadow-xs focus-within:border-[#2196F3] focus-within:ring-1 focus-within:ring-[#2196F3]/30 transition-all">
        <Toolbar e={e} />

        {/* Content editable surface (without 'prose' so colours apply vividly) */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          style={{
            minHeight,
            fontFamily: `'${baseStyle.font}', sans-serif`,
            fontSize: `${baseStyle.size}px`,
            lineHeight: typography?.elements?.p?.lineHeight ?? typography?.globalLineHeight ?? 1.6,
            color: baseStyle.color,
            letterSpacing: typography?.elements?.p?.letterSpacing ? `${typography.elements.p.letterSpacing}px` : undefined,
          }}
          className="w-full p-3 sm:p-3.5 leading-relaxed focus:outline-none overflow-y-auto max-h-[360px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none transition-all [&_h1]:font-black [&_h1]:text-2xl [&_h1]:mb-2 [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mb-1.5 [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mb-1 [&_p]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600"
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
