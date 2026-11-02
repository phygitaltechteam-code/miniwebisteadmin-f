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

// Slide / fade animations for the auto-sliding carousels and banner (no animation plugin in this project)
export const TEMPLATE_KEYFRAMES = `
@keyframes tplSlideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
@keyframes tplFadeIn { from { opacity: 0; } to { opacity: 1; } }
.tpl-slide-in { animation: tplSlideIn 0.5s ease both; }
.tpl-fade-in { animation: tplFadeIn 0.6s ease both; }
`;
