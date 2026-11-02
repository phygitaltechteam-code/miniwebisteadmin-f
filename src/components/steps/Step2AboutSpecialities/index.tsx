import React from 'react';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useStep2Model, Step2Props } from './useStep2Model';
import { CategoryPicker } from './CategoryPicker';
import { ServicesBlock } from './ServicesBlock';
import { SpecialitiesBlock, AboutTextBlock } from './SpecialitiesAndAbout';
import { DocumentsBlock } from './DocumentsBlock';

/** Step 2 of the card builder: About & Specialities */
export const Step2AboutSpecialities: React.FC<Step2Props> = (props) => {
  const { onChange, onPrev } = props;
  const m = useStep2Model(props);
  const { profile, isSubmitting, handleSaveAndNext } = m;

  return (
    <section className="bg-white border border-[#E0E0E0] rounded-lg p-2.5 sm:p-3.5 shadow-xs scroll-mt-28 font-['Roboto',Helvetica,Arial,sans-serif]" id="sec-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E0E0E0] mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2196F3] flex items-center justify-center font-bold text-xs shrink-0">
            2
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            About & Specialities
          </h2>
        </div>
      </div>

      {/* Statutory & Business Profile Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-3">
        <div>
          <GenericInputField
            label="Establishment Year"
            type="text"
            value={profile.establishmentYear !== undefined && profile.establishmentYear !== null ? String(profile.establishmentYear) : ''}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              onChange('establishmentYear', val);
            }}
            placeholder="e.g. 2020"
          />
        </div>

        <div>
          <GenericInputField
            label="GST Number"
            value={profile.gstNumber}
            onChange={(e) => onChange('gstNumber', e.target.value.toUpperCase())}
            placeholder="27AAAAA0000A1Z5"
          />
        </div>
      </div>

      <CategoryPicker m={m} />

      {/* Reorderable blocks: drag a block's grip to change its position (saved as aboutBlockOrder) */}
      <div className="flex flex-col">
        <ServicesBlock m={m} />
        <SpecialitiesBlock m={m} />
        <AboutTextBlock m={m} />
        <DocumentsBlock m={m} />
      </div>

      {/* Step Navigation Buttons */}
      <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 rounded border border-[#C4C4C4] bg-white text-[#000000DE] text-[14px] font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous: Basic Details</span>
          <span className="sm:hidden">Previous</span>
        </button>

        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-6 !py-2 !text-[14px] font-medium text-white shadow-none flex items-center gap-2 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
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

export default Step2AboutSpecialities;
