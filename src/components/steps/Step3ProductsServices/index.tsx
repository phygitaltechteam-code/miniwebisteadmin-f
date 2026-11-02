import React from 'react';
import { Plus, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useStep3Model, Step3Props } from './useStep3Model';
import { ProductList } from './ProductList';
import { ProductModal, EnquiryMessageDialog } from './ProductModal';

/** Step 3 of the card builder: Products & Services */
export const Step3ProductsServices: React.FC<Step3Props> = (props) => {
  const { onPrev } = props;
  const m = useStep3Model(props);
  const { isSubmitting, handleSaveAndNext, openAddModal, isModalOpen, isEnquiryModalOpen } = m;

  return (
    <section className="bg-white border border-[#E0E0E0] rounded-lg p-2.5 sm:p-3.5 shadow-xs scroll-mt-28 font-['Roboto',Helvetica,Arial,sans-serif]" id="sec-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E0E0E0] mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2196F3] flex items-center justify-center font-bold text-xs shrink-0">
            3
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            Products & Services
          </h2>
        </div>

        <GenericButton
          type="button"
          onClick={openAddModal}
          className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-3 sm:!px-4 !py-1.5 !text-[13px] font-medium text-white shadow-none flex items-center gap-1 sm:gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Add Product/Service</span>
          <span className="sm:hidden">Add Product</span>
        </GenericButton>
      </div>

      <ProductList m={m} />

      {isModalOpen && <ProductModal m={m} />}
      {isEnquiryModalOpen && <EnquiryMessageDialog m={m} />}

      {/* Step Navigation Buttons */}
      <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 rounded border border-[#C4C4C4] bg-white text-[#000000DE] text-[14px] font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous: About & Specialities</span>
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

export default Step3ProductsServices;
