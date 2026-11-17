import { useQuery } from '@tanstack/react-query';
import { getAdminWiseVisits, getMyVisits, getVisitOverview, VisitSort } from '@/lib/api/visitsApi';
import { isEmployeeUser, isFranchiseScope } from '@/utils/axios';

/** Cache scope per panel, so a franchise / employee never sees SuperAdmin counts */
const scope = () => (isEmployeeUser() ? 'employee' : isFranchiseScope() ? 'franchise' : 'superadmin');

/** Admin: own card's visit counts */
export const useMyVisits = (days = 30) =>
  useQuery({
    queryKey: ['my-card-visits', days],
    queryFn: () => getMyVisits(days),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

/** SuperAdmin / franchise / employee: totals across their admins */
export const useVisitOverview = (days = 30) =>
  useQuery({
    queryKey: ['visit-overview', scope(), days],
    queryFn: () => getVisitOverview({ days }),
    staleTime: 60 * 1000,
  });

/** SuperAdmin / franchise / employee: admin-wise counts */
export const useAdminWiseVisits = (params: { limit?: number; sortBy?: VisitSort } = {}) =>
  useQuery({
    queryKey: ['visit-admin-wise', scope(), params],
    queryFn: () => getAdminWiseVisits({ page: 1, ...params }),
    staleTime: 60 * 1000,
  });
