import {api} from '@/utils/axios';
import type {
  CardLinks,
  CardStats,
  Lead,
  LeadInput,
  LeadListParams,
  LeadListResponse,
  LeadTemplates,
  PlatformMatch,
} from '@/types/lead';
import type {LeadToCustomerResult} from '@/types/customer';
import {reviewLinkFor} from '@/lib/leads/templates';

/**
 * Owner leads API. Business owners use `customers/*`; super admins (and franchise users,
 * via the axios interceptor rewrite) pass an adminId and use `superAdmin/admin/:adminId/*`.
 * The axios `api` instance resolves to the ApiResponse envelope; the payload is in `.data`.
 */
export const apiBase = (adminId?: string) =>
  adminId ? `superAdmin/admin/${adminId}` : 'customers';
const base = apiBase;

export const unwrap = <T>(response: unknown): T =>
  (response && typeof response === 'object' && 'data' in response
    ? (response as {data: unknown}).data
    : response) as T;

const toQuery = (
  params: LeadListParams,
): Record<string, string | number | boolean> => {
  const q: Record<string, string | number | boolean> = {};
  if (params.search?.trim()) q.search = params.search.trim();
  if (params.status?.length) q.status = params.status.join(',');
  if (params.priority) q.priority = params.priority;
  if (params.event) q.event = params.event;
  if (params.source) q.source = params.source;
  if (params.starred) q.starred = true;
  if (params.dueBy) q.dueBy = params.dueBy;
  if (params.page) q.page = params.page;
  if (params.limit) q.limit = Math.min(params.limit, 500);
  return q;
};

export const listLeads = async (
  params: LeadListParams,
  adminId?: string,
): Promise<LeadListResponse> => {
  const res = await api.get(`${base(adminId)}/leads`, {
    params: toQuery(params),
  });
  const data = unwrap<Partial<LeadListResponse>>(res) || {};
  const leads = Array.isArray(data.leads) ? data.leads : [];
  return {
    leads,
    pagination: data.pagination || {
      page: params.page || 1,
      limit: params.limit || leads.length,
      total: leads.length,
      totalPages: 1,
    },
  };
};

/** Every lead matching the filters (pages of 500), for export. */
export const fetchAllLeads = async (
  params: Omit<LeadListParams, 'page' | 'limit'>,
  adminId?: string,
): Promise<Lead[]> => {
  const all: Lead[] = [];
  for (let page = 1; page <= 200; page++) {
    const {leads, pagination} = await listLeads(
      {...params, page, limit: 500},
      adminId,
    );
    all.push(...leads);
    if (leads.length === 0 || page >= (pagination.totalPages || 1)) break;
  }
  return all;
};

export const getLead = async (id: string, adminId?: string): Promise<Lead> =>
  unwrap<Lead>(await api.get(`${base(adminId)}/leads/${id}`));

export const createLead = async (
  input: LeadInput,
  adminId?: string,
): Promise<Lead> =>
  unwrap<Lead>(await api.post(`${base(adminId)}/leads`, input));

export const updateLead = async (
  id: string,
  input: LeadInput,
  adminId?: string,
): Promise<Lead> =>
  unwrap<Lead>(await api.patch(`${base(adminId)}/leads/${id}`, input));

export const deleteLead = async (
  id: string,
  adminId?: string,
): Promise<void> => {
  await api.delete(`${base(adminId)}/leads/${id}`);
};

export const uploadLeadImages = async (
  id: string,
  files: {front?: File; back?: File},
  adminId?: string,
): Promise<Lead> => {
  const form = new FormData();
  if (files.front) form.append('front', files.front);
  if (files.back) form.append('back', files.back);
  return unwrap<Lead>(
    await api.post(`${base(adminId)}/leads/${id}/images`, form),
  );
};

/** Idempotent: converting the same enquiry twice returns the same lead. */
export const createLeadFromEnquiry = async (
  enquiryId: string,
  adminId?: string,
): Promise<Lead> =>
  unwrap<Lead>(
    await api.post(`${base(adminId)}/leads/from-enquiry/${enquiryId}`),
  );

export const getLeadEvents = async (adminId?: string): Promise<string[]> => {
  const data = unwrap<unknown>(await api.get(`${base(adminId)}/leads/events`));
  return Array.isArray(data)
    ? data.filter((e): e is string => typeof e === 'string' && !!e)
    : [];
};

export const getLeadTemplates = async (
  adminId?: string,
): Promise<LeadTemplates> => {
  const data =
    unwrap<Partial<LeadTemplates>>(
      await api.get(`${base(adminId)}/leads/templates`),
    ) || {};
  return {
    whatsapp: data.whatsapp ?? '',
    emailSubject: data.emailSubject ?? '',
    emailBody: data.emailBody ?? '',
  };
};

/** An empty string resets that template to the server default. */
export const saveLeadTemplates = async (
  templates: LeadTemplates,
  adminId?: string,
): Promise<LeadTemplates> => {
  const data =
    unwrap<Partial<LeadTemplates>>(
      await api.put(`${base(adminId)}/leads/templates`, templates),
    ) || {};
  return {
    whatsapp: data.whatsapp ?? templates.whatsapp,
    emailSubject: data.emailSubject ?? templates.emailSubject,
    emailBody: data.emailBody ?? templates.emailBody,
  };
};

export const getCardAnalytics = async (
  days = 30,
  adminId?: string,
): Promise<CardStats> => {
  const data =
    unwrap<Partial<CardStats>>(
      await api.get(`${base(adminId)}/analytics`, {params: {days}}),
    ) || {};
  return {
    days: data.days ?? days,
    totals: data.totals ?? {
      views: 0,
      calls: 0,
      whatsapp: 0,
      emails: 0,
      saves: 0,
    },
    daily: Array.isArray(data.daily) ? data.daily : [],
  };
};

/**
 * Is the lead's business already on digiwebcard? Matches the phone (last 10 digits) or the
 * exact company name against live businesses other than the caller's own.
 */
export const getPlatformMatch = async (
  query: {phone?: string; company?: string},
  adminId?: string,
): Promise<PlatformMatch> => {
  const params: Record<string, string> = {};
  if (query.phone?.trim()) params.phone = query.phone.trim();
  if (query.company?.trim()) params.company = query.company.trim();
  if (!params.phone && !params.company) return {matched: false};
  const data =
    unwrap<Partial<PlatformMatch>>(
      await api.get(`${base(adminId)}/leads/platform-match`, {params}),
    ) || {};
  return {
    matched: !!data.matched,
    adminId: data.adminId || undefined,
    businessName: data.businessName || undefined,
    cardLink: data.cardLink || undefined,
    matchedBy: data.matchedBy,
  };
};

/** Idempotent: moving the same lead twice returns the same customer. The lead becomes WON. */
export const moveLeadToCustomer = async (
  id: string,
  adminId?: string,
): Promise<LeadToCustomerResult> =>
  unwrap<LeadToCustomerResult>(
    await api.post(`${base(adminId)}/leads/${id}/to-customer`),
  );

/** The business's public card link and review link, for {card_link} / {review_link}. */
export const getCardLinks = async (adminId?: string): Promise<CardLinks> => {
  const data =
    unwrap<{cardLink?: string; reviewLink?: string}>(
      await api.get(`${base(adminId)}/info`),
    ) || {};
  return {
    cardLink: String(data.cardLink || '').trim(),
    reviewLink: reviewLinkFor(data),
  };
};
