import { api, EmployeePortal } from '@/utils/axios';

/** Employee panel's own APIs: /api/v1/employee/{login,profile,change-password,logout} (refresh lives in axios.ts) */

export interface EmployeeLoginPayload {
  username: string; // mobile
  password: string;
}

export interface EmployeeProfilePage {
  key: string;
  label?: string;
  permission?: string;
}

export interface EmployeeProfile {
  id?: string;
  name?: string;
  mobile?: string;
  email?: string;
  portal: EmployeePortal;
  /** Every page with its level (BLOCK / VIEW / EDIT); shape is normalised by normalizePermissions */
  permissions: unknown;
  pages: EmployeeProfilePage[];
  /** Pages that are not BLOCK (sidebar) */
  menu: EmployeeProfilePage[];
  [key: string]: unknown;
}

const unwrap = (res: any) => res?.data ?? res;

const toPortal = (v: unknown): EmployeePortal =>
  String(v ?? '').toUpperCase() === 'FRANCHISE' ? 'FRANCHISE' : 'SUPERADMIN';

/** Same response as /users/login; 403 for SuperAdmin / franchise / admin accounts */
export const employeeLogin = async (payload: EmployeeLoginPayload) => api.post('employee/login', payload);

export const getMyEmployeeProfile = async (): Promise<EmployeeProfile> => {
  const raw: any = unwrap(await api.get('employee/profile'));
  const p = raw?.employee ? { ...raw.employee, ...raw } : raw || {};
  return {
    ...p,
    portal: toPortal(p.portal),
    permissions: p.permissions ?? [],
    pages: Array.isArray(p.pages) ? p.pages : [],
    menu: Array.isArray(p.menu) ? p.menu : [],
  };
};

export const changeMyEmployeePassword = async (payload: { currentPassword: string; newPassword: string }) =>
  api.post('employee/change-password', payload);

/** Token is passed in: sign-out clears storage before the request interceptors run */
export const employeeLogout = async (accessToken: string | null) =>
  api.post('employee/logout', {}, accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined);
