import { api } from '@/utils/axios';
import { ProfileData } from '@/types/profile';

export interface CustomerSettingsPayload {
  amount?: number;
  renewalAmount?: number;
  headings?: Partial<ProfileData['headings']>;
  navLabels?: Partial<ProfileData['navLabels']>;
  visibility?: Partial<ProfileData['visibility']>;
  theme?: string;
  hasLogoBorder?: boolean;
  hasGoldenBorder?: boolean;
  [key: string]: any;
}

export interface CustomerSettingsResponse {
  success?: boolean;
  message?: string;
  data?: any;
  settings?: any;
  [key: string]: any;
}

/**
 * Format frontend ProfileData into card settings payload
 */
export const formatCustomerSettingsPayload = (profile: Partial<ProfileData>): CustomerSettingsPayload => {
  return {
    amount: profile.amount ? Number(profile.amount) : undefined,
    renewalAmount: profile.renewalAmount ? Number(profile.renewalAmount) : undefined,
    headings: profile.headings || {},
    navLabels: profile.navLabels || {},
    visibility: profile.visibility || {},
    theme: profile.theme || 'clean-white',
    hasLogoBorder: profile.hasGoldenBorder ?? profile.hasLogoBorder ?? true,
    hasGoldenBorder: profile.hasGoldenBorder ?? true,
    ...(profile.sectionOrder?.length ? { sectionOrder: profile.sectionOrder } : {}),
    ...(profile.aboutBlockOrder?.length ? { aboutBlockOrder: profile.aboutBlockOrder } : {}),
    ...(profile.productOrder?.length ? { productOrder: profile.productOrder } : {}),
    ...(profile.videoOrder?.length ? { videoOrder: profile.videoOrder } : {}),
    ...(profile.linkOrder?.length ? { linkOrder: profile.linkOrder } : {}),
    ...(profile.hiddenLinks ? { hiddenLinks: profile.hiddenLinks } : {}),
    ...(profile.hiddenPayments ? { hiddenPayments: profile.hiddenPayments } : {}),
  };
};

/** Order and show/hide keys stored in the settings API */
export type SettingsOrderFields = Partial<
  Pick<ProfileData, 'sectionOrder' | 'aboutBlockOrder' | 'productOrder' | 'videoOrder' | 'linkOrder' | 'hiddenLinks' | 'hiddenPayments'>
>;

/**
 * Save only the given order fields (PATCH settings with just those keys), so a reorder never
 * overwrites headings or other settings with unsaved local values. Falls back to POST.
 */
export const saveSettingsOrder = async (
  fields: SettingsOrderFields,
  adminId?: string
): Promise<CustomerSettingsResponse> => {
  const endpoint = adminId ? `superAdmin/admin/${adminId}/settings` : 'customers/settings';
  try {
    const res = await api.patch(endpoint, fields);
    return (res as any)?.data || res;
  } catch (err: any) {
    if ([404, 405].includes(err?.response?.status)) {
      const res = await api.post(endpoint, fields);
      return (res as any)?.data || res;
    }
    throw err;
  }
};

export const saveSectionOrder = (sectionOrder: string[], adminId?: string) =>
  saveSettingsOrder({ sectionOrder: sectionOrder as ProfileData['sectionOrder'] }, adminId);

/** Read the order fields out of a settings GET response, keeping only well-formed string arrays */
export const parseSettingsOrder = (raw: any): SettingsOrderFields => {
  const result: SettingsOrderFields = {};
  const keys: (keyof SettingsOrderFields)[] = ['sectionOrder', 'aboutBlockOrder', 'productOrder', 'videoOrder', 'linkOrder'];
  keys.forEach((key) => {
    const val = raw?.[key];
    if (Array.isArray(val) && val.length > 0 && val.every((v: any) => typeof v === 'string')) {
      (result as any)[key] = val;
    }
  });
  // Hidden lists may legitimately be empty (everything shown)
  (['hiddenLinks', 'hiddenPayments'] as const).forEach((key) => {
    const val = raw?.[key];
    if (Array.isArray(val) && val.every((v: any) => typeof v === 'string')) result[key] = val;
  });
  return result;
};

/** Sort `items` by the position of their id in `order`; items not in `order` keep their relative order at the end */
export const sortByOrder = <T,>(items: T[], order: string[] | undefined, getId: (item: T) => string): T[] => {
  if (!order?.length) return items;
  const rank = new Map(order.map((id, idx) => [id, idx]));
  return items
    .map((item, idx) => ({ item, idx, r: rank.get(getId(item)) ?? order.length + idx }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.item);
};

/**
 * GET customers/settings OR superAdmin/admin/:adminId/settings
 */
export const getCustomerSettings = async (adminId?: string): Promise<CustomerSettingsResponse> => {
  if (adminId) {
    const response = await api.get(`superAdmin/admin/${adminId}/settings`);
    return (response as any)?.data || response;
  }
  try {
    const response = await api.get('customers/settings');
    return (response as any)?.data || response;
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const fallback = await api.get('customers/info');
      return (fallback as any)?.data || fallback;
    }
    throw error;
  }
};

/**
 * Save or update card settings & headings
 * POST/PATCH customers/settings OR superAdmin/admin/:adminId/settings
 */
export const saveOrUpdateCustomerSettings = async (
  profile: Partial<ProfileData>,
  adminId?: string
): Promise<CustomerSettingsResponse> => {
  const payload = formatCustomerSettingsPayload(profile);
  const endpoint = adminId ? `superAdmin/admin/${adminId}/settings` : 'customers/settings';

  // 1. Try POST
  try {
    const res = await api.post(endpoint, payload);
    return (res as any)?.data || res;
  } catch (err: any) {
    // 2. Try PATCH / PUT
    if (err?.response?.status === 405 || err?.response?.status === 404 || err?.response?.status === 409) {
      try {
        const patchRes = await api.patch(endpoint, payload);
        return (patchRes as any)?.data || patchRes;
      } catch (patchErr: any) {
        if (adminId) {
          try {
            const putRes = await api.put(endpoint, payload);
            return (putRes as any)?.data || putRes;
          } catch {
            throw patchErr;
          }
        }
        // 3. Fallback to customers/info for regular customer only
        if (patchErr?.response?.status === 404 || patchErr?.response?.status === 405) {
          const infoRes = await api.patch('customers/info', payload);
          return (infoRes as any)?.data || infoRes;
        }
        throw patchErr;
      }
    }
    throw err;
  }
};

/**
 * Reset card settings (POST superAdmin/admin/:adminId/settings/reset)
 */
export const resetCustomerSettings = async (adminId?: string): Promise<any> => {
  if (adminId) {
    const res = await api.post(`superAdmin/admin/${adminId}/settings/reset`);
    return (res as any)?.data || res;
  }
  return { success: true };
};
