import { api } from '@/utils/axios';
import { getAdmins } from './superadmin/admin';
import { normalizeFeedback, PublicFeedback, FeedbackSummary } from './publicFeedbackApi';

export * from './superadmin/feedback';

/**
 * Review (feedback) list endpoints. They follow the enquiry API naming
 * (customers/enquires, superAdmin/enquiries, superAdmin/admin/:id/enquires); change them here if the backend differs.
 */
const MY_REVIEWS_ENDPOINTS = ['customers/feedbacks', 'customers/feedback'];
const ALL_REVIEWS_ENDPOINT = 'superAdmin/feedbacks';
const businessReviewsEndpoint = (adminId: string) => `superAdmin/admin/${adminId}/feedbacks`;

/** A review plus the business it was left for (SuperAdmin / franchise list) */
export interface BusinessReview extends PublicFeedback {
  adminId?: string;
  businessName?: string;
  /** Raw time in ms, for sorting and "new since last seen" */
  receivedAt: number;
}

export interface ReviewList {
  reviews: BusinessReview[];
  summary: FeedbackSummary;
}

const timeOf = (raw: any) => {
  const t = new Date(raw?.createdAt || raw?.created_at || raw?.date || 0).getTime();
  return isNaN(t) ? 0 : t;
};

const rawList = (res: any): any[] => {
  const data = res?.data !== undefined ? res.data : res;
  if (Array.isArray(data)) return data;
  const list = data?.feedbacks || data?.feedback || data?.reviews || data?.items || data?.latest || data?.data || data?.results || [];
  return Array.isArray(list) ? list : list?.items || list?.latest || [];
};

const toReview = (raw: any, i: number, extra: Partial<BusinessReview> = {}): BusinessReview => ({
  ...normalizeFeedback(raw, i),
  adminId: raw?.adminId || raw?.admin?.id,
  businessName: raw?.businessName || raw?.admin?.businessName || raw?.admin?.fullname,
  receivedAt: timeOf(raw),
  ...extra,
});

const newestFirst = (list: BusinessReview[]) => [...list].sort((a, b) => b.receivedAt - a.receivedAt);

/** Average and count: the response's own summary when it has one, else worked out from the list */
const summaryOf = (res: any, reviews: BusinessReview[]): FeedbackSummary => {
  const data = res?.data !== undefined ? res.data : res;
  const s = data?.summary || data?.feedbacks?.summary;
  if (s && (s.totalRatings !== undefined || s.averageRating !== undefined)) {
    return { totalRatings: Number(s.totalRatings) || reviews.length, averageRating: Number(s.averageRating) || 0 };
  }
  const rated = reviews.filter((r) => r.rating > 0);
  const avg = rated.length ? rated.reduce((sum, r) => sum + r.rating, 0) / rated.length : 0;
  return { totalRatings: reviews.length, averageRating: Math.round(avg * 10) / 10 };
};

const isMissing = (error: any) => [404, 405].includes(error?.response?.status);

/** Admin login: every review left on its own card, newest first */
export const getMyReviews = async (): Promise<ReviewList> => {
  let lastError: any;
  for (const endpoint of MY_REVIEWS_ENDPOINTS) {
    try {
      const res: any = await api.get(endpoint);
      const reviews = newestFirst(rawList(res).map((r, i) => toReview(r, i)));
      return { reviews, summary: summaryOf(res, reviews) };
    } catch (error: any) {
      lastError = error;
      if (!isMissing(error)) throw error;
    }
  }
  throw lastError;
};

/**
 * Every review for the businesses this login can see, newest first.
 * Uses superAdmin/feedbacks when the backend has it, else collects each business's superAdmin/admin/:id/feedbacks.
 */
export const getAllBusinessReviews = async (): Promise<ReviewList> => {
  try {
    const res: any = await api.get(ALL_REVIEWS_ENDPOINT);
    const reviews = newestFirst(rawList(res).map((r, i) => toReview(r, i)));
    return { reviews, summary: summaryOf(res, reviews) };
  } catch (error: any) {
    if (!isMissing(error)) throw error;
  }

  const admins: any[] = await getAdmins();
  const perBusiness = await Promise.allSettled(
    admins.map(async (admin) => {
      const adminId = String(admin?.id || admin?._id || '');
      if (!adminId) return [] as BusinessReview[];
      const res: any = await api.get(businessReviewsEndpoint(adminId));
      const businessName = admin?.digitalCard?.businessName || admin?.businessName || admin?.fullname || admin?.user?.fullname;
      return rawList(res).map((r, i) => {
        const review = toReview(r, i, { adminId, businessName });
        return { ...review, id: `${adminId}:${review.id}` };
      });
    }),
  );
  // Every business call failed (e.g. the endpoint doesn't exist yet): report it instead of an empty list
  const failed = perBusiness.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
  if (admins.length > 0 && failed.length === perBusiness.length) throw failed[0].reason;

  const reviews = newestFirst(perBusiness.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])));
  return { reviews, summary: summaryOf(null, reviews) };
};

/** Error text for the review lists */
export const reviewsErrorText = (error: any) =>
  isMissing(error)
    ? 'The reviews list API is not available on the server yet.'
    : error?.response?.data?.message || error?.message || 'Could not load reviews.';
