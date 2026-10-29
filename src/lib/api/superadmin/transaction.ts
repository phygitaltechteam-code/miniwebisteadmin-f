import { api, isFranchiseUser } from '@/utils/axios';

/**
 * Plan bills (one per "select plan"): superAdmin/transactions, or franchise/transactions on a franchise session
 * (its own plan bills plus its admins' bills). Newest first.
 */
export interface TransactionRow {
  id: string;
  billNo: string;
  businessName?: string;
  addedBy?: { fullname?: string; role?: string; label?: string } | null;
  paymentStatus?: 'DONE' | 'PENDING' | string;
  paymentDate?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  planLabel?: string;
  paymentMethod?: string | null;
  amount?: number;
  type?: 'ADMIN' | 'FRANCHISE';
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  paymentStatus?: string;
  type?: 'ADMIN' | 'FRANCHISE';
  adminId?: string;
  franchiseId?: string;
  from?: string; // yyyy-mm-dd
  to?: string; // yyyy-mm-dd
}

export interface TransactionPage {
  rows: TransactionRow[];
  total: number;
}

const base = () => (isFranchiseUser() ? 'franchise' : 'superAdmin');

export const getTransactions = async (filters: TransactionFilters = {}): Promise<TransactionPage> => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
  const res: any = await api.get(`${base()}/transactions`, { params });
  const data = res?.data ?? res;
  const rows: TransactionRow[] = Array.isArray(data)
    ? data
    : data?.transactions || data?.items || data?.rows || data?.data || [];
  const total = Number(data?.total ?? data?.pagination?.total ?? data?.meta?.total ?? rows.length) || rows.length;
  return { rows, total };
};
