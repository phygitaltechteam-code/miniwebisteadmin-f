import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Step2Model } from './useStep2Model';

/** Business Categories multi-select dropdown (search, pick, or add a custom category) */
export const CategoryPicker: React.FC<{ m: Step2Model }> = ({ m }) => {
  const { profile, availableCategories, selectedCategoryLabels, handleAddCategory, handleRemoveCategory } = m;
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');

  return (
    <div className="mb-3 pt-2.5 border-t border-[#E0E0E0]">
      <label className="text-[14px] font-normal text-[#000000DE] block mb-1">
        Business Categories <span className="text-red-500 font-bold">*</span>
      </label>

      <div className="relative">
        {/* Trigger */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setCatDropdownOpen((prev) => !prev)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setCatDropdownOpen((prev) => !prev))}
          className={`w-full cursor-pointer flex items-center justify-between gap-2 px-3 py-2 rounded border text-[14px] font-medium transition-all bg-white ${
            catDropdownOpen
              ? 'border-[#2196F3] ring-1 ring-[#2196F3]'
              : 'border-[#C4C4C4] hover:border-[#2196F3]'
          }`}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 min-h-[22px] items-center">
            {selectedCategoryLabels.length === 0 ? (
              <span className="text-[#9E9E9E] text-[14px]">Select or add categories...</span>
            ) : (
              selectedCategoryLabels.map((label) => (
                <span
                  key={label}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2196F3] border border-[#BFDBFE] text-[12px] font-medium"
                >
                  {label}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveCategory(label); }}
                    className="hover:text-red-600 ml-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))
            )}
          </div>
          <span className="text-gray-400 shrink-0 text-[11px]">{catDropdownOpen ? '▲' : '▼'}</span>
        </div>

        {/* Dropdown Panel */}
        {catDropdownOpen && (
          <div className="absolute z-30 mt-1 w-full bg-white border border-[#c5c6cd] rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-150">
            {/* Search */}
            <div className="px-3 pt-3 pb-2 border-b border-stroke">
              <input
                type="text"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="Search or type a new category..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stroke focus:outline-none focus:border-[#2563EB] bg-[#f8f9fc]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && catSearch.trim()) {
                    e.preventDefault();
                    const match = availableCategories.find((c) => c.name.toLowerCase() === catSearch.trim().toLowerCase());
                    handleAddCategory(match?.name || catSearch.trim(), match?.id);
                    setCatSearch('');
                  }
                }}
                autoFocus
              />
            </div>

            {/* Options */}
            <div className="max-h-52 overflow-y-auto">
              {availableCategories
                .filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                .map((cat) => {
                  const isSelected =
                    (profile.categoryIds || []).includes(cat.id) ||
                    (profile.categories || []).some((c: any) =>
                      typeof c === 'object'
                        ? c.id === cat.id || String(c.name || '').toLowerCase() === cat.name.toLowerCase()
                        : String(c).toLowerCase() === cat.name.toLowerCase() || c === cat.id
                    ) ||
                    (profile.categoryNames || []).some((n: string) => String(n).toLowerCase() === cat.name.toLowerCase());
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          handleRemoveCategory(cat.name);
                        } else {
                          handleAddCategory(cat.name, cat.id);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition-colors ${
                        isSelected ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#091426] hover:bg-[#f8f9fc]'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#2563EB] border-[#2563EB]' : 'border-[#c5c6cd] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className="font-medium">{cat.name}</span>
                    </button>
                  );
                })}

              {/* Manually add a custom category when it's not in the list */}
              {catSearch.trim() &&
                !availableCategories.some((c) => c.name.toLowerCase() === catSearch.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => { handleAddCategory(catSearch.trim()); setCatSearch(''); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left text-[#2563EB] font-semibold hover:bg-[#EFF6FF] border-t border-stroke"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add "{catSearch.trim()}"</span>
                  </button>
                )}

              {availableCategories.length === 0 && !catSearch.trim() && (
                <div className="px-4 py-4 text-xs text-gray-400 text-center">
                  Type to add a category
                </div>
              )}
            </div>

            {/* Done button */}
            <div className="px-3 py-2 border-t border-stroke">
              <button
                type="button"
                onClick={() => { setCatDropdownOpen(false); setCatSearch(''); }}
                className="w-full py-1.5 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold hover:bg-[#1D4ED8] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
