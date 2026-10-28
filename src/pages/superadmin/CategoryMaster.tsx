import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericTable, { Column } from '@/components/Forms/Table/GenericTable';
import {
  createAdminCategorySchema,
  AdminCategory,
  CreateCategoryPayload,
} from '@/lib/api/superadmin/category';
import {
  useDeleteCategory,
  useGetCategories,
  useSaveCategory,
  useUpdateCategory,
} from '@/lib/react-query/superadmin/category';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type CategoryRow = {
  id: string;
  name: string;
  createdAt?: string;
};

const CategoryMaster: React.FC = () => {
  const methods = useForm<CreateCategoryPayload>({
    resolver: zodResolver(createAdminCategorySchema),
    defaultValues: {
      name: '',
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const { data: categoryData, isLoading } = useGetCategories();
  const { mutateAsync: saveCategory, isPending: isAdding } = useSaveCategory();
  const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const handleBack = () => {
    setEditingCategoryId(null);
    methods.reset({ name: '' });
    setShowForm(false);
  };

  const columns: Column<CategoryRow>[] = [
    { accessor: 'createdAt', header: 'Date & Time', sortable: true },
    { accessor: 'name', header: 'Category Name' },

  ];

  const rawCategoryList: any[] = Array.isArray(categoryData)
    ? categoryData
    : (categoryData as any)?.data?.categories ||
    (categoryData as any)?.categories ||
    (Array.isArray((categoryData as any)?.data) ? (categoryData as any).data : []);

  const formattedCategoryData: CategoryRow[] = rawCategoryList.map((cat: any) => ({
    id: cat.id || cat._id || '',
    name: cat.name || cat.CategoryName || 'Unnamed Category',
    createdAt: cat.createdAt ? new Date(cat.createdAt).toISOString().split('T')[0] : 'N/A',
  }));

  const handleEdit = (row: CategoryRow) => {
    setEditingCategoryId(row.id);
    setShowForm(true);
  };

  useEffect(() => {
    if (editingCategoryId && categoryData) {
      const toEdit = categoryData.find((c) => c.id === editingCategoryId);
      if (toEdit) {
        methods.reset({
          name: toEdit.name,
        });
      }
    }
  }, [editingCategoryId, categoryData]);

  const onSubmit = async (data: CreateCategoryPayload) => {
    try {
      if (editingCategoryId) {
        await updateCategory({
          id: editingCategoryId,
          data: { name: data.name },
        });
      } else {
        await saveCategory(data);
      }
      methods.reset({ name: '' });
      setEditingCategoryId(null);
      setShowForm(false);
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong saving category');
    }
  };


  return (
    <div className="space-y-4">
      {/* FORM VIEW */}
      {showForm ? (
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-5 rounded-xl border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark md:p-6"
          >
            <div className="mb-4 flex items-center gap-3 border-b border-stroke pb-4 dark:border-strokedark">
              <button
                type="button"
                onClick={handleBack}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke text-lg font-bold text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
              >
                ←
              </button>
              <h2 className="text-lg font-bold text-black dark:text-white">
                {editingCategoryId ? 'Edit Category' : 'Save Category'}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
              <div className="col-span-12 md:col-span-8">
                <GenericInputField
                  name="name"
                  label="Category Name"
                  placeholder="Enter category name (e.g. Starters, Main Course)"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-md border border-stroke px-5 py-2 text-sm font-medium text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
              >
                Cancel
              </button>
              <GenericButton type="submit" disabled={isAdding || isUpdating}>
                {editingCategoryId
                  ? isUpdating
                    ? 'Updating...'
                    : 'Update Category'
                  : isAdding
                    ? 'Saving...'
                    : 'Save Category'}
              </GenericButton>
            </div>
          </form>
        </FormProvider>
      ) : (
        <GenericTable
          title="All Categories"
          headerAction={
            <GenericButton
              onClick={() => setShowForm(true)}
              className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-4 !py-1.5 !text-[14px] font-medium text-white shadow-none"
            >
              + Add New
            </GenericButton>
          }
          data={formattedCategoryData}
          columns={columns}
          itemsPerPage={10}
          searchAble
          action
          showSrNo={true}
          onDelete={(row) => deleteCategory(row?.id)}
          onEdit={(row) => handleEdit(row)}
        />
      )}
    </div>
  );

};

export default CategoryMaster;
