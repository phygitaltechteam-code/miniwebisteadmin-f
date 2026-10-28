import { api } from '@/utils/axios';

export interface CustomerCategory {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

// IDs of categories that come from the selectable category list. Only these are valid to send as
// category IDs; a manually entered category comes back from the API with its own ID, which the
// backend rejects ("Invalid categories"), so it must be sent by name instead.
const listedCategoryIds = new Set<string>();
const categoryNameById = new Map<string, string>();

/** Remember an id -> name pair seen in an API response, so an unlisted id can be sent by its name */
export const rememberCategoryName = (id: string, name: string) => {
  if (id && name) categoryNameById.set(id, name);
};

/**
 * Turn a category value into what should be sent: a listed category's id stays as is, a manual
 * category's id is replaced by its name, and anything else (e.g. a typed name) is returned unchanged.
 * Before the category list has loaded, values are passed through unchanged.
 */
export const resolveCategoryForSave = (value: string): string => {
  if (listedCategoryIds.size === 0 || listedCategoryIds.has(value)) return value;
  return categoryNameById.get(value) || value;
};

/** True when `value` is the id of a category that is NOT in the selectable list (a manual category) */
export const isUnlistedCategoryId = (value: string): boolean =>
  listedCategoryIds.size > 0 && !listedCategoryIds.has(value) && categoryNameById.has(value);

/**
 * GET customers/categories
 * Returns the list of categories available for customers to select.
 * Falls back to superAdmin/categories if the customer endpoint is not available.
 */
export const getCustomerCategories = async (adminId?: string): Promise<CustomerCategory[]> => {
  const parseList = (resAny: any): CustomerCategory[] | null => {
    const data =
      resAny?.data?.categories ||
      resAny?.data?.adminCategories ||
      resAny?.categories ||
      resAny?.adminCategories ||
      (Array.isArray(resAny?.data) ? resAny.data : null) ||
      (Array.isArray(resAny) ? resAny : null);

    if (!Array.isArray(data)) return null;

    const list: CustomerCategory[] = data.map((item: any) => ({
      id:
        item.id ||
        item._id ||
        item.categoryId ||
        item.adminCategoryId ||
        item.DishCategoryID ||
        '',
      name:
        item.name ||
        item.CategoryName ||
        item.categoryName ||
        'Unnamed Category',
      createdAt: item.createdAt
        ? new Date(item.createdAt).toISOString().split('T')[0]
        : undefined,
      updatedAt: item.updatedAt,
    }));

    list.forEach((cat) => {
      if (!cat.id) return;
      listedCategoryIds.add(cat.id);
      rememberCategoryName(cat.id, cat.name);
    });
    return list;
  };

  // If in SuperAdmin mode with adminId, fetch that admin's categories
  if (adminId) {
    try {
      const res = await api.get(`superAdmin/admin/${adminId}/categories`);
      const parsed = parseList(res as any);
      if (parsed && parsed.length > 0) return parsed;
    } catch (err: any) {
      // Fallback to superAdmin/categories (NEVER customers/ on superadmin side)
      try {
        const res = await api.get('superAdmin/categories');
        const parsed = parseList(res as any);
        if (parsed && parsed.length > 0) return parsed;
      } catch {}
    }
    return [];
  }

  // Fallback for SuperAdmin sessions without specific adminId
  try {
    const rawToken = localStorage.getItem('token');
    const isSuperAdmin = rawToken && String(rawToken).toUpperCase().includes('SUPERADMIN');
    if (isSuperAdmin) {
      const res = await api.get('superAdmin/categories');
      const parsed = parseList(res as any);
      return parsed || [];
    }
  } catch {}

  // Regular customer only: Try customers/categories
  try {
    const res = await api.get('customers/categories');
    const parsed = parseList(res as any);
    if (parsed && parsed.length > 0) return parsed;
  } catch (err: any) {
    // Normal for regular customer if endpoint unavailable
  }

  return [];
};
