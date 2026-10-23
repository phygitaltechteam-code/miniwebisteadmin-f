import { api } from '@/utils/axios';

/**
 * SuperAdmin Card Forge API Client
 * Exclusively uses /api/v1/superAdmin/admin/:adminId/* endpoints for SuperAdmin operations.
 */

// ─── 1. Info ─────────────────────────────────────────────────────────────────
export const superAdminGetInfo = async (adminId: string) => {
  const res = await api.get(`superAdmin/admin/${adminId}/info`);
  return (res as any)?.data || res;
};

export const superAdminSaveInfo = async (
  adminId: string,
  payload: any,
  isUpdate: boolean = false
) => {
  const res = isUpdate
    ? await api.patch(`superAdmin/admin/${adminId}/info`, payload)
    : await api.post(`superAdmin/admin/${adminId}/info`, payload);
  return (res as any)?.data || res;
};

export const superAdminDeleteInfo = async (adminId: string) => {
  const res = await api.delete(`superAdmin/admin/${adminId}/info`);
  return (res as any)?.data || res;
};

// ─── 2. About Us ─────────────────────────────────────────────────────────────
export const superAdminGetAbout = async (adminId: string) => {
  const res = await api.get(`superAdmin/admin/${adminId}/about`);
  return (res as any)?.data || res;
};

export const superAdminSaveAbout = async (
  adminId: string,
  payload: any,
  isUpdate: boolean = false
) => {
  const res = isUpdate
    ? await api.patch(`superAdmin/admin/${adminId}/about`, payload)
    : await api.post(`superAdmin/admin/${adminId}/about`, payload);
  return (res as any)?.data || res;
};

export const superAdminDeleteAbout = async (adminId: string) => {
  const res = await api.delete(`superAdmin/admin/${adminId}/about`);
  return (res as any)?.data || res;
};

export const superAdminUploadAboutDocument = async (adminId: string, formData: FormData) => {
  const res = await api.post(`superAdmin/admin/${adminId}/about/documents`, formData);
  return (res as any)?.data || res;
};

export const superAdminUpdateAboutDocument = async (
  adminId: string,
  documentId: string,
  payload: any
) => {
  const res = await api.patch(`superAdmin/admin/${adminId}/about/documents/${documentId}`, payload);
  return (res as any)?.data || res;
};

export const superAdminDeleteAboutDocument = async (adminId: string, documentId: string) => {
  const res = await api.delete(`superAdmin/admin/${adminId}/about/documents/${documentId}`);
  return (res as any)?.data || res;
};

// ─── 3. Products ─────────────────────────────────────────────────────────────
export const superAdminGetProducts = async (adminId: string, params?: any) => {
  const res = await api.get(`superAdmin/admin/${adminId}/products`, { params });
  return (res as any)?.data || res;
};

export const superAdminGetProductById = async (adminId: string, id: string | number) => {
  const res = await api.get(`superAdmin/admin/${adminId}/products/${id}`);
  return (res as any)?.data || res;
};

export const superAdminCreateProduct = async (adminId: string, payload: any) => {
  const res = await api.post(`superAdmin/admin/${adminId}/products`, payload);
  return (res as any)?.data || res;
};

export const superAdminUpdateProduct = async (
  adminId: string,
  id: string | number,
  payload: any
) => {
  const res = await api.patch(`superAdmin/admin/${adminId}/products/${id}`, payload);
  return (res as any)?.data || res;
};

export const superAdminDeleteProduct = async (adminId: string, id: string | number) => {
  const res = await api.delete(`superAdmin/admin/${adminId}/products/${id}`);
  return (res as any)?.data || res;
};

// ─── 4. Links ────────────────────────────────────────────────────────────────
export const superAdminGetLinks = async (adminId: string) => {
  const res = await api.get(`superAdmin/admin/${adminId}/links`);
  return (res as any)?.data != null ? res : { data: res };
};

export const superAdminSaveLinks = async (adminId: string, payload: any) => {
  try {
    const res = await api.post(`superAdmin/admin/${adminId}/links`, payload);
    return (res as any)?.data || res;
  } catch (err: any) {
    if ([404, 405, 409].includes(err?.response?.status)) {
      try {
        const patchRes = await api.patch(`superAdmin/admin/${adminId}/links`, payload);
        return (patchRes as any)?.data || patchRes;
      } catch {
        const putRes = await api.put(`superAdmin/admin/${adminId}/links`, payload);
        return (putRes as any)?.data || putRes;
      }
    }
    throw err;
  }
};

export const superAdminDeleteLinks = async (adminId: string) => {
  const res = await api.delete(`superAdmin/admin/${adminId}/links`);
  return (res as any)?.data || res;
};

// ─── 5. Categories ───────────────────────────────────────────────────────────
export const superAdminGetCategoriesForAdmin = async (adminId: string) => {
  const res = await api.get(`superAdmin/admin/${adminId}/categories`);
  const data = (res as any)?.data?.categories || (res as any)?.categories || (Array.isArray(res) ? res : []);
  return Array.isArray(data) ? data : [];
};

// ─── 6. Payment ──────────────────────────────────────────────────────────────
export const superAdminGetPayment = async (adminId: string) => {
  const res = await api.get(`superAdmin/admin/${adminId}/payment`);
  return (res as any)?.data || res;
};

export const superAdminSavePayment = async (adminId: string, payload: any) => {
  try {
    const res = await api.post(`superAdmin/admin/${adminId}/payment`, payload);
    return (res as any)?.data || res;
  } catch (err: any) {
    if ([404, 405, 409].includes(err?.response?.status)) {
      try {
        const patchRes = await api.patch(`superAdmin/admin/${adminId}/payment`, payload);
        return (patchRes as any)?.data || patchRes;
      } catch {
        const putRes = await api.put(`superAdmin/admin/${adminId}/payment`, payload);
        return (putRes as any)?.data || putRes;
      }
    }
    throw err;
  }
};

export const superAdminDeletePayment = async (adminId: string) => {
  const res = await api.delete(`superAdmin/admin/${adminId}/payment`);
  return (res as any)?.data || res;
};

// ─── 7. Gallery ──────────────────────────────────────────────────────────────
export const superAdminGetGallery = async (adminId: string) => {
  const res = await api.get(`superAdmin/admin/${adminId}/gallery`);
  return (res as any)?.data || res;
};

export const superAdminCreateGallery = async (adminId: string, formData: FormData) => {
  const res = await api.post(`superAdmin/admin/${adminId}/gallery`, formData);
  return (res as any)?.data || res;
};

export const superAdminUpdateGallery = async (
  adminId: string,
  id: string | number,
  formData: FormData
) => {
  const res = await api.patch(`superAdmin/admin/${adminId}/gallery/${id}`, formData);
  return (res as any)?.data || res;
};

export const superAdminDeleteGallery = async (adminId: string, id: string | number) => {
  const res = await api.delete(`superAdmin/admin/${adminId}/gallery/${id}`);
  return (res as any)?.data || res;
};

export const superAdminBulkDeleteGallery = async (adminId: string, ids: (string | number)[]) => {
  const res = await api.delete(`superAdmin/admin/${adminId}/gallery`, { data: { ids } });
  return (res as any)?.data || res;
};

// ─── 8. YouTube Videos ───────────────────────────────────────────────────────
export const superAdminGetVideos = async (adminId: string) => {
  const res = await api.get(`superAdmin/admin/${adminId}/videos`);
  return (res as any)?.data || res;
};

export const superAdminCreateVideo = async (adminId: string, payload: any) => {
  const res = await api.post(`superAdmin/admin/${adminId}/videos`, payload);
  return (res as any)?.data || res;
};

export const superAdminUpdateVideo = async (
  adminId: string,
  id: string | number,
  payload: any
) => {
  const res = await api.patch(`superAdmin/admin/${adminId}/videos/${id}`, payload);
  return (res as any)?.data || res;
};

export const superAdminDeleteVideo = async (adminId: string, id: string | number) => {
  const res = await api.delete(`superAdmin/admin/${adminId}/videos/${id}`);
  return (res as any)?.data || res;
};

// ─── 9. Settings ─────────────────────────────────────────────────────────────
export const superAdminGetSettings = async (adminId: string) => {
  const res = await api.get(`superAdmin/admin/${adminId}/settings`);
  return (res as any)?.data || res;
};

export const superAdminSaveSettings = async (adminId: string, payload: any) => {
  try {
    const res = await api.post(`superAdmin/admin/${adminId}/settings`, payload);
    return (res as any)?.data || res;
  } catch (err: any) {
    if ([404, 405, 409].includes(err?.response?.status)) {
      try {
        const patchRes = await api.patch(`superAdmin/admin/${adminId}/settings`, payload);
        return (patchRes as any)?.data || patchRes;
      } catch {
        const putRes = await api.put(`superAdmin/admin/${adminId}/settings`, payload);
        return (putRes as any)?.data || putRes;
      }
    }
    throw err;
  }
};

export const superAdminResetSettings = async (adminId: string) => {
  const res = await api.post(`superAdmin/admin/${adminId}/settings/reset`);
  return (res as any)?.data || res;
};

// ─── 10. Enquiries ───────────────────────────────────────────────────────────
export const superAdminGetEnquiries = async (adminId: string) => {
  const res = await api.get(`superAdmin/admin/${adminId}/enquires`);
  return (res as any)?.data || res;
};

export const superAdminMarkEnquiriesRead = async (adminId: string) => {
  const res = await api.patch(`superAdmin/admin/${adminId}/enquires/mark-all-read`);
  return (res as any)?.data || res;
};

export const superAdminGetEnquiryById = async (adminId: string, enquiryId: string | number) => {
  const res = await api.get(`superAdmin/admin/${adminId}/enquires/${enquiryId}`);
  return (res as any)?.data || res;
};

export const superAdminUpdateEnquiryStatus = async (
  adminId: string,
  enquiryId: string | number,
  status: string
) => {
  const res = await api.patch(`superAdmin/admin/${adminId}/enquires/${enquiryId}`, { status });
  return (res as any)?.data || res;
};

export const superAdminDeleteEnquiry = async (adminId: string, enquiryId: string | number) => {
  const res = await api.delete(`superAdmin/admin/${adminId}/enquires/${enquiryId}`);
  return (res as any)?.data || res;
};
