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
  };
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
