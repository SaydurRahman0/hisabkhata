import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { formatCurrency, formatNumber } from '../../lib/formatters.js';
import { DEMO_HIGH_DUES } from '../../lib/demoData.js';
import { Card } from '../../components/ui/Card.jsx';
import { AlertTriangle, Send, PhoneCall, ChevronRight } from 'lucide-react';

export function DueHighlightCard() {
  const { language, t, openPreviewModal } = useApp();

  const handleReminderClick = (item) => {
    openPreviewModal(
      language === 'bn' ? 'বকেয়া তাগাদা রিমাইন্ডার' : 'Due Reminder Action',
      language === 'bn'
        ? `${item.customerName.bn} (${item.phone})-কে ${formatCurrency(item.totalDue, 'bn')} টাকার তাগাদা এসএমএস পাঠানোর প্রস্তুতি। ফেজ ০২-এ স্বয়ংক্রিয় এসএমএস গেটওয়ে সংযুক্ত হবে।`
        : `Ready to dispatch due reminder SMS for ${formatCurrency(item.totalDue, 'en')} to ${item.customerName.en} (${item.phone}). Automated SMS dispatch will be wired in Phase 02.`
    );
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t('dashboard.highDueTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('dashboard.highDueSub')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            openPreviewModal(
              t('dashboard.viewAllDue'),
              language === 'bn'
                ? 'সম্পূর্ণ বাকি খাতা ও কাস্টমার লেজার ফিল্টারিং ফেজ ০২-এ বাস্তবায়ন করা হবে।'
                : 'Customer ledger balance sheets and collection scheduling will be implemented in Phase 02.'
            )
          }
          className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <span>{language === 'bn' ? 'সকল বাকি' : 'All Dues'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {DEMO_HIGH_DUES.map((item) => (
          <div
            key={item.id}
            className="p-3.5 space-y-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
          >
            {/* Top row: Customer Name and Overdue Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                {item.customerName[language] || item.customerName.bn}
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-medium whitespace-nowrap shrink-0">
                {formatNumber(item.daysOverdue, language)}{' '}
                {language === 'bn' ? 'দিন বাকি' : 'days overdue'}
              </span>
            </div>

            {/* Middle row: Phone & Last Payment */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="font-mono">{formatNumber(item.phone, language)}</span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
              <span className="truncate">
                {language === 'bn' ? 'শেষ জমা:' : 'Last:'}{' '}
                {item.lastPaymentDate[language] || item.lastPaymentDate.bn}
              </span>
            </div>

            {/* Bottom row: Amount & Reminder Button */}
            <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100/80 dark:border-slate-800/60">
              <div>
                <span className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatCurrency(item.totalDue, language)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                  {language === 'bn' ? 'বকেয়া' : 'due'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleReminderClick(item)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3 h-3 text-indigo-500" />
                <span>{t('dashboard.sendReminder')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
