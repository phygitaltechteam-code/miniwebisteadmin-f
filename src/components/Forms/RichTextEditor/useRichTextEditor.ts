import { useState, useRef, useEffect, useCallback } from 'react';
import { AVAILABLE_FONTS, TypographySettings } from '@/types/typography';

export type HeadingOption = 'Paragraph' | 'Heading 1' | 'Heading 2' | 'Heading 3';

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

/** State, selection tracking and every formatting command of the rich text editor */
export const useRichTextEditor = (
  value: string,
  onChange: (value: string) => void,
  typography?: TypographySettings,
  onTypographyChange?: (settings: TypographySettings) => void
) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const initialFont = typography?.elements?.p?.fontFamily || typography?.primaryFont || 'Roboto';
  const initialSize = typography?.elements?.p?.fontSize || 15;
  const initialColor = typography?.elements?.p?.color || typography?.globalColor || '#091426';

  const [currentHeading, setCurrentHeading] = useState<HeadingOption>('Paragraph');
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

  /** Remember the current selection (toolbar controls take focus away from the editor) */
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedSelection.current = sel.getRangeAt(0).cloneRange();
  };

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
  const setHeading = (heading: HeadingOption) => {
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

  /** True when there is selected text (live or saved) for font / size / colour to apply to */
  const hasActiveSelection = () => {
    const sel = window.getSelection();
    return (sel && sel.rangeCount > 0 && !sel.isCollapsed) || (savedSelection.current && !savedSelection.current.collapsed);
  };

  // Font Family: applies strictly to selected text
  const applyFontToSelection = (fontName: string) => {
    restoreSelection();
    setCurrentFont(fontName);

    if (hasActiveSelection()) {
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

    if (hasActiveSelection()) {
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

    if (hasActiveSelection()) {
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

  return {
    editorRef, colorPickerRef, baseStyle, handleInput, saveSelection,
    currentHeading, setHeading, currentFont, applyFontToSelection, fontSize, applyFontSizeToSelection,
    textColor, colorPickerOpen, setColorPickerOpen, applyColorToSelection,
    executeCommand, applyList, handleInsertLink, handleRemoveFormat, selectedText,
  };
};

export type RichTextEditorModel = ReturnType<typeof useRichTextEditor>;
