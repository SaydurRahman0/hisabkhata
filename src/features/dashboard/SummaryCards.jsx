import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { formatCurrency, formatNumber } from '../../lib/formatters.js';
import { DEMO_SUMMARY_DATA } from '../../lib/demoData.js';
import {
  TrendingUp,
  Wallet,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';

/**
 * Key Performance Summary Cards.
 * Visualizes business health across Sales, Cash, Credit, and Total Dues.
 */
export function SummaryCards() {
  const { language, t } = useApp();

  const cards = [
    {
      id: 'todaySales',
      title: t('dashboard.todaySales'),
      amount: formatCurrency(DEMO_SUMMARY_DATA.todaySales, language),
      subtitle: t('dashboard.todaySalesSub'),
      icon: TrendingUp,
      accentColor: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60'
    },
    {
      id: 'cashCollected',
      title: t('dashboard.cashCollected'),
      amount: formatCurrency(DEMO_SUMMARY_DATA.cashCollectedToday, language),
      subtitle: t('dashboard.cashCollectedSub'),
      icon: Wallet,
      accentColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60'
    },
    {
      id: 'newCredit',
      title: t('dashboard.newCredit'),
      amount: formatCurrency(DEMO_SUMMARY_DATA.newCreditToday, language),
      subtitle: t('dashboard.newCreditSub'),
      icon: Receipt,
      accentColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60'
    },
    {
      id: 'totalDue',
      title: t('dashboard.totalOutstanding'),
      amount: formatCurrency(DEMO_SUMMARY_DATA.totalOutstandingDues, language),
      subtitle: t('dashboard.totalOutstandingSub'),
      icon: AlertCircle,
      accentColor: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.id} padding="normal" className="flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.badgeBg} ${card.accentColor} shrink-0`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums font-mono">
                {card.amount}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>{card.subtitle}</span>
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
