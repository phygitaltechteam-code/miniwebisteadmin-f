import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCategories,
  saveCategory,
  editCategory,
  deleteCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/lib/api/superadmin/category';
import { SUPERADMIN_CATEGORY_KEYS } from '../queryKeys';
import toast from 'react-hot-toast';

export const useGetCategories = () => {
  return useQuery({
    queryKey: [SUPERADMIN_CATEGORY_KEYS.GET_ALL],
    queryFn: getCategories,
  });
};

export const useGetCategory = useGetCategories;

export const useSaveCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryPayload) => saveCategory(data),
    onSuccess: () => {
      toast.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: [SUPERADMIN_CATEGORY_KEYS.GET_ALL] });
    },
    onError: (error: any) => {
      toast.error('Failed to save category: ' + (error?.message || 'Error occurred'));
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryPayload }) => editCategory(id, data),
    onSuccess: () => {
      toast.success('Category updated successfully');
      queryClient.invalidateQueries({ queryKey: [SUPERADMIN_CATEGORY_KEYS.GET_ALL] });
    },
    onError: (error: any) => {
      toast.error('Failed to update category: ' + (error?.message || 'Error occurred'));
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: [SUPERADMIN_CATEGORY_KEYS.GET_ALL] });
    },
    onError: (error: any) => {
      toast.error('Failed to delete category: ' + (error?.message || 'Error occurred'));
    },
  });
};
