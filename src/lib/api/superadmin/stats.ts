import {api, isFranchiseUser} from '@/utils/axios';

export interface TopBusiness {
  adminId: string;
  businessName: string;
  leads: number;
  views30d: number;
  cardLink: string;
}

/** GET superAdmin/stats (whole platform) or franchise/stats (the franchise's own businesses) */
export interface PlatformStats {
  businesses: {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
  };
  /** Super admin only */
  franchises: {total: number} | null;
  leads: {total: number; last30Days: number; won: number};
  customers: {total: number};
  cardViews30d: number;
  enquiries30d: number;
  /** Top 5 by leads */
  topBusinesses: TopBusiness[];
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

type Raw = Record<string, Record<string, unknown> | undefined> & {
  cardViews30d?: unknown;
  enquiries30d?: unknown;
  topBusinesses?: unknown;
};

export const getPlatformStats = async (): Promise<PlatformStats> => {
  // The axios instance resolves to the response envelope; the stats are in .data
  const res = (await api.get(
    isFranchiseUser() ? 'franchise/stats' : 'superAdmin/stats',
  )) as {data?: Raw} | undefined;
  const d: Raw = res?.data ?? {};
  return {
    businesses: {
      total: num(d.businesses?.total),
      active: num(d.businesses?.active),
      expiringSoon: num(d.businesses?.expiringSoon),
      expired: num(d.businesses?.expired),
    },
    franchises: d.franchises ? {total: num(d.franchises.total)} : null,
    leads: {
      total: num(d.leads?.total),
      last30Days: num(d.leads?.last30Days),
      won: num(d.leads?.won),
    },
    customers: {total: num(d.customers?.total)},
    cardViews30d: num(d.cardViews30d),
    enquiries30d: num(d.enquiries30d),
    topBusinesses: (Array.isArray(d.topBusinesses)
      ? (d.topBusinesses as Record<string, unknown>[])
      : []
    ).map((b) => ({
      adminId: String(b?.adminId || ''),
      businessName: String(b?.businessName || ''),
      leads: num(b?.leads),
      views30d: num(b?.views30d),
      cardLink: String(b?.cardLink || ''),
    })),
  };
};
