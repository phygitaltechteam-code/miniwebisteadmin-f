import { api } from '@/utils/axios';
import { ProfileData, SocialLink, QuickLink } from '@/types/profile';

/**
 * Exact payload shape that the backend `customers/links` API accepts/returns.
 * Field names must match EXACTLY (backend is case-sensitive).
 */
export interface CustomLinkItem {
  name: string;
  url: string;
  logo?: string | null;
}

export interface CustomerLinksPayload {
  customLink?: string | null;
  customLinks?: CustomLinkItem[];
  whatsappLinks?: string | null;
  emailLinks?: string | null;
  callLinks?: string | null;
  instagramLink?: string | null;
  facebookLink?: string | null;
  youTubeLink?: string | null;
  linkedinLink?: string | null;
  webSiteLink?: string | null;
  location?: string | null;
  googleMyBussiness?: string | null;
  twitter?: string | null;
  telegram?: string | null;
  catalogue?: string | null;
  bookingLink?: string | null;
  goLink?: string | null;
  pdfLink?: string | null;
  videoLink?: string | null;
  imageLink?: string | null;
  zomatoLink?: string | null;
  swiggyLink?: string | null;
  uberLink?: string | null;
  slackLink?: string | null;
  whatsappGroup?: string | null;
  facebookGroup?: string | null;
  spotifyLink?: string | null;
  amazonLink?: string | null;
  meshowLink?: string | null;
  shopify?: string | null;
  appStoreLink?: string | null;
  discordLink?: string | null;
  [key: string]: any;
}

export interface CustomerLinksResponse {
  success?: boolean;
  message?: string;
  data?: any;
  links?: any;
  social?: any;
  [key: string]: any;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

/** Return trimmed non-empty string or null (backend wants null for empty fields) */
const v = (val?: string | null): string | null =>
  val && val.trim() ? val.trim() : null;

const getSocial = (profile: Partial<ProfileData>, platform: string): string | null =>
  v(profile.socialLinks?.find((s) => s.platform === platform)?.url) ||
  v((profile as any)[platform]) ||
  null;

/** Custom link keys in use (customLink, customLink2, …) sorted by their number; always includes customLink */
export const customLinkKeys = (profile: Partial<ProfileData>): string[] => {
  const keys = new Set<string>(['customLink']);
  Object.keys(profile.linksDetails || {}).forEach((k) => /^customLink\d*$/.test(k) && keys.add(k));
  Object.keys(profile).forEach((k) => /^customLink\d+$/.test(k) && keys.add(k));
  const num = (k: string) => Number(k.replace('customLink', '') || 1);
  return Array.from(keys).sort((a, b) => num(a) - num(b));
};

/**
 * Our ordered link keys → backend linkOrder. Only links that hold a value and that the links API
 * knows are sent (an unknown name is rejected with 400); custom links become custom:<index>.
 */
export const toBackendLinkOrder = (keys: string[], profile: Partial<ProfileData>): string[] => {
  const known = new Set(Object.keys(formatCustomerLinksPayload({})).filter((k) => k !== 'customLink' && k !== 'customLinks'));
  const savedCustom = customLinkKeys(profile).filter(
    (k) => v((profile as any)[k]) || v(profile.linksDetails?.[k]?.url)
  );
  return Array.from(new Set(keys))
    .map((key) => {
      if (/^customLink\d*$/.test(key)) {
        // index in the customLinks array that formatCustomerLinksPayload sends
        const idx = savedCustom.indexOf(key);
        return idx >= 0 ? `custom:${idx}` : null;
      }
      const hasValue = v((profile as any)[key]) || v(profile.linksDetails?.[key]?.url);
      return known.has(key) && hasValue ? key : null;
    })
    .filter((k): k is string => k !== null);
};

/** Backend linkOrder → our link keys (custom:0 → customLink, custom:1 → customLink2, …) */
export const fromBackendLinkOrder = (order: string[]): string[] =>
  order.map((key) => {
    const m = /^custom:(\d+)$/.exec(key);
    if (!m) return key;
    const n = Number(m[1]);
    return n === 0 ? 'customLink' : `customLink${n + 1}`;
  });

// ─── Format payload ──────────────────────────────────────────────────────────

/**
 * Maps frontend ProfileData → exact backend customers/links payload.
 * Every field uses the exact backend key name from the API response.
 */
export const formatCustomerLinksPayload = (
  profile: Partial<ProfileData>
): CustomerLinksPayload => {
  const whatsappQl = profile.quickLinks?.find((l) => l.id === 'whatsapp');
  const customQl   = profile.quickLinks?.find((l) => l.id === 'custom');

  // Custom link name + url + logo go in the customLinks array (customLink, customLink2, customLink3, …)
  const customDetail = profile.linksDetails?.customLink;
  const customUrl = v(profile.customLink) || v(customDetail?.url) || v(customQl?.value);
  const customLinks: CustomLinkItem[] = customLinkKeys(profile)
    .map((key): CustomLinkItem | null => {
      const detail = profile.linksDetails?.[key];
      const url = key === 'customLink' ? customUrl : v((profile as any)[key]) || v(detail?.url);
      return url ? { name: v(detail?.name) || 'Custom Link', url, logo: v(detail?.icon) } : null;
    })
    .filter((link): link is CustomLinkItem => link !== null);

  return {
    // Website
    webSiteLink: v(profile.webSiteLink) || v(profile.website) || v((profile as any).websiteLink),

    // Google Maps location
    location: v(profile.location) || v(profile.mapLink),

    // Google My Business (note: backend typo "Bussiness" is intentional)
    googleMyBussiness: v(profile.googleMyBussiness),

    // Social media
    instagramLink: v(profile.instagramLink) || getSocial(profile, 'instagram'),
    facebookLink:  v(profile.facebookLink)  || getSocial(profile, 'facebook'),
    youTubeLink:   v(profile.youTubeLink)   || getSocial(profile, 'youtube'),
    linkedinLink:  v(profile.linkedinLink)  || getSocial(profile, 'linkedin'),
    twitter:       v(profile.twitter)        || getSocial(profile, 'twitter'),

    // Messaging — only what the user explicitly entered in the popup
    whatsappLinks: v(profile.whatsappLinks),
    emailLinks:    v(profile.emailLinks),
    callLinks:     v(profile.callLinks),

    // Channels / Groups
    whatsappGroup:  v(profile.whatsappGroup) || v(whatsappQl?.value),
    facebookGroup:  v(profile.facebookGroup),
    telegram:       v(profile.telegram),
    slackLink:      v(profile.slackLink),
    discordLink:    v(profile.discordLink),
    spotifyLink:    v(profile.spotifyLink),

    // Store / Catalogue
    catalogue:   v(profile.catalogue),
    shopify:     v(profile.shopify),
    amazonLink:  v(profile.amazonLink),
    meshowLink:  v(profile.meshowLink),
    appStoreLink:v(profile.appStoreLink),
    zomatoLink:  v(profile.zomatoLink),
    swiggyLink:  v(profile.swiggyLink),
    uberLink:    v(profile.uberLink),

    // Media / Docs
    bookingLink: v(profile.bookingLink),
    goLink:      v(profile.goLink),
    pdfLink:     v(profile.pdfLink),
    videoLink:   v(profile.videoLink),
    imageLink:   v(profile.imageLink),

    // Custom button
    customLink:  customUrl,
    customLinks,
  };
};

/** Convert a base64 data: URL (from the logo picker) into a File for multipart upload */
const dataUrlToFile = (dataUrl: string, baseName: string): File => {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/png';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], `${baseName}.${mime.split('/')[1] || 'png'}`, { type: mime });
};

/**
 * Build the multipart body for the links API.
 * Normal links are plain text fields; each custom link repeats customLinkName / customLinkUrl / customLinkLogo
 * in order. customLinkLogo is a File for a new logo, the existing URL to keep it, or empty for no logo.
 */
export const formatCustomerLinksFormData = (profile: Partial<ProfileData>): FormData => {
  const { customLink: _customLink, customLinks = [], ...fields } = formatCustomerLinksPayload(profile);
  const formData = new FormData();

  Object.entries(fields).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') formData.append(key, String(val));
  });

  customLinks.forEach((link, idx) => {
    formData.append('customLinkName', link.name);
    formData.append('customLinkUrl', link.url);
    const logo = link.logo || '';
    if (logo.startsWith('data:')) {
      formData.append('customLinkLogo', dataUrlToFile(logo, `custom-link-logo-${idx + 1}`));
    } else if (logo.startsWith('blob:')) {
      formData.append('customLinkLogo', ''); // local preview only, nothing to upload
    } else {
      formData.append('customLinkLogo', logo);
    }
  });

  return formData;
};

// ─── Parse GET response back into ProfileData shape ──────────────────────────

/**
 * Maps a backend customers/links GET response `data` object back into
 * ProfileData fields so Step4 can hydrate the form.
 */
export const parseCustomerLinksResponse = (data: any): Partial<ProfileData> => {
  if (!data || typeof data !== 'object') return {};

  const parsed: Partial<ProfileData> = {};

  if (data.webSiteLink)        parsed.webSiteLink = data.webSiteLink;
  if (data.location)           parsed.location    = data.location;
  if (data.googleMyBussiness)  parsed.googleMyBussiness = data.googleMyBussiness;
  if (data.instagramLink)      parsed.instagramLink = data.instagramLink;
  if (data.facebookLink)       parsed.facebookLink  = data.facebookLink;
  if (data.youTubeLink)        parsed.youTubeLink   = data.youTubeLink;
  if (data.linkedinLink)       parsed.linkedinLink  = data.linkedinLink;
  if (data.twitter)            parsed.twitter       = data.twitter;
  if (data.whatsappLinks)      parsed.whatsappLinks = data.whatsappLinks;
  if (data.emailLinks)         parsed.emailLinks    = data.emailLinks;
  if (data.callLinks)          parsed.callLinks     = data.callLinks;
  if (data.whatsappGroup)      parsed.whatsappGroup = data.whatsappGroup;
  if (data.facebookGroup)      parsed.facebookGroup = data.facebookGroup;
  if (data.telegram)           parsed.telegram      = data.telegram;
  if (data.slackLink)          parsed.slackLink     = data.slackLink;
  if (data.discordLink)        parsed.discordLink   = data.discordLink;
  if (data.spotifyLink)        parsed.spotifyLink   = data.spotifyLink;
  if (data.catalogue)          parsed.catalogue     = data.catalogue;
  if (data.shopify)            parsed.shopify       = data.shopify;
  if (data.amazonLink)         parsed.amazonLink    = data.amazonLink;
  if (data.meshowLink)         parsed.meshowLink    = data.meshowLink;
  if (data.appStoreLink)       parsed.appStoreLink  = data.appStoreLink;
  if (data.zomatoLink)         parsed.zomatoLink    = data.zomatoLink;
  if (data.swiggyLink)         parsed.swiggyLink    = data.swiggyLink;
  if (data.uberLink)           parsed.uberLink      = data.uberLink;
  if (data.bookingLink)        parsed.bookingLink   = data.bookingLink;
  if (data.goLink)             parsed.goLink        = data.goLink;
  if (data.pdfLink)            parsed.pdfLink       = data.pdfLink;
  if (data.videoLink)          parsed.videoLink     = data.videoLink;
  if (data.imageLink)          parsed.imageLink     = data.imageLink;
  if (data.customLink)         parsed.customLink    = data.customLink;

  // Saved link order from the links API (custom:<n> mapped back to customLink keys)
  if (Array.isArray(data.linkOrder) && data.linkOrder.length > 0) {
    parsed.linkOrder = fromBackendLinkOrder(data.linkOrder.filter((k: any) => typeof k === 'string'));
  }

  // Every saved custom link becomes customLink, customLink2, customLink3, …
  const customs = (Array.isArray(data.customLinks) ? data.customLinks : []).filter((c: any) => c?.url);
  if (customs.length > 0) {
    const details: NonNullable<ProfileData['linksDetails']> = {};
    customs.forEach((c: any, idx: number) => {
      const key = idx === 0 ? 'customLink' : `customLink${idx + 1}`;
      (parsed as any)[key] = c.url;
      details[key] = {
        id: key,
        name: c.name || 'Custom Link',
        description: '',
        url: c.url,
        icon: c.logo || undefined,
      };
    });
    parsed.linksDetails = details;
  }

  return parsed;
};

export const formatCustomerSocialPayload = formatCustomerLinksPayload;
export type CustomerSocialPayload = CustomerLinksPayload;
export type CustomerSocialResponse = CustomerLinksResponse;

// ─── GET ─────────────────────────────────────────────────────────────────────

export const getCustomerLinks = async (adminId?: string): Promise<CustomerLinksResponse> => {
  const endpoint = adminId ? `superAdmin/admin/${adminId}/links` : 'customers/links';
  try {
    const response = await api.get(endpoint);
    // Return the full axios response data so the caller can access .data
    return (response as any)?.data != null ? (response as any) : { data: response };
  } catch (err: any) {
    if (!adminId && (err?.response?.status === 404 || err?.response?.status === 405)) {
      try {
        const socialRes = await api.get('customers/social');
        return (socialRes as any)?.data != null ? (socialRes as any) : { data: socialRes };
      } catch (socialErr: any) {
        if (socialErr?.response?.status === 404 || socialErr?.response?.status === 405) {
          const infoRes = await api.get('customers/info');
          return (infoRes as any)?.data != null ? (infoRes as any) : { data: infoRes };
        }
        throw socialErr;
      }
    }
    throw err;
  }
};

export const getCustomerSocial = getCustomerLinks;

// ─── POST / PATCH ─────────────────────────────────────────────────────────────

export const saveOrUpdateCustomerLinks = async (
  profile: Partial<ProfileData>,
  adminId?: string
): Promise<CustomerLinksResponse> => {
  const payload = formatCustomerLinksFormData(profile);
  const endpoint = adminId ? `superAdmin/admin/${adminId}/links` : 'customers/links';

  // Try POST first
  try {
    const res = await api.post(endpoint, payload);
    return (res as any)?.data || res;
  } catch (err: any) {
    // 405 / 409 / 404 → try PATCH
    if ([405, 404, 409].includes(err?.response?.status)) {
      try {
        const patchRes = await api.patch(endpoint, payload);
        return (patchRes as any)?.data || patchRes;
      } catch (patchErr: any) {
        if (!adminId && (patchErr?.response?.status === 404 || patchErr?.response?.status === 405)) {
          try {
            const socialPost = await api.post('customers/social', payload);
            return (socialPost as any)?.data || socialPost;
          } catch {
            try {
              const socialPatch = await api.patch('customers/social', payload);
              return (socialPatch as any)?.data || socialPatch;
            } catch {
              const infoPatch = await api.patch('customers/info', payload);
              return (infoPatch as any)?.data || infoPatch;
            }
          }
        }
        throw patchErr;
      }
    }
    throw err;
  }
};

export const createCustomerSocial = async (
  payload: CustomerSocialPayload
): Promise<CustomerSocialResponse> => saveOrUpdateCustomerLinks(payload as Partial<ProfileData>);

export const updateCustomerSocial = async (
  payload: Partial<CustomerSocialPayload>
): Promise<CustomerSocialResponse> => saveOrUpdateCustomerLinks(payload as Partial<ProfileData>);
