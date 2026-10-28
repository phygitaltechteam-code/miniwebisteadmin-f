import { api } from '@/utils/axios';

export interface FranchisePayload {
  fullname: string;
  name?: string;
  phoneNumber: string;
  address: string;
  adminLimit: number;
  password?: string;
  email?: string;
  city?: string;
  user?: {
    fullname: string;
    phoneNumber: string;
    password?: string;
    address?: string;
    role?: string;
  };
}

export interface FranchiseItem {
  id: string;
  _id?: string;
  fullname?: string;
  name?: string;
  phoneNumber?: string;
  phone?: string;
  address?: string;
  adminLimit?: number;
  email?: string;
  city?: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    fullname?: string;
    phoneNumber?: string;
    address?: string;
    email?: string;
    createdAt?: string;
  };
}

// GET /superadmin/franchise (real backend API call, no static dummy data)
export const getFranchises = async (): Promise<FranchiseItem[]> => {
  try {
    let response: any;
    try {
      response = await api.get('superadmin/franchise');
    } catch (err: any) {
      if (err?.response?.status === 404) {
        response = await api.get('superAdmin/franchise');
      } else {
        throw err;
      }
    }
    const resAny = response as any;
    const list =
      resAny?.data?.franchises ||
      resAny?.franchises ||
      resAny?.data?.data?.franchises ||
      resAny?.data?.data ||
      (Array.isArray(resAny?.data) ? resAny.data : null) ||
      (Array.isArray(response) ? response : []);

    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error('API superadmin/franchise fetch error:', error);
    return [];
  }
};

// POST /superadmin/franchise (sends required fullname, adminLimit as number, phoneNumber, address, password)
export const saveFranchise = async (data: FranchisePayload): Promise<FranchiseItem> => {
  const fullnameVal = (data.fullname || data.name || '').trim();
  const adminLimitVal = Number(data.adminLimit || 10);

  const payload: any = {
    ...data,
    fullname: fullnameVal,
    name: fullnameVal,
    adminLimit: adminLimitVal,
    phoneNumber: data.phoneNumber?.trim(),
    address: data.address?.trim(),
    password: data.password,
    user: data.user || {
      fullname: fullnameVal,
      phoneNumber: data.phoneNumber?.trim(),
      address: data.address?.trim(),
      password: data.password,
      role: 'FRANCHISE',
    },
  };

  if (data.email && data.email.trim() !== '') {
    payload.email = data.email.trim();
  }

  let response: any;
  try {
    response = await api.post('superadmin/franchise', payload);
  } catch (err: any) {
    if (err?.response?.status === 404) {
      response = await api.post('superAdmin/franchise', payload);
    } else {
      throw err;
    }
  }
  return (response as any)?.data || response;
};

// PATCH /superadmin/franchise/:id
export const updateFranchise = async (
  id: string,
  data: Partial<FranchisePayload>,
): Promise<FranchiseItem> => {
  const payload: any = { ...data };

  if (data.fullname || data.name) {
    const val = (data.fullname || data.name || '').trim();
    payload.fullname = val;
    payload.name = val;
  }
  if (data.adminLimit !== undefined && data.adminLimit !== null && (data.adminLimit as any) !== '') {
    payload.adminLimit = Number(data.adminLimit);
  }
  if (data.phoneNumber) {
    payload.phoneNumber = data.phoneNumber.trim();
  }
  if (data.address) {
    payload.address = data.address.trim();
  }
  if (data.password && data.password.trim() !== '') {
    payload.password = data.password;
  }

  let response: any;
  try {
    response = await api.patch(`superadmin/franchise/${id}`, payload);
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 405) {
      try {
        response = await api.patch(`superAdmin/franchise/${id}`, payload);
      } catch {
        response = await api.put(`superadmin/franchise/${id}`, payload);
      }
    } else {
      throw err;
    }
  }
  return (response as any)?.data || response;
};

// DELETE /superadmin/franchise/:id
export const deleteFranchise = async (id: string): Promise<{ success: boolean; id: string }> => {
  try {
    await api.delete(`superadmin/franchise/${id}`);
  } catch {
    await api.delete(`superAdmin/franchise/${id}`);
  }
  return { success: true, id };
};
