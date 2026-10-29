import { api, isFranchiseUser } from '@/utils/axios';

/**
 * Subscription plans.
 * SuperAdmin: superAdmin/plans (audience ADMIN | FRANCHISE, optional franchiseId for a franchise's own admin plans).
 * Franchise:  franchise/plans (always its own admin plans).
 */

export type PlanAudience = 'ADMIN' | 'FRANCHISE';
export type PlanValidityUnit = 'DAY' | 'MONTH' | 'YEAR';

export interface PlanFeatureGroup {
  group: string;
  items: string[];
}

export interface PlanItem {
  id: string;
  audience?: PlanAudience;
  franchiseId?: string | null;
  franchise?: { id: string; fullname?: string; name?: string } | null;
  name: string;
  isFreeTrial: boolean;
  validityUnit: PlanValidityUnit;
  validityValue: number;
  price: number;
  digitalCards: number;
  unlimitedGreetingImages: boolean;
  greetingVideosPerDay: number;
  aiCredits: number;
  isActive: boolean;
  features: PlanFeatureGroup[];
  /** Admins and franchises currently on this plan */
  usedBy?: number;
}

export type PlanPayload = Omit<PlanItem, 'id' | 'franchise' | 'usedBy'>;

export interface SelectPlanPayload {
  planId: string;
  price?: number;
  startDate?: string; // ISO date-time
  expiryDate?: string; // ISO date-time
  /** Admins only; left out = unchanged */
  paymentStatus?: 'DONE' | 'PENDING';
}

/** Plan terms saved on the admin / franchise row by "select plan" */
export interface SelectedPlanTerms {
  planId?: string;
  planName?: string;
  isFreeTrial?: boolean;
  amount?: number;
  startDate?: string;
  expiryDate?: string;
  plan?: Partial<PlanItem> | null;
}

const base = () => (isFranchiseUser() ? 'franchise' : 'superAdmin');

const unwrap = (res: any) => res?.data?.data ?? res?.data;

const normalizePlan = (p: any): PlanItem => ({
  ...p,
  id: p.id || p._id || '',
  price: Number(p.price) || 0,
  validityValue: Number(p.validityValue) || 1,
  validityUnit: String(p.validityUnit || 'YEAR').toUpperCase() as PlanValidityUnit,
  digitalCards: Number(p.digitalCards) || 0,
  greetingVideosPerDay: Number(p.greetingVideosPerDay) || 0,
  aiCredits: Number(p.aiCredits) || 0,
  isFreeTrial: Boolean(p.isFreeTrial),
  unlimitedGreetingImages: Boolean(p.unlimitedGreetingImages),
  isActive: p.isActive !== false,
  features: Array.isArray(p.features) ? p.features : [],
});

export const getPlans = async (params: { audience?: PlanAudience; franchiseId?: string; isActive?: boolean } = {}): Promise<PlanItem[]> => {
  // The franchise list is always its own admin plans, so audience / franchiseId are not sent there
  const query = isFranchiseUser()
    ? { ...(params.isActive !== undefined ? { isActive: params.isActive } : {}) }
    : Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  const data = unwrap(await api.get(`${base()}/plans`, { params: query }));
  const list = Array.isArray(data) ? data : data?.plans || data?.items || [];
  return list.map(normalizePlan);
};

export const createPlan = async (payload: PlanPayload): Promise<PlanItem> => {
  const body: any = { ...payload };
  if (isFranchiseUser()) {
    delete body.audience;
    delete body.franchiseId;
  } else if (!body.franchiseId) {
    delete body.franchiseId;
  }
  return normalizePlan(unwrap(await api.post(`${base()}/plans`, body)));
};

export const updatePlan = async (id: string, payload: Partial<PlanPayload>): Promise<PlanItem> => {
  // Audience and owner are fixed once a plan exists
  const body: any = { ...payload };
  delete body.audience;
  delete body.franchiseId;
  return normalizePlan(unwrap(await api.patch(`${base()}/plans/${id}`, body)));
};

export const deletePlan = async (id: string): Promise<void> => {
  await api.delete(`${base()}/plans/${id}`);
};

/** Select a plan for an admin (SuperAdmin or franchise) or for a franchise (SuperAdmin only) */
export const selectPlan = async (target: 'admin' | 'franchise', id: string, payload: SelectPlanPayload): Promise<SelectedPlanTerms> => {
  const url = isFranchiseUser()
    ? `franchise/admins/${id}/plan`
    : `superAdmin/${target}/${id}/plan`;
  return unwrap(await api.post(url, payload));
};

/** Plan terms from an admin / franchise record (fields written by select plan) */
export const pickPlanTerms = (raw: any): SelectedPlanTerms | null => {
  if (!raw?.planId && !raw?.planName) return null;
  return {
    planId: raw.planId,
    planName: raw.planName || raw.plan?.name,
    isFreeTrial: raw.isFreeTrial,
    amount: raw.amount !== undefined && raw.amount !== null ? Number(raw.amount) : undefined,
    startDate: raw.startDate,
    expiryDate: raw.expiryDate,
    plan: raw.plan || null,
  };
};

/** On a plan whose expiry date has not passed */
export const isPlanLive = (terms: SelectedPlanTerms | null | undefined) => {
  if (!terms?.planId) return false;
  if (!terms.expiryDate) return true;
  const expiry = new Date(terms.expiryDate);
  return isNaN(expiry.getTime()) || expiry.getTime() >= new Date().setHours(0, 0, 0, 0);
};

/** Backend error message for toasts */
export const planErrorText = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
