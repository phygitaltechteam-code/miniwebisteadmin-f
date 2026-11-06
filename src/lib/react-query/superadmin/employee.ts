import {
  createEmployee,
  deleteEmployee,
  EmployeePayload,
  getEmployees,
  toggleEmployeeStatus,
  updateEmployee,
  getEmployeePages,
  getEmployeePermissionsApi,
  saveEmployeePermissionsApi,
} from '@/lib/api/superadmin/employee';
import { SUPERADMIN_EMPLOYEE_KEYS } from '@/lib/react-query/queryKeys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const errorMessage = (error: any, fallback: string) => {
  const errList = error?.response?.data?.errors;
  return (
    (Array.isArray(errList) && errList.length > 0
      ? errList.map((e: any) => e.message || e.field).join(', ')
      : null) ||
    error?.response?.data?.message ||
    fallback
  );
};

const useInvalidateEmployees = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [SUPERADMIN_EMPLOYEE_KEYS.GET_ALL] });
};

export const useGetEmployees = () =>
  useQuery({
    queryKey: [SUPERADMIN_EMPLOYEE_KEYS.GET_ALL],
    queryFn: getEmployees,
    staleTime: 1000 * 60,
  });

export const useCreateEmployee = () => {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (data: EmployeePayload) => createEmployee(data),
    onSuccess: (res: any) => {
      invalidate();
      toast.success(res?.message || 'Employee created successfully');
    },
    onError: (error: any) => toast.error(errorMessage(error, 'Failed to create employee')),
  });
};

export const useUpdateEmployee = () => {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeePayload> }) => updateEmployee(id, data),
    onSuccess: (res: any) => {
      invalidate();
      toast.success(res?.message || 'Employee updated successfully');
    },
    onError: (error: any) => toast.error(errorMessage(error, 'Failed to update employee')),
  });
};

export const useToggleEmployeeStatus = () => {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleEmployeeStatus(id, isActive),
    onSuccess: (res: any) => toast.success(res?.message || 'Employee status updated'),
    onError: (error: any) => toast.error(errorMessage(error, 'Failed to update employee status')),
    onSettled: () => invalidate(),
  });
};

export const useDeleteEmployee = () => {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: (res: any) => {
      invalidate();
      toast.success(res?.message || 'Employee deleted successfully');
    },
    onError: (error: any) => toast.error(errorMessage(error, 'Failed to delete employee')),
  });
};

// ─── Page permissions ────────────────────────────────────────────────────────

export const useEmployeePages = () =>
  useQuery({
    queryKey: [SUPERADMIN_EMPLOYEE_KEYS.PAGES],
    queryFn: () => getEmployeePages(),
    staleTime: 1000 * 60 * 10,
  });

/** Raw permissions of one employee (normalise with normalizePermissions) */
export const useEmployeePermissions = (id?: string | null) =>
  useQuery({
    queryKey: [SUPERADMIN_EMPLOYEE_KEYS.PERMISSIONS, id],
    queryFn: () => getEmployeePermissionsApi(id as string),
    enabled: !!id,
    staleTime: 1000 * 60,
    // A refetch would overwrite unsaved changes in the Restriction Master
    refetchOnWindowFocus: false,
  });

export const useSaveEmployeePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: { key: string; permission: string }[] }) =>
      saveEmployeePermissionsApi(id, permissions),
    onSuccess: (res: any, { id }) => {
      queryClient.invalidateQueries({ queryKey: [SUPERADMIN_EMPLOYEE_KEYS.PERMISSIONS, id] });
      toast.success(res?.message || 'Permissions saved successfully');
    },
    onError: (error: any) => toast.error(errorMessage(error, 'Failed to save permissions')),
  });
};
