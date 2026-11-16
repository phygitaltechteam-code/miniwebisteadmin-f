import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createLead,
  createLeadFromEnquiry,
  deleteLead,
  getCardAnalytics,
  getCardLinks,
  getLeadEvents,
  getLeadTemplates,
  getPlatformMatch,
  listLeads,
  moveLeadToCustomer,
  saveLeadTemplates,
  updateLead,
} from '@/lib/api/leadsApi';
import type {
  Lead,
  LeadInput,
  LeadListParams,
  LeadListResponse,
  LeadTemplates,
} from '@/types/lead';
import {localToday} from '@/lib/leads/dates';

/** All lead queries of one business start with this key, so one invalidation refreshes them all. */
export const leadsKey = (adminId?: string) =>
  ['leads', adminId ?? 'me'] as const;

export const apiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong',
): string => {
  const e = error as {
    response?: {data?: {message?: string}};
    message?: string;
  } | null;
  return e?.response?.data?.message || e?.message || fallback;
};

export const useLeads = (params: LeadListParams, adminId?: string) =>
  useQuery({
    queryKey: [...leadsKey(adminId), 'list', params],
    queryFn: () => listLeads(params, adminId),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

/** Number of open follow-ups due today or earlier (for the header badge). */
export const useDueTodayCount = (adminId?: string, enabled = true) => {
  const dueBy = localToday();
  return useQuery({
    queryKey: [...leadsKey(adminId), 'list', {dueBy, limit: 1}],
    queryFn: () => listLeads({dueBy, limit: 1}, adminId),
    select: (res) => res.pagination.total,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    enabled,
  });
};

export const useLeadEvents = (adminId?: string) =>
  useQuery({
    queryKey: [...leadsKey(adminId), 'events'],
    queryFn: () => getLeadEvents(adminId),
    staleTime: 5 * 60 * 1000,
  });

export const useLeadTemplates = (adminId?: string) =>
  useQuery({
    queryKey: [...leadsKey(adminId), 'templates'],
    queryFn: () => getLeadTemplates(adminId),
    staleTime: 10 * 60 * 1000,
  });

export const useSaveLeadTemplates = (adminId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templates: LeadTemplates) =>
      saveLeadTemplates(templates, adminId),
    onSuccess: (saved) => {
      queryClient.setQueryData([...leadsKey(adminId), 'templates'], saved);
      toast.success('Message templates saved');
    },
    onError: (error) =>
      toast.error(apiErrorMessage(error, 'Could not save the templates')),
  });
};

export const useCardAnalytics = (days = 30, adminId?: string) =>
  useQuery({
    queryKey: [...leadsKey(adminId), 'analytics', days],
    queryFn: () => getCardAnalytics(days, adminId),
    staleTime: 5 * 60 * 1000,
  });

export const useCreateLead = (adminId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadInput) => createLead(input, adminId),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: leadsKey(adminId)}),
    onError: (error) =>
      toast.error(apiErrorMessage(error, 'Could not save the lead')),
  });
};

export const useUpdateLead = (adminId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: LeadInput}) =>
      updateLead(id, input, adminId),
    // Show inline edits (status, follow-up, star) right away; the refetch below brings the server's copy
    onMutate: async ({id, input}) => {
      const listKey = [...leadsKey(adminId), 'list'];
      await queryClient.cancelQueries({queryKey: listKey});
      queryClient.setQueriesData<LeadListResponse>(
        {queryKey: listKey},
        (old) =>
          old && Array.isArray(old.leads)
            ? {
                ...old,
                leads: old.leads.map((l) =>
                  l.id === id ? ({...l, ...input} as Lead) : l,
                ),
              }
            : old,
      );
    },
    onError: (error) =>
      toast.error(apiErrorMessage(error, 'Could not update the lead')),
    onSettled: () =>
      queryClient.invalidateQueries({queryKey: leadsKey(adminId)}),
  });
};

export const useDeleteLead = (adminId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLead(id, adminId),
    onSuccess: () => {
      toast.success('Lead deleted');
      queryClient.invalidateQueries({queryKey: leadsKey(adminId)});
    },
    onError: (error) =>
      toast.error(apiErrorMessage(error, 'Could not delete the lead')),
  });
};

/** Idempotent: an enquiry already saved returns its existing lead. */
export const useLeadFromEnquiry = (adminId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enquiryId: string) =>
      createLeadFromEnquiry(enquiryId, adminId),
    onSuccess: (lead) => {
      toast.success(`Saved ${lead?.name || 'the enquiry'} as a lead`);
      queryClient.invalidateQueries({queryKey: leadsKey(adminId)});
      // The server marks the enquiry read: refresh the enquiry lists and bells
      queryClient.invalidateQueries({
        queryKey: adminId
          ? ['superAdmin', 'admin', adminId, 'enquires']
          : ['customers', 'enquires'],
      });
      queryClient.invalidateQueries({queryKey: ['all-business-enquiries']});
      queryClient.invalidateQueries({queryKey: ['notifications']});
    },
    onError: (error) =>
      toast.error(
        apiErrorMessage(error, 'Could not save the enquiry as a lead'),
      ),
  });
};

/** The business's card link and review link for {card_link} / {review_link} ('' until the card is saved). */
export const useCardLinks = (adminId?: string) =>
  useQuery({
    queryKey: [...leadsKey(adminId), 'card-links'],
    queryFn: () => getCardLinks(adminId),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

/** Whether the lead's business is already on digiwebcard (by phone, else company name). */
export const usePlatformMatch = (
  query: {phone?: string | null; company?: string | null},
  adminId?: string,
) => {
  const phone = (query.phone ?? '').trim();
  const company = (query.company ?? '').trim();
  // Fewer than 10 digits can't match a phone; a blank company never matches
  const usable = phone.replace(/\D/g, '').length >= 10 || company.length > 0;
  return useQuery({
    queryKey: [...leadsKey(adminId), 'platform-match', phone, company],
    queryFn: () => getPlatformMatch({phone, company}, adminId),
    enabled: usable,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
};

/** Idempotent: a lead already moved returns its existing customer. */
export const useMoveLeadToCustomer = (adminId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => moveLeadToCustomer(leadId, adminId),
    onSuccess: (res) => {
      toast.success(
        `${res?.customer?.fullname || 'The lead'} is now a customer`,
      );
      queryClient.invalidateQueries({queryKey: leadsKey(adminId)});
      queryClient.invalidateQueries({
        queryKey: ['customers-list', adminId ?? 'me'],
      });
    },
    onError: (error) =>
      toast.error(
        apiErrorMessage(error, 'Could not move the lead to customers'),
      ),
  });
};
