/*eslint-disable*/
import React, {useEffect} from 'react';
import {Header} from '../components/Header';
import {CardCarousel} from '../components/CardCarousel';
import {QuickActions} from '../components/QuickActions';
import {TransactionList} from '../components/TransactionList';
import Footer from '@/features/Footer/Footer';
import {useGetProfileMutation} from './dashboardmutation';
import {MdRefresh} from 'react-icons/md';
import {transformApiTransaction, transformWalletData} from '@/utils/formatters';
import {BankCard} from '../types';

const Dashboard: React.FC = () => {
  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useGetProfileMutation();

  if (isLoading) {
    return (
      <div className="bg-background-light dark:bg-background-dark relative mx-auto flex h-screen w-full max-w-md flex-col items-center justify-center shadow-2xl">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-light dark:bg-background-dark relative mx-auto flex h-screen w-full max-w-md flex-col items-center justify-center shadow-2xl">
        <div className="rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">
            Failed to load dashboard data
          </p>
          <p className="mt-2 text-sm text-red-500 dark:text-red-300">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-blue-700"
          >
            <MdRefresh />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!apiResponse) {
    return (
      <div className="bg-background-light dark:bg-background-dark relative mx-auto flex h-screen w-full max-w-md flex-col items-center justify-center shadow-2xl">
        <div className="rounded-lg bg-yellow-50 p-6 dark:bg-yellow-900/20">
          <p className="text-yellow-600 dark:text-yellow-400">
            No data available
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-blue-700"
          >
            <MdRefresh />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const dashboardData = apiResponse.data || apiResponse;

  const wallet = dashboardData.wallet || dashboardData.data?.wallet;
  const apiTransactions =
    dashboardData.transactions || dashboardData.data?.transactions || [];

  const walletCards: BankCard[] = transformWalletData(wallet, apiTransactions);

  const transactions = Array.isArray(apiTransactions)
    ? apiTransactions.map((tx: any) => {
        const transformed = transformApiTransaction(tx);

        return transformed;
      })
    : [];

  return (
    <>
      <div className="bg-gray-50 flex min-h-screen items-start justify-center pt-0">
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-white shadow-2xl md:rounded-3xl">
          <div className="h-2 w-full bg-transparent" />
          <Header />
          <main className="flex flex-1 flex-col">
            <CardCarousel cards={walletCards} />
            <QuickActions />
            <TransactionList transactions={transactions} />
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
