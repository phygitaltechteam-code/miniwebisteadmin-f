import React from 'react';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useStep1Model, Step1Props } from './useStep1Model';
import { IdentitySection } from './IdentitySection';
import { OwnersSection, PhonesSection } from './OwnersAndPhones';
import { AddressSection, EmailSection, WebsiteSection } from './ContactSections';

/** Step 1 of the card builder: Basic Details */
export const Step1BasicDetails: React.FC<Step1Props> = (props) => {
  const m = useStep1Model(props);
  const { isSubmitting, handleSaveAndNext } = m;

  return (
    <section className="bg-white border border-[#E0E0E0] rounded-lg p-2.5 sm:p-3.5 shadow-xs scroll-mt-28 font-['Roboto',Helvetica,Arial,sans-serif]" id="sec-1">
      {/* Step Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between pb-2.5 border-b border-[#E0E0E0] mb-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2196F3] flex items-center justify-center font-bold text-xs shrink-0">
            1
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            Basic Details
          </h2>
        </div>

        <span className="px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2196F3] text-[11px] font-semibold border border-[#BFDBFE] flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2196F3]" />
          <span>Active Profile</span>
        </span>
      </div>

      <div className="space-y-3">
        <IdentitySection m={m} />
        <OwnersSection m={m} />
        <PhonesSection m={m} />
        <AddressSection m={m} />
        <EmailSection m={m} />
        <WebsiteSection m={m} />
      </div>

      {/* Step Footer Navigation */}
      <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex justify-end">
        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="w-full sm:w-auto !bg-[#2196F3] hover:!bg-[#1E88E5] !px-6 !py-2 !text-[14px] font-medium text-white shadow-none flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>Save & Next</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </GenericButton>
      </div>
    </section>
  );
};

export default Step1BasicDetails;
