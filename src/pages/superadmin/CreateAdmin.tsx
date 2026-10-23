import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericTable, { Column } from '@/components/Forms/Table/GenericTable';
import {
  useDeleteAdmin,
  useGetAdmin,
  useSaveAdmin,
  useUpdateAdmin,
} from '@/lib/react-query/superadmin/admin';
import { useGetCategories } from '@/lib/react-query/superadmin/category';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

const formSchema = z
  .object({
   
    fullname: z.string().min(1, 'Name is required').trim(),
    email: z.string().min(1, 'Email is required').email('Invalid email address').trim(),
    phoneNumber: z.string().min(1, 'Phone Number is required').trim(),
    secondaryPhoneNumber: z.string().optional(),
    price: z.coerce.number().min(0, 'Price must be positive').optional(),
    renewalAmount: z.coerce.number().min(0, 'Renewal amount must be positive').optional(),
    address: z.string().min(1, 'Address is required').trim(),
    password: z.string().optional(),
    startDate: z.preprocess(
      (val) => (typeof val === 'string' ? new Date(val) : val),
      z.date({ required_error: 'Start date is required' }),
    ),
    endDate: z.preprocess(
      (val) => (typeof val === 'string' ? new Date(val) : val),
      z.date({ required_error: 'End date is required' }),
    ),
  })
  .refine((data) => data.startDate < data.endDate, {
    message: 'Start date must be before end date',
    path: ['endDate'],
  });

type FormValues = z.infer<typeof formSchema>;

type AdminRow = {
  id: string;
  fullname: string;
  categoryName: string;
  email: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  price?: number | string;
  renewalAmount?: number | string;
  address: string;
  startDate: string;
  endDate: string;
  raw?: any;
};

export interface CreateAdminProps {
  onOpenCardForge?: (admin: any) => void;
}

const CreateAdmin: React.FC<CreateAdminProps> = ({ onOpenCardForge }) => {
  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
    
      fullname: '',
      email: '',
      phoneNumber: '',
      secondaryPhoneNumber: '',
      address: '',
      password: '',
      price: undefined,
      renewalAmount: undefined,
    },
  });

  const [showForm, setShowForm] = useState(false);
  const { mutateAsync: saveAdmin, isPending: isAdding } = useSaveAdmin();
  const { data: adminData } = useGetAdmin();
  const { mutateAsync: deleteAdmin } = useDeleteAdmin();
  const { mutateAsync: updateAdmin, isPending: isUpdating } = useUpdateAdmin();
  const { data: categoriesData } = useGetCategories();
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);

  const rawCategoryList: any[] = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.data?.categories ||
      (categoriesData as any)?.categories ||
      (Array.isArray((categoriesData as any)?.data) ? (categoriesData as any).data : []);

  const categoryOptions = rawCategoryList.map((cat: any) => ({
    label: cat.name || cat.CategoryName || 'Category',
    value: cat.id || cat._id || '',
  }));

  const handleBack = () => {
    setEditingAdminId(null);
    methods.reset();
    setShowForm(false);
  };

  const columns: Column<AdminRow>[] = [
    { accessor: 'fullname', header: 'Name' },
    { accessor: 'phoneNumber', header: 'Phone' },
    { accessor: 'price', header: 'Price (₹)' },
    { accessor: 'renewalAmount', header: 'Renewal (₹)' },
    { accessor: 'startDate', header: 'Start Date' },
    { accessor: 'endDate', header: 'End Date' },
    { accessor: 'address', header: 'Address' },
    ...(onOpenCardForge
      ? [
          {
            header: 'Digital Card Forge',
            accessor: 'id' as const,
            render: (row: AdminRow) => {
              const adminObj = row.raw || row;
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetId = adminObj.id || adminObj._id || row.id;
                    try {
                      const url = new URL(window.location.href);
                      url.searchParams.set('view', 'card-builder');
                      url.searchParams.set('adminId', targetId);
                      window.history.pushState({ view: 'card-builder', adminId: targetId }, '', url.toString());
                    } catch {}
                    onOpenCardForge(adminObj);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white border border-indigo-200 dark:border-indigo-800 transition-all shadow-xs group cursor-pointer"
                  title={`Open Digital Card Forge for ${row.fullname}`}
                >
                  <span className="text-[13px]">📇</span>
                  <span>Card Forge</span>
                  <span className="group-hover:translate-x-0.5 transition-transform font-mono">→</span>
                </button>
              );
            },
          } as Column<AdminRow>,
        ]
      : []),
  ];

  const rawAdminList: any[] = Array.isArray(adminData)
    ? adminData
    : (adminData as any)?.data?.admins ||
      (adminData as any)?.admins ||
      (Array.isArray((adminData as any)?.data) ? (adminData as any).data : []);

  const formattedAdminData: AdminRow[] = rawAdminList.map((each: any) => {
    const matchedCategory = rawCategoryList.find(
      (c) => c.id === each.adminCategoryId || c.name === each.category || c.id === each.category?.id,
    );
    const catName =
      each?.adminCategory?.name ||
      matchedCategory?.name ||
      each.category?.name ||
      each.category ||
      each.categoryName ||
      'N/A';

    const priceDisplay =
      each.amount !== null && each.amount !== undefined
        ? `₹${each.amount}`
        : each.price !== undefined
        ? `₹${each.price}`
        : 'N/A';

    const renewalDisplay =
      each.renewalAmount !== null && each.renewalAmount !== undefined
        ? `₹${each.renewalAmount}`
        : 'N/A';

    const endRaw = each.expiryDate || each.endDate;

    return {
      id: each.id || each._id || '',
      fullname: each?.user?.fullname || each.fullname || 'Admin',
      categoryName: catName,
      phoneNumber: each?.user?.phoneNumber || each.phoneNumber || '',
      price: priceDisplay,
      renewalAmount: renewalDisplay,
      address: each?.user?.address || each.address || '',
      startDate: each.startDate ? String(each.startDate).split('T')[0] : '',
      endDate: endRaw ? String(endRaw).split('T')[0] : '',
      email: each.user?.email || each.email || '',
      secondaryPhoneNumber: each.user?.secondaryPhoneNumber || each.secondaryPhoneNumber,
      raw: each,
    };
  });

  const handleEdit = (row: AdminRow) => {
    setEditingAdminId(row?.id);
    setShowForm(true);
  };

  useEffect(() => {
    if (editingAdminId && rawAdminList.length > 0) {
      const toEdit: any = rawAdminList.find((e: any) => (e.id || e._id) === editingAdminId);
      if (toEdit) {
        const startRaw = toEdit.startDate;
        const endRaw = toEdit.expiryDate || toEdit.endDate;

        let startFormatted = '';
        if (startRaw) {
          try {
            startFormatted = new Date(startRaw).toISOString().split('T')[0];
          } catch {}
        }

        let endFormatted = '';
        if (endRaw) {
          try {
            endFormatted = new Date(endRaw).toISOString().split('T')[0];
          } catch {}
        } else if (startRaw) {
          try {
            const d = new Date(startRaw);
            d.setFullYear(d.getFullYear() + 1);
            endFormatted = d.toISOString().split('T')[0];
          } catch {}
        }

        const amountVal =
          toEdit.amount !== null && toEdit.amount !== undefined
            ? toEdit.amount
            : toEdit.price !== null && toEdit.price !== undefined
            ? toEdit.price
            : undefined;

        const renewalVal =
          toEdit.renewalAmount !== null && toEdit.renewalAmount !== undefined
            ? toEdit.renewalAmount
            : 0;

        methods.reset({
          fullname: toEdit.user?.fullname || toEdit.fullname || '',
          email: toEdit.user?.email || toEdit.email || '',
          phoneNumber: toEdit.user?.phoneNumber || toEdit.phoneNumber || '',
          secondaryPhoneNumber: toEdit.secondaryPhoneNumber || toEdit.user?.secondaryPhoneNumber || '',
          address: toEdit.user?.address || toEdit.address || '',
          price: amountVal,
          renewalAmount: renewalVal,
          startDate: startFormatted as any,
          endDate: endFormatted as any,
          password: '',
        });
      }
    }
  }, [editingAdminId, rawAdminList, methods]);

  const onSubmit = async (data: FormValues) => {
    try {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      end.setUTCHours(23, 59, 59, 0);

      const priceNumber =
        data.price !== undefined && data.price !== null && data.price !== ('' as any)
          ? Number(data.price)
          : undefined;

      const renewalNumber =
        data.renewalAmount !== undefined && data.renewalAmount !== null && data.renewalAmount !== ('' as any)
          ? Number(data.renewalAmount)
          : 0;

      const payload: any = {
        amount: priceNumber,
        price: priceNumber,
        renewalAmount: renewalNumber,
        fullname: data.fullname,
        email: data.email,
        phoneNumber: data.phoneNumber,
        secondaryPhoneNumber: data.secondaryPhoneNumber || '',
        address: data.address,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        expiryDate: end.toISOString(),
        role: 'ADMIN',
      };

      if (data.password && data.password.trim() !== '') {
        payload.password = data.password;
      }

      if (editingAdminId) {
        await updateAdmin({
          id: editingAdminId,
          data: payload,
        });
      } else {
        await saveAdmin(payload);
      }

      methods.reset();
      setEditingAdminId(null);
      setShowForm(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      {/* FORM VIEW */}
      {showForm ? (
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-5 rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark md:p-6"
          >
            {/* Form Top Title */}
            <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-stroke text-base font-bold text-black hover:bg-gray-100 hover:text-primary transition-all dark:border-strokedark dark:text-white"
                >
                  ←
                </button>
                <div>
                  <h2 className="text-lg font-bold text-black dark:text-white">
                    {editingAdminId ? 'Edit Administrator' : 'Create New Administrator'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Category selection is prioritized first
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                Admin Details
              </span>
            </div>

            {/* Space-optimized Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
             

              {/* 2. Full Name */}
              <div className="col-span-1">
                <GenericInputField
                  name="fullname"
                  label="Full Name"
                  placeholder="Enter administrator full name"
                  required
                />
              </div>

              {/* 3. Email */}
              <div className="col-span-1">
                <GenericInputField
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="name@enterprise.com"
                  required
                />
              </div>

              {/* 4. Phone Number */}
              <div className="col-span-1">
                <GenericInputField
                  name="phoneNumber"
                  label="Primary Phone Number"
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              {/* 5. Secondary Phone Number */}
              <div className="col-span-1">
                <GenericInputField
                  name="secondaryPhoneNumber"
                  label="Secondary Phone Number"
                  placeholder="Optional alternate contact"
                />
              </div>

              {/* 6. Price */}
              <div className="col-span-1">
                <GenericInputField
                  name="price"
                  label="Pricing Amount (₹)"
                  type="number"
                  placeholder="e.g. 5000"
                />
              </div>

              {/* 7. Renewal Amount */}
              <div className="col-span-1">
                <GenericInputField
                  name="renewalAmount"
                  label="Renewal Amount (₹)"
                  type="number"
                  placeholder="e.g. 2000"
                />
              </div>

              {/* 8. Start Date */}
              <div className="col-span-1">
                <GenericInputField
                  name="startDate"
                  label="Start Date"
                  type="date"
                  required
                />
              </div>

              {/* 9. End Date */}
              <div className="col-span-1">
                <GenericInputField
                  name="endDate"
                  label="End Date"
                  type="date"
                  required
                />
              </div>

              {/* 10. Password */}
              <div className="col-span-1">
                <GenericInputField
                  name="password"
                  label="Account Password"
                  type="password"
                  placeholder={editingAdminId ? 'Leave blank to preserve password' : 'Min 8 characters'}
                  required={!editingAdminId}
                />
              </div>

              {/* 11. Address */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <GenericInputField
                  name="address"
                  label="Office / Facility Address"
                  placeholder="Street, Landmark, City, State"
                  required
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-stroke px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-100 transition-all dark:border-strokedark dark:text-white"
              >
                Cancel
              </button>
              <GenericButton
                type="submit"
                disabled={isAdding || isUpdating}
                className="!px-6 !py-2.5 !text-sm !font-bold shadow-md shadow-[#2563EB]/30"
              >
                {editingAdminId
                  ? isUpdating
                    ? 'Updating...'
                    : 'Update Admin'
                  : isAdding
                    ? 'Saving...'
                    : 'Create Admin'}
              </GenericButton>
            </div>
          </form>
        </FormProvider>
      ) : (
        <GenericTable
          title="Registered Catering Administrators"
          headerAction={
            <GenericButton
              onClick={() => setShowForm(true)}
              className="!px-4 !py-2 !text-xs font-bold shadow-md shadow-[#2563EB]/25"
            >
              + Add New Admin
            </GenericButton>
          }
          data={formattedAdminData}
          columns={columns}
          itemsPerPage={10}
          searchAble
          action
          onRowClick={(row) => {
            const adminObj = row.raw || row;
            const targetId = adminObj.id || adminObj._id || row.id;
            try {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'card-builder');
              url.searchParams.set('adminId', targetId);
              window.history.pushState({ view: 'card-builder', adminId: targetId }, '', url.toString());
            } catch {}
            onOpenCardForge?.(adminObj);
          }}
          onDelete={(row) => deleteAdmin(row?.id)}
          onEdit={(row) => handleEdit(row)}
        />
      )}
    </div>
  );
};

export default CreateAdmin;
