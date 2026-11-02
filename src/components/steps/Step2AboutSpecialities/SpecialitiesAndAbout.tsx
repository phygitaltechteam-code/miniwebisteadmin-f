import React from 'react';
import { Plus, Sparkles, GripVertical } from 'lucide-react';
import { RichTextEditor } from '@/components/Forms/RichTextEditor';
import { Step2Model } from './useStep2Model';
import { BlockHandle } from './BlockHandle';

/** Core Specialities: keyword chips (drag to reorder), manual entry and AI generate */
export const SpecialitiesBlock: React.FC<{ m: Step2Model }> = ({ m }) => {
  const {
    profile, newSpeciality, setNewSpeciality, handleAiGenerateKeywords, handleAddSpeciality, handleRemoveSpeciality,
    chipDragProps, chipDragClass, aboutBlockDropProps, aboutBlockClass,
  } = m;
  return (
    <div {...aboutBlockDropProps('specialities')} className={`mb-3 pt-3 border-t border-[#c5c6cd]/40 ${aboutBlockClass('specialities')}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <label className="text-xs font-bold text-[#091426] flex items-center gap-1">
            <BlockHandle m={m} block="specialities" />
            Core Specialities
          </label>
          <button
            type="button"
            onClick={handleAiGenerateKeywords}
            className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
            title={profile.specialities?.length ? 'Regenerate new keyword specialities using AI' : 'Automatically craft keywords from registered services'}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{profile.specialities?.length ? 'Regenerate' : 'AI Generate'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            maxLength={100}
            value={newSpeciality}
            onChange={(e) => setNewSpeciality(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpeciality())}
            placeholder="New speciality..."
            className="h-8 px-2.5 text-xs rounded-xl border border-stroke bg-white focus:outline-none focus:border-[#2563EB] flex-1 min-w-0 sm:w-56"
          />
          <button
            type="button"
            onClick={handleAddSpeciality}
            className="h-8 px-3 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-2xs hover:bg-[#1D4ED8]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-stroke bg-[#f8f9ff] min-h-[42px]">
        {(profile.specialities || []).map((item, index) => {
          const itemText = typeof item === 'object' ? String((item as any).specialities || (item as any).name || (item as any).title || '') : String(item);
          return (
            <span
              key={index}
              {...chipDragProps('specialities', index)}
              className={`px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs group hover:bg-blue-100 transition-colors cursor-grab active:cursor-grabbing ${chipDragClass('specialities', index)}`}
              title="Drag to reorder"
            >
              <GripVertical className="w-3 h-3 text-blue-300 -ml-1" />
              <span>{itemText}</span>
              <button
                type="button"
                onClick={() => handleRemoveSpeciality(itemText)}
                className="hover:text-rose-600 text-xs text-[#75777d] group-hover:text-[#2563EB]"
                title={`Remove ${itemText}`}
              >
                ✕
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** About us text: rich text editor with AI write / regenerate */
export const AboutTextBlock: React.FC<{ m: Step2Model }> = ({ m }) => {
  const { profile, onChange, handleAiGenerateNarrative, aboutBlockDropProps, aboutBlockClass } = m;
  return (
    <div {...aboutBlockDropProps('about')} className={`mb-3 pt-3 border-t border-[#c5c6cd]/40 ${aboutBlockClass('about')}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs sm:text-[13px] font-bold text-[#091426] flex items-center gap-1">
          <BlockHandle m={m} block="about" />
          About us text
        </label>
        <button
          type="button"
          onClick={handleAiGenerateNarrative}
          className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-2xs"
          title={profile.aboutNarrative ? 'Regenerate narrative with a different template' : 'Generate narrative using AI'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{profile.aboutNarrative ? 'Regenerate' : 'AI Write'}</span>
        </button>
      </div>

      <RichTextEditor
        label=""
        value={profile.aboutNarrative || (profile as any).aboutUsText || ''}
        onChange={(val) => {
          onChange('aboutNarrative', val);
          onChange('aboutUsText' as any, val);
        }}
        placeholder="Write company story, vision, or background here..."
        minHeight="140px"
        typography={profile.typography}
        onTypographyChange={(newTypo) => {
          onChange('typography', newTypo);
        }}
      />
    </div>
  );
};
