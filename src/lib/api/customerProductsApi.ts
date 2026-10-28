import { api } from '@/utils/axios';
import { ProductItem } from '@/types/profile';

export interface CustomerProductPayload {
  name: string;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  image?: string;
  isHideEnquiry?: boolean;
  hideEnquiry?: boolean;
  isHideDownloadProductCart?: boolean;
  hideDownload?: boolean;
  removeImage?: boolean;
  customiseMessage?: boolean;
  customEnquiryMessage?: string;
  [key: string]: any;
}

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CustomerProductResponse {
  success?: boolean;
  message?: string;
  data?: any;
  product?: any;
  products?: any[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  [key: string]: any;
}

/**
 * Format frontend ProductItem into backend payload matching createProductSchema / updateProductSchema
 */
export const formatProductPayload = (item: Partial<ProductItem>): CustomerProductPayload => {
  const name = (item.name || item.title || '').trim();
  const description = (item.description || '').trim();
  const currency = (item.currency || item.currencyInfo || 'INR').trim();
  const numPrice = item.price !== undefined && item.price !== '' && item.price !== null
    ? Number(item.price)
    : undefined;

  const isHideEnquiry = Boolean(item.isHideEnquiry ?? item.hideEnquiry);
  const isHideDownloadProductCart = Boolean(item.isHideDownloadProductCart ?? item.hideDownload);

  const payload: CustomerProductPayload = {
    name,
    title: name,
    description: description || undefined,
    currency: currency || 'INR',
    price: (numPrice !== undefined && !Number.isNaN(numPrice)) ? numPrice : undefined,
    isHideEnquiry,
    hideEnquiry: isHideEnquiry,
    isHideDownloadProductCart,
    hideDownload: isHideDownloadProductCart,
  };

  if (item.image) {
    payload.image = item.image;
  }
  if (item.images) {
    payload.images = item.images.filter((url) => !url.startsWith('blob:') && !url.startsWith('data:'));
  }
  if (item.removeImage) {
    payload.removeImage = true;
  }
  if (item.customiseMessage !== undefined) {
    payload.customiseMessage = item.customiseMessage;
  }
  if (item.customEnquiryMessage) {
    payload.customEnquiryMessage = item.customEnquiryMessage;
    payload.enquiryMessage = item.customEnquiryMessage;
  }

  return payload;
};

/**
 * Convert product item to multipart/form-data for image file uploads.
 * New files and already-uploaded image URLs are both appended under the "images" field,
 * matching the `images` array the products API returns.
 */
export const formatProductFormData = (item: Partial<ProductItem>, files?: File | File[]): FormData => {
  const formData = new FormData();
  const payload = formatProductPayload(item);

  formData.append('name', payload.name);
  if (payload.description) {
    formData.append('description', payload.description);
  }
  formData.append('currency', payload.currency || 'INR');
  if (payload.price !== undefined) {
    formData.append('price', String(payload.price));
  }
  formData.append('isHideEnquiry', String(payload.isHideEnquiry));
  formData.append('isHideDownloadProductCart', String(payload.isHideDownloadProductCart));

  if (item.customiseMessage && item.customEnquiryMessage) {
    formData.append('enquiryMessage', item.customEnquiryMessage);
  }

  // Keep images that are already on the server (skip local blob:/data: previews of new files)
  const isServerUrl = (url?: string) => !!url && !url.startsWith('blob:') && !url.startsWith('data:');
  const existingUrls = (item.images?.length ? item.images : item.image ? [item.image] : []).filter(isServerUrl);
  existingUrls.forEach((url) => formData.append('images', url));

  const fileList = (Array.isArray(files) ? files : files ? [files] : []).filter(Boolean);
  fileList.forEach((f) => formData.append('images', f));

  if (payload.removeImage) {
    formData.append('removeImage', 'true');
  }

  return formData;
};

/**
 * Normalize raw backend product item to frontend ProductItem
 */
export const normalizeBackendProduct = (item: any): ProductItem => {
  const id = item._id || item.id || String(Date.now());
  const name = item.name || item.title || '';
  const isHideEnquiry = Boolean(item.isHideEnquiry ?? item.hideEnquiry);
  const isHideDownload = Boolean(item.isHideDownloadProductCart ?? item.hideDownload);
  const rawImages = Array.isArray(item.images) ? item.images : Array.isArray(item.image) ? item.image : [];
  const images: string[] = rawImages
    .map((img: any) => (typeof img === 'string' ? img : img?.url || img?.path || ''))
    .filter(Boolean);
  const primaryImage = (typeof item.image === 'string' ? item.image : '') || item.imageUrl || images[0] || '';

  return {
    id,
    _id: item._id || item.id,
    name,
    title: name,
    description: item.description || '',
    price: item.price !== undefined && item.price !== null ? item.price : '',
    currency: item.currency || 'INR',
    image: primaryImage,
    images: images.length > 0 ? images : primaryImage ? [primaryImage] : [],
    isHideEnquiry,
    hideEnquiry: isHideEnquiry,
    isHideDownloadProductCart: isHideDownload,
    hideDownload: isHideDownload,
    customiseMessage: Boolean(item.customiseMessage || item.enquiryMessage),
    customEnquiryMessage: item.enquiryMessage || item.customEnquiryMessage || '',
    status: item.status || 'Active',
  };
};

/**
 * GET customers/products OR superAdmin/admin/:adminId/products
 * Retrieves products catalog using listProductsSchema query parameters
 */
export const getCustomerProducts = async (
  params?: ListProductsQuery,
  adminId?: string
): Promise<CustomerProductResponse> => {
  const endpoint = adminId ? `superAdmin/admin/${adminId}/products` : 'customers/products';
  try {
    const response = await api.get(endpoint, { params });
    return (response as any)?.data || response;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

/**
 * POST customers/products OR superAdmin/admin/:adminId/products
 * Creates a new product adhering to createProductSchema
 */
export const createCustomerProduct = async (
  payload: CustomerProductPayload | FormData,
  adminId?: string
): Promise<CustomerProductResponse> => {
  const endpoint = adminId ? `superAdmin/admin/${adminId}/products` : 'customers/products';
  try {
    const response = await api.post(endpoint, payload);
    return (response as any)?.data || response;
  } catch (error) {
    console.error(`Error creating product via POST ${endpoint}:`, error);
    throw error;
  }
};

export const isTempProductId = (id: any): boolean => {
  if (!id) return true;
  const str = String(id).trim();
  return str.startsWith('temp-') || str.startsWith('new-');
};

/**
 * PATCH customers/products/:id OR superAdmin/admin/:adminId/products/:id
 * Updates an existing product adhering to updateProductSchema.
 * Never calls PATCH with temporary frontend IDs (e.g. temp-...).
 */
export const updateCustomerProduct = async (
  id: string | number,
  payload: Partial<CustomerProductPayload> | FormData,
  adminId?: string
): Promise<CustomerProductResponse> => {
  if (isTempProductId(id)) {
    console.warn(`[customerProductsApi] Prevented PATCH on temporary ID "${id}". Redirecting to POST.`);
    return createCustomerProduct(payload as any, adminId);
  }
  const endpoint = adminId ? `superAdmin/admin/${adminId}/products/${id}` : `customers/products/${id}`;
  try {
    const response = await api.patch(endpoint, payload);
    return (response as any)?.data || response;
  } catch (error) {
    console.error(`Error updating product ${id} via PATCH ${endpoint}:`, error);
    throw error;
  }
};

/**
 * DELETE customers/products/:id OR superAdmin/admin/:adminId/products/:id
 */
export const deleteCustomerProduct = async (
  id: string | number,
  adminId?: string
): Promise<CustomerProductResponse> => {
  if (isTempProductId(id)) {
    return { success: true, message: 'Local product removed' };
  }
  const endpoint = adminId ? `superAdmin/admin/${adminId}/products/${id}` : `customers/products/${id}`;
  try {
    const response = await api.delete(endpoint);
    return (response as any)?.data || response;
  } catch (error) {
    console.error(`Error deleting product via DELETE ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Sync entire products catalog:
 * 1. Executes deletions for removed products (skips local temporary IDs)
 * 2. Creates new products via POST customers/products (individual object payload)
 * 3. Updates existing persisted products via PATCH customers/products/:id
 */
export const syncCustomerProducts = async (
  products: ProductItem[],
  deletedProductIds: (string | number)[] = [],
  adminId?: string
): Promise<CustomerProductResponse> => {
  // 1. Delete removed items that were previously saved on server
  for (const delId of deletedProductIds) {
    if (delId && !isTempProductId(delId) && isNaN(Number(delId))) {
      try {
        await deleteCustomerProduct(delId, adminId);
      } catch (err) {
        console.warn(`Could not delete product ${delId}:`, err);
      }
    }
  }

  // 2. Individual CRUD adhering to backend schemas (one product object at a time)
  const results: any[] = [];

  for (const prod of products) {
    const isNewItem = isTempProductId(prod._id) && isTempProductId(prod.id);
    const hasRealBackendId = !isNewItem;
    const backendId = (!isTempProductId(prod._id) ? prod._id : (!isTempProductId(prod.id) ? prod.id : undefined));

    try {
      const files = prod.imageFiles?.length ? prod.imageFiles : prod.imageFile ? [prod.imageFile] : [];
      if (files.length > 0) {
        const formData = formatProductFormData(prod, files);
        if (hasRealBackendId && backendId) {
          const res = await updateCustomerProduct(backendId, formData, adminId);
          results.push(res);
        } else {
          // New product -> Always use POST customers/products or superAdmin/admin/:adminId/products
          const res = await createCustomerProduct(formData, adminId);
          results.push(res);
          const newId =
            (res as any)?.data?.product?._id ||
            (res as any)?.data?.product?.id ||
            (res as any)?.data?._id ||
            (res as any)?.data?.id ||
            (res as any)?.product?._id ||
            (res as any)?._id;
          if (newId) {
            prod._id = String(newId);
            prod.id = String(newId);
          }
        }
      } else {
        const payload = formatProductPayload(prod);
        if (hasRealBackendId && backendId) {
          const res = await updateCustomerProduct(backendId, payload, adminId);
          results.push(res);
        } else {
          // New product -> Always use POST customers/products or superAdmin/admin/:adminId/products
          const res = await createCustomerProduct(payload, adminId);
          results.push(res);
          const newId =
            (res as any)?.data?.product?._id ||
            (res as any)?.data?.product?.id ||
            (res as any)?.data?._id ||
            (res as any)?.data?.id ||
            (res as any)?.product?._id ||
            (res as any)?._id;
          if (newId) {
            prod._id = String(newId);
            prod.id = String(newId);
          }
        }
      }
    } catch (err: any) {
      console.error('Error synchronizing product:', prod.name || prod.title, err);
      throw err;
    }
  }

  return {
    success: true,
    message: 'All products synchronized successfully',
    data: results,
  };
};
