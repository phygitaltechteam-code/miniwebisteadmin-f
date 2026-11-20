import { getPortalTheme } from '@/types/theme';

// ─── Color variants ─────────────────────────────────────────────────────────────
// Each card theme maps to one of four template palettes. Colors are applied through CSS variables,
// so the same markup renders in orange, violet, blue or green.
export type TemplatePaletteKey = 'orange' | 'violet' | 'blue' | 'green';

export interface TemplatePalette {
  label: string;
  primary: string; // buttons, headings accent, icons
  dark: string; // button hover
  soft: string; // light tinted backgrounds
  bannerFrom: string; // hero + footer gradient
  bannerTo: string;
}

export const TEMPLATE_PALETTES: Record<TemplatePaletteKey, TemplatePalette> = {
  orange: { label: 'Orange', primary: '#F97316', dark: '#EA580C', soft: '#FFF7ED', bannerFrom: '#07162C', bannerTo: '#123058' },
  violet: { label: 'Violet', primary: '#7C3AED', dark: '#6D28D9', soft: '#F5F3FF', bannerFrom: '#1A0A38', bannerTo: '#3B1773' },
  blue: { label: 'Blue', primary: '#0284C7', dark: '#0369A1', soft: '#F0F9FF', bannerFrom: '#07132B', bannerTo: '#0F2E5C' },
  green: { label: 'Green', primary: '#10B981', dark: '#059669', soft: '#ECFDF5', bannerFrom: '#061C18', bannerTo: '#0E3B30' },
};

/** Card theme id (navy-orange, violet-white, sapphire-cyan, emerald-obsidian, …) -> template palette */
export const paletteForTheme = (themeId?: string): TemplatePaletteKey => {
  const id = getPortalTheme(themeId).id;
  if (id === 'violet-white') return 'violet';
  if (id === 'sapphire-cyan') return 'blue';
  if (id === 'emerald-obsidian') return 'green';
  return 'orange';
};

// ─── Free colour themes ─────────────────────────────────────────────────────────
// The app can also save the theme as a hex colour (#RRGGBB, or #RGB); the palette is derived from it.
type Rgb = [number, number, number];

const HEX_THEME = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** True when the theme is a hex colour (#RRGGBB or #RGB) rather than a preset id */
export const isHexTheme = (theme?: string): theme is string => HEX_THEME.test(String(theme || '').trim());

const hexToRgb = (hex: string): Rgb => {
  let h = hex.trim().slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToHex = (rgb: Rgb): string =>
  '#' + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('').toUpperCase();

/** RGB (0-255) -> HSL (hue 0-360, saturation and lightness 0-1) */
const rgbToHsl = ([r, g, b]: Rgb): Rgb => {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [h * 60, s, l];
};

const hslToHex = (h: number, s: number, l: number): string => {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return rgbToHex([f(0), f(8), f(4)]);
};

/** Mix a colour with another: amount 0 keeps the colour, 1 gives the other */
const mixRgb = (rgb: Rgb, other: Rgb, amount: number): Rgb =>
  rgb.map((v, i) => v + (other[i] - v) * amount) as Rgb;

/** Palette for a hex colour: the colour itself, 12% darker hover, a near-white tint and a very dark banner of the same hue */
const paletteFromHex = (hex: string): TemplatePalette => {
  const rgb = hexToRgb(hex);
  const [h, s] = rgbToHsl(rgb);
  return {
    label: 'Custom',
    primary: rgbToHex(rgb),
    dark: rgbToHex(mixRgb(rgb, [0, 0, 0], 0.12)),
    soft: rgbToHex(mixRgb(rgb, [255, 255, 255], 0.92)),
    bannerFrom: hslToHex(h, s, 0.1),
    bannerTo: hslToHex(h, s, 0.2),
  };
};

/** Card theme -> template palette: a hex colour gets its own palette, anything else the preset one */
export const paletteFor = (theme?: string): TemplatePalette =>
  isHexTheme(theme) ? paletteFromHex(theme) : TEMPLATE_PALETTES[paletteForTheme(theme)];

// Slide / fade animations for the auto-sliding carousels and banner (no animation plugin in this project)
export const TEMPLATE_KEYFRAMES = `
@keyframes tplSlideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
@keyframes tplFadeIn { from { opacity: 0; } to { opacity: 1; } }
.tpl-slide-in { animation: tplSlideIn 0.5s ease both; }
.tpl-fade-in { animation: tplFadeIn 0.6s ease both; }
`;
