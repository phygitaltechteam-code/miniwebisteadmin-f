import React from 'react';
import { CreditCard, FileText } from 'lucide-react';
import { franchiseNavItems, navItems, SuperAdminView } from '@/components/superadmin/SuperAdminSidebar';
import type { PermissionOption } from '@/lib/api/superadmin/employee';

/** BLOCK = page hidden · VIEW = read only (no add/edit/delete/submit) · EDIT = full access */
export type PermissionLevel = 'BLOCK' | 'VIEW' | 'EDIT';

/** Page key (from the backend, e.g. ALL_BUSINESSES) -> level */
export type PermissionsByKey = Record<string, PermissionLevel>;

/** Sidebar view -> level */
export type ViewAccess = Partial<Record<SuperAdminView, PermissionLevel>>;

/** Used only when GET …/employees/pages fails */
export const FALLBACK_LEVELS: PermissionOption[] = [
  { value: 'BLOCK', label: 'Block', description: 'Page hidden' },
  { value: 'VIEW', label: 'View', description: 'View only, no add / edit / delete / submit' },
  { value: 'EDIT', label: 'Edit', description: 'Full access' },
];

const LEVELS: PermissionLevel[] = ['BLOCK', 'VIEW', 'EDIT'];
const asLevel = (v: unknown): PermissionLevel | null => {
  const s = String(v ?? '').trim().toUpperCase();
  return (LEVELS as string[]).includes(s) ? (s as PermissionLevel) : null;
};

// Backend page key -> sidebar view
export const PAGE_KEY_TO_VIEW: Record<string, SuperAdminView> = {
  HOME: 'home',
  ALL_BUSINESSES: 'admins',
  ALL_REVIEWS: 'reviews',
  FRANCHISEE_LIST: 'franchise',
  FRANCHISE_LIST: 'franchise',
  EMPLOYEE_MASTER: 'employees',
  CATEGORY_MASTER: 'categories',
  BILLING_REPORT: 'billing',
  CUSTOMER_PLANS_PRICING: 'pricing',
  CUSTOMER_PLANS_AND_PRICING: 'pricing',
  CUSTOMER_PLANS_PRICING_MANAGEMENT: 'pricing',
  CARD_FORGE: 'card-builder',
};

const normalizeText = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** View for a backend page: known key first, then by matching the sidebar label */
export const pageKeyToView = (key: string, label?: string): SuperAdminView | null => {
  const known = PAGE_KEY_TO_VIEW[String(key || '').toUpperCase()];
  if (known) return known;
  if (label) {
    const target = normalizeText(label);
    const match = [...navItems, ...franchiseNavItems].find((i) => {
      const l = normalizeText(i.label);
      return l === target || l.startsWith(target) || target.startsWith(l);
    });
    if (match) return match.id;
    if (target.startsWith('cardforge')) return 'card-builder';
  }
  return null;
};

/** Sidebar icon for a backend page */
export const pageIcon = (key: string, label?: string): React.ElementType => {
  const view = pageKeyToView(key, label);
  if (view === 'card-builder') return CreditCard;
  return [...navItems, ...franchiseNavItems].find((i) => i.id === view)?.icon || FileText;
};

/**
 * Permissions response -> { KEY: level }. Accepts
 * { permissions: [{ key, permission }] }, { permissions: { KEY: level } }, an array, or the same under data.
 */
export const normalizePermissions = (raw: any): PermissionsByKey => {
  const out: PermissionsByKey = {};
  const src =
    raw?.permissions ??
    raw?.data?.permissions ??
    raw?.data?.data?.permissions ??
    (Array.isArray(raw?.data) ? raw.data : undefined) ??
    raw;
  if (Array.isArray(src)) {
    src.forEach((p: any) => {
      const key = p?.key || p?.pageKey || p?.page;
      const level = asLevel(p?.permission ?? p?.level ?? p?.access ?? p?.value);
      if (key && level) out[String(key).toUpperCase()] = level;
    });
  } else if (src && typeof src === 'object') {
    Object.entries(src).forEach(([key, val]) => {
      const level = asLevel(val);
      if (level) out[key.toUpperCase()] = level;
    });
  }
  return out;
};

/** { KEY: level } -> { view: level } */
export const toViewAccess = (byKey: PermissionsByKey): ViewAccess => {
  const access: ViewAccess = {};
  Object.entries(byKey).forEach(([key, level]) => {
    const view = pageKeyToView(key);
    if (view) access[view] = level;
  });
  return access;
};

export interface EmployeeSession {
  isEmployee: boolean;
  employeeId: string;
  franchiseId: string;
  /** Permissions sent with the login response, if any */
  permissions: PermissionsByKey | null;
}

/** Employee details from the stored login response */
export const getEmployeeSession = (): EmployeeSession => {
  const empty: EmployeeSession = { isEmployee: false, employeeId: '', franchiseId: '', permissions: null };
  try {
    const raw = localStorage.getItem('token');
    if (!raw || !raw.startsWith('{')) return empty;
    const t = JSON.parse(raw);
    const user = t?.user || t?.data?.user || {};
    const role = String(user?.role || t?.role || t?.data?.role || '').toUpperCase();
    if (role !== 'EMPLOYEE') return empty;

    const employee = t?.employee || user?.employee || {};
    const franchise = t?.franchise || user?.franchise || employee?.franchise || null;
    const rawPerms = t?.permissions ?? user?.permissions ?? employee?.permissions;
    const perms = rawPerms ? normalizePermissions({ permissions: rawPerms }) : null;

    return {
      isEmployee: true,
      employeeId: String(t?.employeeId || user?.employeeId || employee?.id || ''),
      franchiseId: String(
        franchise?.id || t?.franchiseId || user?.franchiseId || employee?.franchiseId || '',
      ),
      permissions: perms && Object.keys(perms).length > 0 ? perms : null,
    };
  } catch {
    return empty;
  }
};
