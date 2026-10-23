import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCustomerInfo,
  createCustomerInfo,
  updateCustomerInfo,
  CustomerInfoPayload,
  CustomerInfoResponse,
} from '@/lib/api/customerInfoApi';
import toast from 'react-hot-toast';

export const CUSTOMER_INFO_QUERY_KEY = ['customers', 'info'];

/**
 * Hook to fetch customer basic profile information (GET customers/info)
 */
export const useCustomerInfo = (options?: { enabled?: boolean }) => {
  return useQuery<CustomerInfoResponse>({
    queryKey: CUSTOMER_INFO_QUERY_KEY,
    queryFn: getCustomerInfo,
    ...options,
  });
};

/**
 * Hook to create customer basic profile information (POST customers/info)
 */
export const useCreateCustomerInfo = (options?: {
  onSuccess?: (data: CustomerInfoResponse) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerInfoPayload) => createCustomerInfo(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_INFO_QUERY_KEY });
      toast.success(res?.message || 'Customer basic details saved successfully!');
      options?.onSuccess?.(res);
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save customer basic details';
      toast.error(msg);
      options?.onError?.(error);
    },
  });
};

/**
 * Hook to update customer basic profile information (PATCH customers/info)
 */
export const useUpdateCustomerInfo = (options?: {
  onSuccess?: (data: CustomerInfoResponse) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CustomerInfoPayload>) => updateCustomerInfo(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_INFO_QUERY_KEY });
      toast.success(res?.message || 'Customer basic details updated successfully!');
      options?.onSuccess?.(res);
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update customer basic details';
      toast.error(msg);
      options?.onError?.(error);
    },
  });
};
