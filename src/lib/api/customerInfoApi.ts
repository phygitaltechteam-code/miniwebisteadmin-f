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

  // Format business natures & specialities as string arrays
  const natures = Array.isArray(profile.natureOfBusiness)
    ? profile.natureOfBusiness
    : (profile.businessNatures ? (Array.isArray(profile.businessNatures) ? profile.businessNatures : [profile.businessNatures]) : []);

  const specialitiesList = Array.isArray(profile.specialities)
    ? profile.specialities
    : [];

  // Services offered as comma-separated string
  const services = Array.isArray(profile.servicesOffered)
    ? profile.servicesOffered.join(', ')
    : (profile.servicesOffered || '');

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

    // Multiple business natures & specialities
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
 * GET customers/info
 * Retrieves the current customer basic profile information
 */
export const getCustomerInfo = async (): Promise<CustomerInfoResponse> => {
  try {
    const response = await api.get('customers/info');
    return (response as any)?.data || response;
  } catch (error) {
    console.error('Error fetching customers/info:', error);
    throw error;
  }
};

/**
 * POST customers/info
 * Creates new customer basic profile information
 */
export const createCustomerInfo = async (
  payload: CustomerInfoPayload
): Promise<CustomerInfoResponse> => {
  try {
    const response = await api.post('customers/info', payload);
    return (response as any)?.data || response;
  } catch (error) {
    console.error('Error creating customers/info:', error);
    throw error;
  }
};

/**
 * PATCH customers/info
 * Updates existing customer basic profile information
 */
export const updateCustomerInfo = async (
  payload: Partial<CustomerInfoPayload>
): Promise<CustomerInfoResponse> => {
  try {
    const response = await api.patch('customers/info', payload);
    return (response as any)?.data || response;
  } catch (error) {
    console.error('Error updating customers/info via PATCH:', error);
    throw error;
  }
};

/**
 * Convenience helper: saves or updates customer/info depending on whether an ID or update flag exists
 */
export const saveOrUpdateCustomerInfo = async (
  payload: CustomerInfoPayload,
  isUpdate: boolean = false
): Promise<CustomerInfoResponse> => {
  if (isUpdate) {
    return updateCustomerInfo(payload);
  }
  return createCustomerInfo(payload);
};
