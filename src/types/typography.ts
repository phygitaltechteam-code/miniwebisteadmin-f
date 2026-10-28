export const AVAILABLE_FONTS = [
  'Roboto',
  'Inter',
  'Arial',
  'Poppins',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Nunito',
  'Raleway',
  'Ubuntu',
  'Merriweather',
  'Georgia',
  'Times New Roman',
  'Playfair Display',
  'Oswald',
  'Source Sans 3',
  'Noto Sans',
  'Work Sans',
  'DM Sans',
  'PT Sans',
] as const;

export type AvailableFont = typeof AVAILABLE_FONTS[number];

export const FONT_WEIGHTS = [
  { label: 'Thin', value: '100' },
  { label: 'Extra Light', value: '200' },
  { label: 'Light', value: '300' },
  { label: 'Regular', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semi Bold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Extra Bold', value: '800' },
  { label: 'Black', value: '900' },
] as const;

export interface TypographyElementConfig {
  id: string;
  name: string;
  tag: string;
  minSize: number;
  maxSize: number;
  defaultSize: number;
}

export const TYPOGRAPHY_ELEMENTS: TypographyElementConfig[] = [
  { id: 'h1', name: 'Heading 1', tag: 'H1', minSize: 32, maxSize: 48, defaultSize: 36 },
  { id: 'h2', name: 'Heading 2', tag: 'H2', minSize: 28, maxSize: 36, defaultSize: 30 },
  { id: 'h3', name: 'Heading 3', tag: 'H3', minSize: 24, maxSize: 30, defaultSize: 24 },
  { id: 'h4', name: 'Heading 4', tag: 'H4', minSize: 20, maxSize: 24, defaultSize: 20 },
  { id: 'h5', name: 'Heading 5', tag: 'H5', minSize: 18, maxSize: 20, defaultSize: 18 },
  { id: 'h6', name: 'Heading 6', tag: 'H6', minSize: 16, maxSize: 18, defaultSize: 16 },
  { id: 'p', name: 'Paragraph', tag: 'P', minSize: 14, maxSize: 18, defaultSize: 15 },
  { id: 'small', name: 'Small Text', tag: 'Small', minSize: 12, maxSize: 14, defaultSize: 13 },
  { id: 'extraSmall', name: 'Extra Small Text', tag: 'Small', minSize: 10, maxSize: 12, defaultSize: 11 },
  { id: 'navLinks', name: 'Navigation Links', tag: 'Nav', minSize: 14, maxSize: 18, defaultSize: 14 },
  { id: 'headerLogo', name: 'Header Logo Text', tag: 'Logo', minSize: 20, maxSize: 32, defaultSize: 24 },
  { id: 'buttonText', name: 'Button Text', tag: 'Button', minSize: 14, maxSize: 18, defaultSize: 14 },
  { id: 'bannerHeading', name: 'Banner Heading', tag: 'Hero H1', minSize: 40, maxSize: 64, defaultSize: 48 },
  { id: 'bannerDescription', name: 'Banner Description', tag: 'Hero P', minSize: 16, maxSize: 22, defaultSize: 18 },
  { id: 'sectionHeading', name: 'Section Heading', tag: 'H2', minSize: 28, maxSize: 40, defaultSize: 32 },
  { id: 'cardTitle', name: 'Card Title', tag: 'H3', minSize: 18, maxSize: 24, defaultSize: 20 },
  { id: 'cardDescription', name: 'Card Description', tag: 'P', minSize: 14, maxSize: 16, defaultSize: 14 },
  { id: 'footerHeading', name: 'Footer Heading', tag: 'H4', minSize: 16, maxSize: 20, defaultSize: 18 },
  { id: 'footerText', name: 'Footer Text', tag: 'P', minSize: 12, maxSize: 16, defaultSize: 14 },
  { id: 'formLabel', name: 'Form Label', tag: 'Label', minSize: 14, maxSize: 16, defaultSize: 14 },
  { id: 'inputText', name: 'Input Text', tag: 'Input', minSize: 14, maxSize: 16, defaultSize: 14 },
  { id: 'testimonialText', name: 'Testimonial Text', tag: 'P', minSize: 14, maxSize: 18, defaultSize: 15 },
  { id: 'imageCaption', name: 'Image Caption', tag: 'Figcaption', minSize: 12, maxSize: 14, defaultSize: 12 },
  { id: 'breadcrumb', name: 'Breadcrumb', tag: 'Small', minSize: 12, maxSize: 14, defaultSize: 12 },
  { id: 'badgeText', name: 'Badge Text', tag: 'Span', minSize: 11, maxSize: 14, defaultSize: 12 },
  { id: 'priceText', name: 'Price Text', tag: 'Span', minSize: 18, maxSize: 32, defaultSize: 24 },
  { id: 'linkText', name: 'Link Text', tag: 'A', minSize: 14, maxSize: 18, defaultSize: 14 },
  { id: 'copyrightText', name: 'Copyright Text', tag: 'Small', minSize: 12, maxSize: 14, defaultSize: 12 },
];

export interface ElementTypographyStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  backgroundColor?: string;
}

export interface TypographySettings {
  primaryFont: string;
  secondaryFont: string;
  globalFontWeight: string;
  globalTextAlign: 'left' | 'center' | 'right' | 'justify';
  globalFontStyle: 'normal' | 'italic';
  globalTextDecoration: 'none' | 'underline' | 'line-through';
  globalTextTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  globalLineHeight: number;
  globalLetterSpacing: number;
  globalColor?: string;
  globalBackgroundColor?: string;
  elements: Record<string, ElementTypographyStyle>;
}

export const defaultTypographySettings: TypographySettings = {
  primaryFont: 'Roboto',
  secondaryFont: 'Inter',
  globalFontWeight: '400',
  globalTextAlign: 'left',
  globalFontStyle: 'normal',
  globalTextDecoration: 'none',
  globalTextTransform: 'none',
  globalLineHeight: 1.5,
  globalLetterSpacing: 0,
  globalColor: '#212121',
  globalBackgroundColor: 'transparent',
  elements: {},
};

/**
 * Computes CSS properties from TypographySettings for either the root container
 * or a specific typography element (e.g., bannerHeading, sectionHeading, cardTitle, etc.)
 */
export function getComputedTypographyStyle(
  settings?: TypographySettings,
  elementId?: string
): React.CSSProperties {
  if (!settings) return {};

  const elStyle = elementId ? settings.elements?.[elementId] : undefined;

  const fontFamily = elStyle?.fontFamily || (elementId ? undefined : settings.primaryFont) || settings.primaryFont;
  const fontWeight = elStyle?.fontWeight || (elementId ? undefined : settings.globalFontWeight);
  const textAlign = elStyle?.textAlign || (elementId ? undefined : settings.globalTextAlign);
  const fontStyle = elStyle?.fontStyle || (elementId ? undefined : settings.globalFontStyle);
  const textDecoration = elStyle?.textDecoration || (elementId ? undefined : settings.globalTextDecoration);
  const textTransform = elStyle?.textTransform || (elementId ? undefined : settings.globalTextTransform);
  const lineHeight = elStyle?.lineHeight ?? (elementId ? undefined : settings.globalLineHeight);
  const letterSpacing = elStyle?.letterSpacing ?? (elementId ? undefined : settings.globalLetterSpacing);
  const color = elStyle?.color || (elementId ? undefined : (settings.globalColor && settings.globalColor !== '#212121' ? settings.globalColor : undefined));
  const backgroundColor = elStyle?.backgroundColor && elStyle.backgroundColor !== 'transparent' ? elStyle.backgroundColor : undefined;
  const fontSize = elStyle?.fontSize;

  const style: React.CSSProperties = {};

  if (fontFamily) {
    style.fontFamily = `'${fontFamily}', sans-serif`;
  }
  if (fontWeight) {
    style.fontWeight = fontWeight as any;
  }
  if (fontSize) {
    style.fontSize = `${fontSize}px`;
  }
  if (textAlign) {
    style.textAlign = textAlign;
  }
  if (fontStyle && fontStyle !== 'normal') {
    style.fontStyle = fontStyle;
  }
  if (textDecoration && textDecoration !== 'none') {
    style.textDecoration = textDecoration;
  }
  if (textTransform && textTransform !== 'none') {
    style.textTransform = textTransform;
  }
  if (lineHeight !== undefined) {
    style.lineHeight = lineHeight;
  }
  if (letterSpacing !== undefined && letterSpacing !== 0) {
    style.letterSpacing = `${letterSpacing}px`;
  }
  if (color) {
    style.color = color;
  }
  if (backgroundColor) {
    style.backgroundColor = backgroundColor;
  }

  return style;
}

