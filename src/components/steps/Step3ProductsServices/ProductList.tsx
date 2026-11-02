import React from 'react';
import { Plus, GripVertical, Edit3, Trash2, Image as ImageIcon } from 'lucide-react';
import { htmlToText } from '@/utils/richText';
import { Step3Model } from './useStep3Model';

/** Saved products (drag to reorder, edit, delete) or the empty state */
export const ProductList: React.FC<{ m: Step3Model }> = ({ m }) => {
  const { profile, productDragProps, productDragClass, openEditModal, handleDelete } = m;
  return (
    <div className="space-y-2.5">
      {profile.products.length === 0 ? (
        <div className="p-5 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-2">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-800">No products or services added yet</p>
        </div>
      ) : (
        profile.products.map((product, index) => (
          <div
            key={product.id}
            {...productDragProps(index)}
            title="Drag to reorder"
            className={`border border-stroke rounded-xl p-2.5 sm:p-3 bg-[#f8f9ff]/60 hover:bg-white hover:border-[#2563EB]/40 transition-all shadow-2xs cursor-grab active:cursor-grabbing ${productDragClass(index)}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                <GripVertical className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                <span className="hidden sm:flex w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs items-center justify-center font-bold shrink-0 mt-0.5">
                  {index + 1}
                </span>

                {/* Thumbnail */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-white border border-stroke overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                  {product.image ? (
                    <img src={product.image} alt={product.name || product.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-[#091426] truncate">
                      {product.name || product.title}
                    </h4>
                    {product.price !== undefined && product.price !== '' && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        {product.currency || 'INR'} {product.price}
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-xs text-[#5a5c61] line-clamp-2 mt-1 leading-relaxed">
                      {htmlToText(product.description)}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-500">
                    <span className={`px-2 py-0.5 rounded ${(product.isHideEnquiry ?? product.hideEnquiry) ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700 font-medium'}`}>
                      {(product.isHideEnquiry ?? product.hideEnquiry) ? 'Enquiry Hidden' : 'Enquiry Active'}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${(product.isHideDownloadProductCart ?? product.hideDownload) ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700 font-medium'}`}>
                      {(product.isHideDownloadProductCart ?? product.hideDownload) ? 'Card Download Hidden' : 'Card Download Active'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(product)}
                  className="p-2 text-gray-500 hover:text-[#2563EB] rounded-lg hover:bg-white border border-transparent hover:border-stroke transition-all"
                  title="Edit Product"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  className="p-2 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-white border border-transparent hover:border-stroke transition-all"
                  title="Delete Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
