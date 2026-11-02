import React from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { RichTextEditor } from '@/components/Forms/RichTextEditor';
import { Step3Model, MAX_PRODUCT_IMAGES } from './useStep3Model';

/** Product images: add (up to the limit) and delete through each image's kebab menu */
const ProductImages: React.FC<{ m: Step3Model }> = ({ m }) => {
  const { images, handleAddProductImage, handleDeleteImage, activeKebabIndex, setActiveKebabIndex } = m;
  return (
    <div className="pt-2">
      <p className="mb-1.5 text-[11px] text-gray-500">
        Images {images.length}/{MAX_PRODUCT_IMAGES}
      </p>
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {/* Add Image Button (hidden at the limit) */}
        {images.length < MAX_PRODUCT_IMAGES && (
          <label className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl border-2 border-dashed border-[#90caf9] bg-white hover:bg-sky-50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors p-2 text-center shrink-0 group">
            <Plus className="w-5 h-5 text-[#1e88e5]" />
            <span className="text-[11px] font-bold text-[#1e88e5] leading-tight">
              + Add image
            </span>
            <input type="file" accept="image/*" multiple onChange={handleAddProductImage} className="hidden" />
          </label>
        )}

        {/* Uploaded Images with Kebab Menu */}
        {images.map((imgUrl, idx) => (
          <div
            key={idx}
            className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl border border-dashed border-gray-400 bg-white p-1 shrink-0 flex items-center justify-center group"
          >
            <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-contain rounded-lg" />

            {/* 3-dots kebab menu button */}
            <div className="absolute top-1 right-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveKebabIndex(activeKebabIndex === idx ? null : idx);
                }}
                className="w-6 h-6 rounded-full bg-white/95 hover:bg-white shadow-xs border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                title="Options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {activeKebabIndex === idx && (
                <div className="absolute right-0 top-full mt-1 z-50 w-32 rounded-lg bg-white py-1 shadow-lg border border-gray-200 text-left">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(idx);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete image</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Add / edit product modal: name, description (AI), price, enquiry / download options and images */
export const ProductModal: React.FC<{ m: Step3Model }> = ({ m }) => {
  const {
    profile, onChange, isEnquiryModalOpen, setIsModalOpen, setIsEnquiryModalOpen, editingId, isSavingProduct, handleSaveModal,
    name, setName, description, setDescription, price, setPrice, handleAiGenerateDesc, handleTitleBlur,
    hideEnquiry, setHideEnquiry, hideDownload, setHideDownload,
  } = m;
  return (
    <div
      className={`${isEnquiryModalOpen ? 'hidden' : 'fixed'} inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200`}
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-[#091426]">
            {editingId ? 'Edit Product/Service details' : 'Add Product/Service details'}
          </h3>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-gray-700 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (overflow-x-hidden avoids unwanted horizontal scrollbar) */}
        <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden">
          <div className="border border-[#bfdbfe] bg-[#f0f7ff]/70 rounded-xl p-3.5 sm:p-4.5 space-y-4">
            {/* Enter Product/Service name (Optional) */}
            <div className="border border-gray-300 rounded-lg bg-white px-3 py-1.5 focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] transition-all">
              <label className="block text-[11px] font-medium text-gray-500">
                Enter Product/Service name (Optional)
              </label>
              <input
                type="text"
                maxLength={150}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Digital Business Card & Mini Website"
                className="w-full bg-transparent text-xs sm:text-sm text-[#091426] font-medium focus:outline-none pt-0.5"
              />
            </div>

            {/* Product Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs sm:text-[13px] font-bold text-gray-800">
                  Product Description
                </label>
                <button
                  type="button"
                  onClick={handleAiGenerateDesc}
                  className="px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200 text-[11px] font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-2xs"
                  title={description ? 'Regenerate description' : 'Generate with AI'}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{description ? 'Regenerate' : 'AI Write'}</span>
                </button>
              </div>
              <RichTextEditor
                label=""
                value={description}
                onChange={(val) => setDescription(val)}
                placeholder="Enter detailed product description..."
                minHeight="140px"
                typography={profile.typography}
                onTypographyChange={(newTypo) => {
                  onChange('typography', newTypo);
                }}
              />
            </div>

            {/* Currency & Price Row */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]">
              <div className="w-24 border-r border-gray-200 px-3 py-1.5 flex flex-col justify-center bg-gray-50/50">
                <span className="text-[10px] font-semibold text-gray-500 leading-tight">Currency</span>
                <span className="text-xs sm:text-sm font-bold text-gray-800 text-center">₹</span>
              </div>
              <div className="flex-1 px-3 py-1.5 flex flex-col justify-center">
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter Product/Service Price (Optional)"
                  className="w-full bg-transparent text-xs sm:text-sm text-[#091426] font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Checkboxes & Customise Message link */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={hideEnquiry}
                    onChange={(e) => setHideEnquiry(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-gray-300"
                  />
                  <span>Hide Enquiry Button</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsEnquiryModalOpen(true)}
                  className="text-xs font-bold text-[#1e88e5] hover:text-[#1565c0] hover:underline transition-colors"
                >
                  Customise Your Enquiry Message
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={hideDownload}
                  onChange={(e) => setHideDownload(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-gray-300"
                />
                <span>Hide Download Product Card Button</span>
              </label>
            </div>

            <ProductImages m={m} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 text-xs font-bold text-[#1e88e5] hover:text-[#1565c0] uppercase tracking-wider transition-colors"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSaveModal}
            disabled={isSavingProduct}
            className="px-6 py-2 rounded-lg bg-[#1e88e5] hover:bg-[#1976d2] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSavingProduct && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSavingProduct ? 'SAVING...' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Customise Enquiry Message dialog (opens over the product modal) */
export const EnquiryMessageDialog: React.FC<{ m: Step3Model }> = ({ m }) => {
  const { customMessageText, setCustomMessageText, setCustomiseMessage, setIsEnquiryModalOpen } = m;
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setIsEnquiryModalOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <h4 className="text-sm sm:text-base font-bold text-[#091426]">
            Customise Enquiry Message
          </h4>
          <button
            type="button"
            onClick={() => setIsEnquiryModalOpen(false)}
            className="text-gray-400 hover:text-gray-700 rounded-lg p-1 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="border border-gray-300 rounded-xl p-3 focus-within:border-[#1e88e5] focus-within:ring-2 focus-within:ring-[#1e88e5]/20 bg-white transition-all shadow-2xs">
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Enter Custom Enquiry Message
            </label>
            <textarea
              rows={4}
              value={customMessageText}
              onChange={(e) => setCustomMessageText(e.target.value)}
              placeholder="Enter custom enquiry message..."
              className="w-full bg-transparent text-xs sm:text-sm text-[#091426] font-medium focus:outline-none resize-none leading-relaxed"
              autoFocus
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-gray-100 bg-gray-50/60">
          <button
            type="button"
            onClick={() => setIsEnquiryModalOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setCustomiseMessage(true);
              setIsEnquiryModalOpen(false);
              toast.success('Custom enquiry message saved');
            }}
            className="px-6 py-2 rounded-lg bg-[#1e88e5] hover:bg-[#1976d2] text-white text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
