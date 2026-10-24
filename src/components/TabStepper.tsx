import React, { useRef, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface TabStepperProps {
  currentStep: number;
  onSelectStep: (stepNumber: number) => void;
  productCount?: number;
}

export const TabStepper: React.FC<TabStepperProps> = ({
  currentStep,
  onSelectStep,
}) => {
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

  const steps = [
    { number: 1, name: '1. Basic Details', shortName: '1. Basic' },
    { number: 2, name: '2. About & Specialities', shortName: '2. About' },
    { number: 3, name: '3. Products & Services', shortName: '3. Products' },
    { number: 4, name: '4. Links & Social', shortName: '4. Links' },
    { number: 5, name: '5. Payment & QR', shortName: '5. Payment' },
    { number: 6, name: '6. Photo Gallery', shortName: '6. Gallery' },
    { number: 7, name: '7. YouTube Videos', shortName: '7. Videos' },
    { number: 8, name: '8. Card Settings', shortName: '8. Settings' },
  ];

  const currentStepObj = steps.find((s) => s.number === currentStep) || steps[0];

  return (
    <div className="bg-white border border-[#c5c6cd]/50 rounded-xl p-1.5 sm:p-2 shadow-xs relative w-full transition-all overflow-hidden mb-1">
      {/* Mobile-only Step Sequence Info Header */}
      <div className="sm:hidden flex items-center justify-between px-1.5 pb-1.5 mb-1 border-b border-slate-100 text-[11px]">
        <div className="flex items-center gap-1.5 font-bold text-[#091426]">
          <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px]">
            {currentStep}
          </span>
          <span className="text-[#2563EB] font-bold">
            {currentStepObj.name.replace(/^\d+\.\s*/, '')}
          </span>
          <span className="text-gray-400 font-normal">({currentStep}/8)</span>
        </div>
        <span className="text-[10px] font-medium text-gray-400">Swipe for steps →</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="p-1 rounded-lg text-gray-400 hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors shrink-0 flex xl:hidden items-center justify-center"
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
            const isCompleted = currentStep > step.number;

            return (
              <button
                key={step.number}
                ref={isActive ? activeTabRef : null}
                onClick={() => onSelectStep(step.number)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap shrink-0 xl:flex-1 justify-center transition-all flex items-center gap-1 sm:gap-1.5 ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs font-bold'
                    : isCompleted
                    ? 'bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE]'
                    : 'text-gray-600 bg-gray-50/90 hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                }`}
              >
                <span>{step.name}</span>
                {isCompleted && !isActive && (
                  <CheckCircle className="w-3 h-3 text-[#2563EB] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="p-1 rounded-lg text-gray-400 hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors shrink-0 flex xl:hidden items-center justify-center"
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
