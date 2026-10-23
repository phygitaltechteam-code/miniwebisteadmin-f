// TransactionList.tsx
import React, {useState} from 'react';
import {Transaction} from '../types';
import {
  MdReceiptLong,
  MdChevronRight,
  MdExpandMore,
  MdExpandLess,
} from 'react-icons/md';
import {useNavigate} from '@tanstack/react-router';

interface TransactionListProps {
  transactions: Transaction[];
  initialLimit?: number;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  initialLimit = 3,
}) => {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const displayedTransactions = showAll
    ? transactions
    : transactions.slice(0, initialLimit);

  const handleTransactionClick = (transactionId: string) => {
    navigate({
      to: '/wallet/transaction/$id',
      params: {id: transactionId},
    });
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-1 flex-col px-6 pb-28">
        <div className="mb-4 mt-2 flex items-center justify-between">
          <h3 className="text-lg font-bold leading-tight text-[#0d131c] dark:text-white">
            Recent Transactions
          </h3>
          <button className="text-sm font-semibold text-primary transition-colors hover:text-blue-700">
            See All
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-slate-100 p-6 dark:bg-slate-800">
            <MdReceiptLong className="h-12 w-12 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            No transactions yet
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your transactions will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-28">
      <div className="mb-4 mt-2 flex items-center justify-between">
        <h3 className="text-lg font-bold leading-tight text-[#0d131c] dark:text-white">
          Recent Transactions
        </h3>

        {transactions.length > initialLimit && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-all hover:bg-primary hover:text-white dark:bg-primary/20 dark:hover:bg-primary sm:px-3 sm:py-1.5 sm:text-sm"
          >
            {showAll ? (
              <>
                <MdExpandLess className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <MdExpandMore className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>See All</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {displayedTransactions.map((tx) => {
          const Icon = tx.icon;
          // Determine amount sign based on type (CREDIT = income, DEBIT = expense)
          const amountSign = tx.type === 'CREDIT' ? '+' : '-';
          const amountColor =
            tx.amountColor ||
            (tx.type === 'CREDIT'
              ? 'text-green-600 dark:text-green-400'
              : 'text-[#0d131c] dark:text-white');

          return (
            <div
              key={tx.id}
              onClick={() => handleTransactionClick(tx.id)}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tx.iconBgClass} ${tx.colorClass}`}
                >
                  <Icon size={28} />
                </div>
                <div className="flex flex-col">
                  <p className="text-base font-semibold leading-tight text-[#0d131c] dark:text-white">
                    {tx.title || tx.particular}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {tx.date || new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                  {tx.status && (
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tx.badgeClass}`}
                      >
                        {tx.status === 'Pending' && (
                          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
                        )}
                        {tx.status === 'Approved' && (
                          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                        )}
                        {tx.status === 'Rejected' && (
                          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        )}
                        {tx.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold sm:text-base ${amountColor}`}
                  >
                    {amountSign}${tx.amount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 sm:text-xs">
                    {tx.category || (tx.type === 'CREDIT' ? 'Credit' : 'Debit')}
                  </p>
                </div>

                <div className="mt-1 flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400 sm:mt-2 sm:gap-1 sm:text-xs">
                  <span>View</span>
                  <MdChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
