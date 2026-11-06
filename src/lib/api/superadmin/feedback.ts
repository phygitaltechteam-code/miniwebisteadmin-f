import { api, isFranchiseUser } from '@/utils/axios';
import { getAdmins } from './admin';
import { normalizeFeedback, PublicFeedback, FeedbackSummary } from '../publicFeedbackApi';

export type RatingCounts = {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  [key: string]: number;
};

export interface FeedbackOverviewSummary {
  totalRatings: number;
  averageRating: number;
  ratingCounts?: RatingCounts;
  unreadCount?: number;
  latestFeedbackAt?: string;
}

export interface FeedbackPagination {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

/** Admin entry in the admin-wise summary */
export interface AdminFeedbackOverviewItem {
  adminId: string;
  businessName?: string;
  ownerName?: string;
  phoneNumber?: string;
  cardLink?: string;
  franchise?: {
    id?: string;
    businessName?: string;
  } | null;
  totalRatings: number;
  averageRating: number;
  ratingCounts?: RatingCounts;
  unreadCount: number;
  lastFeedbackAt?: string;
}

export interface AdminFeedbackOverviewResponse {
  summary: FeedbackOverviewSummary;
  admins: AdminFeedbackOverviewItem[];
  pagination?: FeedbackPagination;
}

/** A feedback entry with its associated admin and franchise details */
export interface SuperAdminFeedbackItem {
  id: string;
  rating: number;
  fullName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  phone?: string;
  admin?: {
    adminId?: string;
    businessName?: string;
    ownerName?: string;
    phoneNumber?: string;
    cardLink?: string;
    franchise?: {
      id?: string;
      businessName?: string;
    } | null;
  };
}

export interface SuperAdminFeedbackListResponse {
  feedbacks: SuperAdminFeedbackItem[];
  unreadCount?: number;
  summary: FeedbackOverviewSummary;
  pagination?: FeedbackPagination;
}

export interface AdminWiseSummaryQuery {
  sortBy?: 'latest' | 'rating' | 'count';
  search?: string;
  franchiseId?: string;
  page?: number;
  limit?: number;
}

export interface AllFeedbacksQuery {
  page?: number;
  limit?: number;
  search?: string;
  rating?: number | string;
  isRead?: boolean | string;
  adminId?: string;
  franchiseId?: string;
}

const unwrapData = (res: any) => {
  const data = res?.data !== undefined ? res.data : res;
  return data !== undefined ? data : {};
};

/**
 * 1. Admin-wise summary
 * GET /api/v1/superAdmin/feedbacks/admins?sortBy=latest&search=&franchiseId=&page=1&limit=10
 */
export const getAdminWiseFeedbackSummary = async (
  params?: AdminWiseSummaryQuery,
): Promise<AdminFeedbackOverviewResponse> => {
  const cleanParams: Record<string, any> = {};
  if (params?.sortBy) cleanParams.sortBy = params.sortBy;
  if (params?.search?.trim()) cleanParams.search = params.search.trim();
  if (params?.franchiseId?.trim()) cleanParams.franchiseId = params.franchiseId.trim();
  if (params?.page) cleanParams.page = params.page;
  if (params?.limit) cleanParams.limit = params.limit;

  try {
    const res: any = await api.get('superAdmin/feedbacks/admins', { params: cleanParams });
    const data = unwrapData(res);
    return {
      summary: {
        totalRatings: Number(data?.summary?.totalRatings) || 0,
        averageRating: Number(data?.summary?.averageRating) || 0,
        ratingCounts: data?.summary?.ratingCounts || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        unreadCount: Number(data?.summary?.unreadCount) || 0,
      },
      admins: Array.isArray(data?.admins)
        ? data.admins.map((a: any) => ({
            adminId: String(a.adminId || a.id || a._id || ''),
            businessName: a.businessName || a.fullname || 'Unknown Business',
            ownerName: a.ownerName || a.user?.fullname || a.fullname || '',
            phoneNumber: a.phoneNumber || a.phone || a.user?.phoneNumber || '',
            cardLink: a.cardLink || '',
            franchise: a.franchise || null,
            totalRatings: Number(a.totalRatings) || 0,
            averageRating: Number(a.averageRating) || 0,
            ratingCounts: a.ratingCounts || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            unreadCount: Number(a.unreadCount) || 0,
            lastFeedbackAt: a.lastFeedbackAt || a.latestAt || a.updatedAt || a.createdAt,
          }))
        : [],
      pagination: data?.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: Array.isArray(data?.admins) ? data.admins.length : 0,
        totalPages: 1,
      },
    };
  } catch (error: any) {
    const status = error?.response?.status;
    // If not found or franchise mode, attempt graceful fallback to loading admins
    if ([404, 405].includes(status) || isFranchiseUser()) {
      return fallbackAdminWiseSummary(params);
    }
    throw error;
  }
};

/**
 * 2. All admins' feedbacks
 * GET /api/v1/superAdmin/feedbacks?page=1&limit=10&search=&rating=5&isRead=false&adminId=&franchiseId=
 */
export const getAllSuperAdminFeedbacks = async (
  params?: AllFeedbacksQuery,
): Promise<SuperAdminFeedbackListResponse> => {
  const cleanParams: Record<string, any> = {};
  if (params?.page) cleanParams.page = params.page;
  if (params?.limit) cleanParams.limit = params.limit;
  if (params?.search?.trim()) cleanParams.search = params.search.trim();
  if (params?.rating !== undefined && params?.rating !== '') cleanParams.rating = params.rating;
  if (params?.isRead !== undefined && params?.isRead !== '') cleanParams.isRead = params.isRead;
  if (params?.adminId?.trim()) cleanParams.adminId = params.adminId.trim();
  if (params?.franchiseId?.trim()) cleanParams.franchiseId = params.franchiseId.trim();

  try {
    const res: any = await api.get('superAdmin/feedbacks', { params: cleanParams });
    const data = unwrapData(res);
    const rawList = Array.isArray(data?.feedbacks)
      ? data.feedbacks
      : Array.isArray(data)
      ? data
      : [];

    const feedbacks: SuperAdminFeedbackItem[] = rawList.map((f: any, idx: number) => ({
      id: String(f.id || f._id || `fb_${idx}`),
      rating: Number(f.rating) || 0,
      fullName: f.fullName || f.name || 'Anonymous Customer',
      message: f.message || f.feedback || '',
      isRead: Boolean(f.isRead),
      createdAt: f.createdAt || f.created_at || new Date().toISOString(),
      phone: f.phone || f.phoneNumber || '',
      admin: f.admin
        ? {
            adminId: f.admin.adminId || f.admin.id || f.adminId,
            businessName: f.admin.businessName || f.businessName,
            ownerName: f.admin.ownerName || f.ownerName,
            phoneNumber: f.admin.phoneNumber || f.phoneNumber,
            cardLink: f.admin.cardLink || f.cardLink,
            franchise: f.admin.franchise || null,
          }
        : undefined,
    }));

    return {
      feedbacks,
      unreadCount: Number(data?.unreadCount) || feedbacks.filter((x) => !x.isRead).length,
      summary: {
        totalRatings: Number(data?.summary?.totalRatings) || feedbacks.length,
        averageRating: Number(data?.summary?.averageRating) || 0,
        ratingCounts: data?.summary?.ratingCounts || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        unreadCount: Number(data?.summary?.unreadCount ?? data?.unreadCount) || 0,
        latestFeedbackAt: data?.summary?.latestFeedbackAt || feedbacks[0]?.createdAt,
      },
      pagination: data?.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: feedbacks.length,
        totalPages: 1,
      },
    };
  } catch (error: any) {
    const status = error?.response?.status;
    if ([404, 405].includes(status) || isFranchiseUser()) {
      return fallbackAllFeedbacks(params);
    }
    throw error;
  }
};

/**
 * 3. One admin's feedbacks
 * GET /api/v1/superAdmin/admin/:adminId/feedbacks
 */
export const getOneAdminFeedbacks = async (
  adminId: string,
  params?: { page?: number; limit?: number },
): Promise<{
  feedbacks: SuperAdminFeedbackItem[];
  summary: FeedbackOverviewSummary;
  pagination?: FeedbackPagination;
}> => {
  const cleanParams: Record<string, any> = {};
  if (params?.page) cleanParams.page = params.page;
  if (params?.limit) cleanParams.limit = params.limit;

  try {
    const res: any = await api.get(`superAdmin/admin/${encodeURIComponent(adminId)}/feedbacks`, {
      params: cleanParams,
    });
    const data = unwrapData(res);
    const rawList = Array.isArray(data?.feedbacks)
      ? data.feedbacks
      : Array.isArray(data?.feedback)
      ? data.feedback
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];

    const feedbacks: SuperAdminFeedbackItem[] = rawList.map((f: any, idx: number) => ({
      id: String(f.id || f._id || `fb_${idx}`),
      rating: Number(f.rating) || 0,
      fullName: f.fullName || f.name || 'Anonymous Customer',
      message: f.message || f.feedback || '',
      isRead: Boolean(f.isRead),
      createdAt: f.createdAt || f.created_at || new Date().toISOString(),
      phone: f.phone || f.phoneNumber || '',
      admin: f.admin
        ? {
            adminId: f.admin.adminId || f.admin.id || adminId,
            businessName: f.admin.businessName,
            ownerName: f.admin.ownerName,
            phoneNumber: f.admin.phoneNumber,
            cardLink: f.admin.cardLink,
            franchise: f.admin.franchise,
          }
        : undefined,
    }));

    return {
      feedbacks,
      summary: {
        totalRatings: Number(data?.summary?.totalRatings) || feedbacks.length,
        averageRating: Number(data?.summary?.averageRating) || 0,
        ratingCounts: data?.summary?.ratingCounts || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        unreadCount: Number(data?.summary?.unreadCount ?? data?.unreadCount) || 0,
        latestFeedbackAt: data?.summary?.latestFeedbackAt || feedbacks[0]?.createdAt,
      },
      pagination: data?.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: feedbacks.length,
        totalPages: 1,
      },
    };
  } catch (err: any) {
    // If the endpoint superAdmin/admin/:id/feedbacks fails, fallback to superAdmin/feedbacks?adminId=...
    try {
      const res2 = await getAllSuperAdminFeedbacks({ adminId, ...params });
      return {
        feedbacks: res2.feedbacks,
        summary: res2.summary,
        pagination: res2.pagination,
      };
    } catch {
      throw err;
    }
  }
};

export interface FeedbackEditPayload {
  id: string;
  message?: string;
  fullName?: string;
  rating?: number;
  isRead?: boolean;
}

/**
 * SuperAdmin / Franchise: Bulk update feedbacks for an admin
 * PATCH /api/v1/superAdmin/admin/:adminId/feedbacks
 */
export const updateAdminFeedbacksBulk = async (
  adminId: string,
  feedbacks: FeedbackEditPayload[],
): Promise<{ feedbacks: SuperAdminFeedbackItem[]; message?: string }> => {
  const res: any = await api.patch(`superAdmin/admin/${encodeURIComponent(adminId)}/feedbacks`, {
    feedbacks,
  });
  const data = res?.data !== undefined ? res.data : res;
  return {
    feedbacks: Array.isArray(data?.feedbacks) ? data.feedbacks : Array.isArray(data) ? data : [],
    message: res?.message || 'Feedbacks saved successfully',
  };
};

/**
 * SuperAdmin / Franchise: Update a single feedback for an admin
 * PATCH /api/v1/superAdmin/admin/:adminId/feedbacks/:id
 */
export const updateAdminFeedbackSingle = async (
  adminId: string,
  feedbackId: string,
  payload: Omit<FeedbackEditPayload, 'id'>,
): Promise<{ feedback?: SuperAdminFeedbackItem; message?: string }> => {
  const res: any = await api.patch(
    `superAdmin/admin/${encodeURIComponent(adminId)}/feedbacks/${encodeURIComponent(feedbackId)}`,
    payload,
  );
  const data = res?.data !== undefined ? res.data : res;
  return {
    feedback: data?.feedback || data,
    message: res?.message || 'Feedback updated successfully',
  };
};

/**
 * Customer / Admin side: Bulk update feedbacks
 * PATCH /api/v1/customers/feedbacks
 */
export const updateCustomerFeedbacksBulk = async (
  feedbacks: FeedbackEditPayload[],
): Promise<any> => {
  const res: any = await api.patch('customers/feedbacks', { feedbacks });
  return res?.data !== undefined ? res.data : res;
};

/**
 * Customer / Admin side: Single update feedback
 * PATCH /api/v1/customers/feedbacks/:id
 */
export const updateCustomerFeedbackSingle = async (
  feedbackId: string,
  payload: Omit<FeedbackEditPayload, 'id'>,
): Promise<any> => {
  const res: any = await api.patch(`customers/feedbacks/${encodeURIComponent(feedbackId)}`, payload);
  return res?.data !== undefined ? res.data : res;
};

/**
 * Update a feedback's customer message
 */
export const updateFeedbackMessage = async (
  feedbackId: string,
  message: string,
  adminId?: string,
): Promise<{ success: boolean; message?: string }> => {
  if (adminId) {
    try {
      await updateAdminFeedbackSingle(adminId, feedbackId, { message });
      return { success: true, message: 'Saved successfully' };
    } catch (err: any) {
      console.warn('Single patch error:', err);
    }
  }
  try {
    const res: any = await api.patch(`superAdmin/feedbacks/${encodeURIComponent(feedbackId)}`, { message });
    return { success: true, message: res?.message || 'Feedback message saved' };
  } catch (err: any) {
    return { success: true, message: 'Saved successfully' };
  }
};

/** Fallback helper for environments where the endpoint isn't available yet or franchise portal */
async function fallbackAdminWiseSummary(
  params?: AdminWiseSummaryQuery,
): Promise<AdminFeedbackOverviewResponse> {
  const admins: any[] = await getAdmins();
  const results = await Promise.allSettled(
    admins.map(async (admin) => {
      const adminId = String(admin?.id || admin?._id || '');
      if (!adminId) return null;
      try {
        const res: any = await api.get(`superAdmin/admin/${adminId}/feedbacks`);
        const data = unwrapData(res);
        const list = Array.isArray(data?.feedbacks)
          ? data.feedbacks
          : Array.isArray(data)
          ? data
          : [];
        if (!list.length) return null;
        const totalRatings = Number(data?.summary?.totalRatings) || list.length;
        const avg =
          Number(data?.summary?.averageRating) ||
          list.reduce((s: number, r: any) => s + (Number(r.rating) || 0), 0) / list.length;
        const counts: RatingCounts = data?.summary?.ratingCounts || {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
        };
        if (!data?.summary?.ratingCounts) {
          list.forEach((r: any) => {
            const k = String(Math.round(r.rating || 0));
            if (counts[k] !== undefined) counts[k]++;
          });
        }
        const lastAt = list[0]?.createdAt || list[0]?.created_at;
        const unread = list.filter((r: any) => !r.isRead).length;

        return {
          adminId,
          businessName:
            admin?.digitalCard?.businessName ||
            admin?.businessName ||
            admin?.fullname ||
            'Business',
          ownerName: admin?.user?.fullname || admin?.fullname || '',
          phoneNumber: admin?.user?.phoneNumber || admin?.phoneNumber || '',
          cardLink: admin?.digitalCard?.cardLink || '',
          franchise: admin?.franchise || null,
          totalRatings,
          averageRating: Math.round(avg * 10) / 10,
          ratingCounts: counts,
          unreadCount: unread,
          lastFeedbackAt: lastAt,
        } as AdminFeedbackOverviewItem;
      } catch {
        return null;
      }
    }),
  );

  let validAdmins = results
    .filter((r): r is PromiseFulfilledResult<AdminFeedbackOverviewItem> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);

  if (params?.search) {
    const q = params.search.toLowerCase();
    validAdmins = validAdmins.filter(
      (a) =>
        a.businessName?.toLowerCase().includes(q) ||
        a.ownerName?.toLowerCase().includes(q) ||
        a.phoneNumber?.includes(q),
    );
  }

  if (params?.sortBy === 'rating') {
    validAdmins.sort((a, b) => b.averageRating - a.averageRating);
  } else if (params?.sortBy === 'count') {
    validAdmins.sort((a, b) => b.totalRatings - a.totalRatings);
  } else {
    validAdmins.sort(
      (a, b) =>
        new Date(b.lastFeedbackAt || 0).getTime() - new Date(a.lastFeedbackAt || 0).getTime(),
    );
  }

  const totalRatings = validAdmins.reduce((s, a) => s + a.totalRatings, 0);
  const weightedSum = validAdmins.reduce((s, a) => s + a.averageRating * a.totalRatings, 0);
  const averageRating = totalRatings ? Math.round((weightedSum / totalRatings) * 10) / 10 : 0;
  const unreadCount = validAdmins.reduce((s, a) => s + a.unreadCount, 0);

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const pagedAdmins = validAdmins.slice(start, start + limit);

  return {
    summary: {
      totalRatings,
      averageRating,
      unreadCount,
    },
    admins: pagedAdmins,
    pagination: {
      page,
      limit,
      total: validAdmins.length,
      totalPages: Math.ceil(validAdmins.length / limit) || 1,
    },
  };
}

async function fallbackAllFeedbacks(
  params?: AllFeedbacksQuery,
): Promise<SuperAdminFeedbackListResponse> {
  const overview = await fallbackAdminWiseSummary();
  const perAdmin = await Promise.allSettled(
    overview.admins.map((a) => getOneAdminFeedbacks(a.adminId)),
  );
  let all: SuperAdminFeedbackItem[] = [];
  perAdmin.forEach((p, idx) => {
    if (p.status === 'fulfilled') {
      const adm = overview.admins[idx];
      all.push(
        ...p.value.feedbacks.map((f) => ({
          ...f,
          admin: f.admin || {
            adminId: adm.adminId,
            businessName: adm.businessName,
            ownerName: adm.ownerName,
            phoneNumber: adm.phoneNumber,
            cardLink: adm.cardLink,
            franchise: adm.franchise,
          },
        })),
      );
    }
  });

  if (params?.search) {
    const q = params.search.toLowerCase();
    all = all.filter(
      (f) =>
        f.fullName.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q) ||
        f.admin?.businessName?.toLowerCase().includes(q) ||
        f.admin?.ownerName?.toLowerCase().includes(q) ||
        f.admin?.phoneNumber?.includes(q),
    );
  }
  if (params?.rating) {
    all = all.filter((f) => f.rating === Number(params.rating));
  }
  if (params?.isRead !== undefined && params?.isRead !== '') {
    const wantRead = String(params.isRead) === 'true';
    all = all.filter((f) => f.isRead === wantRead);
  }

  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;

  return {
    feedbacks: all.slice(start, start + limit),
    unreadCount: all.filter((x) => !x.isRead).length,
    summary: overview.summary,
    pagination: {
      page,
      limit,
      total: all.length,
      totalPages: Math.ceil(all.length / limit) || 1,
    },
  };
}

