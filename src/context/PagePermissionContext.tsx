import React, { createContext, useContext } from 'react';
import type { SuperAdminView } from '@/components/superadmin/SuperAdminSidebar';
import type { PermissionLevel, ViewAccess } from '@/lib/employeePermissions';

/**
 * Edit access of the page being shown. Employees with VIEW permission get canEdit = false,
 * which hides / disables add, edit, delete and submit in the shared form & table components.
 * Defaults to true, so every other role is unaffected.
 *
 * viewAccess: the employee's level per module (undefined for every other role), so a page can
 * hide a section that belongs to another module (e.g. Franchise Monthly Bills in the Billing Report).
 */
const PagePermissionContext = createContext<{ canEdit: boolean; viewAccess?: ViewAccess | null }>({
  canEdit: true,
});

export const PagePermissionProvider: React.FC<{
  canEdit: boolean;
  viewAccess?: ViewAccess | null;
  children: React.ReactNode;
}> = ({ canEdit, viewAccess, children }) => (
  <PagePermissionContext.Provider value={{ canEdit, viewAccess }}>{children}</PagePermissionContext.Provider>
);

export const useCanEdit = (): boolean => useContext(PagePermissionContext).canEdit;

/** Level for a module: EDIT for non-employees; for employees a missing permission means BLOCK */
export const useViewLevel = (view: SuperAdminView): PermissionLevel => {
  const { viewAccess } = useContext(PagePermissionContext);
  if (!viewAccess) return 'EDIT';
  return viewAccess[view] ?? 'BLOCK';
};
