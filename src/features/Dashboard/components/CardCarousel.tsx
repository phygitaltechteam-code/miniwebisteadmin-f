import React from 'react';
import {MaterialIcon} from './MaterialIcon';
import {BankCard} from '../types';
import {BiLock} from 'react-icons/bi';

interface CardCarouselProps {
  cards: BankCard[];
}

export const CardCarousel: React.FC<CardCarouselProps> = ({cards}) => {
  return (
    <div className="w-full py-4">
      {/* Cards Scroll Container */}
      <div className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`group relative flex h-40 w-[85%] max-w-[320px] shrink-0 cursor-pointer snap-center flex-col justify-center overflow-hidden rounded-xl p-6 text-white shadow-lg transition-transform active:scale-95 ${
              card.theme === 'orange'
                ? 'bg-primary shadow-orange-500/30'
                : 'border border-slate-700 bg-slate-900 shadow-slate-900/20 dark:bg-slate-800'
            }`}
          >
            {card.theme === 'orange' && (
              <>
                <div className="absolute -right-8 -top-12 h-48 w-48 rounded-full border-[32px] border-white/10 mix-blend-overlay"></div>
                <div className="absolute -bottom-8 -left-6 h-32 w-32 rounded-full bg-gradient-to-tr from-white/20 to-transparent blur-xl"></div>
                <div className="absolute bottom-8 right-12 h-12 w-12 rounded-full border-2 border-white/20 opacity-60"></div>
              </>
            )}

            {card.theme === 'dark' && (
              <>
                <div className="absolute right-0 top-0 h-full w-full bg-gradient-to-br from-slate-800 to-slate-900 opacity-50"></div>
                <div className="absolute -right-4 -top-4 h-40 w-40 rotate-12 rounded-xl border border-slate-600/30 bg-slate-700/10"></div>
                <div className="absolute bottom-[-20%] left-[-10%] h-32 w-32 rotate-45 rounded-lg bg-slate-700/20 blur-sm"></div>
              </>
            )}

            {/* Card Content */}
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="mb-1 flex w-full items-start justify-between">
                <p
                  className={`text-sm font-medium ${card.theme === 'orange' ? 'text-white/90' : 'text-slate-400'}`}
                >
                  {card.type}
                </p>
                <BiLock size={20} />
              </div>

              <div className="mt-auto">
                <h3
                  className={`font-bold tracking-tight ${
                    card.balance > 999999
                      ? 'text-2xl sm:text-3xl'
                      : card.balance > 99999
                        ? 'text-2xl sm:text-3xl'
                        : 'text-3xl'
                  }`}
                >
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(card.balance)}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-center gap-1.5">
        {cards.map((card, index) => (
          <div
            key={`dot-${card.id}`}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${index === 0 ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
          />
        ))}
      </div>
    </div>
  );
};
