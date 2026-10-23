import { updateAdminProfile } from '@/lib/api/adminApi';
import {
  adminPayload,
  deleteAdmin,
  editAdmin,
  getAdmins,
  saveAdminProfile,
  admin,
} from '@/lib/api/superadmin/admin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export type { admin, adminPayload };

export const useSaveAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveAdminProfile,
    onSuccess: () => {
      toast.success('Admin registered successfully!');
    },
    onError: (error: any) => {
      console.log('errors', error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.message ||
        'Failed to register admin';
      toast.error(backendMessage);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin'],
      });
    },
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => {
      toast.success('Admin deleted successfully!');
    },
    onError: (error: any) => {
      console.log('errors', error);
      const backendMessage =
        error?.response?.data?.message || 'Failed to delete admin';
      toast.error(backendMessage);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin'],
      });
    },
  });
};

export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: adminPayload }) => {
      return editAdmin(id, data);
    },
    onSuccess: () => {
      toast.success('Admin updated successfully!');
    },
    onError: (error: any) => {
      console.log('errors', error);
      const backendMessage =
        error?.response?.data?.message || 'Failed to edit admin';
      toast.error(backendMessage);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin'],
      });
    },
  });
};

export const useGetAdmin = () =>
  useQuery<admin[]>({
    queryKey: ['admin'],
    queryFn: () => getAdmins(),
  });
