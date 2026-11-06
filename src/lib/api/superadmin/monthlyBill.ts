import { api, isFranchiseScope } from '@/utils/axios';

/**
 * Franchise monthly bills: what a franchise owes SuperAdmin for its new cards and renewals in a month (rate per card).
 * Franchise session: franchise/monthly-bills (own bill, view only).
 * SuperAdmin: superAdmin/monthly-bills (all franchises, totals only) and superAdmin/franchise/:id/monthly-bills (one bill + mark paid).
 */
export type BillPartStatus = 'DONE' | 'PENDING';

export interface MonthlyBillCard {
  adminId?: string;
  businessName?: string;
  cardLink?: string;
  createdAt?: string;
  renewedAt?: string;
  planName?: string;
  isDeleted?: boolean;
}

export interface MonthlyBillPart {
  count: number;
  amount: number;
  paymentStatus?: BillPartStatus | string;
  paymentReceivedDate?: string | null;
  cards?: MonthlyBillCard[];
}

export interface MonthlyBill {
  billNo?: string;
  monthLabel?: string;
  rate?: number;
  franchise?: { id?: string; businessName?: string; fullname?: string } | null;
  newCards: MonthlyBillPart;
  renewals: MonthlyBillPart;
  totalAmount: number;
  note?: string | null;
}

export interface MonthQuery {
  year: number;
  month: number; // 1-12
}

export interface MarkBillPaidPayload extends MonthQuery {
  newCardsStatus?: BillPartStatus;
  newCardsPaidAt?: string; // yyyy-mm-dd; left out = today
  renewalStatus?: BillPartStatus;
  renewalPaidAt?: string;
  note?: string;
}

const emptyPart = (): MonthlyBillPart => ({ count: 0, amount: 0, cards: [] });

const toPart = (raw: any): MonthlyBillPart => ({
  ...emptyPart(),
  ...(raw || {}),
  count: Number(raw?.count) || 0,
  amount: Number(raw?.amount) || 0,
  cards: Array.isArray(raw?.cards) ? raw.cards : [],
});

export const toMonthlyBill = (raw: any): MonthlyBill => {
  const newCards = toPart(raw?.newCards);
  const renewals = toPart(raw?.renewals);
  return {
    ...(raw || {}),
    franchise: raw?.franchise || (raw?.franchiseId ? { id: raw.franchiseId, businessName: raw.businessName } : null),
    newCards,
    renewals,
    totalAmount: Number(raw?.totalAmount ?? newCards.amount + renewals.amount) || 0,
  };
};

const unwrap = (res: any) => res?.data ?? res;

/** One franchise's bill for a month (franchise session: its own) */
export const getFranchiseMonthlyBill = async (franchiseId: string | undefined, q: MonthQuery): Promise<MonthlyBill> => {
  const url = isFranchiseScope() || !franchiseId ? 'franchise/monthly-bills' : `superAdmin/franchise/${franchiseId}/monthly-bills`;
  const res: any = await api.get(url, { params: q });
  return toMonthlyBill(unwrap(res));
};

/** SuperAdmin: every franchise's bill totals for a month */
export const getMonthlyBillsOverview = async (q: MonthQuery): Promise<MonthlyBill[]> => {
  const res: any = await api.get('superAdmin/monthly-bills', { params: q });
  const data = unwrap(res);
  const rows = Array.isArray(data) ? data : data?.bills || data?.franchises || data?.items || data?.rows || data?.data || [];
  return (Array.isArray(rows) ? rows : []).map(toMonthlyBill);
};

/** SuperAdmin: report for the admins it added directly (no franchise); report only, no bill no / paid status */
export const getDirectMonthlyReport = async (q: MonthQuery): Promise<MonthlyBill> => {
  const res: any = await api.get('superAdmin/monthly-bills/direct', { params: q });
  return toMonthlyBill(unwrap(res));
};

/** SuperAdmin: mark a bill part PAID (DONE) or reopen it (PENDING) */
export const markMonthlyBill = async (franchiseId: string, payload: MarkBillPaidPayload): Promise<MonthlyBill> => {
  const res: any = await api.patch(`superAdmin/franchise/${franchiseId}/monthly-bills`, payload);
  return toMonthlyBill(unwrap(res));
};

export const isPartPaid = (part?: MonthlyBillPart) => String(part?.paymentStatus || '').toUpperCase() === 'DONE';
