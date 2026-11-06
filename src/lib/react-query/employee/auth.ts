import { changeMyEmployeePassword, getMyEmployeeProfile } from '@/lib/api/employee/auth';
import { EMPLOYEE_SELF_KEYS } from '@/lib/react-query/queryKeys';
import { setEmployeePortal } from '@/utils/axios';
import { useMutation, useQuery } from '@tanstack/react-query';
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

/** GET employee/profile: details, portal, permissions, pages and menu. Also stores the portal for the URL helpers. */
export const useMyEmployeeProfile = (enabled = true) =>
  useQuery({
    queryKey: [EMPLOYEE_SELF_KEYS.PROFILE],
    queryFn: async () => {
      const profile = await getMyEmployeeProfile();
      setEmployeePortal(profile.portal);
      return profile;
    },
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });

export const useChangeMyEmployeePassword = (onDone?: () => void) =>
  useMutation({
    mutationFn: changeMyEmployeePassword,
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Password changed successfully');
      onDone?.();
    },
    onError: (error: any) => toast.error(errorMessage(error, 'Failed to change password')),
  });
