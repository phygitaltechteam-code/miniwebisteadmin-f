import { api, isFranchiseUser } from '@/utils/axios';

export interface adminPayload {
  adminCategoryId?: string;
  price?: number;
  renewalAmount?: number;
  fullname: string;
  email: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  address: string;
  password?: string;
  startDate: string | Date;
  endDate: string | Date;
  plan?: string;
  role?: string;
  user?: {
    fullname: string;
    email: string;
    phoneNumber: string;
    secondaryPhoneNumber?: string;
    password?: string;
    role?: string;
  };
}

export type AdminPayload = adminPayload;

export interface admin {
  id?: string;
  _id?: string;
  adminCategoryId?: string;
  category?: {
    id: string;
    name: string;
  } | string;
  price?: number;
  renewalAmount?: number;
  startDate: Date | string;
  endDate: Date | string;
  address: string;
  plan?: string;
  secondaryPhoneNumber?: string;
  user?: {
    fullname: string;
    email: string;
    secondaryPhoneNumber?: string;
    phoneNumber: string;
    password?: string;
    role: string;
  };
}

export type AdminItem = admin;

// GET admins — franchise role uses franchise/admins, superadmin uses superadmin/admin
export const getAdmins = async (): Promise<admin[]> => {
  try {
    const isFranchise = isFranchiseUser();
    const endpoints = isFranchise
      ? ['franchise/admins', 'franchise/admin']
      : ['superadmin/admin', 'superAdmin/admin'];

    let response: any;
    let success = false;
    for (const endpoint of endpoints) {
      try {
        response = await api.get(endpoint);
        success = true;
        break;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404 || status === 403 || status === 405) {
          continue;
        }
        throw err;
      }
    }

    if (!success) {
      return [];
    }

    const resAny = response as any;
    const list =
      resAny?.data?.admins ||
      resAny?.admins ||
      resAny?.data?.data?.admins ||
      resAny?.data?.data ||
      (Array.isArray(resAny?.data) ? resAny.data : null) ||
      (Array.isArray(response) ? response : []);

    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error('API admin fetch error:', error);
    return [];
  }
};

export const getAdmin = getAdmins;

/** Digital card summary returned with an admin (Projects tab table) */
export interface DigitalCardInfo {
  cardNo?: string;
  cardLink?: string;
  createdAt?: string;
  madeBy?: { id?: string; fullname?: string; phoneNumber?: string; role?: string; label?: string } | null;
  paymentStatus?: 'DONE' | 'PENDING' | 'FREE_TRIAL';
  status?: 'ACTIVE' | 'EXPIRED' | 'INACTIVE' | 'DELETED';
}

export interface CopyAdminPayload {
  name: string;
  phoneNumber: string;
  password: string;
  copyCard: boolean;
  copyViews: boolean;
  copyFeedbacks: boolean;
}

// POST copy of an admin (new admin from the form, data copied from :id) —
// superAdmin/admin/:id/copy, or franchise/admins/:id/copy on a franchise session
export const copyAdmin = async (id: string, payload: CopyAdminPayload): Promise<{ admin: any; copied?: any }> => {
  const res: any = await api.post(isFranchiseUser() ? `franchise/admins/${id}/copy` : `superAdmin/admin/${id}/copy`, payload);
  return res?.data ?? res;
};

// GET one admin — superAdmin/admin/:id, or franchise/admins/:id on a franchise session
export const getAdminById = async (id: string): Promise<any> => {
  const res: any = await api.get(isFranchiseUser() ? `franchise/admins/${id}` : `superAdmin/admin/${id}`);
  return res?.data ?? res;
};

// POST save admin — franchise role uses franchise/admins, superadmin uses superadmin/admin
export const saveAdminProfile = async (data: adminPayload): Promise<admin> => {
  const priceVal = data.price !== undefined ? Number(data.price) : (data as any).amount !== undefined ? Number((data as any).amount) : undefined;
  const renewalVal = data.renewalAmount !== undefined ? Number(data.renewalAmount) : undefined;
  const startIso = data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate;
  const endIso = data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate;

  const passwordVal = (data.password || data.user?.password || '').trim();

  const payload: any = {
    ...data,
    amount: priceVal,
    price: priceVal,
    renewalAmount: renewalVal,
    startDate: startIso,
    endDate: endIso,
    expiryDate: endIso,
    address: data.address,
    password: passwordVal,
    user: data.user || {
      fullname: data.fullname,
      email: data.email,
      phoneNumber: data.phoneNumber,
      secondaryPhoneNumber: data.secondaryPhoneNumber,
      password: passwordVal,
      role: 'ADMIN',
    },
    fullname: data.fullname,
    email: data.email,
    phoneNumber: data.phoneNumber,
    secondaryPhoneNumber: data.secondaryPhoneNumber,
    role: 'ADMIN',
  };

  if (passwordVal) {
    payload.password = passwordVal;
    if (payload.user) {
      payload.user.password = passwordVal;
    }
  }

  if (data.adminCategoryId) {
    payload.adminCategoryId = data.adminCategoryId;
  }

  const isFranchise = isFranchiseUser();
  const endpoints = isFranchise
    ? ['franchise/admins', 'franchise/admin']
    : ['superadmin/admin', 'superAdmin/admin'];

  let lastError: any;
  for (const endpoint of endpoints) {
    try {
      const response = await api.post(endpoint, payload);
      return (response as any)?.data || response;
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      const resData = err?.response?.data;
      const message = resData?.message;

      // If backend responded with a business message (e.g. "Admin limit reached", validation failure)
      // immediately throw so the UI receives and displays the actual message!
      if (message || (resData?.errors && resData.errors.length > 0)) {
        throw err;
      }

      // If status is 403, 400, 409, 422 - this is a business / permission rejection from server, do not fallback
      if (status === 403 || status === 400 || status === 409 || status === 422) {
        throw err;
      }

      // Only retry alternative route spelling if 404 (route not found) or 405 (method not allowed)
      if (status === 404 || status === 405) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
};

export const saveAdmin = saveAdminProfile;

// PATCH update admin
export const editAdmin = async (id: string, data: Partial<adminPayload>): Promise<admin> => {
  const priceVal =
    data.price !== undefined && data.price !== null && data.price !== ('' as any)
      ? Number(data.price)
      : (data as any).amount !== undefined && (data as any).amount !== null && (data as any).amount !== ''
      ? Number((data as any).amount)
      : undefined;

  const renewalVal =
    data.renewalAmount !== undefined && data.renewalAmount !== null && data.renewalAmount !== ('' as any)
      ? Number(data.renewalAmount)
      : undefined;

  const startIso = data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate;
  const endIso = data.endDate instanceof Date ? data.endDate.toISOString() : (data as any).expiryDate || data.endDate;

  const payload: any = {
    ...data,
    amount: priceVal,
    price: priceVal,
    renewalAmount: renewalVal,
    startDate: startIso,
    endDate: endIso,
    expiryDate: endIso,
    address: data.address,
    user: data.user || {
      fullname: data.fullname,
      email: data.email,
      phoneNumber: data.phoneNumber,
      secondaryPhoneNumber: data.secondaryPhoneNumber,
      address: data.address,
      ...(data.password ? { password: data.password } : {}),
      role: 'ADMIN',
    },
    fullname: data.fullname,
    email: data.email,
    phoneNumber: data.phoneNumber,
    secondaryPhoneNumber: data.secondaryPhoneNumber,
  };

  if (data.adminCategoryId) {
    payload.adminCategoryId = data.adminCategoryId;
  }

  if (data.password && data.password.trim() !== '') {
    payload.password = data.password;
  }

  const isFranchise = isFranchiseUser();
  const prefixes = isFranchise
    ? ['franchise/admins', 'franchise/admin']
    : ['superadmin/admin', 'superAdmin/admin'];

  let lastError: any;
  for (const prefix of prefixes) {
    try {
      const response = await api.patch(`${prefix}/${id}`, payload);
      return (response as any)?.data || response;
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (message) {
        throw err;
      }
      if (status === 404 || status === 405) {
        try {
          const putRes = await api.put(`${prefix}/${id}`, payload);
          return (putRes as any)?.data || putRes;
        } catch (putErr: any) {
          if (putErr?.response?.data?.message) {
            throw putErr;
          }
          if (putErr?.response?.status === 404 || putErr?.response?.status === 405) {
            continue;
          }
          throw putErr;
        }
      }
      throw err;
    }
  }

  throw lastError;
};

export const updateAdmin = editAdmin;
export const updateAdminProfile = editAdmin;

// PATCH superAdmin/admin/:id/toggle with { isActive } — sets the admin active or inactive.
// On a franchise session the axios interceptor sends this to franchise/admin/:id/toggle.
export const toggleAdminStatus = async (id: string, isActive: boolean): Promise<any> => {
  const response = await api.patch(`superAdmin/admin/${id}/toggle`, { isActive });
  return (response as any)?.data || response;
};

/** isActive from a toggle response ({ isActive } or { data: { isActive } }); undefined when absent */
export const readIsActive = (res: any): boolean | undefined => {
  const val = res?.isActive ?? res?.data?.isActive;
  return typeof val === 'boolean' ? val : undefined;
};

/** Read the active flag from an admin / franchise record (true when nothing says otherwise) */
export const isRecordActive = (each: any): boolean => {
  const flag = each?.isActive ?? each?.active ?? each?.user?.isActive;
  if (typeof flag === 'boolean') return flag;
  const status = String(each?.status || each?.user?.status || '').toUpperCase();
  if (status) return status === 'ACTIVE';
  return true;
};

// DELETE admin
export const deleteAdmin = async (id: string): Promise<{ success: boolean; id: string }> => {
  const isFranchise = isFranchiseUser();
  const prefixes = isFranchise
    ? ['franchise/admins', 'franchise/admin']
    : ['superadmin/admin', 'superAdmin/admin'];

  let lastError: any;
  for (const prefix of prefixes) {
    try {
      await api.delete(`${prefix}/${id}`);
      return { success: true, id };
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (message || status === 403 || status === 400) {
        throw err;
      }
      if (status === 404 || status === 405) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};
