import { api } from '@/utils/axios';
import {
  CreateAdminInfoValues,
  UpdateAdminInfoValues,
} from '@/schemas/cardProfileSchema';
import { ProfileData } from '@/types/profile';

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

  const addRealCatId = (id: any) => {
    if (!id) return;
    const trimmed = String(id).trim();
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
    vanityUrl: profile.vanityUrl || '',
    prefix: profile.prefix || 'Mr.',
    contactName: profile.contactName || '',
    designation: profile.designation || '',
    primaryPhone: profile.primaryPhone || '',
    whatsappNumber: profile.whatsappNumber || profile.whatsappPhone || '',
    email: emailClean,
    address: profile.address || '',
    mapLink: profile.mapLink || '',
    logoUrl: profile.logoUrl || '',
    bannerUrl: profile.bannerUrl || '',
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
 * POST customers/info OR superAdmin/admin/:adminId/info
 * Creates new customer basic profile information
 */
export const createCustomerInfo = async (
  payload: CustomerInfoPayload,
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
  payload: Partial<CustomerInfoPayload>,
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
  payload: CustomerInfoPayload,
  isUpdate: boolean = false,
  adminId?: string
): Promise<CustomerInfoResponse> => {
  if (isUpdate) {
    return updateCustomerInfo(payload, adminId);
  }
  return createCustomerInfo(payload, adminId);
};
