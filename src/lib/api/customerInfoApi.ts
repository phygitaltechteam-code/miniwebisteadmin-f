import { api, getStoredAccessToken } from '@/utils/axios';
import {
  CreateAdminInfoValues,
  UpdateAdminInfoValues,
} from '@/schemas/cardProfileSchema';
import { ProfileData } from '@/types/profile';
import { base64ToFile } from './customerAboutApi';
import { isUnlistedCategoryId, resolveCategoryForSave } from './customerCategoriesApi';

export type CustomerInfoPayload = CreateAdminInfoValues & {
  id?: string;
  _id?: string;
  customerId?: string;
  [key: string]: any;
};

export const isUuidOrId = (val?: string | null): boolean => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const prefixedOrHex = /^(cat_|adm_)[a-zA-Z0-9_-]+$|^[0-9a-fA-F]{24}$/;
  return uuidRegex.test(trimmed) || prefixedOrHex.test(trimmed);
};

/**
 * Maps frontend ProfileData to the exact backend createAdminInfoSchema / customer/info shape
 */
export const formatAdminInfoPayload = (
  profile: Partial<ProfileData>
): CustomerInfoPayload => {
  // Collect REAL category DB IDs only (UUIDs or MongoDB ObjectId-like strings).
  // NEVER include display names like "Enterprise" or "Retail & Trade" — the backend
  // will reject those with 404 "Invalid categories".
  const categoryIdsList: string[] = [];

  // Ids of manual categories are sent by name instead (backend rejects them as "Invalid categories")
  const manualCategoryNames: string[] = [];

  const addRealCatId = (id: any) => {
    if (!id) return;
    const trimmed = String(id).trim();
    if (isUnlistedCategoryId(trimmed)) {
      const name = resolveCategoryForSave(trimmed);
      if (!manualCategoryNames.includes(name)) manualCategoryNames.push(name);
      return;
    }
    // Only add if it looks like an actual DB ID (UUID, MongoDB ObjectId, or prefixed ID)
    if (trimmed && isUuidOrId(trimmed) && !categoryIdsList.includes(trimmed)) {
      categoryIdsList.push(trimmed);
    }
  };

  if (Array.isArray(profile.categoryIds)) {
    profile.categoryIds.forEach(addRealCatId);
  }
  if (Array.isArray(profile.adminCategoryIds)) {
    profile.adminCategoryIds.forEach(addRealCatId);
  }
  if (profile.categoryId) {
    addRealCatId(profile.categoryId);
  }

  // Collect category names (human-readable labels, e.g. "Business Consulting", "Retail")
  const categoryNamesList: string[] = [];
  const addCatName = (name: any) => {
    if (!name) return;
    const trimmed = String(name).trim();
    // Only store actual names, not IDs
    if (trimmed && !isUuidOrId(trimmed) && !categoryNamesList.includes(trimmed)) {
      categoryNamesList.push(trimmed);
    }
  };

  if (Array.isArray(profile.categoryNames)) {
    profile.categoryNames.forEach(addCatName);
  }
  if (Array.isArray(profile.categories)) {
    profile.categories.forEach(addCatName);
  }
  if (profile.categoryName) {
    addCatName(profile.categoryName);
  }
  manualCategoryNames.forEach(addCatName);

  // Determine exact active services chosen by the user in Step 1
  let activeServicesList: string[] = [];
  if (Array.isArray(profile.servicesOffered) && profile.servicesOffered.length > 0) {
    activeServicesList = profile.servicesOffered
      .map(s => String(s || '').trim())
      .filter(Boolean);
  } else if (typeof profile.servicesOffered === 'string' && profile.servicesOffered.trim().length > 0) {
    activeServicesList = profile.servicesOffered
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  } else if (Array.isArray(profile.natureOfBusiness) && profile.natureOfBusiness.length > 0) {
    activeServicesList = profile.natureOfBusiness
      .map(s => (typeof s === 'string' ? s : s?.name || s?.businessNature || '').trim())
      .filter(Boolean);
  } else if (Array.isArray(profile.businessNatures) && profile.businessNatures.length > 0) {
    activeServicesList = profile.businessNatures
      .map(s => (typeof s === 'string' ? s : s?.name || s?.businessNature || '').trim())
      .filter(Boolean);
  }

  // Deduplicate active services
  const seenNatures = new Set<string>();
  const natures: string[] = [];
  activeServicesList.forEach(s => {
    const lower = s.toLowerCase();
    if (!seenNatures.has(lower)) {
      seenNatures.add(lower);
      natures.push(s);
    }
  });

  // Services offered as clean comma-separated string matching active services only
  const services = natures.join(', ');

  // Filter specialities so only those matching active services are sent (never send specialities for removed services)
  const rawSpecialities = Array.isArray(profile.specialities) ? profile.specialities : [];
  let specialitiesList: string[] = [];

  if (natures.length > 0 && rawSpecialities.length > 0) {
    specialitiesList = rawSpecialities
      .map((s: any) => (typeof s === 'string' ? s : s?.name || s?.title || s?.specialities || '').trim())
      .filter(spec => {
        if (!spec) return false;
        return natures.some(srv =>
          spec.toLowerCase().includes(srv.toLowerCase()) || srv.toLowerCase().includes(spec.toLowerCase())
        );
      });

    if (specialitiesList.length === 0) {
      specialitiesList = natures.slice(0, 6).map(srv => `${srv} Solutions`);
    }
  } else if (natures.length > 0) {
    specialitiesList = natures.slice(0, 6).map(srv => `${srv} Solutions`);
  }

  // Clean email
  let emailClean = profile.email || '';
  if (emailClean.includes('mailto:')) {
    emailClean = emailClean.replace(/.*mailto:([^)]+).*/, '$1');
  }

  const primaryCategoryId = categoryIdsList[0] || undefined;

  return {
    businessName: profile.businessName || '',
    tagline: (profile as any).tagline || (profile as any).businessTagline || (profile as any).businessTagLine || '',
    businessTagline: (profile as any).businessTagline || (profile as any).tagline || (profile as any).businessTagLine || '',
    businessTagLine: (profile as any).businessTagLine || (profile as any).businessTagline || (profile as any).tagline || '',   // capital L
    vanityUrl: profile.vanityUrl || '',
    prefix: profile.prefix || 'Mr.',
    contactName: profile.contactName || '',
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    designation: profile.designation || '',
    extraOwners: profile.extraOwners || [],
    primaryPhone: profile.primaryPhone || '',
    whatsappNumber: profile.whatsappNumber || profile.whatsappPhone || '',
    altPhone: profile.altPhone || '',
    landline: profile.landline || '',
    extraPhones: profile.extraPhones || [],
    email: emailClean,
    extraEmails: profile.extraEmails || [],
    address: profile.address || '',
    extraAddresses: profile.extraAddresses || [],
    mapLink: profile.mapLink || '',
    website: profile.website || '',
    websiteProtocol: profile.websiteProtocol || 'http',
    logoUrl: profile.logoUrl || '',
    bannerUrl: profile.bannerUrl || (profile.banners && profile.banners[0]) || '',
    banners: profile.banners && profile.banners.length > 0 ? profile.banners : (profile.bannerUrl ? [profile.bannerUrl] : []),
    servicesOffered: services,
    theme: profile.theme || 'clean-white',
    pincode: profile.pincode || '',
    city: profile.city || '',
    district: profile.district || '',
    state: profile.state || '',
    showCategoryInCard: profile.showCategoryInCard ?? true,
    hasLogoBorder: profile.hasGoldenBorder ?? false,

    // Category ID fields: ONLY real DB IDs sent (prevents 404 "Invalid categories")
    // If no real IDs exist, omit so backend doesn't reject with name strings
    categoryIds: categoryIdsList.length > 0 ? categoryIdsList : undefined,
    adminCategoryIds: categoryIdsList.length > 0 ? categoryIdsList : undefined,
    categoryId: primaryCategoryId,
    category: primaryCategoryId,

    // Category Name fields: human-readable labels for display/compatibility
    categories: categoryNamesList.length > 0 ? categoryNamesList : undefined,
    categoryName: categoryNamesList[0] || undefined,
    categoryNames: categoryNamesList.length > 0 ? categoryNamesList : undefined,

    // Multiple business natures & specialities strictly matching active services
    businessNatures: natures,
    businessNature: natures,
    specialities: specialitiesList,
  };
};

export interface CustomerInfoResponse {
  success?: boolean;
  message?: string;
  data?: any;
  customer?: any;
  info?: any;
  [key: string]: any;
}

/**
 * GET customers/info OR superAdmin/admin/:adminId/info
 * Retrieves the customer basic profile information
 */
export const getCustomerInfo = async (adminId?: string): Promise<CustomerInfoResponse> => {
  const endpoint = adminId ? `superAdmin/admin/${adminId}/info` : 'customers/info';
  try {
    const response = await api.get(endpoint);
    return (response as any)?.data || response;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Convert frontend ProfileData into multipart/form-data for customers/info (or admin/info)
 * Exactly matches backend contract:
 * - businessName
 * - vanityUrl
 * - hasLogoBorder ('true' | 'false')
 * - logo (File or URL)
 * - banners (Files or URLs in display order; '[]' if empty)
 * - prefix
 * - firstName
 * - lastName
 * - designation
 * - additionalOwners: JSON.stringify([...])
 * - primaryPhone
 * - alternatePhone
 * - whatsappNumber
 * - landlineCode
 * - landlineNumber
 * - additionalPhones: JSON.stringify([...])
 * - address
 * - mapLink
 * - pincode
 * - city
 * - state
 * - additionalAddresses: JSON.stringify([...])
 * - email
 * - additionalEmails: JSON.stringify([...])
 * - websiteProtocol
 * - website
 * - tagline & businessTagline
 */
export const formatCustomerInfoFormData = (profile: Partial<ProfileData>): FormData => {
  const fd = new FormData();

  // Business name & identity
  fd.append('businessName', profile.businessName || '');
  fd.append('vanityUrl', profile.vanityUrl || '');
  fd.append('hasLogoBorder', String(profile.hasGoldenBorder ?? false));

  // Business Tagline — send all casing variants the backend may expect
  const tagline = (profile as any).tagline || (profile as any).businessTagline || (profile as any).businessTagLine || '';
  if (tagline) {
    fd.append('tagline', tagline);
    fd.append('businessTagline', tagline);
    fd.append('businessTagLine', tagline);   // capital L — matches backend field name
  }

  // Logo: File or converted base64
  const rawLogo = (profile as any).logoFile || profile.logoUrl;
  if (rawLogo instanceof File) {
    fd.append('logo', rawLogo);
  } else if (typeof rawLogo === 'string' && rawLogo.startsWith('data:')) {
    const file = base64ToFile(rawLogo, 'logo.png');
    if (file) {
      fd.append('logo', file);
    } else {
      fd.append('logo', rawLogo);
    }
  } else if (typeof rawLogo === 'string' && rawLogo) {
    fd.append('logo', rawLogo);
  }

  // Banners — full list in display order: kept URLs as text, new ones as File
  const bannersList: Array<string | File> = Array.isArray(profile.banners) && profile.banners.length > 0
    ? profile.banners
    : profile.bannerUrl
    ? [profile.bannerUrl]
    : [];

  if (bannersList.length === 0) {
    fd.append('banners', '[]');
  } else {
    bannersList.forEach((b, idx) => {
      if (b instanceof File) {
        fd.append('banners', b);
      } else if (typeof b === 'string' && b.startsWith('data:')) {
        const file = base64ToFile(b, `banner_${idx + 1}.jpg`);
        if (file) {
          fd.append('banners', file);
        } else {
          fd.append('banners', b);
        }
      } else if (typeof b === 'string' && b) {
        fd.append('banners', b);
      }
    });
  }

  // Owner
  fd.append('prefix', profile.prefix || 'Mr.');
  fd.append('firstName', profile.firstName || '');
  fd.append('lastName', profile.lastName || '');
  fd.append('designation', profile.designation || '');

  // Additional Owners: array of { prefix, firstName, lastName, designation }
  const rawOwners = profile.extraOwners || (profile as any).additionalOwners || [];
  const normalizedOwners = Array.isArray(rawOwners)
    ? rawOwners.map((o: any) => ({
        prefix: o.prefix || 'Mr.',
        firstName: o.firstName || '',
        lastName: o.lastName || '',
        designation: o.designation || '',
      }))
    : [];
  fd.append('additionalOwners', JSON.stringify(normalizedOwners));

  // Phones
  fd.append('primaryPhone', profile.primaryPhone || '');
  fd.append('alternatePhone', (profile as any).alternatePhone || profile.altPhone || '');
  fd.append('whatsappNumber', profile.whatsappNumber || profile.whatsappPhone || '');
  fd.append('landlineCode', (profile as any).landlineCode || '022');
  fd.append('landlineNumber', (profile as any).landlineNumber || profile.landline || '');

  // Additional Phones: array of strings e.g. ['9876543210']
  const rawPhones = profile.extraPhones || (profile as any).additionalPhones || [];
  const normalizedPhones = Array.isArray(rawPhones)
    ? rawPhones.map((p: any) => (typeof p === 'string' ? p : p.phone || '')).filter(Boolean)
    : [];
  fd.append('additionalPhones', JSON.stringify(normalizedPhones));

  // Address
  fd.append('address', profile.address || '');
  fd.append('mapLink', profile.mapLink || '');
  fd.append('pincode', profile.pincode || '');
  fd.append('city', profile.city || '');
  fd.append('state', profile.state || '');

  // Additional Addresses: array of { address, mapLink }
  const rawAddresses = profile.extraAddresses || (profile as any).additionalAddresses || [];
  const normalizedAddresses = Array.isArray(rawAddresses)
    ? rawAddresses.map((a: any) => ({
        address: typeof a === 'string' ? a : a.address || '',
        mapLink: typeof a === 'string' ? '' : a.mapLink || '',
      }))
    : [];
  fd.append('additionalAddresses', JSON.stringify(normalizedAddresses));

  // Email & website
  let emailClean = profile.email || '';
  if (emailClean.includes('mailto:')) {
    emailClean = emailClean.replace(/.*mailto:([^)]+).*/, '$1');
  }
  fd.append('email', emailClean);

  // Additional Emails: array of strings e.g. ['sales@example.com']
  const rawEmails = profile.extraEmails || (profile as any).additionalEmails || [];
  const normalizedEmails = Array.isArray(rawEmails)
    ? rawEmails.map((e: any) => {
        let em = typeof e === 'string' ? e : e.email || '';
        if (em.includes('mailto:')) em = em.replace(/.*mailto:([^)]+).*/, '$1');
        return em;
      }).filter(Boolean)
    : [];
  fd.append('additionalEmails', JSON.stringify(normalizedEmails));

  fd.append('websiteProtocol', profile.websiteProtocol || 'http://');
  fd.append('website', profile.website || '');

  return fd;
};

/**
 * POST customers/info OR superAdmin/admin/:adminId/info
 * Creates new customer basic profile information
 */
export const createCustomerInfo = async (
  payload: CustomerInfoPayload | FormData,
  adminId?: string
): Promise<CustomerInfoResponse> => {
  const endpoint = adminId ? `superAdmin/admin/${adminId}/info` : 'customers/info';
  try {
    const response = await api.post(endpoint, payload);
    return (response as any)?.data || response;
  } catch (error) {
    console.error(`Error creating info via ${endpoint}:`, error);
    throw error;
  }
};

/**
 * PATCH customers/info OR superAdmin/admin/:adminId/info
 * Updates existing customer basic profile information
 */
export const updateCustomerInfo = async (
  payload: Partial<CustomerInfoPayload> | FormData,
  adminId?: string
): Promise<CustomerInfoResponse> => {
  const endpoint = adminId ? `superAdmin/admin/${adminId}/info` : 'customers/info';
  try {
    const response = await api.patch(endpoint, payload);
    return (response as any)?.data || response;
  } catch (error) {
    console.error(`Error updating info via PATCH ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Convenience helper: saves or updates customer/info depending on whether an ID or update flag exists
 */
export const saveOrUpdateCustomerInfo = async (
  payload: CustomerInfoPayload | FormData,
  isUpdate: boolean = false,
  adminId?: string
): Promise<CustomerInfoResponse> => {
  if (isUpdate) {
    return updateCustomerInfo(payload, adminId);
  }
  return createCustomerInfo(payload, adminId);
};

/**
 * Direct submit helper utilizing FormData with native fetch fallback
 * Exact match for user's requested snippet:
 * await fetch(`${API}/api/v1/customers/info`, {
 *   method: isFirstSave ? 'POST' : 'PATCH',
 *   headers: { Authorization: `Bearer ${token}` },
 *   body: fd,
 * });
 */
export const submitCustomerInfoFormData = async (
  fd: FormData,
  isFirstSave: boolean,
  adminId?: string
): Promise<CustomerInfoResponse> => {
  const method = isFirstSave ? 'POST' : 'PATCH';
  const endpoint = adminId ? `superAdmin/admin/${adminId}/info` : 'customers/info';

  try {
    const res = isFirstSave ? await api.post(endpoint, fd) : await api.patch(endpoint, fd);
    return (res as any)?.data || res;
  } catch (axiosErr: any) {
    console.warn(`[customerInfoApi] Axios ${method} failed, trying native fetch fallback:`, axiosErr);

    const rawBaseUrl = import.meta.env.VITE_SERVER_URL || '/api/v1';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const fullUrl = `${baseUrl}/${cleanEndpoint}`;
    const token = getStoredAccessToken();

    const response = await fetch(fullUrl, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: fd,
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr: any;
      try {
        parsedErr = JSON.parse(errText);
      } catch {
        parsedErr = { message: errText };
      }
      throw new Error(parsedErr?.message || parsedErr?.error || `Failed to submit info (${response.status})`);
    }

    return await response.json();
  }
};
