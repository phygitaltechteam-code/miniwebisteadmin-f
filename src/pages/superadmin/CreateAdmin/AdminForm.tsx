import React from 'react';
import { FormProvider, UseFormReturn } from 'react-hook-form';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { FormValues } from './schema';

interface AdminFormProps {
  methods: UseFormReturn<FormValues>;
  onSubmit: (data: FormValues) => void;
  onBack: () => void;
  isEditing: boolean;
  isAdding: boolean;
  isUpdating: boolean;
  apiError: string | null;
}

/** Create / edit administrator form */
export const AdminForm: React.FC<AdminFormProps> = ({ methods, onSubmit, onBack, isEditing, isAdding, isUpdating, apiError }) => (
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
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#C4C4C4] text-sm font-bold text-[#000000DE] hover:bg-gray-100 transition-all dark:border-strokedark dark:text-white"
          >
            ←
          </button>
          <div>
            <h2 className="text-base font-semibold text-[#000000DE] dark:text-white">
              {isEditing ? 'Edit Administrator' : 'Create New Administrator'}
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
          <svg className="w-4 h-4 text-red-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
        <div className="col-span-1">
          <GenericInputField name="fullname" label="Full Name" placeholder="Enter administrator full name" required />
        </div>
        <div className="col-span-1">
          <GenericInputField name="email" label="Email Address" type="email" placeholder="name@enterprise.com" required />
        </div>
        <div className="col-span-1">
          <GenericInputField name="phoneNumber" label="Primary Phone Number" placeholder="10-digit mobile number" type="tel" maxLength={10} required />
        </div>
        <div className="col-span-1">
          <GenericInputField name="secondaryPhoneNumber" label="Secondary Phone Number" placeholder="Optional 10-digit alternate contact" type="tel" maxLength={10} />
        </div>
        <div className="col-span-1">
          <GenericInputField name="price" label="Pricing Amount (₹)" type="number" placeholder="e.g. 5000" />
        </div>
        <div className="col-span-1">
          <GenericInputField name="renewalAmount" label="Renewal Amount (₹)" type="number" placeholder="e.g. 2000" />
        </div>
        <div className="col-span-1">
          <GenericInputField name="startDate" label="Start Date" type="date" required />
        </div>
        <div className="col-span-1">
          <GenericInputField name="endDate" label="End Date" type="date" required />
        </div>
        <div className="col-span-1">
          <GenericInputField
            name="password"
            label="Account Password"
            type="password"
            placeholder={isEditing ? 'Leave blank to preserve password' : 'Min 6 characters'}
            required={!isEditing}
          />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <GenericInputField name="address" label="Office / Facility Address" placeholder="Street, Landmark, City, State" required />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E0E0E0] dark:border-strokedark">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-[#C4C4C4] px-4 py-2 text-[13px] sm:text-[14px] font-medium text-[#000000DE] hover:bg-gray-50 transition-all dark:border-strokedark dark:text-white"
        >
          Cancel
        </button>
        <GenericButton
          type="submit"
          disabled={isAdding || isUpdating}
          className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-5 !py-2 !text-[13px] sm:!text-[14px] font-medium text-white shadow-none rounded"
        >
          {isEditing
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
);
