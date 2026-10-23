import { api } from '@/utils/axios';
import { z } from 'zod';

export const createAdminCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').trim(),
});

export const updateAdminCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').trim(),
});

export type CreateCategoryPayload = z.infer<typeof createAdminCategorySchema>;
export type UpdateCategoryPayload = z.infer<typeof updateAdminCategorySchema>;

export interface AdminCategory {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

// GET superAdmin/categories - Pure API, no static dummy categories
export const getCategories = async (): Promise<AdminCategory[]> => {
  try {
    const response = await api.get('superAdmin/categories');
    const resAny = response as any;
    const data =
      resAny?.data?.categories ||
      resAny?.data?.adminCategories ||
      resAny?.categories ||
      resAny?.adminCategories ||
      (Array.isArray(resAny?.data) ? resAny.data : null) ||
      (Array.isArray(response) ? response : []);

    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.id || item._id || item.DishCategoryID || item.adminCategoryId || item.categoryId || '',
        name: item.name || item.CategoryName || item.categoryName || 'Unnamed Category',
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'N/A',
        updatedAt: item.updatedAt,
      }));
    }
    return [];
  } catch (error) {
    console.error('API superAdmin/categories failed:', error);
    return [];
  }
};

export const getCategory = getCategories;

// POST superAdmin/categories
export const saveCategory = async (data: CreateCategoryPayload): Promise<AdminCategory> => {
  const response = await api.post('superAdmin/categories', data);
  const resAny = response as any;
  const result = resAny?.data?.category || resAny?.data || resAny?.category || resAny;
  const resolvedId =
    result?.id ||
    result?._id ||
    result?.categoryId ||
    result?.adminCategoryId ||
    resAny?.id ||
    resAny?.data?.id ||
    '';
  return {
    id: resolvedId,
    name: data.name,
    createdAt: new Date().toISOString().split('T')[0],
  };
};

// PUT superAdmin/categories/:id
export const editCategory = async (id: string, data: UpdateCategoryPayload): Promise<AdminCategory> => {
  const response = await api.patch(`superAdmin/categories/${id}`, data);
  return (response as any)?.data || response;
};

// DELETE superAdmin/categories/:id
export const deleteCategory = async (id: string): Promise<{ success: boolean; id: string }> => {
  await api.delete(`superAdmin/categories/${id}`);
  return { success: true, id };
};
