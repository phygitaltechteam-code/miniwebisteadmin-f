import { api } from '@/utils/axios';

export interface CustomerCategory {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

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

    return data.map((item: any) => ({
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
