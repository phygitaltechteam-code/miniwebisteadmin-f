import {describe, expect, it} from 'vitest';
import {TEMPLATE_PALETTES, isHexTheme, paletteFor} from './palette';

/** Relative luminance-ish brightness (0-255) of a #RRGGBB colour */
const brightness = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114
  );
};

describe('paletteFor', () => {
  it('returns the preset palette for a preset theme id', () => {
    expect(paletteFor('navy-orange')).toEqual(TEMPLATE_PALETTES.orange);
    expect(paletteFor('violet-white')).toEqual(TEMPLATE_PALETTES.violet);
    expect(paletteFor('sapphire-cyan')).toEqual(TEMPLATE_PALETTES.blue);
    expect(paletteFor('emerald-obsidian')).toEqual(TEMPLATE_PALETTES.green);
    expect(paletteFor(undefined)).toEqual(TEMPLATE_PALETTES.orange);
  });

  it('derives a custom palette from a hex colour', () => {
    const p = paletteFor('#1E88E5');
    expect(p.label).toBe('Custom');
    expect(p.primary).toBe('#1E88E5');
    expect(brightness(p.dark)).toBeLessThan(brightness(p.primary));
    expect(brightness(p.soft)).toBeGreaterThan(240);
    expect(brightness(p.bannerFrom)).toBeLessThan(brightness(p.bannerTo));
    expect(brightness(p.bannerTo)).toBeLessThan(brightness(p.primary));
    for (const c of Object.values(p).slice(1))
      expect(c).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('accepts lower case and #RGB', () => {
    expect(paletteFor('#1e88e5').primary).toBe('#1E88E5');
    expect(paletteFor(' #f60 ').primary).toBe('#FF6600');
  });

  it('treats invalid hex values as preset ids', () => {
    expect(isHexTheme('#12345')).toBe(false);
    expect(isHexTheme('1E88E5')).toBe(false);
    expect(paletteFor('#GGGGGG')).toEqual(TEMPLATE_PALETTES.orange);
  });
});
