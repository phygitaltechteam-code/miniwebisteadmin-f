import { Token, User } from '@/types';
import { QUERY_KEYS } from '@/lib/react-query/queryKeys';
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { compressFormDataImages } from '@/utils/imageCompressor';

export const unAuthenticatedApi: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
});

// Every upload: image files in a FormData body are compressed before sending (other fields untouched)
const compressUploadImages = async (req: InternalAxiosRequestConfig) => {
  if (typeof FormData !== 'undefined' && req.data instanceof FormData) {
    req.data = await compressFormDataImages(req.data);
  }
  return req;
};

unAuthenticatedApi.interceptors.request.use(compressUploadImages);

/**
 * Robust helper to extract accessToken string from localStorage
 * regardless of whether it was saved as a raw JWT string or JSON object.
 */
export const getStoredAccessToken = (): string | null => {
  try {
    const raw =
      localStorage.getItem('token') ||
      localStorage.getItem(QUERY_KEYS.TOKEN) ||
      localStorage.getItem('token_key');

    if (!raw) return null;

    if (raw.startsWith('{') || raw.startsWith('[')) {
      const parsed = JSON.parse(raw);
      return (
        parsed?.accessToken ||
        parsed?.data?.accessToken ||
        parsed?.token ||
        parsed?.data?.token ||
        null
      );
    }
    // Clean quotes if stored as a JSON string literal e.g. "eyJ..."
    return raw.replace(/^"|"$/g, '').trim();
  } catch {
    return null;
  }
};

/**
 * Robust helper to extract refreshToken from localStorage
 */
export const getStoredRefreshToken = (): string | null => {
  try {
    const raw =
      localStorage.getItem('token') ||
      localStorage.getItem(QUERY_KEYS.TOKEN) ||
      localStorage.getItem('token_key');

    if (!raw) return null;
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      return (
        parsed?.refreshToken ||
        parsed?.data?.refreshToken ||
        null
      );
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if the currently stored authentication token belongs to a SuperAdmin user.
 */
export const isSuperAdminUser = (): boolean => {
  try {
    const raw = localStorage.getItem('token') || localStorage.getItem(QUERY_KEYS.TOKEN);
    if (!raw) return false;
    let parsed: any = null;
    if (typeof raw === 'string' && (raw.startsWith('{') || raw.startsWith('['))) {
      parsed = JSON.parse(raw);
    }
    const tokenStr = parsed?.accessToken || (typeof raw === 'string' && !raw.startsWith('{') ? raw : null);
    if (!tokenStr) {
      const userRole = parsed?.user?.role || parsed?.role || parsed?.data?.user?.role || parsed?.data?.role || '';
      return String(userRole).toUpperCase() === 'SUPERADMIN';
    }
    const decoded: any = jwtDecode(tokenStr);
    const role = decoded?.role || decoded?.user?.role || parsed?.user?.role || parsed?.role || '';
    return String(role).toUpperCase() === 'SUPERADMIN';
  } catch {
    return false;
  }
};

/**
 * Check if the currently stored authentication token belongs to a Franchise user.
 */
const storedRoleIs = (target: string): boolean => {
  try {
    const raw =
      localStorage.getItem('token') ||
      localStorage.getItem(QUERY_KEYS.TOKEN) ||
      localStorage.getItem('token_key');
    if (!raw) return false;
    let parsed: any = null;
    if (typeof raw === 'string' && (raw.startsWith('{') || raw.startsWith('['))) {
      parsed = JSON.parse(raw);
    }
    const tokenStr =
      parsed?.accessToken ||
      parsed?.data?.accessToken ||
      parsed?.token ||
      (typeof raw === 'string' && !raw.startsWith('{') ? raw : null);

    const directRole =
      parsed?.user?.role ||
      parsed?.role ||
      parsed?.data?.user?.role ||
      parsed?.data?.role ||
      '';

    if (String(directRole).toUpperCase() === target) return true;

    if (tokenStr) {
      try {
        const decoded: any = jwtDecode(tokenStr);
        const role = decoded?.role || decoded?.user?.role || '';
        if (String(role).toUpperCase() === target) return true;
      } catch {}
    }
    return false;
  } catch {
    return false;
  }
};

export const isFranchiseUser = (): boolean => storedRoleIs('FRANCHISE');

/**
 * Check if the currently stored authentication token belongs to an Employee user.
 */
export const isEmployeeUser = (): boolean => storedRoleIs('EMPLOYEE');

export type EmployeePortal = 'SUPERADMIN' | 'FRANCHISE';

/** Set from GET employee/profile (`portal`), so URL helpers know which panel the employee belongs to */
export const EMPLOYEE_PORTAL_KEY = 'employee_portal';

export const setEmployeePortal = (portal: EmployeePortal | null) => {
  try {
    if (portal) localStorage.setItem(EMPLOYEE_PORTAL_KEY, portal);
    else localStorage.removeItem(EMPLOYEE_PORTAL_KEY);
  } catch {}
};

/** Employee's panel: profile `portal`, else FRANCHISE when the login response carries a franchise */
export const getEmployeePortal = (): EmployeePortal => {
  try {
    const stored = String(localStorage.getItem(EMPLOYEE_PORTAL_KEY) || '').toUpperCase();
    if (stored === 'FRANCHISE' || stored === 'SUPERADMIN') return stored;
    const raw = localStorage.getItem('token');
    if (raw && raw.startsWith('{')) {
      const t = JSON.parse(raw);
      const user = t?.user || t?.data?.user || {};
      const employee = t?.employee || user?.employee || {};
      const franchiseId =
        t?.franchise?.id || user?.franchise?.id || employee?.franchise?.id ||
        t?.franchiseId || user?.franchiseId || employee?.franchiseId;
      if (franchiseId) return 'FRANCHISE';
    }
  } catch {}
  return 'SUPERADMIN';
};

/** Franchise panel scope: a franchise login, or an employee of a franchise (same screens and API shapes) */
export const isFranchiseScope = (): boolean =>
  isFranchiseUser() || (isEmployeeUser() && getEmployeePortal() === 'FRANCHISE');

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
});

api.interceptors.request.use(compressUploadImages);

api.interceptors.request.use(async (req) => {
  const isFranchise = isFranchiseUser();
  const isEmployee = isEmployeeUser();

  // Strict guard: on SuperAdmin, Franchise or Employee sessions, NEVER dispatch any request to customers/*
  if (isSuperAdminUser() || isFranchise || isEmployee) {
    const targetUrl = req.url || '';
    if (targetUrl.startsWith('customers/') || targetUrl.includes('/customers/')) {
      console.warn(`[axios] Blocked customers/ route on Admin/Franchise session: ${targetUrl}`);
      return Promise.reject(new Error(`[Admin Protection] Customers endpoint blocked on management session: ${targetUrl}`));
    }
  }

  // Franchise panel (franchise login or a franchise's employee): superAdmin/admin/:id/... => franchise/admin/:id/...
  // e.g. superAdmin/admin/:adminId/info -> franchise/admin/:adminId/info
  if ((isFranchise || (isEmployee && getEmployeePortal() === 'FRANCHISE')) && req.url) {
    if (/^\/?superAdmin\/admin\//i.test(req.url)) {
      req.url = req.url.replace(/^(\/?)superAdmin\/admin\//i, '$1franchise/admin/');
    } else if (/^\/?superadmin\//i.test(req.url)) {
      req.url = req.url.replace(/^(\/?)superadmin\//i, '$1franchise/');
    }
  }

  // Employee panel: the same API as their SuperAdmin / franchise, under employee/ (every method)
  if (isEmployee && req.url && /^\/?(superadmin|franchise)\//i.test(req.url)) {
    req.url = req.url.replace(/^(\/?)(superadmin|franchise)\//i, '$1employee/');
  }

  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();

  if (accessToken) {
    // Check expiration and try refresh if token is expired
    try {
      const decodedUser: User = jwtDecode(accessToken);
      const isExpired = decodedUser.exp && decodedUser.exp * 1000 < Date.now();

      if (isExpired && refreshToken) {
        try {
          const res = await unAuthenticatedApi.post(isEmployee ? 'employee/refresh' : '/users/refresh-token', {
            refreshToken,
          });

          const newAccessToken =
            res.data?.data?.accessToken || res.data?.accessToken;
          const newRefreshToken =
            res.data?.data?.refreshToken ||
            res.data?.refreshToken ||
            refreshToken;

          if (newAccessToken) {
            const rawCurrent = localStorage.getItem('token') || '{}';
            let parsedCurrent: any = {};
            try {
              parsedCurrent = JSON.parse(rawCurrent);
            } catch {}

            const updatedStorage = {
              ...parsedCurrent,
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            };

            localStorage.setItem('token', JSON.stringify(updatedStorage));
            localStorage.setItem(QUERY_KEYS.TOKEN, JSON.stringify(updatedStorage));

            const authBearer = `Bearer ${newAccessToken}`;
            if (req.headers.set) {
              req.headers.set('Authorization', authBearer);
              req.headers.set('token', newAccessToken);
              req.headers.set('x-access-token', newAccessToken);
            } else {
              req.headers.Authorization = authBearer;
              req.headers['Authorization'] = authBearer;
              req.headers['token'] = newAccessToken;
              req.headers['x-access-token'] = newAccessToken;
            }
            return req;
          }
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError);
        }
      }
    } catch {
      // jwtDecode parse issue, continue with current token
    }

    // Attach Authorization header and fallback token headers
    const authBearer = `Bearer ${accessToken}`;
    if (req.headers.set) {
      req.headers.set('Authorization', authBearer);
      req.headers.set('token', accessToken);
      req.headers.set('x-access-token', accessToken);
    } else {
      req.headers.Authorization = authBearer;
      req.headers['Authorization'] = authBearer;
      req.headers['token'] = accessToken;
      req.headers['x-access-token'] = accessToken;
    }
  }

  return req;
});

export const setActiveAdminId = (adminId: string | null) => {
  if (adminId) {
    sessionStorage.setItem('active_admin_id', adminId);
  } else {
    sessionStorage.removeItem('active_admin_id');
  }
};

export const getActiveAdminId = (): string | null => {
  try {
    return sessionStorage.getItem('active_admin_id') || null;
  } catch {
    return null;
  }
};

api.interceptors.response.use(
  async (res: AxiosResponse) => {
    return res.data;
  },
  (error: AxiosError<unknown>) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized:', error.response.data);
    } else if (error.response?.status === 403) {
      console.error('Forbidden:', error.response.data);
      // Admin plan expired (login or any page): show the blocking popup (PlanExpiredGate)
      const body: any = error.response.data;
      if (body?.data?.code === 'PLAN_EXPIRED') {
        window.dispatchEvent(new CustomEvent('plan-expired', { detail: { message: body?.data?.message || body?.message } }));
      }
    } else if (error.response?.status === 404) {
      console.error('Not found:', error.response.data);
    } else if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    } else {
      console.error('Error:', error.response?.data);
    }

    return Promise.reject(error);
  },
);
