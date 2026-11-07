import { api, unAuthenticatedApi } from '@/utils/axios';

/**
 * Card visit counts.
 * - Public: POST client/admins/visit/:adminId (admin id or vanity URL), once per card page open
 * - Admin: GET customers/visits
 * - SuperAdmin: GET superAdmin/visits, superAdmin/visits/admins, superAdmin/admin/:adminId/visits
 *   (franchise and employee sessions are sent to franchise/… and employee/… by the axios interceptor)
 */

export interface VisitStats {
  totalVisits: number;
  uniqueVisitors: number;
  today: number;
  last7Days: number;
  last30Days: number;
  lastVisitAt: string | null;
  daily: Array<{ date: string; visits: number }>;
}

export interface AdminVisitRow extends VisitStats {
  adminId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  cardLink: string;
  franchiseName: string;
}

export type VisitSort = 'visits' | 'today' | 'last7Days' | 'last30Days' | 'unique' | 'latest';

const unwrap = (res: any) => res?.data?.data ?? res?.data ?? res;
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const toVisitStats = (raw: any): VisitStats => {
  const r = raw?.visits && typeof raw.visits === 'object' ? { ...raw, ...raw.visits } : raw || {};
  return {
    totalVisits: num(r.totalVisits ?? r.total ?? r.views),
    uniqueVisitors: num(r.uniqueVisitors ?? r.unique),
    today: num(r.today),
    last7Days: num(r.last7Days),
    last30Days: num(r.last30Days),
    lastVisitAt: r.lastVisitAt || null,
    daily: Array.isArray(r.daily) ? r.daily.map((d: any) => ({ date: String(d.date), visits: num(d.visits ?? d.count) })) : [],
  };
};

const toAdminVisitRow = (r: any): AdminVisitRow => ({
  ...toVisitStats(r),
  adminId: String(r.adminId || r.id || r.admin?.id || ''),
  businessName: r.businessName || r.admin?.businessName || r.fullname || r.user?.fullname || '-',
  ownerName: r.ownerName || r.owner || r.admin?.ownerName || '',
  phone: r.phone || r.phoneNumber || r.user?.phoneNumber || '',
  cardLink: r.cardLink || r.vanityUrl || '',
  franchiseName: r.franchiseName || r.franchise?.fullname || r.franchise?.name || '',
});

// ── Public card ──────────────────────────────────────────────────────────────
const VISITOR_KEY = 'card-visitor-id';

/** Random id kept in this browser, so repeat visits are recognised without the IP */
const visitorId = (): string | undefined => {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
};

/** Records one guest visit; the backend ignores repeats from the same guest within 30 minutes */
export const recordCardVisit = async (adminIdOrVanity: string, source?: string) => {
  const body: Record<string, string> = {};
  const id = visitorId();
  if (id) body.visitorId = id;
  if (source) body.source = source;
  const res = await unAuthenticatedApi.post(`client/admins/visit/${encodeURIComponent(adminIdOrVanity)}`, body);
  return unwrap(res) as { counted: boolean; views: number | null };
};

// ── Admin (own card) ─────────────────────────────────────────────────────────
export const getMyVisits = async (days = 30): Promise<VisitStats> =>
  toVisitStats(unwrap(await api.get('customers/visits', { params: { days } })));

// ── SuperAdmin / franchise / employee ────────────────────────────────────────
export const getVisitOverview = async (params: { days?: number; franchiseId?: string; adminId?: string } = {}): Promise<VisitStats> => {
  const query = Object.fromEntries(Object.entries({ days: 30, ...params }).filter(([, v]) => v !== undefined && v !== ''));
  return toVisitStats(unwrap(await api.get('superAdmin/visits', { params: query })));
};

export const getAdminWiseVisits = async (
  params: { page?: number; limit?: number; search?: string; franchiseId?: string; sortBy?: VisitSort } = {},
): Promise<{ rows: AdminVisitRow[]; total: number }> => {
  const query = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  const data: any = unwrap(await api.get('superAdmin/visits/admins', { params: query }));
  const list = Array.isArray(data) ? data : data?.admins || data?.items || data?.rows || data?.data || [];
  const rows = (Array.isArray(list) ? list : []).map(toAdminVisitRow);
  return { rows, total: num(data?.pagination?.total ?? data?.total ?? rows.length) };
};

export const getAdminVisits = async (adminId: string): Promise<VisitStats> =>
  toVisitStats(unwrap(await api.get(`superAdmin/admin/${adminId}/visits`)));
