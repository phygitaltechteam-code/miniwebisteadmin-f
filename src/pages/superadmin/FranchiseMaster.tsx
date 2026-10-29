import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericTable, { Column } from '@/components/Forms/Table/GenericTable';
import {
  useDeleteFranchise,
  useGetFranchises,
  useSaveFranchise,
  useUpdateFranchise,
  useToggleFranchiseStatus,
} from '@/lib/react-query/superadmin/franchise';
import { isRecordActive, readIsActive } from '@/lib/api/superadmin/admin';
import { pickPlanTerms } from '@/lib/api/superadmin/plan';
import StatusToggle from '@/components/Forms/StatusToggle';
import ProjectsAndPayments from '@/pages/superadmin/ProjectsAndPayments';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

const franchiseSchema = z.object({
  fullname: z.string().min(1, 'Name is required').trim(),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
    .trim(),
  adminLimit: z.coerce.number().min(0, 'Admin limit must be a number'),
  address: z.string().min(1, 'Address is required').trim(),
  password: z.string().optional(),
  email: z
    .string()
    .email('Invalid email address')
    .or(z.literal(''))
    .optional(),
  city: z.string().optional(),
});

type FormValues = z.infer<typeof franchiseSchema>;

type FranchiseRow = {
  id: string;
  dateTime: string;
  datePart?: string;
  timePart?: string;
  fullname: string;
  phoneNumber: string;
  adminLimit: number | string;
  address: string;
  city?: string;
  email?: string;
  isActive: boolean;
  raw?: any;
};

export const FranchiseMaster: React.FC = () => {
  const methods = useForm<FormValues>({
    resolver: zodResolver(franchiseSchema),
    defaultValues: {
      fullname: '',
      phoneNumber: '',
      adminLimit: 10,
      address: '',
      password: '',
      email: '',
      city: '',
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedFranchise, setSelectedFranchise] = useState<FranchiseRow | null>(null);
  const [editingFranchiseId, setEditingFranchiseId] = useState<string | null>(null);

  const { data: franchiseList, isLoading } = useGetFranchises();
  const { mutateAsync: saveFranchise, isPending: isAdding } = useSaveFranchise();
  const { mutateAsync: updateFranchise, isPending: isUpdating } = useUpdateFranchise();
  const { mutateAsync: deleteFranchise } = useDeleteFranchise();
  const { mutateAsync: toggleFranchiseStatus } = useToggleFranchiseStatus();
  const [togglingFranchiseId, setTogglingFranchiseId] = useState<string | null>(null);
  // isActive returned by the toggle API, per franchise id (wins over the list until it refreshes)
  const [franchiseStatusOverride, setFranchiseStatusOverride] = useState<Record<string, boolean>>({});

  const handleBack = () => {
    setEditingFranchiseId(null);
    methods.reset({
      fullname: '',
      phoneNumber: '',
      adminLimit: 10,
      address: '',
      password: '',
      email: '',
      city: '',
    });
    setShowForm(false);
  };

  const columns: Column<FranchiseRow>[] = [
    { accessor: 'dateTime', header: 'Date & Time', sortable: true },
    {
      accessor: 'fullname',
      header: 'Name',
      sortable: true,
      // Opens the franchise's Subscription & Payments page
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedFranchise(row)}
          className="text-left font-medium text-[#2196F3] hover:underline"
          title="Subscription & Payments"
        >
          {row.fullname}
        </button>
      ),
    },
    { accessor: 'phoneNumber', header: 'Phone' },
    { accessor: 'adminLimit', header: 'Admin Limit' },
    { accessor: 'address', header: 'Address' },
    {
      accessor: (row) => (row.isActive ? 'Active' : 'Inactive'),
      header: 'Status',
      className: 'text-center w-28',
      render: (row) => {
        const active = franchiseStatusOverride[row.id] ?? row.isActive;
        return (
          <StatusToggle
            active={active}
            name={row.fullname}
            disabled={togglingFranchiseId === row.id}
            onToggle={async () => {
              setTogglingFranchiseId(row.id);
              try {
                const res = await toggleFranchiseStatus({ id: row.id, isActive: !active });
                // Show exactly what the API reports (isActive: false -> switch off)
                const apiActive = readIsActive(res);
                if (apiActive !== undefined) {
                  setFranchiseStatusOverride((prev) => ({ ...prev, [row.id]: apiActive }));
                }
              } catch {
                // error toast comes from the mutation; switch keeps its previous state
              } finally {
                setTogglingFranchiseId(null);
              }
            }}
          />
        );
      },
    },
  ];

  const rawList: any[] = Array.isArray(franchiseList) ? franchiseList : [];

  const formattedData: FranchiseRow[] = rawList.map((item: any) => {
    const createdRaw = item.createdAt || item.created_at || item.updatedAt;
    let formattedDateTime = '-';
    let datePart = '';
    let timePart = '';
    if (createdRaw) {
      try {
        const d = new Date(createdRaw);
        if (!isNaN(d.getTime())) {
          datePart = d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          timePart = d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          formattedDateTime = `${datePart} ${timePart}`;
        }
      } catch {}
    }

    return {
      id: item.id || item._id || '',
      dateTime: formattedDateTime,
      datePart: datePart,
      timePart: timePart,
      fullname: item.fullname || item.name || item.user?.fullname || 'Franchise',
      phoneNumber: item.phoneNumber || item.phone || item.user?.phoneNumber || '',
      adminLimit: item.adminLimit !== undefined && item.adminLimit !== null ? Number(item.adminLimit) : 10,
      address: item.address || item.user?.address || '',
      city: item.city || '',
      email: item.email || item.user?.email || '',
      isActive: isRecordActive(item),
      raw: item,
    };
  });

  const handleEdit = (row: FranchiseRow) => {
    setEditingFranchiseId(row.id);
    const item = rawList.find((f: any) => (f.id || f._id) === row.id);
    if (item) {
      methods.reset({
        fullname: item.fullname || item.name || item.user?.fullname || '',
        phoneNumber: item.phoneNumber || item.phone || item.user?.phoneNumber || '',
        adminLimit: item.adminLimit !== undefined ? Number(item.adminLimit) : 10,
        address: item.address || item.user?.address || '',
        password: '',
        email: item.email || item.user?.email || '',
        city: item.city || '',
      });
    }
    setShowForm(true);
  };

  const handleDelete = async (row: FranchiseRow) => {
    if (window.confirm(`Are you sure you want to delete "${row.fullname}"?`)) {
      await deleteFranchise(row.id);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: any = {
        fullname: data.fullname,
        name: data.fullname,
        phoneNumber: data.phoneNumber,
        adminLimit: Number(data.adminLimit),
        address: data.address,
        email: data.email || undefined,
        city: data.city || undefined,
        status: 'ACTIVE',
      };

      if (!editingFranchiseId && (!data.password || data.password.trim() === '')) {
        methods.setError('password', {
          type: 'manual',
          message: 'Password is required to register a franchise (min 6 characters)',
        });
        toast.error('Password is required');
        return;
      }

      if (data.password && data.password.trim() !== '') {
        payload.password = data.password.trim();
        payload.user = {
          fullname: data.fullname,
          phoneNumber: data.phoneNumber,
          address: data.address,
          password: data.password.trim(),
          role: 'FRANCHISE',
        };
      }

      if (editingFranchiseId) {
        await updateFranchise({
          id: editingFranchiseId,
          data: payload,
        });
      } else {
        await saveFranchise(payload);
      }

      handleBack();
    } catch (error) {
      console.error('Franchise save error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── FORM VIEW ──────────────────────────────────────────────────────── */}
      {showForm ? (
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-5 rounded-xl border border-stroke bg-white p-5 shadow-sm md:p-6"
          >
            {/* Form Top Title */}
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
                  <h2 className="text-lg font-bold text-black">
                    {editingFranchiseId ? 'Edit Franchise' : 'Create New Franchise'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Enter franchise credentials, admin limit and contact address
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                Franchise Details
              </span>
            </div>

            {/* Form Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {/* 1. Full Name */}
              <div className="col-span-1">
                <GenericInputField
                  name="fullname"
                  label="Name"
                  placeholder="Enter franchise name"
                  required
                />
              </div>

              {/* 2. Phone */}
              <div className="col-span-1">
                <GenericInputField
                  name="phoneNumber"
                  label="Phone Number"
                  placeholder="10-digit mobile number"
                  type="tel"
                  maxLength={10}
                  required
                />
              </div>

              {/* 3. Admin Limit */}
              <div className="col-span-1">
                <GenericInputField
                  name="adminLimit"
                  label="Admin Limit"
                  type="number"
                  placeholder="e.g. 10"
                  required
                />
              </div>

              {/* 4. Password */}
              <div className="col-span-1">
                <GenericInputField
                  name="password"
                  label="Password"
                  type="password"
                  placeholder={editingFranchiseId ? 'Leave blank to preserve current' : 'Min 6 characters'}
                  required={!editingFranchiseId}
                />
              </div>

              {/* 5. Email (Optional) */}
              <div className="col-span-1">
                <GenericInputField
                  name="email"
                  label="Email (Optional)"
                  type="email"
                  placeholder="franchise@domain.com"
                />
              </div>

              {/* 6. Address */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <GenericInputField
                  name="address"
                  label="Address"
                  placeholder="Street, Landmark, City, State"
                  required
                />
              </div>
            </div>

            {/* Bottom Actions */}
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
                disabled={isAdding || isUpdating}
                className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-6 !py-2 !text-[14px] font-medium flex items-center gap-2 text-white shadow-none"
              >
                {isAdding || isUpdating
                  ? 'Saving...'
                  : editingFranchiseId
                  ? 'Update Franchise'
                  : 'Create Franchise'}
              </GenericButton>
            </div>
          </form>
        </FormProvider>
      ) : selectedFranchise ? (
        /* ─── SUBSCRIPTION & PAYMENTS (payments tab only, with Upgrade) ──────── */
        <ProjectsAndPayments
          paymentsOnly
          planTarget="franchise"
          currentPlan={pickPlanTerms(selectedFranchise.raw)}
          business={{
            id: selectedFranchise.id,
            fullname: selectedFranchise.fullname,
            phoneNumber: selectedFranchise.phoneNumber,
          }}
          onBack={() => setSelectedFranchise(null)}
          onEdit={() => {
            const row = selectedFranchise;
            setSelectedFranchise(null);
            handleEdit(row);
          }}
          onDelete={() => {
            const row = selectedFranchise;
            setSelectedFranchise(null);
            handleDelete(row);
          }}
        />
      ) : (
        /* ─── TABLE VIEW (Exact same GenericTable layout as CreateAdmin) ──────── */
        <GenericTable
          title="All Franchise Details"
          headerAction={
            <GenericButton
              onClick={() => {
                setEditingFranchiseId(null);
                methods.reset({
                  fullname: '',
                  phoneNumber: '',
                  adminLimit: 10,
                  address: '',
                  password: '',
                  email: '',
                  city: '',
                });
                setShowForm(true);
              }}
              className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-4 !py-1.5 !text-[14px] font-medium text-white shadow-none"
            >
              + Add New Franchise
            </GenericButton>
          }
          data={formattedData}
          columns={columns}
          itemsPerPage={10}
          searchAble
          action
          showSrNo={true}
          onDelete={(row) => handleDelete(row)}
          onEdit={(row) => handleEdit(row)}
        />
      )}
    </div>
  );
};

export default FranchiseMaster;
