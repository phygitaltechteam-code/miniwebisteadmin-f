import { api, isFranchiseScope } from '@/utils/axios';

export interface EmployeePayload {
  employeeName: string;
  mobileNumber: string;
  email?: string;
  designation: string;
  joiningDate?: string;
  password?: string;
  address?: string;
  /** SuperAdmin only: "" = SuperAdmin's own employee */
  franchiseId?: string;
}

export interface EmployeeItem {
  id: string;
  fullname?: string;
  phoneNumber?: string;
  email?: string | null;
  designation?: string;
  joiningDate?: string | null;
  address?: string | null;
  isActive?: boolean;
  franchise?: { id: string; businessName?: string } | null;
  addedBy?: { label?: string } | null;
  createdAt?: string;
}

// superAdmin/employees, or franchise/employees on a franchise session
const base = () => (isFranchiseScope() ? 'franchise/employees' : 'superAdmin/employees');

export const getEmployees = async (): Promise<EmployeeItem[]> => {
  const res: any = await api.get(base(), { params: { page: 1, limit: 100 } });
  const list =
    res?.data?.employees ||
    res?.employees ||
    res?.data?.data?.employees ||
    (Array.isArray(res?.data?.data) ? res.data.data : null) ||
    (Array.isArray(res?.data) ? res.data : null) ||
    (Array.isArray(res) ? res : []);
  return Array.isArray(list) ? list : [];
};

export const createEmployee = async (data: EmployeePayload): Promise<any> => {
  return api.post(base(), data);
};

export const updateEmployee = async (id: string, data: Partial<EmployeePayload>): Promise<any> => {
  return api.patch(`${base()}/${id}`, data);
};

export const toggleEmployeeStatus = async (id: string, isActive: boolean): Promise<any> => {
  return api.patch(`${base()}/${id}/status`, { isActive });
};

export const deleteEmployee = async (id: string): Promise<any> => {
  return api.delete(`${base()}/${id}`);
};

// ─── Page permissions ────────────────────────────────────────────────────────

export interface EmployeePage {
  srNo?: number;
  key: string;
  label: string;
}

export interface PermissionOption {
  value: string;
  label: string;
  description?: string;
}

export interface EmployeePagesResponse {
  portal?: string;
  pages: EmployeePage[];
  permissionOptions: PermissionOption[];
  defaultPermission: string;
}

/** GET …/employees/pages — page list + Block/View/Edit options for the panel */
export const getEmployeePages = async (portal?: 'SUPERADMIN' | 'FRANCHISE'): Promise<EmployeePagesResponse> => {
  const res: any = await api.get(`${base()}/pages`, { params: portal ? { portal } : undefined });
  const body = res?.pages ? res : res?.data?.pages ? res.data : res?.data?.data || res?.data || res;
  return {
    portal: body?.portal,
    pages: Array.isArray(body?.pages) ? body.pages : [],
    permissionOptions: Array.isArray(body?.permissionOptions) ? body.permissionOptions : [],
    defaultPermission: body?.defaultPermission || 'BLOCK',
  };
};

/**
 * GET …/employees/:id/permissions — raw response (normalised by normalizePermissions).
 * `prefix` overrides the panel prefix (used for an employee's own login).
 */
export const getEmployeePermissionsApi = async (id: string, prefix?: string): Promise<any> => {
  return api.get(`${prefix || base()}/${id}/permissions`);
};

/** PUT …/employees/:id/permissions with { permissions: [{ key, permission }] } (shape to confirm with backend) */
export const saveEmployeePermissionsApi = async (
  id: string,
  permissions: { key: string; permission: string }[],
): Promise<any> => {
  return api.put(`${base()}/${id}/permissions`, { permissions });
};
