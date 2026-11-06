import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericTable, { Column } from '@/components/Forms/Table/GenericTable';
import { SuperAdminView } from '@/components/superadmin/SuperAdminSidebar';
import { isRecordActive } from '@/lib/api/superadmin/admin';
import { EmployeePage } from '@/lib/api/superadmin/employee';
import {
  FALLBACK_LEVELS,
  normalizePermissions,
  pageIcon,
  PermissionsByKey,
} from '@/lib/employeePermissions';
import {
  useEmployeePages,
  useEmployeePermissions,
  useGetEmployees,
  useSaveEmployeePermissions,
} from '@/lib/react-query/superadmin/employee';
import { ChevronDown, UserCog } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface EmployeeRestrictionMasterProps {
  userRole?: string;
  onNavigate?: (view: SuperAdminView) => void;
}

type Draft = Record<string, string>;

const sameMap = (a: Draft, b: Draft) => Object.keys({ ...a, ...b }).every((k) => a[k] === b[k]);

export const EmployeeRestrictionMaster: React.FC<EmployeeRestrictionMasterProps> = ({ userRole, onNavigate }) => {
  const isFranchise = userRole?.trim().toUpperCase() === 'FRANCHISE';

  // Pages + Block/View/Edit options come from the backend
  const { data: pagesData, isLoading: isLoadingPages, isError: pagesError } = useEmployeePages();
  const pages: EmployeePage[] = pagesData?.pages || [];
  const options = pagesData?.permissionOptions?.length ? pagesData.permissionOptions : FALLBACK_LEVELS;
  const defaultPermission = pagesData?.defaultPermission || 'BLOCK';

  const { data: employeeList, isLoading } = useGetEmployees();
  const employees = useMemo(
    () =>
      (Array.isArray(employeeList) ? employeeList : []).map((e) => ({
        id: e.id,
        fullname: e.fullname || 'Employee',
        designation: e.designation || '',
        isActive: isRecordActive(e),
      })),
    [employeeList],
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const [saved, setSaved] = useState<Draft>({});
  const [draft, setDraft] = useState<Draft>({});

  const {
    data: permsRaw,
    isFetching: isLoadingPerms,
    isError: permsError,
  } = useEmployeePermissions(selectedId || null);
  const { mutateAsync: savePermissions, isPending: isSaving } = useSaveEmployeePermissions();

  const selected = employees.find((e) => e.id === selectedId);
  const isDirty = !!selectedId && !sameMap(saved, draft);
  const busy = !selectedId || isLoadingPerms || isSaving;

  // First employee selected once the list arrives
  useEffect(() => {
    if (!selectedId && employees.length > 0) setSelectedId(employees[0].id);
  }, [employees, selectedId]);

  // Saved values of the selected employee (default for pages with nothing saved)
  useEffect(() => {
    if (!selectedId || isLoadingPerms || pages.length === 0) return;
    const byKey: PermissionsByKey = permsRaw ? normalizePermissions(permsRaw) : {};
    const map: Draft = Object.fromEntries(pages.map((p) => [p.key, byKey[p.key.toUpperCase()] || defaultPermission]));
    setSaved(map);
    setDraft(map);
  }, [selectedId, permsRaw, isLoadingPerms, pages, defaultPermission]);

  const selectEmployee = (id: string) => {
    if (id === selectedId) return;
    if (isDirty && !window.confirm('You have unsaved changes. Discard them and switch employee?')) return;
    setSelectedId(id);
  };

  const setLevel = (key: string, level: string) => setDraft((prev) => ({ ...prev, [key]: level }));
  const setAll = (level: string) => setDraft(Object.fromEntries(pages.map((p) => [p.key, level])));

  const handleSave = async () => {
    if (!selectedId) return;
    try {
      await savePermissions({
        id: selectedId,
        permissions: pages.map((p) => ({ key: p.key, permission: draft[p.key] || defaultPermission })),
      });
      setSaved(draft);
    } catch {
      // error toast comes from the mutation
    }
  };

  const summary = options
    .map((o) => `${o.label} ${pages.filter((p) => (draft[p.key] || defaultPermission) === o.value).length}`)
    .join(' · ');

  const columns: Column<EmployeePage>[] = [
    {
      accessor: 'label',
      header: 'Page / Module',
      render: ({ key, label }) => {
        const Icon = pageIcon(key, label);
        return (
          <div className="flex items-center gap-2.5 min-w-[180px]">
            <Icon className="w-[18px] h-[18px] text-[#616161] shrink-0" />
            <span>{label}</span>
          </div>
        );
      },
    },
    {
      accessor: 'key',
      header: 'Permission',
      render: ({ key }) => (
        <div className="relative w-full min-w-[150px] max-w-[220px]">
          <select
            value={draft[key] || defaultPermission}
            onChange={(e) => setLevel(key, e.target.value)}
            disabled={busy}
            aria-label="Permission"
            className="w-full appearance-none rounded border border-[#C4C4C4] bg-white pl-3 pr-8 py-1.5 text-[14px] text-[#000000DE] outline-none transition focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] disabled:bg-gray-100 cursor-pointer"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      ),
    },
  ];

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (!isLoading && employees.length === 0) {
    return (
      <div className="rounded-xl border border-stroke bg-white p-8 sm:p-10 shadow-sm flex flex-col items-center text-center gap-3">
        <UserCog className="w-10 h-10 text-[#9E9E9E]" />
        <div>
          <h2 className="text-lg font-bold text-black">No employees yet</h2>
          <p className="text-sm text-gray-500 mt-1">Add an employee in Employee Master to assign page permissions.</p>
        </div>
        {onNavigate && <GenericButton onClick={() => onNavigate('employees')}>Go to Employee Master</GenericButton>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Employee selection */}
      <div className="rounded-xl border border-stroke bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <div>
          <h2 className="text-lg font-bold text-black">Employee Restriction Master</h2>
          <p className="text-xs text-gray-500">
            Choose what each employee can do on every {isFranchise ? 'franchise' : 'super admin'} page
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
          <div className="w-full sm:max-w-sm font-['Roboto',Helvetica,Arial,sans-serif]">
            <label className="mb-1 block text-[14px] font-normal text-[#000000DE]">Employee</label>
            <select
              value={selectedId}
              onChange={(e) => selectEmployee(e.target.value)}
              disabled={isLoading}
              className="w-full rounded border border-[#C4C4C4] bg-white px-3 py-2 text-[14px] text-[#000000DE] outline-none transition focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] disabled:bg-gray-100"
            >
              {isLoading && <option value="">Loading employees...</option>}
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullname}
                  {e.designation ? ` (${e.designation})` : ''}
                  {e.isActive ? '' : ' - Inactive'}
                </option>
              ))}
            </select>
          </div>
          {selectedId && pages.length > 0 && (
            <p className="text-[13px] text-gray-500 sm:pb-2">{isLoadingPerms ? 'Loading permissions...' : summary}</p>
          )}
        </div>
        {permsError && (
          <p className="text-[13px] text-red-600">
            Couldn't load this employee's saved permissions; showing defaults.
          </p>
        )}
      </div>

      {/* Permissions */}
      {pagesError ? (
        <div className="rounded-xl border border-stroke bg-white p-5 text-sm text-red-600">
          Couldn't load the page list. Please refresh and try again.
        </div>
      ) : (
        <GenericTable
          title={isLoadingPages ? 'Page Permissions (loading...)' : 'Page Permissions'}
          headerAction={
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] text-gray-500">Set all:</span>
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setAll(o.value)}
                  disabled={busy || pages.length === 0}
                  className="rounded border border-[#C4C4C4] px-2.5 py-1 text-[13px] text-[#000000DE] hover:border-[#2196F3] hover:text-[#2196F3] transition-colors disabled:opacity-50"
                >
                  {o.label}
                </button>
              ))}
            </div>
          }
          data={pages}
          columns={columns}
          showSrNo
          paginationOff
        />
      )}

      <p className="text-[12px] text-gray-500">
        {options.map((o) => `${o.label}: ${o.description || ''}`).join(' · ')}
      </p>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-stroke">
        <span className={`text-[13px] ${isDirty ? 'text-[#2196F3] font-medium' : 'text-gray-500'}`}>
          {isDirty ? 'Unsaved changes' : 'All changes saved'}
        </span>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setDraft(saved)}
            disabled={!isDirty || isSaving}
            className="w-full sm:w-auto rounded-xl border border-stroke px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <GenericButton
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="w-full sm:w-auto !bg-[#2196F3] hover:!bg-[#1E88E5] !px-6 !py-2 !text-[14px] font-medium text-white shadow-none"
          >
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </GenericButton>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRestrictionMaster;
