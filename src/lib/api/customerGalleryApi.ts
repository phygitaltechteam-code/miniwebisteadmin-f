import { api } from '@/utils/axios';
import { ProfileData, GalleryImage, YoutubeVideo } from '@/types/profile';

/**
 * Exact gallery item shape:
 * {
 *   "title": "DSFDSF",
 *   "description": "SDFDSFDS",
 *   "image": "data:image/jpeg;base64,..."
 * }
 */
export interface BackendGalleryItem {
  title: string;
  description: string;
  image: string;
  [key: string]: any;
}

export interface CustomerGalleryPayload {
  gallery: BackendGalleryItem[];
  galleryImages: BackendGalleryItem[];
  youtubeVideos?: YoutubeVideo[];
  [key: string]: any;
}

export interface CustomerGalleryResponse {
  statusCode?: number;
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: any;
  gallery?: any;
  errors?: any;
  [key: string]: any;
}

/**
 * Format frontend gallery items into payload with BOTH `gallery` and `galleryImages`:
 * {
 *   "gallery": [ { title, description, image } ],
 *   "galleryImages": [ { title, description, image } ]
 * }
 */
export const formatCustomerGalleryPayload = (
  source: Partial<ProfileData> | any[]
): { gallery: BackendGalleryItem[]; galleryImages: BackendGalleryItem[] } => {
  const list = Array.isArray(source)
    ? source
    : (source.galleryImages || source.gallery || []);

  const items: BackendGalleryItem[] = list.map((item: any) => ({
    title: (item.title || item.name || '').trim(),
    description: (item.description || '').trim(),
    image: item.image || item.url || item.imageUrl || '',
  }));

  return {
    gallery: items,
    galleryImages: items,
  };
};

/**
 * Parse backend response into frontend GalleryImage[]
 */
export const parseCustomerGalleryResponse = (res: any): GalleryImage[] => {
  const raw = (res as any)?.data || (res as any)?.gallery || (res as any)?.galleryImages || res;
  let list: any[] = [];

  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.gallery)) list = raw.gallery;
    else if (Array.isArray(raw.galleryImages)) list = raw.galleryImages;
    else if (Array.isArray(raw.images)) list = raw.images;
  }

  return list.map((img: any, idx: number) => {
    if (typeof img === 'string') {
      return {
        id: `img-${idx}`,
        url: img,
        image: img,
        title: '',
        description: '',
      };
    }
    const imgUrl = img.image || img.url || img.imageUrl || '';
    return {
      id: img.id || img._id || `img-${idx}-${Date.now()}`,
      url: imgUrl,
      image: imgUrl,
      title: img.title || '',
      description: img.description || '',
      alt: img.alt || img.title || '',
    };
  });
};

/**
 * GET customers/gallery OR superAdmin/admin/:adminId/gallery
 * The list is paginated; a large limit loads every image (gallery reorder needs all ids).
 */
const GALLERY_PARAMS = { page: 1, limit: 100 };

export const getCustomerGallery = async (adminId?: string): Promise<CustomerGalleryResponse> => {
  if (adminId) {
    const response = await api.get(`superAdmin/admin/${adminId}/gallery`, { params: GALLERY_PARAMS });
    return (response as any)?.data || response;
  }
  try {
    const response = await api.get('customers/gallery', { params: GALLERY_PARAMS });
    return (response as any)?.data || response;
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      try {
        const pluralRes = await api.get('customers/galleries');
        return (pluralRes as any)?.data || pluralRes;
      } catch {
        const fallback = await api.get('customers/info');
        return (fallback as any)?.data || fallback;
      }
    }
    throw error;
  }
};

/**
 * Convert base64 data URL to a File instance
 */
export const base64ToFile = (dataurl: string, filename: string): File | null => {
  try {
    if (!dataurl || !dataurl.startsWith('data:')) return null;
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
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
 * Format single gallery item as FormData with separate top-level fields:
 * - 'title'
 * - 'description'
 * - 'image'
 */
export const formatSingleGalleryFormData = (item: any): FormData => {
  const formData = new FormData();
  const title = (item.title || item.name || '').trim();
  const description = (item.description || '').trim();

  formData.append('title', title);
  if (description) {
    formData.append('description', description);
  }

  const rawFile =
    item.file instanceof File
      ? item.file
      : (typeof item.image === 'string' && item.image.startsWith('data:')
          ? base64ToFile(item.image, `${title || 'photo'}.jpg`)
          : (typeof item.url === 'string' && item.url.startsWith('data:')
              ? base64ToFile(item.url, `${title || 'photo'}.jpg`)
              : null));

  if (rawFile) {
    formData.append('image', rawFile, rawFile.name || `${title || 'photo'}.jpg`);
  } else if (item.image || item.url) {
    formData.append('image', item.image || item.url);
  }

  return formData;
};

/**
 * Format gallery data as multipart/form-data for customers/gallery or superAdmin/admin/:adminId/gallery
 * Sends separate title, description, image fields (not wrapped in 'gallery')
 */
export const formatGalleryFormData = (
  source: Partial<ProfileData> | any[]
): FormData => {
  const list = Array.isArray(source)
    ? source
    : (source.galleryImages || source.gallery || []);

  const formData = new FormData();

  list.forEach((item: any) => {
    const title = (item.title || item.name || '').trim();
    const description = (item.description || '').trim();

    // Always append both (even empty) so title[i] / description[i] / image[i] stay lined up
    formData.append('title', title);
    formData.append('description', description);

    const rawFile =
      item.file instanceof File
        ? item.file
        : (typeof item.image === 'string' && item.image.startsWith('data:')
            ? base64ToFile(item.image, `${title || 'photo'}.jpg`)
            : (typeof item.url === 'string' && item.url.startsWith('data:')
                ? base64ToFile(item.url, `${title || 'photo'}.jpg`)
                : null));

    if (rawFile) {
      formData.append('image', rawFile, rawFile.name || `${title || 'photo'}.jpg`);
    } else if (item.image || item.url) {
      formData.append('image', item.image || item.url);
    }
  });

  return formData;
};

/**
 * Save or update gallery (POST customers/gallery or superAdmin/admin/:adminId/gallery as FormData)
 */
export const saveOrUpdateCustomerGallery = async (
  profileOrList: any,
  adminId?: string
): Promise<CustomerGalleryResponse> => {
  const list = Array.isArray(profileOrList)
    ? profileOrList
    : (profileOrList.galleryImages || profileOrList.gallery || []);

  if (list.length === 0) {
    return { success: true, message: 'No gallery photos to upload' };
  }

  const baseEndpoint = adminId ? `superAdmin/admin/${adminId}/gallery` : 'customers/gallery';

  const uploadSingle = async (item: any): Promise<any> => {
    const formData = formatSingleGalleryFormData(item);
    const hasRealId = item.id && !String(item.id).startsWith('img-') && !String(item.id).startsWith('temp-');

    if (adminId && hasRealId) {
      try {
        const patchRes = await api.patch(`${baseEndpoint}/${item.id}`, formData);
        return (patchRes as any)?.data || patchRes;
      } catch (patchErr: any) {
        if (patchErr?.response?.status === 404 || patchErr?.response?.status === 405) {
          const postRes = await api.post(baseEndpoint, formData);
          return (postRes as any)?.data || postRes;
        }
        throw patchErr;
      }
    }

    try {
      const res = await api.post(baseEndpoint, formData);
      return (res as any)?.data || res;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 405 || status === 404) {
        try {
          const patchRes = await api.patch(baseEndpoint, formData);
          return (patchRes as any)?.data || patchRes;
        } catch {
          if (!adminId) {
            const pluralRes = await api.post('customers/galleries', formData);
            return (pluralRes as any)?.data || pluralRes;
          }
        }
      }
      throw err;
    }
  };

  // If single item, send as a single FormData
  if (list.length === 1) {
    return await uploadSingle(list[0]);
  }

  // If multiple items, try batch FormData first
  try {
    const batchFormData = formatGalleryFormData(list);
    const res = await api.post(baseEndpoint, batchFormData);
    return (res as any)?.data || res;
  } catch (err: any) {
    // If batch fails, upload each photo individually
    if (err?.response?.status === 400 || err?.response?.status === 404 || err?.response?.status === 405) {
      const results = await Promise.all(list.map((item: any) => uploadSingle(item)));
      const last = results[results.length - 1];
      return (last as any)?.data || last || { success: true, message: 'Photos uploaded successfully' };
    }
    throw err;
  }
};

export const deleteCustomerGallery = async (
  id: string | number,
  adminId?: string
): Promise<any> => {
  const endpoint = adminId
    ? `superAdmin/admin/${adminId}/gallery/${id}`
    : `customers/gallery/${id}`;
  try {
    const res = await api.delete(endpoint);
    return (res as any)?.data || res;
  } catch (err) {
    console.warn(`Could not delete gallery item ${id}:`, err);
    return null;
  }
};

export const bulkDeleteCustomerGallery = async (
  ids: (string | number)[],
  adminId?: string
): Promise<any> => {
  const endpoint = adminId
    ? `superAdmin/admin/${adminId}/gallery`
    : 'customers/gallery';
  try {
    const res = await api.delete(endpoint, { data: { ids } });
    return (res as any)?.data || res;
  } catch (err) {
    console.warn('Could not bulk delete gallery items:', err);
    return null;
  }
};

export const createCustomerGallery = async (
  payload: any,
  adminId?: string
): Promise<CustomerGalleryResponse> => {
  return saveOrUpdateCustomerGallery(payload, adminId);
};

export const updateCustomerGallery = async (
  payload: any,
  adminId?: string
): Promise<CustomerGalleryResponse> => {
  return saveOrUpdateCustomerGallery(payload, adminId);
};

// Re-export video API utilities from customerVideosApi
export * from './customerVideosApi';
