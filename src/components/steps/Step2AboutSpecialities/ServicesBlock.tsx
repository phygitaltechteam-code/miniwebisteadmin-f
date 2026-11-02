import React from 'react';
import { Plus, X, Sparkles, GripVertical } from 'lucide-react';
import { Step2Model } from './useStep2Model';
import { BlockHandle } from './BlockHandle';
import { cleanServiceString } from './helpers';

/** Nature of business: service chips (drag to reorder), manual entry, auto-generate and suggestions */
export const ServicesBlock: React.FC<{ m: Step2Model }> = ({ m }) => {
  const {
    profile, newService, setNewService, suggestedServices, handleAutoGenerateServices, handleAddSuggestedService,
    handleAddAllSuggestedServices, handleAddService, handleRemoveService, chipDragProps, chipDragClass, aboutBlockDropProps, aboutBlockClass,
  } = m;
  return (
    <div {...aboutBlockDropProps('services')} className={`mb-3 pt-3 border-t border-[#c5c6cd]/40 ${aboutBlockClass('services')}`}>
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <label className="text-xs font-bold text-[#091426] flex items-center gap-1">
          <BlockHandle m={m} block="services" />
          Nature of business
        </label>

        <button
          type="button"
          onClick={handleAutoGenerateServices}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11px] font-bold border border-[#BFDBFE] transition-colors shadow-2xs active:scale-95 shrink-0"
          title="Automatically generate services matching your business category"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Auto Generate</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 p-2 sm:p-2.5 rounded-xl border border-stroke bg-[#f8f9fc] items-center min-h-[42px]">
        {(profile.servicesOffered || []).map((srv, idx) => {
          const cleanSrv = cleanServiceString(srv);
          if (!cleanSrv) return null;
          return (
            <span
              key={idx}
              {...chipDragProps('servicesOffered', idx)}
              className={`px-2.5 py-1 rounded-lg bg-white text-[#091426] text-xs font-semibold flex items-center gap-1.5 border border-stroke shadow-2xs cursor-grab active:cursor-grabbing ${chipDragClass('servicesOffered', idx)}`}
              title="Drag to reorder"
            >
              <GripVertical className="w-3 h-3 text-gray-400 -ml-1" />
              <span>{cleanSrv}</span>
              <button
                type="button"
                onClick={() => handleRemoveService(cleanSrv)}
                className="hover:text-red-600 text-[11px] p-0.5"
                title={`Remove ${cleanSrv}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        <div className="flex items-center gap-1 flex-1 min-w-[150px]">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
            placeholder="+ Type service & Enter (e.g. Corporate Consulting)..."
            className="w-full text-xs bg-transparent border-none text-[#091426] focus:outline-none p-1 placeholder:text-gray-400"
          />
          {newService && (
            <button
              type="button"
              onClick={handleAddService}
              className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold shrink-0 shadow-2xs"
            >
              Add
            </button>
          )}
        </div>
      </div>

      {/* Smart Suggestions based on Business Category / Services */}
      {suggestedServices.length > 0 && (
        <div className="mt-2 p-2 sm:p-2.5 rounded-xl bg-[#EFF6FF]/70 border border-[#BFDBFE] text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-blue-200/50">
            <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#2563EB]" />
              Suggested Services:
            </span>
            <button
              type="button"
              onClick={handleAddAllSuggestedServices}
              className="text-[10px] font-bold text-[#2563EB] hover:underline px-1 py-0.5"
            >
              + Add All
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {suggestedServices.slice(0, 6).map((srv, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddSuggestedService(srv)}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white hover:bg-[#EFF6FF] text-[#091426] hover:text-[#2563EB] border border-stroke hover:border-[#2563EB] transition-all flex items-center gap-1 shadow-2xs"
                title={`Add ${srv}`}
              >
                <Plus className="w-2.5 h-2.5 text-[#2563EB]" />
                <span className="truncate max-w-[200px]">{srv}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
