import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { isFranchiseScope } from '@/utils/axios';
import {
  getMyReviews,
  getAllBusinessReviews,
  ReviewList,
  getAdminWiseFeedbackSummary,
  getAllSuperAdminFeedbacks,
  getOneAdminFeedbacks,
  AdminWiseSummaryQuery,
  AllFeedbacksQuery,
  AdminFeedbackOverviewResponse,
  SuperAdminFeedbackListResponse,
  FeedbackOverviewSummary,
  SuperAdminFeedbackItem,
  FeedbackPagination,
} from '@/lib/api/reviewsApi';

/** Admin panel: reviews left on its own card */
export const useMyReviews = (options?: { enabled?: boolean; refetchInterval?: number }) =>
  useQuery<ReviewList>({
    queryKey: ['customers', 'feedbacks'],
    queryFn: () => getMyReviews(),
    staleTime: 1000 * 60 * 2,
    retry: false,
    refetchOnWindowFocus: true,
    ...options,
  });

/** SuperAdmin / franchise: reviews of every business this login can see */
export const useAllBusinessReviews = () =>
  useQuery<ReviewList>({
    queryKey: ['all-business-reviews', isFranchiseScope() ? 'franchise' : 'superadmin'],
    queryFn: () => getAllBusinessReviews(),
    staleTime: 1000 * 60,
    retry: false,
  });

/**
 * SuperAdmin: Admin-wise feedback summary
 * GET /api/v1/superAdmin/feedbacks/admins?sortBy=...&search=...&franchiseId=...&page=...&limit=...
 */
export const useAdminFeedbackOverview = (
  params?: AdminWiseSummaryQuery,
  options?: { enabled?: boolean },
) =>
  useQuery<AdminFeedbackOverviewResponse>({
    queryKey: ['superadmin-feedbacks-admins', params],
    queryFn: () => getAdminWiseFeedbackSummary(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: false,
    ...options,
  });

/**
 * SuperAdmin: All admins' feedbacks list
 * GET /api/v1/superAdmin/feedbacks?page=...&limit=...&search=...&rating=...&isRead=...&adminId=...&franchiseId=...
 */
export const useSuperAdminAllFeedbacks = (
  params?: AllFeedbacksQuery,
  options?: { enabled?: boolean },
) =>
  useQuery<SuperAdminFeedbackListResponse>({
    queryKey: ['superadmin-feedbacks-all', params],
    queryFn: () => getAllSuperAdminFeedbacks(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: false,
    ...options,
  });

/**
 * SuperAdmin / franchise: Single admin's feedbacks
 * GET /api/v1/superAdmin/admin/:adminId/feedbacks
 */
export const useAdminSpecificFeedbacks = (
  adminId: string,
  params?: { page?: number; limit?: number },
  options?: { enabled?: boolean },
) =>
  useQuery<{
    feedbacks: SuperAdminFeedbackItem[];
    summary: FeedbackOverviewSummary;
    pagination?: FeedbackPagination;
  }>({
    queryKey: ['superadmin-admin-feedbacks', adminId, params],
    queryFn: () => getOneAdminFeedbacks(adminId, params),
    enabled: Boolean(adminId) && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: false,
  });
