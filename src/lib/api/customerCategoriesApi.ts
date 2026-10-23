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
export const getCustomerCategories = async (): Promise<CustomerCategory[]> => {
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

  // Try customers/categories first
  try {
    const res = await api.get('customers/categories');
    const parsed = parseList(res as any);
    if (parsed && parsed.length > 0) return parsed;
  } catch (err: any) {
    // fall through to superAdmin fallback
  }

  // Fallback: superAdmin/categories (same shape)
  try {
    const res = await api.get('superAdmin/categories');
    const parsed = parseList(res as any);
    if (parsed && parsed.length > 0) return parsed;
  } catch (err: any) {
    console.error('[getCustomerCategories] Both category endpoints failed:', err);
  }

  return [];
};
