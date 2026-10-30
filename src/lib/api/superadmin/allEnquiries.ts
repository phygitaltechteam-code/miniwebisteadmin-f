import { api } from '@/utils/axios';
import { CustomerEnquiry } from '@/types/profile';
import { extractEnquiriesList, normalizeEnquiryItem } from '@/lib/api/customerEnquiriesApi';
import { getAdmins } from './admin';

/** An enquiry plus the business it came in for (SuperAdmin / franchise notifications) */
export interface BusinessEnquiry extends CustomerEnquiry {
  adminId?: string;
  businessName?: string;
  /** Raw time in ms, for sorting and "new since last seen" */
  receivedAt: number;
}

const timeOf = (raw: any) => {
  const t = new Date(raw?.createdAt || raw?.created_at || raw?.date || raw?.timestamp || 0).getTime();
  return isNaN(t) ? 0 : t;
};

const rawList = (res: any): any[] => {
  const data = res?.data !== undefined ? res.data : res;
  if (Array.isArray(data)) return data;
  return data?.enquires || data?.enquiries || data?.items || data?.data || data?.leads || data?.results || [];
};

/**
 * Every enquiry for the businesses this login can see, newest first.
 * Uses superAdmin/enquiries (franchise/enquiries on a franchise session) when the backend has it,
 * else collects each business's superAdmin/admin/:id/enquires.
 */
export const getAllBusinessEnquiries = async (): Promise<BusinessEnquiry[]> => {
  try {
    const res: any = await api.get('superAdmin/enquiries');
    return rawList(res)
      .map((item, i) => ({
        ...normalizeEnquiryItem(item, i),
        adminId: item?.adminId || item?.admin?.id,
        businessName: item?.businessName || item?.admin?.businessName || item?.admin?.fullname,
        receivedAt: timeOf(item),
      }))
      .sort((a, b) => b.receivedAt - a.receivedAt);
  } catch (error: any) {
    const status = error?.response?.status;
    if (status !== 404 && status !== 405) throw error;
  }

  const admins: any[] = await getAdmins();
  const perBusiness = await Promise.allSettled(
    admins.map(async (admin) => {
      const adminId = String(admin?.id || admin?._id || '');
      if (!adminId) return [] as BusinessEnquiry[];
      const res: any = await api.get(`superAdmin/admin/${adminId}/enquires`);
      const raws = rawList(res);
      const normalized = extractEnquiriesList(res);
      const businessName = admin?.digitalCard?.businessName || admin?.businessName || admin?.fullname || admin?.user?.fullname;
      return normalized.map((e, i) => ({ ...e, id: `${adminId}:${e.id}`, adminId, businessName, receivedAt: timeOf(raws[i]) }));
    }),
  );
  return perBusiness
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => b.receivedAt - a.receivedAt);
};
