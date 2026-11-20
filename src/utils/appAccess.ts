/** Which apps an ADMIN may use, set by the SuperAdmin (backend `Admin.appAccess`) */
export type AppAccess = 'BOTH' | 'LEADS' | 'CARD';

export const APP_ACCESS_VALUES = ['BOTH', 'LEADS', 'CARD'] as const;

/** Any stored value -> AppAccess; missing or unknown (older records / sessions) means BOTH */
export const toAppAccess = (value: unknown): AppAccess => {
  const v = String(value ?? '')
    .trim()
    .toUpperCase();
  return v === 'LEADS' || v === 'CARD' ? v : 'BOTH';
};

/** Logged-in admin's access, from the login reply kept in localStorage 'token' (user.appAccess) */
export const getAppAccess = (): AppAccess => {
  try {
    const raw = localStorage.getItem('token');
    if (!raw || !raw.startsWith('{')) return 'BOTH';
    const parsed = JSON.parse(raw);
    return toAppAccess(
      parsed?.user?.appAccess ?? parsed?.data?.user?.appAccess,
    );
  } catch {
    return 'BOTH';
  }
};

/** Leads + Customers (everything except a card-only admin) */
export const canUseLeads = (access: AppAccess = getAppAccess()): boolean =>
  access !== 'CARD';

/** Digital card builder (everything except a leads-only admin) */
export const canUseCard = (access: AppAccess = getAppAccess()): boolean =>
  access !== 'LEADS';
