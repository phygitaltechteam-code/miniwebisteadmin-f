import {
  deleteFranchise,
  getFranchises,
  FranchiseItem,
  FranchisePayload,
  saveFranchise,
  updateFranchise,
} from '@/lib/api/superadmin/franchise';
import { SUPERADMIN_FRANCHISE_KEYS } from '@/lib/react-query/queryKeys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useGetFranchises = () => {
  return useQuery({
    queryKey: [SUPERADMIN_FRANCHISE_KEYS.GET_ALL],
    queryFn: getFranchises,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSaveFranchise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FranchisePayload) => saveFranchise(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({
        queryKey: [SUPERADMIN_FRANCHISE_KEYS.GET_ALL],
      });
      const successMsg = res?.message || 'Franchise created successfully';
      toast.success(successMsg);
    },
    onError: (error: any) => {
      console.error('Franchise save error:', error);
      const errList = error?.response?.data?.errors;
      const errMsg =
        (Array.isArray(errList) && errList.length > 0
          ? errList.map((e: any) => e.message || e.field).join(', ')
          : null) ||
        error?.response?.data?.message ||
        'Failed to create franchise';
      toast.error(errMsg);
    },
  });
};

export const useUpdateFranchise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FranchisePayload> }) =>
      updateFranchise(id, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({
        queryKey: [SUPERADMIN_FRANCHISE_KEYS.GET_ALL],
      });
      const successMsg = res?.message || 'Franchise updated successfully';
      toast.success(successMsg);
    },
    onError: (error: any) => {
      console.error('Franchise update error:', error);
      const errList = error?.response?.data?.errors;
      const errMsg =
        (Array.isArray(errList) && errList.length > 0
          ? errList.map((e: any) => e.message || e.field).join(', ')
          : null) ||
        error?.response?.data?.message ||
        'Failed to update franchise';
      toast.error(errMsg);
    },
  });
};

export const useDeleteFranchise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFranchise(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({
        queryKey: [SUPERADMIN_FRANCHISE_KEYS.GET_ALL],
      });
      const successMsg = res?.message || 'Franchise deleted successfully';
      toast.success(successMsg);
    },
    onError: (error: any) => {
      console.error('Franchise delete error:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete franchise');
    },
  });
};
