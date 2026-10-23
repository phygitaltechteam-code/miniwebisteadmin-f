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
  productCount = 0,
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
    { number: 1, name: '1. Basic Details' },
    { number: 2, name: '2. About & Specialities' },
    { number: 3, name: '3. Products & Services', badge: productCount },
    { number: 4, name: '4. Links & Social' },
    { number: 5, name: '5. Payment & QR' },
    { number: 6, name: '6. Photo Gallery' },
    { number: 7, name: '7. YouTube Videos' },
    { number: 8, name: '8. Card Settings' },
  ];

  return (
    <div className="bg-white border border-[#c5c6cd]/50 rounded-xl p-1.5 sm:p-2 shadow-xs relative w-full transition-all  overflow-hidden flex items-center gap-1 mb-1">
      {/* Scroll Left Button */}
      <button
        type="button"
        onClick={() => handleScroll('left')}
        className="p-1 rounded-lg text-gray-400 hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors shrink-0 hidden sm:flex xl:hidden items-center justify-center"
        title="Scroll left"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 xl:flex-1 justify-center transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : isCompleted
                  ? 'bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE]'
                  : 'text-gray-600 bg-gray-50/80 hover:bg-[#EFF6FF] hover:text-[#2563EB]'
              }`}
            >
              <span>{step.name}</span>
              {step.badge !== undefined && step.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-white text-[#2563EB]'
                      : 'bg-[#2563EB] text-white'
                  }`}
                >
                  {step.badge}
                </span>
              )}
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
        className="p-1 rounded-lg text-gray-400 hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors shrink-0 hidden sm:flex xl:hidden items-center justify-center"
        title="Scroll right"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};
