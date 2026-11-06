import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericTable, { Column } from '@/components/Forms/Table/GenericTable';
import StatusToggle from '@/components/Forms/StatusToggle';
import { isRecordActive, readIsActive } from '@/lib/api/superadmin/admin';
import { EmployeeItem, EmployeePayload } from '@/lib/api/superadmin/employee';
import {
  useCreateEmployee,
  useDeleteEmployee,
  useGetEmployees,
  useToggleEmployeeStatus,
  useUpdateEmployee,
} from '@/lib/react-query/superadmin/employee';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

// Same rule as the login API: 8+ characters, at least one letter and one number
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PASSWORD_MESSAGE = 'Password must be at least 8 characters with a letter and a number';

const employeeSchema = z.object({
  fullname: z.string().trim().min(1, 'Employee name is required'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Mobile number is required')
    .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  email: z.string().trim().email('Invalid email address').or(z.literal('')).optional(),
  designation: z.string().trim().min(1, 'Designation is required'),
  joiningDate: z.string().optional(),
  password: z
    .string()
    .optional()
    .refine((v) => !v || PASSWORD_RULE.test(v), PASSWORD_MESSAGE),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof employeeSchema>;

type EmployeeRow = {
  id: string;
  dateTime: string;
  fullname: string;
  phoneNumber: string;
  email: string;
  designation: string;
  joiningDate: string;
  address: string;
  franchise: string;
  isActive: boolean;
};

const emptyForm: FormValues = {
  fullname: '',
  phoneNumber: '',
  email: '',
  designation: '',
  joiningDate: '',
  password: '',
  address: '',
};

const formatDateTime = (raw?: string) => {
  if (!raw) return '-';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '-';
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString(
    'en-US',
    { hour: '2-digit', minute: '2-digit', hour12: true },
  )}`;
};

const formatDate = (iso: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toRow = (item: EmployeeItem): EmployeeRow => ({
  id: item.id,
  dateTime: formatDateTime(item.createdAt),
  fullname: item.fullname || '',
  phoneNumber: item.phoneNumber || '',
  email: item.email || '',
  designation: item.designation || '',
  // ISO date -> YYYY-MM-DD for the date input
  joiningDate: item.joiningDate ? String(item.joiningDate).slice(0, 10) : '',
  address: item.address || '',
  franchise: item.franchise?.businessName || 'SuperAdmin',
  isActive: isRecordActive(item),
});

interface EmployeeMasterProps {
  userRole?: string;
}

export const EmployeeMaster: React.FC<EmployeeMasterProps> = ({ userRole }) => {
  const isFranchise = userRole?.trim().toUpperCase() === 'FRANCHISE';

  const methods = useForm<FormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: emptyForm,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  // isActive returned by the status API, per employee id (wins over the list until it refreshes)
  const [statusOverride, setStatusOverride] = useState<Record<string, boolean>>({});

  const { data: employeeList, isLoading } = useGetEmployees();
  const { mutateAsync: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutateAsync: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const { mutateAsync: toggleStatus } = useToggleEmployeeStatus();
  const { mutateAsync: deleteEmployee } = useDeleteEmployee();

  const employees: EmployeeRow[] = (Array.isArray(employeeList) ? employeeList : []).map(toRow);

  const openCreate = () => {
    setEditingId(null);
    methods.reset(emptyForm);
    setShowForm(true);
  };

  const handleBack = () => {
    setEditingId(null);
    methods.reset(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (row: EmployeeRow) => {
    setEditingId(row.id);
    methods.reset({
      fullname: row.fullname,
      phoneNumber: row.phoneNumber,
      email: row.email,
      designation: row.designation,
      joiningDate: row.joiningDate,
      password: '',
      address: row.address,
    });
    setShowForm(true);
  };

  const handleDelete = async (row: EmployeeRow) => {
    if (!window.confirm(`Are you sure you want to delete "${row.fullname}"?`)) return;
    try {
      await deleteEmployee(row.id);
    } catch {
      // error toast comes from the mutation
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!editingId && !data.password) {
      methods.setError('password', { type: 'manual', message: 'Password is required' });
      return;
    }

    const payload: EmployeePayload = {
      employeeName: data.fullname,
      mobileNumber: data.phoneNumber,
      email: data.email || '',
      designation: data.designation,
      joiningDate: data.joiningDate || '',
      address: data.address || '',
    };
    if (data.password) payload.password = data.password;

    try {
      if (editingId) {
        await updateEmployee({ id: editingId, data: payload });
      } else {
        // SuperAdmin's own employee; a franchise's employees are always added under it by the backend
        if (!isFranchise) payload.franchiseId = '';
        await createEmployee(payload);
      }
      handleBack();
    } catch {
      // error toast comes from the mutation; stay on the form
    }
  };

  const columns: Column<EmployeeRow>[] = [
    { accessor: 'dateTime', header: 'Date & Time', sortable: true },
    { accessor: 'fullname', header: 'Name', sortable: true },
    { accessor: 'phoneNumber', header: 'Mobile' },
    { accessor: (row) => row.email || '-', header: 'Email' },
    {
      accessor: 'designation',
      header: 'Designation',
      render: (row) =>
        row.designation ? (
          <span className="inline-block whitespace-nowrap px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
            {row.designation}
          </span>
        ) : (
          '-'
        ),
    },
    ...(!isFranchise ? [{ accessor: 'franchise', header: 'Franchise' } as Column<EmployeeRow>] : []),
    { accessor: (row) => formatDate(row.joiningDate), header: 'Joining Date' },
    {
      accessor: (row) => (row.isActive ? 'Active' : 'Inactive'),
      header: 'Status',
      className: 'text-center w-28',
      render: (row) => {
        const active = statusOverride[row.id] ?? row.isActive;
        return (
          <StatusToggle
            active={active}
            name={row.fullname}
            disabled={togglingId === row.id}
            onToggle={async () => {
              setTogglingId(row.id);
              try {
                const res = await toggleStatus({ id: row.id, isActive: !active });
                const apiActive = readIsActive(res);
                setStatusOverride((prev) => ({ ...prev, [row.id]: apiActive ?? !active }));
              } catch {
                // error toast comes from the mutation; switch keeps its previous state
              } finally {
                setTogglingId(null);
              }
            }}
          />
        );
      },
    },
  ];

  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-4">
      {showForm ? (
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-5 rounded-xl border border-stroke bg-white p-5 shadow-sm md:p-6"
          >
            <div className="flex items-center justify-between border-b border-stroke pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-stroke text-base font-bold text-black hover:bg-gray-100 hover:text-primary transition-all"
                >
                  ←
                </button>
                <div>
                  <h2 className="text-lg font-bold text-black">{editingId ? 'Edit Employee' : 'Create New Employee'}</h2>
                  <p className="text-xs text-gray-500">Enter employee details, designation and login credentials</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                Employee Details
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              <GenericInputField name="fullname" label="Employee Name" placeholder="Enter employee name" required />
              <GenericInputField
                name="phoneNumber"
                label="Mobile Number"
                placeholder="10-digit mobile number"
                type="tel"
                maxLength={10}
                required
              />
              <GenericInputField name="email" label="Email (Optional)" type="email" placeholder="employee@domain.com" />
              <GenericInputField name="designation" label="Designation" placeholder="e.g. Sales Executive" required />
              <GenericInputField name="joiningDate" label="Joining Date" type="date" />
              <GenericInputField
                name="password"
                label="Password"
                type="password"
                placeholder={editingId ? 'Leave blank to keep current' : 'Min 8 characters, letters & numbers'}
                required={!editingId}
              />
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <GenericInputField name="address" label="Address" placeholder="Street, Landmark, City, State" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stroke">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-stroke px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <GenericButton
                type="submit"
                disabled={isSaving}
                className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-6 !py-2 !text-[14px] font-medium flex items-center gap-2 text-white shadow-none"
              >
                {isSaving ? 'Saving...' : editingId ? 'Update Employee' : 'Create Employee'}
              </GenericButton>
            </div>
          </form>
        </FormProvider>
      ) : (
        <GenericTable
          title={isLoading ? 'All Employees (loading...)' : 'All Employees'}
          headerAction={
            <GenericButton
              onClick={openCreate}
              className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-4 !py-1.5 !text-[14px] font-medium text-white shadow-none"
            >
              + Add New Employee
            </GenericButton>
          }
          data={employees}
          columns={columns}
          itemsPerPage={10}
          searchAble
          action
          showSrNo
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default EmployeeMaster;
