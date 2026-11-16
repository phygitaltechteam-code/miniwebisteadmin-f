import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from '@/lib/api/customersApi';
import {apiErrorMessage} from '@/lib/react-query/leads';
import type {CustomerInput, CustomerListParams} from '@/types/customer';

/** All customer queries of one business start with this key, so one invalidation refreshes them all. */
export const customersKey = (adminId?: string) =>
  ['customers-list', adminId ?? 'me'] as const;

export const useCustomers = (params: CustomerListParams, adminId?: string) =>
  useQuery({
    queryKey: [...customersKey(adminId), params],
    queryFn: () => listCustomers(params, adminId),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

export const useCreateCustomer = (adminId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(input, adminId),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: customersKey(adminId)}),
    onError: (error) =>
      toast.error(apiErrorMessage(error, 'Could not save the customer')),
  });
};

export const useUpdateCustomer = (adminId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: CustomerInput}) =>
      updateCustomer(id, input, adminId),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: customersKey(adminId)}),
    onError: (error) =>
      toast.error(apiErrorMessage(error, 'Could not update the customer')),
  });
};

export const useDeleteCustomer = (adminId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id, adminId),
    onSuccess: () => {
      toast.success('Customer deleted');
      queryClient.invalidateQueries({queryKey: customersKey(adminId)});
    },
    onError: (error) =>
      toast.error(apiErrorMessage(error, 'Could not delete the customer')),
  });
};
