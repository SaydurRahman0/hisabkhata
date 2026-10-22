import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { DemoNoticeBanner } from './DemoNoticeBanner.jsx';
import { SummaryCards } from './SummaryCards.jsx';
import { QuickActions } from './QuickActions.jsx';
import { RecentActivityTable } from './RecentActivityTable.jsx';
import { DueHighlightCard } from './DueHighlightCard.jsx';
import { Clock, Store } from 'lucide-react';

export function DashboardOverview() {
  const { language, t } = useApp();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Last Synchronized Time */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{t('dashboard.lastUpdated')}</span>
        </div>
      </div>

      {/* Demo Data Notice */}
      <DemoNoticeBanner />

      {/* 4 Summary Cards */}
      <SummaryCards />

      {/* Quick Actions Bar */}
      <QuickActions />

      {/* Main Content Split: Recent Activity & Due Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivityTable />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <DueHighlightCard />

          {/* Quick Business Tips / Info Card for shopkeeper */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
              <Store className="w-4 h-4 text-indigo-500" />
              <span>
                {language === 'bn' ? 'দোকানের ক্যাশ খাতা পরামর্শ' : 'Daily Cashbook Tip'}
              </span>
            </div>
            <p className="leading-relaxed">
              {language === 'bn'
                ? 'প্রতিদিন দোকান বন্ধের পূর্বে ক্যাশ ড্রয়ারের নগদ টাকার সাথে "আজ নগদ জমা" মিলিয়ে নিন। কোনো অসঙ্গতি থাকলে তাত্ক্ষণিক এন্ট্রি সংশোধন করুন।'
                : 'Always reconcile physical drawer cash with the "Cash Collected Today" figure before closing the shop to catch any balance discrepancies early.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
