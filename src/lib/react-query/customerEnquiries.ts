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
 * Hook to fetch customer enquiries via GET customers/enquires
 */
export const useCustomerEnquiries = (options?: { enabled?: boolean }) => {
  return useQuery<CustomerEnquiry[]>({
    queryKey: CUSTOMER_ENQUIRIES_QUERY_KEY,
    queryFn: getCustomerEnquiries,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    ...options,
  });
};

/**
 * Hook to update status of an enquiry (PATCH customers/enquires/:id)
 */
export const useUpdateCustomerEnquiryStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CustomerEnquiry['status'] }) =>
      updateCustomerEnquiryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_ENQUIRIES_QUERY_KEY });
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
export const useDeleteCustomerEnquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomerEnquiry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_ENQUIRIES_QUERY_KEY });
      toast.success('Enquiry removed');
    },
  });
};
