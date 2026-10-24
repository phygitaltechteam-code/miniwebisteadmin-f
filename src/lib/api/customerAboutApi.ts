import { api } from '@/utils/axios';
import { ProfileData, CompanyDocument } from '@/types/profile';

export interface CustomerAboutPayload {
  establishmentYear?: Number | string;
  gstNumber?: string;
  isCategoryDigitalCard?: boolean;
  showCategoryInCard?: boolean;
  aboutUsText?: string;
  aboutNarrative?: string;
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
 * Ensures all fields are formatted, and documents array items include fileName
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

  // Business natures (each entry max 100 characters)
  (payload.businessNatures || []).forEach((nature) => {
    const cleanNature = String(nature || '').trim().slice(0, 100);
    if (cleanNature) {
      formData.append('businessNatures', cleanNature);
      formData.append('businessNature', cleanNature);
      formData.append('natureOfBusiness', cleanNature);
    }
  });

  // Specialities (each entry max 100 characters)
  (payload.specialities || []).forEach((spec) => {
    const cleanSpec = String(spec || '').trim().slice(0, 100);
    if (cleanSpec) {
      formData.append('specialities', cleanSpec);
    }
  });

  if (payload.removeDocumentIds && payload.removeDocumentIds.length > 0) {
    formData.append('removeDocumentIds', JSON.stringify(payload.removeDocumentIds));
  }

  // Brochure fields
  if (payload.brochureName) formData.append('brochureName', payload.brochureName);
  if (payload.brochureSize) formData.append('brochureSize', payload.brochureSize);
  if (payload.brochureDate) formData.append('brochureDate', payload.brochureDate);
  if (payload.brochureUrl) formData.append('brochureUrl', payload.brochureUrl);

  // Documents array - append file and fileName as required by backend
  const docs = payload.documents || [];
  docs.forEach((doc: any) => {
    const rawFile =
      doc.file instanceof File
        ? doc.file
        : (typeof doc.url === 'string' && doc.url.startsWith('data:')
            ? base64ToFile(doc.url, doc.fileName || doc.name || 'document.pdf')
            : null);

    if (rawFile) {
      formData.append('documents', rawFile);
    } else if (doc.url) {
      formData.append('documents', doc.url);
    }
    formData.append('fileName', doc.fileName || ''); // never skip; '' = use original filename
    formData.append('description', doc.description || ''); // kept index-aligned with documents/fileName
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

