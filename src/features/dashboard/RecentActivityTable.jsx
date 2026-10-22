import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { formatCurrency, formatNumber, formatTime } from '../../lib/formatters.js';
import { DEMO_TRANSACTIONS } from '../../lib/demoData.js';
import { Card } from '../../components/ui/Card.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import {
  TrendingUp,
  Receipt,
  Wallet,
  Clock,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  FileText
} from 'lucide-react';

export function RecentActivityTable() {
  const { language, t, openPreviewModal } = useApp();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'cash_sale' | 'credit_sale' | 'due_collection'
  const [searchQuery, setSearchQuery] = useState('');

  // Client-side filtering
  const filteredTransactions = useMemo(() => {
    return DEMO_TRANSACTIONS.filter((txn) => {
      // 1. Type filter
      if (filterType !== 'all' && txn.type !== filterType) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameBn = (txn.customerName.bn || '').toLowerCase();
        const nameEn = (txn.customerName.en || '').toLowerCase();
        const phone = (txn.phone || '').toLowerCase();
        const receipt = (txn.receiptNo || '').toLowerCase();
        const items = (txn.itemsSummary[language] || '').toLowerCase();

        return (
          nameBn.includes(query) ||
          nameEn.includes(query) ||
          phone.includes(query) ||
          receipt.includes(query) ||
          items.includes(query)
        );
      }

      return true;
    });
  }, [filterType, searchQuery, language]);

  // Transaction type metadata helper
  const getTypeMeta = (type) => {
    switch (type) {
      case 'cash_sale':
        return {
          label: t('dashboard.typeCashSale'),
          icon: TrendingUp,
          badgeVariant: 'success',
          amountPrefix: '+'
        };
      case 'credit_sale':
        return {
          label: t('dashboard.typeCreditSale'),
          icon: Receipt,
          badgeVariant: 'warning',
          amountPrefix: ''
        };
      case 'due_collection':
        return {
          label: t('dashboard.typeDueCollection'),
          icon: Wallet,
          badgeVariant: 'info',
          amountPrefix: '+'
        };
      default:
        return {
          label: type,
          icon: TrendingUp,
          badgeVariant: 'neutral',
          amountPrefix: ''
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">{t('dashboard.statusPaid')}</Badge>;
      case 'due':
        return <Badge variant="warning">{t('dashboard.statusDue')}</Badge>;
      case 'collected':
        return <Badge variant="info">{t('dashboard.statusCollected')}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleRowClick = (txn) => {
    openPreviewModal(
      `${t('dashboard.colTime')}: ${txn.receiptNo}`,
      language === 'bn'
        ? `ক্রেতা: ${txn.customerName.bn} (${txn.phone})\nবিবরণ: ${txn.itemsSummary.bn}\nমোট পরিমাণ: ${formatCurrency(txn.amount, 'bn')}\n\nএটি ফেজ ০১ প্রিভিউ ডেটা। ফেজ ০২-এ বিস্তারিত লেনদেন হিস্টোরি ও রসিদ প্রিভিউ যুক্ত হবে।`
        : `Customer: ${txn.customerName.en} (${txn.phone})\nDescription: ${txn.itemsSummary.en}\nTotal Amount: ${formatCurrency(txn.amount, 'en')}\n\nThis is Phase 01 preview data. Comprehensive transaction histories will be accessible in Phase 02.`
    );
  };

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Table Header & Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('dashboard.recentActivityTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('dashboard.recentActivitySub')}
            </p>
          </div>

          {/* Quick Counter */}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>{t('dashboard.totalCount')}</span>{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums font-mono">
              {formatNumber(filteredTransactions.length, language)}
            </span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Segmented Filter Control */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('dashboard.filterAll')}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('cash_sale')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'cash_sale'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('dashboard.filterCashSale')}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('credit_sale')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'credit_sale'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('dashboard.filterCreditSale')}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('due_collection')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'due_collection'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('dashboard.filterDueCollection')}
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('dashboard.searchTable')}
              id="table-search"
              ariaLabel={t('dashboard.searchTable')}
            />
          </div>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                {t('dashboard.colTime')}
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                {t('dashboard.colCustomer')}
              </th>
              <th scope="col" className="hidden sm:table-cell px-4 py-3">
                {t('dashboard.colItems')}
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                {t('dashboard.colType')}
              </th>
              <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">
                {t('dashboard.colAmount')}
              </th>
              <th scope="col" className="px-4 py-3 text-center whitespace-nowrap">
                {t('dashboard.colStatus')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-sm">{t('dashboard.emptyTable')}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterType('all');
                        setSearchQuery('');
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                      {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => {
                const typeMeta = getTypeMeta(txn.type);
                const TypeIcon = typeMeta.icon;

                return (
                  <tr
                    key={txn.id}
                    onClick={() => handleRowClick(txn)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    {/* Time & Receipt */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono text-slate-900 dark:text-slate-100 font-medium">
                        {txn.receiptNo}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(txn.time, language)}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {txn.customerName[language] || txn.customerName.bn}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3" />
                        <span>{formatNumber(txn.phone, language)}</span>
                      </div>
                    </td>

                    {/* Items Summary */}
                    <td className="hidden sm:table-cell px-4 py-3 max-w-xs">
                      <p className="truncate text-slate-700 dark:text-slate-300">
                        {txn.itemsSummary[language] || txn.itemsSummary.bn}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        {txn.customerLocation[language] || txn.customerLocation.bn}
                      </p>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{typeMeta.label}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                        {formatCurrency(txn.amount, language)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {getStatusBadge(txn.status)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination note */}
      <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {language === 'bn'
            ? 'সর্বশেষ ৭টি ডেমো এন্ট্রি প্রদর্শিত হচ্ছে'
            : 'Displaying 7 demo transactions'}
        </span>
        <button
          type="button"
          onClick={() =>
            openPreviewModal(
              t('nav.reports'),
              language === 'bn'
                ? 'সম্পূর্ণ লেজার ও পিডিএফ রিপোর্ট জেনারেশন ফিচারটি ফেজ ০৩-এ যুক্ত করা হবে।'
                : 'Full ledger reporting and downloadable PDF statement features will be introduced in Phase 03.'
            )
          }
          className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer"
        >
          {language === 'bn' ? 'রিপোর্ট স্টেটমেন্ট দেখুন →' : 'View Statement →'}
        </button>
      </div>
    </Card>
  );
}
