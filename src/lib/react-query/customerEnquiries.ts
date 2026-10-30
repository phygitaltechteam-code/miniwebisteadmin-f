import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCustomerEnquiries,
  updateCustomerEnquiryStatus,
  deleteCustomerEnquiry,
} from '@/lib/api/customerEnquiriesApi';
import { CustomerEnquiry } from '@/types/profile';
import toast from 'react-hot-toast';

export const CUSTOMER_ENQUIRIES_QUERY_KEY = ['customers', 'enquires'];

/**
 * Admin panel (no adminId)  -> GET customers/enquires
 * Super admin (with adminId) -> GET superAdmin/admin/:adminId/enquires
 */
const enquiriesQueryKey = (adminId?: string) =>
  adminId ? ['superAdmin', 'admin', adminId, 'enquires'] : CUSTOMER_ENQUIRIES_QUERY_KEY;

/**
 * Hook to fetch customer enquiries
 */
export const useCustomerEnquiries = (adminId?: string, options?: { enabled?: boolean; refetchInterval?: number }) => {
  return useQuery<CustomerEnquiry[]>({
    queryKey: enquiriesQueryKey(adminId),
    // Wrap the call: react-query passes its own context object as the first argument
    queryFn: () => getCustomerEnquiries(adminId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    ...options,
  });
};

/**
 * Hook to update status of an enquiry (PATCH customers/enquires/:id or superAdmin route)
 */
export const useUpdateCustomerEnquiryStatus = (adminId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CustomerEnquiry['status'] }) =>
      updateCustomerEnquiryStatus(id, status, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiriesQueryKey(adminId) });
      toast.success('Enquiry status updated');
    },
    onError: (err: any) => {
      console.warn('Failed to update enquiry status:', err);
    },
  });
};

/**
 * Hook to delete an enquiry
 */
export const useDeleteCustomerEnquiry = (adminId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomerEnquiry(id, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiriesQueryKey(adminId) });
      toast.success('Enquiry removed');
    },
  });
};
