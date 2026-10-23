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
 * GET customers/settings (with fallback to customers/info)
 */
export const getCustomerSettings = async (): Promise<CustomerSettingsResponse> => {
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
 * Save or update card settings & headings (POST/PATCH customers/settings with fallback to customers/info)
 */
export const saveOrUpdateCustomerSettings = async (
  profile: Partial<ProfileData>
): Promise<CustomerSettingsResponse> => {
  const payload = formatCustomerSettingsPayload(profile);

  // 1. Try POST customers/settings
  try {
    const res = await api.post('customers/settings', payload);
    return (res as any)?.data || res;
  } catch (err: any) {
    // 2. Try PATCH customers/settings
    if (err?.response?.status === 405 || err?.response?.status === 404) {
      try {
        const patchRes = await api.patch('customers/settings', payload);
        return (patchRes as any)?.data || patchRes;
      } catch (patchErr: any) {
        // 3. Fallback to customers/info
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
