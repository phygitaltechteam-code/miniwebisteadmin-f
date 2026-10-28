import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Link2, List, ListOrdered,
  Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Underline, Strikethrough, RemoveFormatting,
  Sparkles, Minus, Plus, Check, ChevronDown
} from 'lucide-react';
import { AVAILABLE_FONTS, TypographySettings } from '../../types/typography';

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
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const initialFont = typography?.elements?.p?.fontFamily || typography?.primaryFont || 'Roboto';
  const initialSize = typography?.elements?.p?.fontSize || 15;
  const initialColor = typography?.elements?.p?.color || typography?.globalColor || '#091426';

  const [currentHeading, setCurrentHeading] = useState<'Paragraph' | 'Heading 1' | 'Heading 2' | 'Heading 3'>('Paragraph');
  // Base style of the whole editor; kept separate from the toolbar state below so styling a
  // selection never restyles the entire text
  const [baseStyle, setBaseStyle] = useState({ font: initialFont, size: initialSize, color: initialColor });
  // Toolbar display state: reflects the current selection
  const [currentFont, setCurrentFont] = useState<string>(initialFont);
  const [fontSize, setFontSize] = useState<number>(initialSize);
  const [textColor, setTextColor] = useState<string>(initialColor);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const isInternalUpdate = useRef(false);

  // Sync incoming value to contentEditable div
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  // Track active selection in contentEditable
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        if (!sel.isCollapsed) {
          savedSelection.current = range.cloneRange();
          setSelectedText(sel.toString().trim());
        } else if (document.activeElement === editorRef.current) {
          savedSelection.current = range.cloneRange();
          setSelectedText('');
        }

        // Detect current format if element has inline styles
        const parentEl = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? (range.commonAncestorContainer as HTMLElement)
          : range.commonAncestorContainer.parentElement;

        if (parentEl) {
          // Keep the heading dropdown in sync with the block the cursor is in
          const block = parentEl.closest('h1, h2, h3, p');
          const blockTag = block && editorRef.current.contains(block) ? block.tagName : '';
          setCurrentHeading(
            blockTag === 'H1' ? 'Heading 1' : blockTag === 'H2' ? 'Heading 2' : blockTag === 'H3' ? 'Heading 3' : 'Paragraph'
          );

          const computed = window.getComputedStyle(parentEl);
          if (computed.fontFamily) {
            const cleanFont = computed.fontFamily.replace(/["']/g, '').split(',')[0].trim();
            if (AVAILABLE_FONTS.includes(cleanFont as any)) {
              setCurrentFont(cleanFont);
            }
          }
          if (computed.fontSize) {
            const pxVal = parseInt(computed.fontSize, 10);
            if (!isNaN(pxVal) && pxVal >= 10 && pxVal <= 48) {
              setFontSize(pxVal);
            }
          }
          if (computed.color) {
            setTextColor(computed.color);
          }
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Close color picker popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync typography prop changes into editor default base styling
  useEffect(() => {
    if (typography) {
      const font = typography.elements?.p?.fontFamily || typography.primaryFont || 'Roboto';
      const size = typography.elements?.p?.fontSize || 15;
      const color = typography.elements?.p?.color || typography.globalColor || '#091426';

      setBaseStyle({ font, size, color });
      setCurrentFont(font);
      setFontSize(size);
      setTextColor(color);
    }
  }, [typography]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  }, [onChange]);

  // Restore user's selection before applying toolbar actions
  const restoreSelection = useCallback(() => {
    if (savedSelection.current && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelection.current);
      }
    }
  }, []);

  // Standard execCommand with selection retention
  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    restoreSelection();
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  // Helper: Apply inline style strictly to selected text without nesting conflicts
  const applyInlineStyleToSelection = (styles: Record<string, string>): boolean => {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return false;
    }

    const range = selection.getRangeAt(0);
    if (!editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) {
      return false;
    }

    try {
      const fragment = range.extractContents();

      // Clean conflicting styles from child elements inside the fragment
      const cleanChildNodes = (parent: Node) => {
        parent.childNodes.forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            Object.keys(styles).forEach((prop) => {
              el.style?.removeProperty(prop);
            });
            if (el.tagName === 'FONT') {
              if (styles['font-family']) el.removeAttribute('face');
              if (styles['color']) el.removeAttribute('color');
              if (styles['font-size']) el.removeAttribute('size');
            }
            cleanChildNodes(child);
          }
        });
      };

      let targetNode: HTMLElement;
      if (
        fragment.childNodes.length === 1 &&
        fragment.firstChild?.nodeType === Node.ELEMENT_NODE &&
        (fragment.firstChild as HTMLElement).tagName === 'SPAN'
      ) {
        // Merge styles directly onto existing span without nesting
        targetNode = fragment.firstChild as HTMLElement;
        Object.entries(styles).forEach(([prop, val]) => {
          targetNode.style.setProperty(prop, val);
        });
      } else {
        // Create new span, clean conflicting nested styles, and insert
        targetNode = document.createElement('span');
        Object.entries(styles).forEach(([prop, val]) => {
          targetNode.style.setProperty(prop, val);
        });
        cleanChildNodes(fragment);
        targetNode.appendChild(fragment);
      }

      range.insertNode(targetNode);

      // Keep selection around newly styled text
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(targetNode);
      selection.addRange(newRange);
      savedSelection.current = newRange.cloneRange();
      setSelectedText(selection.toString().trim());

      handleInput();
      return true;
    } catch (err) {
      console.warn('Could not apply inline style to selection:', err);
      return false;
    }
  };

  // Returns the active non-collapsed selection range inside the editor, or null
  const getSelectedRange = (): Range | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !editorRef.current) return null;
    const range = sel.getRangeAt(0);
    return editorRef.current.contains(range.commonAncestorContainer) ? range : null;
  };

  // Split `container` around `range`: the part before stays in `container`, the selected part is returned,
  // and the part after is moved into a shallow clone of `container` placed right after it.
  const splitAroundSelection = (range: Range, container: HTMLElement): DocumentFragment => {
    const afterRange = document.createRange();
    afterRange.setStart(range.endContainer, range.endOffset);
    afterRange.setEnd(container, container.childNodes.length);
    const afterFrag = afterRange.extractContents();
    const middleFrag = range.extractContents();

    if (afterFrag.textContent?.trim()) {
      const afterEl = container.cloneNode(false) as HTMLElement;
      afterEl.appendChild(afterFrag);
      container.after(afterEl);
    }
    return middleFrag;
  };

  // Insert `node` where the selection was (after `container` when it was split), select it, and save
  const placeAndSelect = (node: HTMLElement, container: HTMLElement | null, range: Range) => {
    if (container) {
      container.after(node);
      if (!container.textContent?.trim()) container.remove();
    } else {
      range.insertNode(node);
    }
    const sel = window.getSelection();
    const newRange = document.createRange();
    newRange.selectNodeContents(node);
    sel?.removeAllRanges();
    sel?.addRange(newRange);
    savedSelection.current = newRange.cloneRange();
    handleInput();
  };

  // Turn only the selected text into its own block (heading, paragraph or list)
  const wrapSelectionInBlock = (build: (content: DocumentFragment) => HTMLElement): boolean => {
    restoreSelection();
    const range = getSelectedRange();
    if (!range || !editorRef.current) return false;

    const startEl = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? (range.startContainer as HTMLElement)
      : range.startContainer.parentElement;
    const block = startEl?.closest('p, h1, h2, h3, blockquote') as HTMLElement | null;
    const container = block && editorRef.current.contains(block) && block !== editorRef.current ? block : null;

    // Selection crossing into another block can't be split cleanly; let the browser handle it
    if (container && !container.contains(range.endContainer)) return false;

    const content = container ? splitAroundSelection(range, container) : range.extractContents();
    placeAndSelect(build(content), container, range);
    return true;
  };

  // Heading dropdown handler
  const setHeading = (heading: 'Paragraph' | 'Heading 1' | 'Heading 2' | 'Heading 3') => {
    restoreSelection();
    setCurrentHeading(heading);

    let tag = 'p';
    if (heading === 'Heading 1') tag = 'h1';
    if (heading === 'Heading 2') tag = 'h2';
    if (heading === 'Heading 3') tag = 'h3';

    if (editorRef.current) {
      editorRef.current.focus();
    }

    // With text selected, only that text becomes the heading
    const applied = wrapSelectionInBlock((content) => {
      const el = document.createElement(tag);
      el.appendChild(content);
      return el;
    });
    if (applied) return;

    try {
      const ok = document.execCommand('formatBlock', false, `<${tag}>`);
      if (!ok) {
        document.execCommand('formatBlock', false, tag);
      }
    } catch {
      document.execCommand('formatBlock', false, tag);
    }
    handleInput();
  };

  // Font Family: applies strictly to selected text
  const applyFontToSelection = (fontName: string) => {
    restoreSelection();
    setCurrentFont(fontName);

    const sel = window.getSelection();
    const hasSelection = (sel && sel.rangeCount > 0 && !sel.isCollapsed) || (savedSelection.current && !savedSelection.current.collapsed);

    if (hasSelection) {
      applyInlineStyleToSelection({ 'font-family': `'${fontName}', sans-serif` });
    } else {
      setBaseStyle((prev) => ({ ...prev, font: fontName }));
      if (onTypographyChange && typography) {
        onTypographyChange({
          ...typography,
          primaryFont: fontName as any,
          elements: {
            ...typography.elements,
            p: {
              ...typography.elements?.p,
              fontFamily: fontName,
            },
          },
        });
      }
    }
    handleInput();
  };

  // Font Size: applies strictly to selected text
  const applyFontSizeToSelection = (delta: number) => {
    restoreSelection();
    const newSize = Math.max(10, Math.min(48, fontSize + delta));
    setFontSize(newSize);

    const sel = window.getSelection();
    const hasSelection = (sel && sel.rangeCount > 0 && !sel.isCollapsed) || (savedSelection.current && !savedSelection.current.collapsed);

    if (hasSelection) {
      applyInlineStyleToSelection({
        'font-size': `${newSize}px`,
        'line-height': '1.3',
      });
    } else {
      setBaseStyle((prev) => ({ ...prev, size: newSize }));
    }
    handleInput();
  };

  // Text Color: applies strictly to selected text without focus loss
  const applyColorToSelection = (colorHex: string) => {
    restoreSelection();
    setTextColor(colorHex);
    setColorPickerOpen(false);

    const sel = window.getSelection();
    const hasSelection = (sel && sel.rangeCount > 0 && !sel.isCollapsed) || (savedSelection.current && !savedSelection.current.collapsed);

    if (hasSelection) {
      applyInlineStyleToSelection({ color: colorHex });
    } else {
      setBaseStyle((prev) => ({ ...prev, color: colorHex }));
    }
    handleInput();
  };

  // Bullet / numbered list: with text selected, only that text becomes the list
  const applyList = (ordered: boolean) => {
    const applied = wrapSelectionInBlock((content) => {
      const list = document.createElement(ordered ? 'ol' : 'ul');
      const li = document.createElement('li');
      li.appendChild(content);
      list.appendChild(li);
      return list;
    });
    if (!applied) executeCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const handleRemoveFormat = () => {
    restoreSelection();
    const range = getSelectedRange();
    if (range && editorRef.current) {
      const text = range.toString();

      // Find the outermost inline styling wrapper (span / b / i / font ...) around the selection
      const startEl = range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as HTMLElement)
        : range.startContainer.parentElement;
      let styled: HTMLElement | null = null;
      for (let el = startEl; el && el !== editorRef.current; el = el.parentElement) {
        if (/^(SPAN|B|STRONG|I|EM|U|S|STRIKE|FONT|A)$/.test(el.tagName)) styled = el;
        else break;
      }

      const plain = document.createElement('span');
      plain.textContent = text;
      if (styled && styled.contains(range.endContainer)) {
        // Lift the selected text out of the styled wrapper so it no longer inherits its styles
        splitAroundSelection(range, styled);
        placeAndSelect(plain, styled, range);
      } else {
        range.deleteContents();
        placeAndSelect(plain, null, range);
      }
      // Unwrap the helper span so plain text remains
      const textNode = document.createTextNode(text);
      plain.replaceWith(textNode);
      const sel = window.getSelection();
      const newRange = document.createRange();
      newRange.selectNodeContents(textNode);
      sel?.removeAllRanges();
      sel?.addRange(newRange);
      savedSelection.current = newRange.cloneRange();
      setSelectedText(text.trim());
    } else {
      executeCommand('removeFormat');
    }
    handleInput();
  };

  const handleInsertLink = () => {
    restoreSelection();
    const url = prompt('Enter destination link URL (https://...):');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  return (
    <div className={`w-full font-['Roboto',Helvetica,Arial,sans-serif] ${className}`}>
      {label && (
        <label className="block text-xs sm:text-[13px] font-bold text-[#091426] mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="border border-[#CBD5E1] rounded-lg overflow-hidden bg-white shadow-xs focus-within:border-[#2196F3] focus-within:ring-1 focus-within:ring-[#2196F3]/30 transition-all">
        {/* ─── Compact Responsive Toolbar (No Horizontal Scrollbar) ────────────────── */}
        <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5 flex flex-wrap items-center gap-1 sm:gap-1.5 text-gray-700 select-none">
          {/* 1. Heading Dropdown (Paragraph, H1, H2, H3) - Easy to handle, compact */}
          <div className="flex items-center shrink-0">
            <select
              value={currentHeading}
              onMouseDown={() => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) savedSelection.current = sel.getRangeAt(0).cloneRange();
              }}
              onChange={(e) => setHeading(e.target.value as any)}
              className="h-7 px-2 rounded border border-[#CBD5E1] bg-white text-xs font-semibold text-slate-800 focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none cursor-pointer shadow-2xs"
              title="Heading Style"
            >
              <option value="Paragraph">Paragraph</option>
              <option value="Heading 1">Heading 1 (H1)</option>
              <option value="Heading 2">Heading 2 (H2)</option>
              <option value="Heading 3">Heading 3 (H3)</option>
            </select>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5 shrink-0" />

          {/* 2. Font Family Dropdown */}
          <div className="flex items-center shrink-0">
            <select
              value={currentFont}
              onMouseDown={() => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) savedSelection.current = sel.getRangeAt(0).cloneRange();
              }}
              onChange={(e) => applyFontToSelection(e.target.value)}
              className="h-7 px-2 rounded border border-[#CBD5E1] bg-white text-xs font-semibold text-slate-800 focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none cursor-pointer shadow-2xs max-w-[110px] sm:max-w-[125px] truncate"
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
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyFontSizeToSelection(-1); }}
              className="px-1.5 h-full hover:bg-gray-100 text-gray-600 font-bold text-xs transition-colors rounded-l border-r border-gray-200 flex items-center justify-center"
              title="Decrease font size"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-1.5 text-xs font-mono font-bold text-[#2196F3] select-none min-w-[32px] text-center">
              {fontSize}px
            </span>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyFontSizeToSelection(1); }}
              className="px-1.5 h-full hover:bg-gray-100 text-gray-600 font-bold text-xs transition-colors rounded-r border-l border-gray-200 flex items-center justify-center"
              title="Increase font size"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5 shrink-0" />

          {/* 4. Text Styles: Bold, Italic, Underline */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('bold'); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 border border-transparent hover:border-gray-300 flex items-center justify-center font-black text-sm text-[#212121] transition-colors"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('italic'); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 border border-transparent hover:border-gray-300 flex items-center justify-center text-sm text-[#212121] transition-colors"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('underline'); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 border border-transparent hover:border-gray-300 flex items-center justify-center text-sm text-[#212121] transition-colors"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('strikeThrough'); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 border border-transparent hover:border-gray-300 flex items-center justify-center text-sm text-[#212121] transition-colors"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5 shrink-0" />

          {/* 5. Reliable Color Palette Popover (Fixes Color Not Applying) */}
          <div className="relative shrink-0" ref={colorPickerRef}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) savedSelection.current = sel.getRangeAt(0).cloneRange();
                setColorPickerOpen(!colorPickerOpen);
              }}
              className="h-7 px-2 rounded border border-[#CBD5E1] bg-white hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Text Color"
            >
              <span className="font-black text-xs" style={{ color: textColor }}>A</span>
              <span
                className="w-3 h-3 rounded-full border border-gray-400 shadow-2xs shrink-0"
                style={{ backgroundColor: textColor }}
              />
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
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyColorToSelection(c.hex);
                      }}
                      className="w-7 h-7 rounded-md border border-gray-200 hover:scale-110 transition-transform flex items-center justify-center relative shadow-2xs"
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {textColor === c.hex && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="pt-1.5 border-t border-gray-100 flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-500 font-medium">Custom:</span>
                  <input
                    type="color"
                    value={textColor}
                    onMouseDown={() => {
                      const sel = window.getSelection();
                      if (sel && sel.rangeCount > 0) savedSelection.current = sel.getRangeAt(0).cloneRange();
                    }}
                    onChange={(e) => applyColorToSelection(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-gray-600">{textColor}</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5 shrink-0" />

          {/* 6. Alignment Buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyLeft'); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 flex items-center justify-center text-gray-700 transition-colors"
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyCenter'); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 flex items-center justify-center text-gray-700 transition-colors"
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyRight'); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 flex items-center justify-center text-gray-700 transition-colors"
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyFull'); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 flex items-center justify-center text-gray-700 transition-colors"
              title="Justify"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-0.5 shrink-0" />

          {/* 7. Lists, Link, Quote, Clear Format */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyList(false); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 flex items-center justify-center text-gray-700 transition-colors"
              title="Bullet list"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyList(true); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 flex items-center justify-center text-gray-700 transition-colors"
              title="Numbered list"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleInsertLink(); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 flex items-center justify-center text-gray-700 transition-colors"
              title="Insert Link"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('formatBlock', '<blockquote>'); }}
              className="w-7 h-7 rounded hover:bg-gray-200/80 flex items-center justify-center text-gray-700 transition-colors"
              title="Quote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleRemoveFormat(); }}
              className="w-7 h-7 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 flex items-center justify-center transition-colors"
              title="Clear Format"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
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

        {/* ─── Content Editable Surface (Without 'prose' so Colors Apply Vividly) ──────────── */}
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
