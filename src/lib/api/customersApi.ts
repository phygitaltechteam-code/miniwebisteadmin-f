import {api} from '@/utils/axios';
import {apiBase, unwrap} from '@/lib/api/leadsApi';
import type {
  Customer,
  CustomerInput,
  CustomerListParams,
  CustomerListResponse,
} from '@/types/customer';

/**
 * Customers of one business: `customers/customers` for the owner, `superAdmin/admin/:adminId/customers`
 * for super admins (franchise sessions are rewritten to `franchise/admin/:adminId/customers` by axios).
 */
const customersPath = (adminId?: string) => `${apiBase(adminId)}/customers`;

export const listCustomers = async (
  params: CustomerListParams,
  adminId?: string,
): Promise<CustomerListResponse> => {
  const query: Record<string, string | number> = {};
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = Math.min(params.limit, 100);
  const res = await api.get(customersPath(adminId), {params: query});
  const data = unwrap<Partial<CustomerListResponse>>(res) || {};
  const customers = Array.isArray(data.customers) ? data.customers : [];
  return {
    customers,
    pagination: data.pagination || {
      page: params.page || 1,
      limit: params.limit || customers.length,
      total: customers.length,
      totalPages: 1,
    },
  };
};

export const getCustomer = async (
  id: string,
  adminId?: string,
): Promise<Customer> =>
  unwrap<Customer>(await api.get(`${customersPath(adminId)}/${id}`));

export const createCustomer = async (
  input: CustomerInput,
  adminId?: string,
): Promise<Customer> =>
  unwrap<Customer>(await api.post(customersPath(adminId), input));

export const updateCustomer = async (
  id: string,
  input: CustomerInput,
  adminId?: string,
): Promise<Customer> =>
  unwrap<Customer>(await api.patch(`${customersPath(adminId)}/${id}`, input));

export const deleteCustomer = async (
  id: string,
  adminId?: string,
): Promise<void> => {
  await api.delete(`${customersPath(adminId)}/${id}`);
};
