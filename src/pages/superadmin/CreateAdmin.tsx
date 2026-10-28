import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericTable, { Column } from '@/components/Forms/Table/GenericTable';
import CopyBusinessModal from '@/components/superadmin/CopyBusinessModal';
import ProjectsAndPayments from '@/pages/superadmin/ProjectsAndPayments';
import {
  useDeleteAdmin,
  useGetAdmin,
  useSaveAdmin,
  useUpdateAdmin,
  useToggleAdminStatus,
} from '@/lib/react-query/superadmin/admin';
import { isRecordActive, readIsActive } from '@/lib/api/superadmin/admin';
import StatusToggle from '@/components/Forms/StatusToggle';
import { useGetCategories } from '@/lib/react-query/superadmin/category';
import { isFranchiseUser } from '@/utils/axios';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import {
  Edit2,
  Settings,
  MoreVertical,
  Copy,
  Trash2,
  Download,
  Key,
  SlidersHorizontal,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

const formSchema = z
  .object({
   
    fullname: z.string().min(1, 'Name is required').trim(),
    email: z.string().min(1, 'Email is required').email('Invalid email address').trim(),
    phoneNumber: z
      .string()
      .min(1, 'Phone Number is required')
      .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
      .trim(),
    secondaryPhoneNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{10}$/.test(val.trim()),
        'Secondary phone number must be exactly 10 digits',
      ),
    price: z.coerce.number().min(0, 'Price must be positive').optional(),
    renewalAmount: z.coerce.number().min(0, 'Renewal amount must be positive').optional(),
    address: z.string().min(1, 'Address is required').trim(),
    password: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.trim().length >= 6,
        'Password must be at least 6 characters',
      ),
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
  businessId: string;
  fullname: string;
  categoryName: string;
  categoryNames?: string[];
  contactDisplay: string;
  creationDate: string;
  madeBy: string;
  aiCredit: number | string;
  subscriptionStatus: 'Subscribed' | 'Not Subscribed';
  email: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  price?: number | string;
  renewalAmount?: number | string;
  address: string;
  startDate: string;
  endDate: string;
  dateTime: string;
  isActive: boolean;
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
  const [apiError, setApiError] = useState<string | null>(null);
  const { mutateAsync: saveAdmin, isPending: isAdding } = useSaveAdmin();
  const { data: adminData } = useGetAdmin();
  const { mutateAsync: deleteAdmin } = useDeleteAdmin();
  const { mutateAsync: updateAdmin, isPending: isUpdating } = useUpdateAdmin();
  const { data: categoriesData } = useGetCategories();
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [selectedProjectBusiness, setSelectedProjectBusiness] = useState<AdminRow | null>(null);
  const [copyModalBusiness, setCopyModalBusiness] = useState<AdminRow | null>(null);
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | null>(null);
  const { mutateAsync: toggleAdminStatus } = useToggleAdminStatus();
  const [togglingAdminId, setTogglingAdminId] = useState<string | null>(null);
  // isActive returned by the toggle API, per admin id (wins over the list until it refreshes)
  const [adminStatusOverride, setAdminStatusOverride] = useState<Record<string, boolean>>({});
  const isFranchise = isFranchiseUser();

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuRowId(null);
    if (activeMenuRowId) {
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [activeMenuRowId]);

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
    setApiError(null);
    methods.reset();
    setShowForm(false);
  };

  const columns: Column<AdminRow>[] = [
    {
      accessor: 'fullname',
      header: 'Business Name',
      sortable: true,
      className: 'font-bold text-[#212121] max-w-[160px]',
      render: (row) => (
        <span className="font-bold text-[#212121] text-[13px] line-clamp-2">
          {row.fullname}
        </span>
      ),
    },
    {
      accessor: 'contactDisplay',
      header: 'Reg. Phone/Email',
      className: 'max-w-[130px]',
      render: (row) => (
        <div className="text-[13px] leading-tight">
          <div className="font-semibold text-[#212121] tracking-wide">
            {row.phoneNumber || '-'}
          </div>
          {row.email && (
            <div className="text-[11px] text-gray-500 truncate">{row.email}</div>
          )}
        </div>
      ),
    },
    {
      accessor: 'categoryName',
      header: 'Category',
      sortable: true,
      className: 'text-[13px] max-w-[180px]',
      render: (row) => {
        const cats = row.categoryNames && row.categoryNames.length > 0 ? row.categoryNames : (row.categoryName && row.categoryName !== '-' ? [row.categoryName] : []);
        if (cats.length === 0) {
          return <span className="text-gray-400 text-[12px] italic">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 items-center">
            {cats.map((c, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] font-medium text-[11px] border border-[#BFDBFE] max-w-[160px] truncate"
                title={c}
              >
                {c}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessor: 'dateTime',
      header: 'Date & Time',
      sortable: true,
      className: 'max-w-[110px]',
      render: (row) => {
        const dt = row.dateTime || row.creationDate || '-';
        const parts = dt.split(', ');
        return (
          <div className="text-[12px] text-[#212121] leading-tight">
            <div className="font-medium">{parts[0]}</div>
            {parts[1] && <div className="text-gray-500 text-[11px]">{parts[1]}</div>}
          </div>
        );
      },
    },
    {
      accessor: 'madeBy',
      header: 'Added By (Role)',
      className: 'max-w-[140px]',
      render: (row) => {
        const namePart = row.madeBy.split(' (')[0];
        const rolePart = row.madeBy.includes('(') ? `(${row.madeBy.split('(')[1]}` : '';
        return (
          <div className="text-[12px] text-[#212121] leading-tight">
            <div className="font-medium truncate">{namePart}</div>
            {rolePart && <div className="text-gray-500 text-[11px] truncate">{rolePart}</div>}
          </div>
        );
      },
    },
    {
      accessor: 'aiCredit',
      header: 'AI Credit',
      className: 'text-center w-16 text-[13px]',
    },
    {
      accessor: 'subscriptionStatus',
      header: 'Subscription Status',
      className: 'text-center w-28',
      render: (row) => {
        const isSubscribed = row.subscriptionStatus === 'Subscribed';
        return (
          <span
            className={`inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-full text-white ${
              isSubscribed ? 'bg-[#4CAF50]' : 'bg-[#F44336]'
            }`}
          >
            {row.subscriptionStatus}
          </span>
        );
      },
    },
    {
      accessor: (row) => (row.isActive ? 'Active' : 'Inactive'),
      header: 'Status',
      className: 'text-center w-28',
      render: (row) => {
        const active = adminStatusOverride[row.id] ?? row.isActive;
        return (
          <StatusToggle
            active={active}
            name={row.fullname}
            disabled={togglingAdminId === row.id}
            onToggle={async () => {
              setTogglingAdminId(row.id);
              try {
                const res = await toggleAdminStatus({ id: row.id, isActive: !active });
                // Show exactly what the API reports (isActive: false -> switch off)
                const apiActive = readIsActive(res);
                if (apiActive !== undefined) {
                  setAdminStatusOverride((prev) => ({ ...prev, [row.id]: apiActive }));
                }
              } catch {
                // error toast comes from the mutation; switch keeps its previous state
              } finally {
                setTogglingAdminId(null);
              }
            }}
          />
        );
      },
    },
    {
      header: 'Actions',
      accessor: (row) => row.id,
      className: 'text-right min-w-[210px]',
      render: (row) => {
        const isMenuOpen = activeMenuRowId === row.id;
        return (
          <div
            className="relative flex items-center justify-end gap-1.5 no-row-click"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedProjectBusiness(row)}
              className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[12px] font-medium text-gray-800 hover:bg-gray-100 shadow-2xs transition-colors shrink-0"
            >
              Projects & Payments
            </button>

            <button
              type="button"
              title="Edit Business"
              onClick={() => handleEdit(row)}
              className="p-1 text-gray-600 hover:text-[#2196F3] rounded transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              title="Card Settings"
              onClick={() => onOpenCardForge?.(row.raw || row)}
              className="p-1 text-gray-600 hover:text-[#2196F3] rounded transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            <div className="relative">
              <button
                type="button"
                title="More Options"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuRowId(isMenuOpen ? null : row.id);
                }}
                className="p-1 text-gray-600 hover:text-[#2196F3] rounded transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* Dropdown Menu (Image 2) */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-60 rounded-md bg-white py-1 shadow-xl ring-1 ring-black/10 font-['Roboto',Helvetica,Arial,sans-serif] text-left">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuRowId(null);
                      setCopyModalBusiness(row);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="h-4 w-4 text-gray-500" />
                    <span>Copy business</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuRowId(null);
                      deleteAdmin(row.id);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                    <span>Delete business</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuRowId(null);
                      toast.success(`Downloading greetings for ${row.fullname}...`);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4 text-gray-500" />
                    <span>Download Greetings</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuRowId(null);
                      toast.success(
                        `Password regenerated for ${row.fullname}: Temp@${Math.floor(
                          1000 + Math.random() * 9000,
                        )}`,
                      );
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Key className="h-4 w-4 text-gray-500" />
                    <span>Regenerate User Password</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  const rawAdminList: any[] = Array.isArray(adminData)
    ? adminData
    : (adminData as any)?.data?.admins ||
      (adminData as any)?.admins ||
      (Array.isArray((adminData as any)?.data) ? (adminData as any).data : []);

  const formattedAdminData: AdminRow[] = rawAdminList.map((each: any, idx: number) => {
    // Extract category names from adminCategories array, adminCategory object, or rawCategoryList match
    const extractedCatNames: string[] = [];

    if (Array.isArray(each.adminCategories) && each.adminCategories.length > 0) {
      each.adminCategories.forEach((ac: any) => {
        const id = ac.adminCategoryId || ac.adminCategory?.id || ac.id;
        const name =
          ac.adminCategory?.name ||
          ac.adminCategory?.CategoryName ||
          ac.name ||
          ac.categoryName ||
          rawCategoryList.find((c) => c.id === id || c._id === id)?.name;
        if (name && typeof name === 'string' && name.trim() && !extractedCatNames.includes(name.trim())) {
          extractedCatNames.push(name.trim());
        }
      });
    }

    if (extractedCatNames.length === 0) {
      const matchedCategory = rawCategoryList.find(
        (c) => c.id === each.adminCategoryId || c._id === each.adminCategoryId || c.name === each.category || c.id === each.category?.id,
      );
      const singleName =
        each?.adminCategory?.name ||
        each?.adminCategory?.CategoryName ||
        matchedCategory?.name ||
        each.category?.name ||
        (typeof each.category === 'string' ? each.category : '') ||
        each.categoryName;
      if (singleName && typeof singleName === 'string' && singleName.trim()) {
        extractedCatNames.push(singleName.trim());
      }
    }

    const catName = extractedCatNames.length > 0 ? extractedCatNames.join(', ') : '-';

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
    const createdRaw = each.createdAt || each.created_at || each.user?.createdAt || each.startDate;
    let formattedDateTime = '-';
    if (createdRaw) {
      try {
        const d = new Date(createdRaw);
        if (!isNaN(d.getTime())) {
          formattedDateTime = d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
      } catch {}
    }

    const priceNum = Number(each.amount || each.price || 0);
    const isSubscribed = priceNum > 0 || each.status === 'ACTIVE' || each.isActive;

    const rawId = String(each.id || each._id || '');
    const businessId = each.businessId || (rawId.length > 5 ? rawId.slice(-5) : String(14837 - idx));

    const creatorRole =
      each.createdBy?.role ||
      each.role ||
      (each.franchiseId || each.franchise ? 'Franchise' : 'SuperAdmin');

    const creatorName =
      each.createdBy?.fullname ||
      each.franchise?.fullname ||
      each.franchise?.name ||
      each.madeBy ||
      (isFranchise ? 'Franchise Partner' : 'Ratan Chavan');

    const creatorPhone = each.createdBy?.phoneNumber || each.franchise?.phoneNumber || '8482980338';
    const creatorDisplay = `${creatorName} (${creatorRole}${creatorPhone ? ` - ${creatorPhone}` : ''})`;

    return {
      id: each.id || each._id || '',
      businessId,
      fullname: each?.user?.fullname || each.fullname || 'Admin',
      categoryName: catName,
      categoryNames: extractedCatNames,
      contactDisplay: each?.user?.phoneNumber || each.phoneNumber || each.user?.email || each.email || '-',
      creationDate: formattedDateTime,
      madeBy: creatorDisplay,
      aiCredit: each.aiCredit !== undefined ? each.aiCredit : 0,
      subscriptionStatus: isSubscribed ? 'Subscribed' : 'Not Subscribed',
      email: each.user?.email || each.email || '',
      phoneNumber: each?.user?.phoneNumber || each.phoneNumber || '',
      secondaryPhoneNumber: each.user?.secondaryPhoneNumber || each.secondaryPhoneNumber,
      price: priceDisplay,
      renewalAmount: renewalDisplay,
      address: each?.user?.address || each.address || '',
      startDate: each.startDate ? String(each.startDate).split('T')[0] : '',
      endDate: endRaw ? String(endRaw).split('T')[0] : '',
      dateTime: formattedDateTime,
      isActive: isRecordActive(each),
      raw: each,
    };
  });

  const handleEdit = (row: AdminRow) => {
    setEditingAdminId(row?.id);
    setApiError(null);
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
      setApiError(null);
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

      if (!editingAdminId && (!data.password || data.password.trim() === '')) {
        methods.setError('password', {
          type: 'manual',
          message: 'Password is required to create a new administrator (min 6 characters)',
        });
        toast.error('Password is required');
        return;
      }

      if (data.password && data.password.trim() !== '') {
        payload.password = data.password.trim();
        payload.user = {
          ...payload.user,
          password: data.password.trim(),
        };
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
      setApiError(null);
      setShowForm(false);
    } catch (error: any) {
      console.error(error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Failed to save administrator';
      setApiError(backendMessage);
    }
  };

  return (
    <div className="space-y-4">
      {/* FORM VIEW */}
      {showForm ? (
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-3.5 rounded-lg border border-[#E0E0E0] bg-white p-3.5 sm:p-4 font-['Roboto',Helvetica,Arial,sans-serif] shadow-none dark:border-strokedark dark:bg-boxdark"
          >
            {/* Form Top Title */}
            <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-2.5 dark:border-strokedark">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex h-8 w-8 items-center justify-center rounded border border-[#C4C4C4] text-sm font-bold text-[#000000DE] hover:bg-gray-100 transition-all dark:border-strokedark dark:text-white"
                >
                  ←
                </button>
                <div>
                  <h2 className="text-base font-semibold text-[#000000DE] dark:text-white">
                    {editingAdminId ? 'Edit Administrator' : 'Create New Administrator'}
                  </h2>
                  <p className="text-xs text-[#757575]">
                    Administrator account details & credentials
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2196F3] border border-blue-200">
                Admin Details
              </span>
            </div>

            {/* Backend API Error Banner */}
            {apiError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[13px]">
                <svg
                  className="w-4 h-4 text-red-600 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <span className="font-semibold">Error: </span>
                  {apiError}
                </div>
              </div>
            )}

            {/* Space-optimized Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
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
                  type="tel"
                  maxLength={10}
                  required
                />
              </div>

              {/* 5. Secondary Phone Number */}
              <div className="col-span-1">
                <GenericInputField
                  name="secondaryPhoneNumber"
                  label="Secondary Phone Number"
                  placeholder="Optional 10-digit alternate contact"
                  type="tel"
                  maxLength={10}
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
                  placeholder={editingAdminId ? 'Leave blank to preserve password' : 'Min 6 characters'}
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
            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E0E0E0] dark:border-strokedark">
              <button
                type="button"
                onClick={handleBack}
                className="rounded border border-[#C4C4C4] px-4 py-2 text-[13px] sm:text-[14px] font-medium text-[#000000DE] hover:bg-gray-50 transition-all dark:border-strokedark dark:text-white"
              >
                Cancel
              </button>
              <GenericButton
                type="submit"
                disabled={isAdding || isUpdating}
                className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-5 !py-2 !text-[13px] sm:!text-[14px] font-medium text-white shadow-none rounded"
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
      ) : selectedProjectBusiness ? (
        <ProjectsAndPayments
          business={selectedProjectBusiness}
          onBack={() => setSelectedProjectBusiness(null)}
          onEdit={(b) => {
            setSelectedProjectBusiness(null);
            handleEdit(b);
          }}
          onDelete={(b) => {
            setSelectedProjectBusiness(null);
            deleteAdmin(b.id);
          }}
        />
      ) : (
        <GenericTable
          title="All Businesses"
          headerAction={
            <div className="flex items-center gap-2">
            
              <GenericButton
                onClick={() => {
                  setApiError(null);
                  setEditingAdminId(null);
                  methods.reset({
                    fullname: '',
                    email: '',
                    phoneNumber: '',
                    secondaryPhoneNumber: '',
                    address: '',
                    password: '',
                    price: undefined,
                    renewalAmount: undefined,
                  });
                  setShowForm(true);
                }}
                className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-4 !py-1.5 !text-[14px] font-medium text-white shadow-none"
              >
                + Add New Business
              </GenericButton>
            </div>
          }
          data={formattedAdminData}
          columns={columns}
          itemsPerPage={10}
          searchAble
          action={false}
          showSrNo={true}
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
        />
      )}

      {/* Copy Business Modal */}
      <CopyBusinessModal
        isOpen={copyModalBusiness !== null}
        business={copyModalBusiness}
        onClose={() => setCopyModalBusiness(null)}
      />
    </div>
  );
};

export default CreateAdmin;
