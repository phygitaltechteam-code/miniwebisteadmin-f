import React, { useRef, useEffect, useState } from 'react';
import { CheckCircle, GripVertical } from 'lucide-react';
import { CardSectionKey, DEFAULT_SECTION_ORDER } from '@/types/profile';

interface TabStepperProps {
  currentStep: number;
  onSelectStep: (stepNumber: number) => void;
  productCount?: number;
  /** Order of the section steps (About … YouTube); defaults to the standard order */
  sectionOrder?: CardSectionKey[];
  /** When given, the section tabs can be dragged to reorder them */
  onReorderSections?: (order: CardSectionKey[]) => void;
}

// Builder step number for each reorderable card section
export const SECTION_STEP: Record<CardSectionKey, number> = {
  about: 2,
  products: 3,
  links: 4,
  payment: 5,
  gallery: 6,
  youtube: 7,
};

const STEP_LABELS: Record<number, { name: string; shortName: string }> = {
  1: { name: 'Basic Details', shortName: 'Basic' },
  2: { name: 'About & Specialities', shortName: 'About' },
  3: { name: 'Products & Services', shortName: 'Products' },
  4: { name: 'Links & Social', shortName: 'Links' },
  5: { name: 'Payment & QR', shortName: 'Payment' },
  6: { name: 'Photo Gallery', shortName: 'Gallery' },
  7: { name: 'YouTube Videos', shortName: 'Videos' },
  8: { name: 'Card Settings', shortName: 'Settings' },
};

/** Step numbers in display order: Basic Details, the sections in `sectionOrder`, then Card Settings */
export const getOrderedSteps = (sectionOrder?: CardSectionKey[]): number[] => {
  const order = sectionOrder?.length ? sectionOrder : DEFAULT_SECTION_ORDER;
  // Keep any section missing from a saved order, so no step disappears
  const complete = [...order, ...DEFAULT_SECTION_ORDER.filter((k) => !order.includes(k))];
  return [1, ...complete.map((k) => SECTION_STEP[k]), 8];
};

export const TabStepper: React.FC<TabStepperProps> = ({
  currentStep,
  onSelectStep,
  sectionOrder,
  onReorderSections,
}) => {
  const [dragKey, setDragKey] = useState<CardSectionKey | null>(null);
  const [dragOverKey, setDragOverKey] = useState<CardSectionKey | null>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [currentStep]);

  const handleScroll = (direction: 'left' | 'right') => {
    scrollContainerRef.current?.scrollBy({
      left: direction === 'left' ? -180 : 180,
      behavior: 'smooth',
    });
  };

  const sectionByStep = Object.fromEntries(
    Object.entries(SECTION_STEP).map(([key, step]) => [step, key as CardSectionKey])
  ) as Record<number, CardSectionKey>;

  const orderedSteps = getOrderedSteps(sectionOrder);
  // Number shown on each tab follows its position, so a reordered tab is renumbered
  const steps = orderedSteps.map((number, idx) => ({
    number,
    position: idx + 1,
    section: sectionByStep[number] as CardSectionKey | undefined,
    name: `${idx + 1}. ${STEP_LABELS[number].name}`,
    shortName: `${idx + 1}. ${STEP_LABELS[number].shortName}`,
  }));

  const currentStepObj = steps.find((s) => s.number === currentStep) || steps[0];

  const handleSectionDrop = (target: CardSectionKey) => {
    const from = dragKey;
    setDragKey(null);
    setDragOverKey(null);
    if (!from || from === target || !onReorderSections) return;
    const current = steps.map((s) => s.section).filter(Boolean) as CardSectionKey[];
    const next = current.filter((k) => k !== from);
    next.splice(next.indexOf(target), 0, from);
    onReorderSections(next);
  };

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-lg p-1.5 sm:p-2 shadow-none relative w-full transition-all overflow-hidden mb-1 font-['Roboto',Helvetica,Arial,sans-serif]">
      {/* Mobile-only Step Sequence Info Header */}
      <div className="sm:hidden flex items-center justify-between px-1.5 pb-1.5 mb-1 border-b border-[#E0E0E0] text-[11px]">
        <div className="flex items-center gap-1.5 font-medium text-[#000000DE]">
          <span className="w-5 h-5 rounded-full bg-[#2196F3] text-white flex items-center justify-center text-[10px] font-bold">
            {currentStepObj.position}
          </span>
          <span className="text-[#2196F3] font-medium">
            {currentStepObj.name.replace(/^\d+\.\s*/, '')}
          </span>
          <span className="text-[#757575] font-normal">({currentStepObj.position}/8)</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="p-1 rounded text-gray-400 hover:text-[#2196F3] hover:bg-[#2196F3]/10 transition-colors shrink-0 flex xl:hidden items-center justify-center"
          title="Scroll left"
          aria-label="Scroll left"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Horizontal Tabs Row (clean, full display, responsive, process-wise) */}
        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full py-0.5"
        >
          {steps.map((step) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStepObj.position > step.position;
            const section = step.section;
            const isDraggable = Boolean(section && onReorderSections);

            return (
              <button
                key={step.number}
                ref={isActive ? activeTabRef : null}
                onClick={() => onSelectStep(step.number)}
                draggable={isDraggable}
                onDragStart={isDraggable ? (e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  setDragKey(section!);
                } : undefined}
                onDragOver={isDraggable ? (e) => {
                  if (!dragKey) return;
                  e.preventDefault();
                  if (dragOverKey !== section) setDragOverKey(section!);
                } : undefined}
                onDrop={isDraggable ? (e) => {
                  e.preventDefault();
                  handleSectionDrop(section!);
                } : undefined}
                onDragEnd={isDraggable ? () => { setDragKey(null); setDragOverKey(null); } : undefined}
                title={isDraggable ? 'Drag to change the section order' : undefined}
                className={`px-2.5 sm:px-3 py-1.5 rounded text-[11px] sm:text-[13px] font-medium whitespace-nowrap shrink-0 xl:flex-1 justify-center transition-all flex items-center gap-1 sm:gap-1.5 ${
                  isActive
                    ? 'bg-[#2196F3] text-white font-medium shadow-none'
                    : isCompleted
                    ? 'bg-[#2196F3]/10 text-[#2196F3] hover:bg-[#2196F3]/20'
                    : 'text-[#000000DE] bg-[#FAFAFA] hover:bg-[#2196F3]/10 hover:text-[#2196F3]'
                } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''} ${
                  dragKey === section && section ? 'opacity-40' : ''
                } ${dragOverKey === section && dragKey && dragKey !== section ? 'ring-2 ring-[#2196F3] ring-offset-1' : ''}`}
              >
                {isDraggable && (
                  <GripVertical className={`w-3 h-3 shrink-0 -ml-1 ${isActive ? 'text-white/70' : 'text-gray-400'}`} />
                )}
                <span>{step.name}</span>
                {isCompleted && !isActive && (
                  <CheckCircle className="w-3.5 h-3.5 text-[#2196F3] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="p-1 rounded text-gray-400 hover:text-[#2196F3] hover:bg-[#2196F3]/10 transition-colors shrink-0 flex xl:hidden items-center justify-center"
          title="Scroll right"
          aria-label="Scroll right"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
