import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericTable from '@/components/Forms/Table/GenericTable';
import CopyBusinessModal from '@/components/superadmin/CopyBusinessModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import ProjectsAndPayments from '@/pages/superadmin/ProjectsAndPayments';
import {
  useDeleteAdmin,
  useGetAdmin,
  useSaveAdmin,
  useUpdateAdmin,
  useToggleAdminStatus,
} from '@/lib/react-query/superadmin/admin';
import { readIsActive } from '@/lib/api/superadmin/admin';
import { pickPlanTerms } from '@/lib/api/superadmin/plan';
import { useGetCategories } from '@/lib/react-query/superadmin/category';
import { isFranchiseScope } from '@/utils/axios';
import { formSchema, FormValues, AdminRow, EMPTY_FORM } from './schema';
import { listFromResponse, toAdminRow, toFormValues, toAdminPayload } from './adminRows';
import { buildAdminColumns } from './adminColumns';
import { AdminForm } from './AdminForm';

export interface CreateAdminProps {
  onOpenCardForge?: (admin: any) => void;
}

/** All Businesses: table of admins, create / edit form, payments, copy card and delete */
const CreateAdmin: React.FC<CreateAdminProps> = ({ onOpenCardForge }) => {
  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_FORM,
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
  // Business waiting for delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<AdminRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdmin(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // useDeleteAdmin shows the error; keep the popup open to retry or cancel
    } finally {
      setIsDeleting(false);
    }
  };
  const { mutateAsync: toggleAdminStatus } = useToggleAdminStatus();
  const [togglingAdminId, setTogglingAdminId] = useState<string | null>(null);
  // isActive returned by the toggle API, per admin id (wins over the list until it refreshes)
  const [adminStatusOverride, setAdminStatusOverride] = useState<Record<string, boolean>>({});
  const isFranchise = isFranchiseScope();

  const rawCategoryList = listFromResponse(categoriesData, 'categories');
  const rawAdminList = listFromResponse(adminData, 'admins');
  const formattedAdminData: AdminRow[] = rawAdminList.map((each: any, idx: number) => toAdminRow(each, idx, rawCategoryList, isFranchise));

  const handleBack = () => {
    setEditingAdminId(null);
    setApiError(null);
    methods.reset();
    setShowForm(false);
  };

  const handleEdit = (row: AdminRow) => {
    setEditingAdminId(row?.id);
    setApiError(null);
    setShowForm(true);
  };

  const handleToggleStatus = async (row: AdminRow, active: boolean) => {
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
  };

  const columns = buildAdminColumns({
    statusOverride: adminStatusOverride,
    togglingId: togglingAdminId,
    onToggleStatus: handleToggleStatus,
    onPayments: setSelectedProjectBusiness,
    onEdit: handleEdit,
    onDelete: setDeleteTarget,
    onCopy: setCopyModalBusiness,
  });

  // Fill the form with the admin being edited
  useEffect(() => {
    if (editingAdminId && rawAdminList.length > 0) {
      const toEdit: any = rawAdminList.find((e: any) => (e.id || e._id) === editingAdminId);
      if (toEdit) methods.reset(toFormValues(toEdit));
    }
  }, [editingAdminId, rawAdminList, methods]);

  const onSubmit = async (data: FormValues) => {
    try {
      setApiError(null);
      const payload = toAdminPayload(data);

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
      {showForm ? (
        <AdminForm
          methods={methods}
          onSubmit={onSubmit}
          onBack={handleBack}
          isEditing={Boolean(editingAdminId)}
          isAdding={isAdding}
          isUpdating={isUpdating}
          apiError={apiError}
          showAppAccess={!isFranchise}
        />
      ) : selectedProjectBusiness ? (
        <ProjectsAndPayments
          business={selectedProjectBusiness}
          currentPlan={pickPlanTerms(selectedProjectBusiness.raw)}
          ownerFranchiseId={
            isFranchise ? undefined : selectedProjectBusiness.raw?.franchiseId || selectedProjectBusiness.raw?.franchise?.id
          }
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
                  methods.reset(EMPTY_FORM);
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete business?"
        message={
          <>
            Are you sure you want to delete <span className="font-semibold text-[#212121]">{deleteTarget?.fullname}</span>? This cannot be undone.
          </>
        }
        busy={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default CreateAdmin;
