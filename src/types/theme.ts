export type PortalThemeId = 'navy-orange' | 'emerald-obsidian' | 'sapphire-cyan' | 'amber-gold' | 'violet-white';

export interface PortalTheme {
  id: PortalThemeId;
  name: string;
  badge: string;
  primaryColorName: string;
  accentColorName: string;
  colorCombination: string;
  desc: string;
  previewClass: string;

  // Theme Color Classes & Tokens
  topNoticeBg: string;
  topNoticeAccent: string;

  headerLogoGlow: string;
  headerActiveNav: string;
  headerCtaBtn: string;

  heroBgGradient: string;
  heroRingBorder: string;
  heroBadgeDot: string;
  heroBadgeText: string;
  heroContactText: string;
  heroPrimaryBtn: string;
  heroPhoneBtn: string;

  specialitiesBg: string;
  specialitiesBorder: string;
  specialitiesIcon: string;
  specialitiesCardHover: string;

  kickerText: string;

  aboutBadgeIconBg: string;
  aboutBadgeSubtitle: string;
  aboutRegisterIconBox: string;
  aboutGstIconBox: string;
  aboutConnectBtn: string;

  productsHoverBorder: string;
  productsHoverTitle: string;

  galleryPromptText: string;

  videoPlayBtnBg: string;
  videoWatchText: string;

  upiCardGradient: string;
  upiCardIconBox: string;
  upiCardAccentText: string;
  upiCardBtn: string;

  bankCardIconBox: string;
  bankCardCopyIcon: string;

  docsIconBox: string;
  docsHoverBorder: string;
  docsHoverText: string;

  footerBg: string;
  footerCategoryText: string;
  footerContactIcon: string;

  modalSubmitBtn: string;
  modalInputFocus: string;
}

export const PORTAL_THEMES: Record<PortalThemeId, PortalTheme> = {
  'navy-orange': {
    id: 'navy-orange',
    name: 'Midnight Navy & Radiant Orange',
    badge: 'Navy / Orange',
    primaryColorName: 'Midnight Navy',
    accentColorName: 'Radiant Orange',
    colorCombination: '#07162C + #F97316',
    desc: 'Deep Midnight Navy foundation paired with energetic high-contrast Radiant Orange',
    previewClass: 'bg-gradient-to-r from-[#07162C] to-[#0B2144] border-orange-500 text-orange-400',

    topNoticeBg: 'bg-[#081326]',
    topNoticeAccent: 'text-orange-400 hover:text-orange-300',

    headerLogoGlow: 'from-[#0F1E36] to-[#1E3A8A] text-orange-400',
    headerActiveNav: 'text-orange-600',
    headerCtaBtn: 'bg-[#F97316] hover:bg-[#EA580C] text-white shadow-orange-500/25',

    heroBgGradient: 'from-[#07162C] via-[#0B2144] to-[#0A1A33]',
    heroRingBorder: 'border-[#F97316]/60',
    heroBadgeDot: 'bg-orange-400',
    heroBadgeText: 'text-orange-300',
    heroContactText: 'text-orange-400',
    heroPrimaryBtn: 'bg-[#F97316] hover:bg-[#EA580C] text-white shadow-orange-500/30',
    heroPhoneBtn: 'text-orange-400',

    specialitiesBg: 'bg-[#EBF4FE]',
    specialitiesBorder: 'border-blue-100/80',
    specialitiesIcon: 'text-blue-600',
    specialitiesCardHover: 'hover:border-blue-400',

    kickerText: 'text-orange-600',

    aboutBadgeIconBg: 'bg-orange-500',
    aboutBadgeSubtitle: 'text-orange-600',
    aboutRegisterIconBox: 'bg-blue-50 text-blue-600 border-blue-100',
    aboutGstIconBox: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    aboutConnectBtn: 'bg-[#F97316] hover:bg-[#EA580C] text-white shadow-orange-500/20',

    productsHoverBorder: 'hover:border-orange-400',
    productsHoverTitle: 'group-hover:text-orange-600',

    galleryPromptText: 'text-orange-400',

    videoPlayBtnBg: 'bg-orange-600 group-hover:bg-orange-500',
    videoWatchText: 'text-orange-600',

    upiCardGradient: 'from-slate-900 to-[#0F2244]',
    upiCardIconBox: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    upiCardAccentText: 'text-orange-400',
    upiCardBtn: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20',

    bankCardIconBox: 'bg-blue-50 text-blue-600 border-blue-100',
    bankCardCopyIcon: 'text-blue-600 hover:text-blue-800',

    docsIconBox: 'bg-orange-50 text-orange-600 border-orange-100',
    docsHoverBorder: 'hover:border-orange-400',
    docsHoverText: 'group-hover:text-orange-600',

    footerBg: 'bg-[#071324]',
    footerCategoryText: 'text-orange-400',
    footerContactIcon: 'text-orange-400',

    modalSubmitBtn: 'bg-[#F97316] hover:bg-[#EA580C] text-white shadow-orange-500/25',
    modalInputFocus: 'focus:border-orange-500 focus:ring-orange-500',
  },

  'emerald-obsidian': {
    id: 'emerald-obsidian',
    name: 'Deep Obsidian & Royal Emerald',
    badge: 'Obsidian / Emerald',
    primaryColorName: 'Deep Obsidian',
    accentColorName: 'Royal Emerald',
    colorCombination: '#061C18 + #10B981',
    desc: 'Prestigious Deep Obsidian Forest base with luminous Royal Emerald and Jade accents',
    previewClass: 'bg-gradient-to-r from-[#061C18] to-[#0B2E26] border-emerald-500 text-emerald-400',

    topNoticeBg: 'bg-[#051713]',
    topNoticeAccent: 'text-emerald-400 hover:text-emerald-300',

    headerLogoGlow: 'from-[#061C18] to-[#0E3A2F] text-emerald-400',
    headerActiveNav: 'text-emerald-600',
    headerCtaBtn: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-emerald-500/25',

    heroBgGradient: 'from-[#061C18] via-[#0B2E26] to-[#08231D]',
    heroRingBorder: 'border-[#10B981]/50',
    heroBadgeDot: 'bg-emerald-400',
    heroBadgeText: 'text-emerald-300',
    heroContactText: 'text-emerald-400',
    heroPrimaryBtn: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-emerald-500/30',
    heroPhoneBtn: 'text-emerald-400',

    specialitiesBg: 'bg-[#E8F8F3]',
    specialitiesBorder: 'border-emerald-100/80',
    specialitiesIcon: 'text-emerald-600',
    specialitiesCardHover: 'hover:border-emerald-400',

    kickerText: 'text-emerald-600',

    aboutBadgeIconBg: 'bg-emerald-600',
    aboutBadgeSubtitle: 'text-emerald-600',
    aboutRegisterIconBox: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    aboutGstIconBox: 'bg-teal-50 text-teal-600 border-teal-100',
    aboutConnectBtn: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-emerald-500/20',

    productsHoverBorder: 'hover:border-emerald-400',
    productsHoverTitle: 'group-hover:text-emerald-600',

    galleryPromptText: 'text-emerald-400',

    videoPlayBtnBg: 'bg-emerald-600 group-hover:bg-emerald-500',
    videoWatchText: 'text-emerald-600',

    upiCardGradient: 'from-slate-950 to-[#07241B]',
    upiCardIconBox: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    upiCardAccentText: 'text-emerald-400',
    upiCardBtn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',

    bankCardIconBox: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    bankCardCopyIcon: 'text-emerald-600 hover:text-emerald-800',

    docsIconBox: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    docsHoverBorder: 'hover:border-emerald-400',
    docsHoverText: 'group-hover:text-emerald-600',

    footerBg: 'bg-[#04130F]',
    footerCategoryText: 'text-emerald-400',
    footerContactIcon: 'text-emerald-400',

    modalSubmitBtn: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-emerald-500/25',
    modalInputFocus: 'focus:border-emerald-500 focus:ring-emerald-500',
  },

  'sapphire-cyan': {
    id: 'sapphire-cyan',
    name: 'Imperial Sapphire & Electric Cyan',
    badge: 'Sapphire / Cyan',
    primaryColorName: 'Imperial Sapphire',
    accentColorName: 'Electric Cyan',
    colorCombination: '#07132B + #0284C7',
    desc: 'Refined Imperial Sapphire Navy paired with crisp, high-tech Electric Cyan accents',
    previewClass: 'bg-gradient-to-r from-[#07132B] to-[#0D2040] border-sky-400 text-sky-300',

    topNoticeBg: 'bg-[#061024]',
    topNoticeAccent: 'text-sky-400 hover:text-sky-300',

    headerLogoGlow: 'from-[#07132B] to-[#0E2856] text-sky-400',
    headerActiveNav: 'text-sky-600',
    headerCtaBtn: 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sky-500/25',

    heroBgGradient: 'from-[#07132B] via-[#0D2040] to-[#0A1A33]',
    heroRingBorder: 'border-[#0284C7]/60',
    heroBadgeDot: 'bg-sky-400',
    heroBadgeText: 'text-sky-300',
    heroContactText: 'text-sky-400',
    heroPrimaryBtn: 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sky-500/30',
    heroPhoneBtn: 'text-sky-400',

    specialitiesBg: 'bg-[#F0F7FF]',
    specialitiesBorder: 'border-sky-100/80',
    specialitiesIcon: 'text-sky-600',
    specialitiesCardHover: 'hover:border-sky-400',

    kickerText: 'text-sky-600',

    aboutBadgeIconBg: 'bg-sky-600',
    aboutBadgeSubtitle: 'text-sky-600',
    aboutRegisterIconBox: 'bg-sky-50 text-sky-600 border-sky-100',
    aboutGstIconBox: 'bg-blue-50 text-blue-600 border-blue-100',
    aboutConnectBtn: 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sky-500/20',

    productsHoverBorder: 'hover:border-sky-400',
    productsHoverTitle: 'group-hover:text-sky-600',

    galleryPromptText: 'text-sky-400',

    videoPlayBtnBg: 'bg-sky-600 group-hover:bg-sky-500',
    videoWatchText: 'text-sky-600',

    upiCardGradient: 'from-slate-950 to-[#0B1E3D]',
    upiCardIconBox: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    upiCardAccentText: 'text-sky-400',
    upiCardBtn: 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/20',

    bankCardIconBox: 'bg-sky-50 text-sky-600 border-sky-100',
    bankCardCopyIcon: 'text-sky-600 hover:text-sky-800',

    docsIconBox: 'bg-sky-50 text-sky-600 border-sky-100',
    docsHoverBorder: 'hover:border-sky-400',
    docsHoverText: 'group-hover:text-sky-600',

    footerBg: 'bg-[#050D1E]',
    footerCategoryText: 'text-sky-400',
    footerContactIcon: 'text-sky-400',

    modalSubmitBtn: 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sky-500/25',
    modalInputFocus: 'focus:border-sky-500 focus:ring-sky-500',
  },

  'amber-gold': {
    id: 'amber-gold',
    name: 'Charcoal Onyx & Royal Amber Gold',
    badge: 'Charcoal / Gold',
    primaryColorName: 'Charcoal Onyx',
    accentColorName: 'Royal Amber Gold',
    colorCombination: '#141416 + #D97706',
    desc: 'Executive Charcoal Onyx foundation accented by prestigious Royal Amber Gold luster',
    previewClass: 'bg-gradient-to-r from-[#141416] to-[#222328] border-amber-500 text-amber-300',

    topNoticeBg: 'bg-[#101113]',
    topNoticeAccent: 'text-amber-400 hover:text-amber-300',

    headerLogoGlow: 'from-[#141416] to-[#2D281E] text-amber-400',
    headerActiveNav: 'text-amber-600',
    headerCtaBtn: 'bg-[#D97706] hover:bg-[#B45309] text-white shadow-amber-500/25',

    heroBgGradient: 'from-[#141416] via-[#222328] to-[#18191D]',
    heroRingBorder: 'border-[#F59E0B]/50',
    heroBadgeDot: 'bg-amber-400',
    heroBadgeText: 'text-amber-300',
    heroContactText: 'text-amber-400',
    heroPrimaryBtn: 'bg-[#D97706] hover:bg-[#B45309] text-white shadow-amber-500/30',
    heroPhoneBtn: 'text-amber-400',

    specialitiesBg: 'bg-[#FFFBEB]',
    specialitiesBorder: 'border-amber-100/80',
    specialitiesIcon: 'text-amber-600',
    specialitiesCardHover: 'hover:border-amber-400',

    kickerText: 'text-amber-600',

    aboutBadgeIconBg: 'bg-amber-600',
    aboutBadgeSubtitle: 'text-amber-600',
    aboutRegisterIconBox: 'bg-amber-50 text-amber-600 border-amber-100',
    aboutGstIconBox: 'bg-orange-50 text-orange-600 border-orange-100',
    aboutConnectBtn: 'bg-[#D97706] hover:bg-[#B45309] text-white shadow-amber-500/20',

    productsHoverBorder: 'hover:border-amber-400',
    productsHoverTitle: 'group-hover:text-amber-600',

    galleryPromptText: 'text-amber-400',

    videoPlayBtnBg: 'bg-amber-600 group-hover:bg-amber-500',
    videoWatchText: 'text-amber-600',

    upiCardGradient: 'from-slate-950 to-[#221D16]',
    upiCardIconBox: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    upiCardAccentText: 'text-amber-400',
    upiCardBtn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',

    bankCardIconBox: 'bg-amber-50 text-amber-600 border-amber-100',
    bankCardCopyIcon: 'text-amber-600 hover:text-amber-800',

    docsIconBox: 'bg-amber-50 text-amber-600 border-amber-100',
    docsHoverBorder: 'hover:border-amber-400',
    docsHoverText: 'group-hover:text-amber-600',

    footerBg: 'bg-[#0D0E10]',
    footerCategoryText: 'text-amber-400',
    footerContactIcon: 'text-amber-400',

    modalSubmitBtn: 'bg-[#D97706] hover:bg-[#B45309] text-white shadow-amber-500/25',
    modalInputFocus: 'focus:border-amber-500 focus:ring-amber-500',
  },

  'violet-white': {
    id: 'violet-white',
    name: 'Royal Violet & Pure White',
    badge: 'Violet / White',
    primaryColorName: 'Royal Violet',
    accentColorName: 'Pure White',
    colorCombination: '#1A0A38 + #8B5CF6',
    desc: 'Regal Deep Violet foundation paired with luminous Amethyst Violet and crisp pure White accents',
    previewClass: 'bg-gradient-to-r from-[#1A0A38] to-[#361168] border-violet-500 text-violet-300',

    topNoticeBg: 'bg-[#120726]',
    topNoticeAccent: 'text-violet-300 hover:text-white',

    headerLogoGlow: 'from-[#1A0A38] to-[#4C1D95] text-violet-300',
    headerActiveNav: 'text-violet-700',
    headerCtaBtn: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-violet-500/25',

    heroBgGradient: 'from-[#1A0A38] via-[#2E1259] to-[#1E0B3E]',
    heroRingBorder: 'border-[#8B5CF6]/50',
    heroBadgeDot: 'bg-violet-400',
    heroBadgeText: 'text-violet-200',
    heroContactText: 'text-violet-300',
    heroPrimaryBtn: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-violet-500/30',
    heroPhoneBtn: 'text-violet-300',

    specialitiesBg: 'bg-[#F5F3FF]',
    specialitiesBorder: 'border-violet-100/80',
    specialitiesIcon: 'text-violet-600',
    specialitiesCardHover: 'hover:border-violet-400',

    kickerText: 'text-violet-600',

    aboutBadgeIconBg: 'bg-violet-600',
    aboutBadgeSubtitle: 'text-violet-600',
    aboutRegisterIconBox: 'bg-violet-50 text-violet-600 border-violet-100',
    aboutGstIconBox: 'bg-purple-50 text-purple-600 border-purple-100',
    aboutConnectBtn: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-violet-500/20',

    productsHoverBorder: 'hover:border-violet-400',
    productsHoverTitle: 'group-hover:text-violet-600',

    galleryPromptText: 'text-violet-400',

    videoPlayBtnBg: 'bg-violet-600 group-hover:bg-violet-500',
    videoWatchText: 'text-violet-600',

    upiCardGradient: 'from-slate-950 to-[#290E54]',
    upiCardIconBox: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    upiCardAccentText: 'text-violet-400',
    upiCardBtn: 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/20',

    bankCardIconBox: 'bg-violet-50 text-violet-600 border-violet-100',
    bankCardCopyIcon: 'text-violet-600 hover:text-violet-800',

    docsIconBox: 'bg-violet-50 text-violet-600 border-violet-100',
    docsHoverBorder: 'hover:border-violet-400',
    docsHoverText: 'group-hover:text-violet-600',

    footerBg: 'bg-[#0E051D]',
    footerCategoryText: 'text-violet-300',
    footerContactIcon: 'text-violet-400',

    modalSubmitBtn: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-violet-500/25',
    modalInputFocus: 'focus:border-violet-500 focus:ring-violet-500',
  },
};

export const getPortalTheme = (themeId?: string): PortalTheme => {
  if (!themeId) return PORTAL_THEMES['navy-orange'];

  // Direct match
  if (themeId in PORTAL_THEMES) {
    return PORTAL_THEMES[themeId as PortalThemeId];
  }

  // Legacy mappings for full compatibility
  const lower = themeId.toLowerCase();
  if (lower.includes('violet') || lower.includes('purple')) {
    return PORTAL_THEMES['violet-white'];
  }
  if (lower.includes('emerald') || lower.includes('green') || lower.includes('mint')) {
    return PORTAL_THEMES['emerald-obsidian'];
  }
  if (lower.includes('royal') || lower.includes('blue') || lower.includes('cyan') || lower.includes('sky')) {
    return PORTAL_THEMES['sapphire-cyan'];
  }
  if (lower.includes('gold') || lower.includes('dark') || lower.includes('amber') || lower.includes('minimal')) {
    return PORTAL_THEMES['amber-gold'];
  }

  return PORTAL_THEMES['navy-orange'];
};
