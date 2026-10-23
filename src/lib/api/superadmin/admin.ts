import { api } from '@/utils/axios';

export interface adminPayload {
  adminCategoryId: string;
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

// GET superadmin/admin
export const getAdmins = async (): Promise<admin[]> => {
  try {
    let response: any;
    try {
      response = await api.get('superadmin/admin');
    } catch (err: any) {
      if (err?.response?.status === 404) {
        response = await api.get('superAdmin/admin');
      } else {
        throw err;
      }
    }
    const resAny = response as any;
    const list =
      resAny?.data?.admins ||
      resAny?.admins ||
      resAny?.data?.data?.admins ||
      (Array.isArray(resAny?.data) ? resAny.data : null) ||
      (Array.isArray(response) ? response : []);

    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error('API superadmin/admin error:', error);
    return [];
  }
};

export const getAdmin = getAdmins;

// POST superadmin/admin
export const saveAdminProfile = async (data: adminPayload): Promise<admin> => {
  const priceVal = data.price !== undefined ? Number(data.price) : (data as any).amount !== undefined ? Number((data as any).amount) : undefined;
  const renewalVal = data.renewalAmount !== undefined ? Number(data.renewalAmount) : undefined;
  const startIso = data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate;
  const endIso = data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate;

  const payload = {
    ...data,
    adminCategoryId: data.adminCategoryId,
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
      password: data.password,
      role: 'ADMIN',
    },
    fullname: data.fullname,
    email: data.email,
    phoneNumber: data.phoneNumber,
    secondaryPhoneNumber: data.secondaryPhoneNumber,
    password: data.password,
    role: 'ADMIN',
  };

  const response = await api.post('superadmin/admin', payload);
  return (response as any)?.data || response;
};

export const saveAdmin = saveAdminProfile;

// PATCH superadmin/admin/:id (backend uses PATCH for updates)
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
    adminCategoryId: data.adminCategoryId,
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

  if (data.password && data.password.trim() !== '') {
    payload.password = data.password;
  }

  // Use PATCH first as requested by backend requirements
  let response: any;
  try {
    response = await api.patch(`superadmin/admin/${id}`, payload);
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 405) {
      try {
        response = await api.patch(`superAdmin/admin/${id}`, payload);
      } catch {
        response = await api.put(`superadmin/admin/${id}`, payload);
      }
    } else {
      throw err;
    }
  }

  return (response as any)?.data || response;
};

export const updateAdmin = editAdmin;
export const updateAdminProfile = editAdmin;

// DELETE superadmin/admin/:id
export const deleteAdmin = async (id: string): Promise<{ success: boolean; id: string }> => {
  await api.delete(`superadmin/admin/${id}`);
  return { success: true, id };
};
