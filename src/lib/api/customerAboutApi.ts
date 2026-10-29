import { api } from '@/utils/axios';
import { ProfileData, CompanyDocument } from '@/types/profile';
import { resolveCategoryForSave } from './customerCategoriesApi';

export interface CustomerAboutPayload {
  establishmentYear?: Number | string;
  gstNumber?: string;
  isCategoryDigitalCard?: boolean;
  showCategoryInCard?: boolean;
  aboutUsText?: string;
  aboutNarrative?: string;
  categoryIds?: string[];
  categories?: string[];
  businessNatures?: string[];
  businessNature?: string[];
  natureOfBusiness?: string[];
  specialities?: string[];
  removeDocumentIds?: string[];
  brochureName?: string;
  brochureSize?: string;
  brochureDate?: string;
  brochureUrl?: string;
  documents?: CompanyDocument[];
  [key: string]: any;
}

export interface CustomerAboutResponse {
  success?: boolean;
  message?: string;
  data?: any;
  about?: any;
  [key: string]: any;
}

/**
 * Format frontend ProfileData into customers/about payload adhering to upsertAboutUsSchema
 * Ensures documents array items include both fileName and name
 */
export const formatAdminAboutPayload = (profile: Partial<ProfileData>): CustomerAboutPayload => {
  // Sync business natures strictly from active servicesOffered (Step 1) if present
  let rawNatures: any[] = [];
  if (Array.isArray(profile.servicesOffered) && profile.servicesOffered.length > 0) {
    rawNatures = profile.servicesOffered;
  } else if (typeof profile.servicesOffered === 'string' && profile.servicesOffered.trim().length > 0) {
    rawNatures = profile.servicesOffered.split(',').map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(profile.natureOfBusiness) && profile.natureOfBusiness.length > 0) {
    rawNatures = profile.natureOfBusiness;
  } else if (Array.isArray(profile.businessNatures) && profile.businessNatures.length > 0) {
    rawNatures = profile.businessNatures;
  }

  const seen = new Set<string>();
  const natures = rawNatures
    .map(s => {
      if (typeof s === 'string') return s.trim();
      if (s && typeof s === 'object') {
        return String((s as any).businessNature || (s as any).nature || (s as any).name || '').trim();
      }
      return '';
    })
    .filter(s => {
      const lower = s.toLowerCase();
      if (!s || seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });

  const specialities = (profile.specialities || [])
    .map(s => {
      if (typeof s === 'string') return s.trim().slice(0, 100);
      if (s && typeof s === 'object') {
        return String((s as any).specialities || (s as any).speciality || (s as any).name || (s as any).title || '').trim().slice(0, 100);
      }
      return '';
    })
    .filter(Boolean);

  // ─── CATEGORY IDS ────────────────────────────────────────────────────────────
  // Exactly what the user selects (predefined category UUIDs) and enters (custom category names).
  // Example: ["67ae0258-418c-4892-9478-14f395137a07", "Electrical Services", "30be1610-b6a1-49e3-b198-8c2af1cb7774"]
  const catIdsList: string[] = [];
  const seenCats = new Set<string>();

  const sourceCategoryList =
    Array.isArray(profile.categoryIds) && profile.categoryIds.length > 0
      ? profile.categoryIds
      : Array.isArray(profile.adminCategoryIds) && profile.adminCategoryIds.length > 0
      ? profile.adminCategoryIds
      : Array.isArray(profile.categories) && profile.categories.length > 0
      ? profile.categories
      : profile.category
      ? [profile.category]
      : [];

  sourceCategoryList.forEach((item: any) => {
    const raw = (typeof item === 'object' ? String(item.id || item._id || item.name || '') : String(item || '')).trim();
    // Manual categories: send the name, never their own id (backend rejects it as "Invalid categories")
    const str = resolveCategoryForSave(raw);
    if (str && !seenCats.has(str.toLowerCase())) {
      seenCats.add(str.toLowerCase());
      catIdsList.push(str);
    }
  });

  const yearStr = profile.establishmentYear ? String(profile.establishmentYear).trim() : '';
  const gstStr = (profile.gstNumber || '').trim().toUpperCase();
  const narrative = (profile.aboutNarrative || (profile as any).aboutUsText || '').trim();

  // Normalize documents ensuring fileName is populated
  const docs: CompanyDocument[] = (profile.documents || []).map((doc: any) => {
    const fileName = doc.fileName || doc.name || 'document';
    const name = doc.name || doc.fileName || 'document';
    return {
      id: doc.id || `doc_${Date.now()}`,
      name,
      fileName,
      description: doc.description || '',
      url: doc.url || '',
      size: doc.size || '',
      uploadedAt: doc.uploadedAt || '',
      type: doc.type || '',
      ...(doc.file ? { file: doc.file } : {}),
    };
  });

  return {
    establishmentYear: yearStr || undefined,
    gstNumber: gstStr || undefined,
    isCategoryDigitalCard: (profile as any).isCategoryDigitalCard ?? profile.showCategoryInCard ?? true,
    showCategoryInCard: profile.showCategoryInCard ?? (profile as any).isCategoryDigitalCard ?? true,
    aboutUsText: narrative,
    aboutNarrative: narrative,
    categoryIds: catIdsList,
    categories: catIdsList,
    businessNatures: natures,
    businessNature: natures,
    natureOfBusiness: natures,
    specialities: specialities,
    removeDocumentIds: (profile as any).removeDocumentIds || [],
    brochureName: profile.brochureName || '',
    brochureSize: profile.brochureSize || '',
    brochureDate: profile.brochureDate || '',
    brochureUrl: profile.brochureUrl || '',
    documents: docs,
  };
};

/**
 * Convert base64 data URL to a File instance
 */
export const base64ToFile = (dataurl: string, filename: string): File | null => {
  try {
    if (!dataurl || !dataurl.startsWith('data:')) return null;
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (err) {
    console.warn('Could not convert base64 to File', err);
    return null;
  }
};

/**
 * Convert frontend ProfileData into multipart/form-data for customers/about
 * Exactly matches backend format from Postman:
 * - categoryIds: ["2b456114-8aac-4c5d-84e6-2416f150eedb", "Bridal Makeup", "Hair Spa"]
 * - businessNatures: ["Service provider", "Vendor Connect"]
 * - specialities: ["Bridal Makeup", "Party Makeup", "Hair Styling"]
 * - documents: File
 * - fileName: Document name
 */
export const formatAboutFormData = (profile: Partial<ProfileData>): FormData => {
  const formData = new FormData();
  const payload = formatAdminAboutPayload(profile);

  if (payload.establishmentYear !== undefined && payload.establishmentYear !== null && String(payload.establishmentYear).trim() !== '') {
    formData.append('establishmentYear', String(payload.establishmentYear).trim());
  }
  if (payload.gstNumber) {
    formData.append('gstNumber', payload.gstNumber);
  }
  formData.append('isCategoryDigitalCard', String(payload.isCategoryDigitalCard ?? true));
  formData.append('showCategoryInCard', String(payload.showCategoryInCard ?? true));
  formData.append('aboutUsText', payload.aboutUsText || '');
  formData.append('aboutNarrative', payload.aboutNarrative || '');

  // categoryIds as JSON string array: ["2b456114-8aac-4c5d-84e6-2416f150eedb", "Bridal Makeup", "Hair Spa"]
  const catIds = payload.categoryIds || [];
  formData.append('categoryIds', JSON.stringify(catIds));

  // businessNatures as JSON string array: ["Service provider", "Vendor Connect"]
  const natures = payload.businessNatures || [];
  formData.append('businessNatures', JSON.stringify(natures));

  // specialities as JSON string array: ["Bridal Makeup", "Party Makeup", "Hair Styling"]
  const specs = payload.specialities || [];
  formData.append('specialities', JSON.stringify(specs));

  if (payload.removeDocumentIds && payload.removeDocumentIds.length > 0) {
    formData.append('removeDocumentIds', JSON.stringify(payload.removeDocumentIds));
  }

  // Brochure fields
  if (payload.brochureName) formData.append('brochureName', payload.brochureName);
  if (payload.brochureSize) formData.append('brochureSize', payload.brochureSize);
  if (payload.brochureDate) formData.append('brochureDate', payload.brochureDate);
  if (payload.brochureUrl) formData.append('brochureUrl', payload.brochureUrl);

  // Documents array - strictly append one fileName and description per binary document file
  // Backend Multer: if fileName is sent without a matching binary file in documents, backend throws:
  // "Received 0 documents but 1 file names — send one name per document"
  const docs = payload.documents || [];
  docs.forEach((doc: any) => {
    const rawFile =
      doc.file instanceof File
        ? doc.file
        : (typeof doc.url === 'string' && doc.url.startsWith('data:')
            ? base64ToFile(doc.url, doc.fileName || doc.name || 'document.pdf')
            : null);

    if (rawFile instanceof File) {
      formData.append('documents', rawFile);
      formData.append('fileName', doc.fileName || doc.name || rawFile.name || 'document');
      formData.append('description', doc.description || '');
    }
  });


  return formData;
};

/**
 * GET customers/about OR superAdmin/admin/:adminId/about
 * Fetches company about, specialities, narrative, and documents.
 */
export const getCustomerAbout = async (adminId?: string): Promise<CustomerAboutResponse> => {
  const endpoint = adminId ? `superAdmin/admin/${adminId}/about` : 'customers/about';
  try {
    const response = await api.get(endpoint);
    return (response as any)?.data || response;
  } catch (error: any) {
    if (!adminId && error?.response?.status === 404) {
      const fallbackRes = await api.get('customers/info');
      return (fallbackRes as any)?.data || fallbackRes;
    }
    throw error;
  }
};

/**
 * POST customers/about OR superAdmin/admin/:adminId/about
 */
export const createCustomerAbout = async (
  payload: CustomerAboutPayload | FormData,
  adminId?: string
): Promise<CustomerAboutResponse> => {
  const endpoint = adminId ? `superAdmin/admin/${adminId}/about` : 'customers/about';
  try {
    const response = await api.post(endpoint, payload);
    return (response as any)?.data || response;
  } catch (error: any) {
    if (!adminId && (error?.response?.status === 404 || error?.response?.status === 405)) {
      const fallbackRes = await api.post('customers/info', payload);
      return (fallbackRes as any)?.data || fallbackRes;
    }
    throw error;
  }
};

/**
 * PATCH customers/about OR superAdmin/admin/:adminId/about
 */
export const updateCustomerAbout = async (
  payload: Partial<CustomerAboutPayload> | FormData,
  adminId?: string
): Promise<CustomerAboutResponse> => {
  const endpoint = adminId ? `superAdmin/admin/${adminId}/about` : 'customers/about';
  try {
    const response = await api.patch(endpoint, payload);
    return (response as any)?.data || response;
  } catch (error: any) {
    if (!adminId && (error?.response?.status === 404 || error?.response?.status === 405)) {
      const fallbackRes = await api.patch('customers/info', payload);
      return (fallbackRes as any)?.data || fallbackRes;
    }
    throw error;
  }
};

/**
 * Save or update customer about details (supports FormData and JSON payload)
 */
export const saveOrUpdateCustomerAbout = async (
  payload: CustomerAboutPayload | FormData,
  isUpdate: boolean = false,
  fallbackJsonPayload?: CustomerAboutPayload,
  adminId?: string
): Promise<CustomerAboutResponse> => {
  if (isUpdate) {
    try {
      return await updateCustomerAbout(payload, adminId);
    } catch (patchErr: any) {
      const status = patchErr?.response?.status;
      if (status === 404 || status === 405) {
        return await createCustomerAbout(payload, adminId);
      }
      if (payload instanceof FormData && fallbackJsonPayload && (status === 415 || status === 400)) {
        console.warn('[customerAboutApi] FormData PATCH failed, falling back to JSON payload with fileName');
        return await updateCustomerAbout(fallbackJsonPayload, adminId);
      }
      throw patchErr;
    }
  }

  try {
    return await createCustomerAbout(payload, adminId);
  } catch (postErr: any) {
    const status = postErr?.response?.status;
    const msg = String(postErr?.response?.data?.message || '').toLowerCase();
    if (status === 409 || status === 405 || (status === 400 && msg.includes('already'))) {
      return await updateCustomerAbout(payload, adminId);
    }
    if (payload instanceof FormData && fallbackJsonPayload && (status === 415 || status === 400)) {
      console.warn('[customerAboutApi] FormData POST failed, falling back to JSON payload with fileName');
      return await createCustomerAbout(fallbackJsonPayload, adminId);
    }
    throw postErr;
  }
};

