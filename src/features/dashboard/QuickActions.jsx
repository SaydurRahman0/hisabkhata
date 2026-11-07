import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { PlusCircle, Wallet, UserPlus, PackagePlus } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';

/**
 * Quick Action Entry Panel.
 * Provides accessible shortcuts with full interaction feedback and Phase 02 roadmap awareness.
 */
export function QuickActions() {
  const { language, t, openPreviewModal, setActiveNav } = useApp();

  const actions = [
    {
      id: 'new-sale',
      label: t('dashboard.newSaleBtn'),
      description: t('dashboard.newSaleDesc'),
      icon: PlusCircle,
      accent: 'text-indigo-600 dark:text-indigo-400',
      bgHover: 'hover:border-indigo-300 dark:hover:border-indigo-800',
      details:
        language === 'bn'
          ? 'নতুন বিক্রয় ফর্ম (নগদ ও বাকিতে বিক্রয়, বারকোড স্ক্যানার, এবং তাত্ক্ষণিক দেনা হিসাব) পরবর্তী ধাপে যুক্ত করা হবে।'
          : 'New sales voucher entry (cash, credit, item lines, and instant customer ledger updates) will be introduced in the next phase.'
    },
    {
      id: 'collect-due',
      label: t('dashboard.collectDueBtn'),
      description: t('dashboard.collectDueDesc'),
      icon: Wallet,
      accent: 'text-emerald-600 dark:text-emerald-400',
      bgHover: 'hover:border-emerald-300 dark:hover:border-emerald-800',
      details:
        language === 'bn'
          ? 'বাকি আদায় ফর্ম (গ্রাহক নির্বাচন, আদায়ের পরিমাণ, কিস্তি হিসাব, এবং এসএমএস কনফার্মেশন) ফেজ ০২-এ বাস্তবায়ন করা হবে।'
          : 'Due collection voucher (customer lookup, installment entry, receipt logging, and balance reconciliation) will be introduced in Phase 02.'
    },
    {
      id: 'add-customer',
      label: t('dashboard.addCustomerBtn'),
      description: t('dashboard.addCustomerDesc'),
      icon: UserPlus,
      accent: 'text-sky-600 dark:text-sky-400',
      bgHover: 'hover:border-sky-300 dark:hover:border-sky-800',
      details:
        language === 'bn'
          ? 'নতুন ক্রেতা খাতা ও গ্রাহক ব্যবস্থাপনা।'
          : 'Customer directory and profile management.'
    },
    {
      id: 'add-product',
      label: t('dashboard.addProductBtn'),
      description: t('dashboard.addProductDesc'),
      icon: PackagePlus,
      accent: 'text-amber-600 dark:text-amber-400',
      bgHover: 'hover:border-amber-300 dark:hover:border-amber-800',
      details:
        language === 'bn'
          ? 'পণ্য ক্যাটালগ ও স্টক ব্যবস্থাপনা।'
          : 'Product catalogue and stock management.'
    }
  ];

  return (
    <Card padding="normal">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t('dashboard.quickActions')}
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'bn' ? '৪টি দ্রুত শর্টকাট' : '4 quick actions'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => {
                if (act.id === 'new-sale') {
                  setActiveNav('sales');
                } else if (act.id === 'add-product') {
                  setActiveNav('products');
                } else if (act.id === 'add-customer') {
                  setActiveNav('customers');
                } else {
                  openPreviewModal(act.label, act.details, 'Phase 05');
                }
              }}
              className={`flex items-start gap-3 p-3 text-left rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 transition-all cursor-pointer ${act.bgHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
            >
              <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 ${act.accent} shrink-0`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {act.label}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                  {act.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
