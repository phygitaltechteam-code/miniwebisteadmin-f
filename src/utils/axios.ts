import { Token, User } from '@/types';
import { QUERY_KEYS } from '@/lib/react-query/queryKeys';
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { jwtDecode } from 'jwt-decode';

export const unAuthenticatedApi: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
});

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

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
});

api.interceptors.request.use(async (req) => {
  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();

  if (accessToken) {
    // Check expiration and try refresh if token is expired
    try {
      const decodedUser: User = jwtDecode(accessToken);
      const isExpired = decodedUser.exp && decodedUser.exp * 1000 < Date.now();

      if (isExpired && refreshToken) {
        try {
          const res = await unAuthenticatedApi.post('/users/refresh-token', {
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

api.interceptors.response.use(
  async (res: AxiosResponse) => {
    return res.data;
  },
  (error: AxiosError<unknown>) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized:', error.response.data);
    } else if (error.response?.status === 403) {
      console.error('Forbidden:', error.response.data);
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
