import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { CollectDueModal } from './CollectDueModal.jsx';
import { CustomerStatementModal } from './CustomerStatementModal.jsx';
import { apiGetDuesList, apiGetCustomerDues } from '../../lib/api.js';
import {
  Wallet,
  Users,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Lock,
  LogIn
} from 'lucide-react';

export function DuesView() {
  const { t, language, isAuthenticated, openAuthModal } = useApp();

  const [dues, setDues] = useState([]);
  const [summary, setSummary] = useState({
    totalOutstandingDue: 0,
    customersWithDueCount: 0,
    totalUnpaidSalesCount: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState('');

  // Modals
  const [selectedCustomerIdForStatement, setSelectedCustomerIdForStatement] = useState(null);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);

  const fetchDues = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await apiGetDuesList({
        search: searchTerm
      });
      setDues(data.dues || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load dues ledger');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, searchTerm]);

  useEffect(() => {
    fetchDues();
  }, [fetchDues]);

  const handlePaymentCollected = (result) => {
    fetchDues();
    setFeedbackNotice(
      language === 'bn'
        ? `৳${result.payment?.amount} বকেয়া সফলভাবে আদায় ও খতিয়ানে সংরক্ষণ করা হয়েছে!`
        : `Due payment of ৳${result.payment?.amount} recorded successfully!`
    );
    setTimeout(() => setFeedbackNotice(''), 5000);
  };

  const handleQuickCollectForCustomer = async (item) => {
    try {
      setIsLoading(true);
      const statement = await apiGetCustomerDues(item.customerId);
      const firstUnpaid = statement.unpaidSales?.[0];
      if (firstUnpaid) {
        setSelectedSaleForPayment(firstUnpaid);
      } else {
        setSelectedCustomerIdForStatement(item.customerId);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load unpaid invoice');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t('dues.authRequiredTitle')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm">
          {t('dues.authRequiredText')}
        </p>
        <Button variant="primary" onClick={openAuthModal} className="gap-2">
          <LogIn className="w-4 h-4" />
          {t('auth.loginTitle')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {t('dues.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('dues.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDues}
            disabled={isLoading}
            className="gap-1.5"
            title="Refresh dues"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {feedbackNotice && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice('')}
            className="text-xs font-semibold hover:underline text-emerald-700 dark:text-emerald-400 ml-4"
          >
            {language === 'bn' ? 'মুছে ফেলুন' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Outstanding Due */}
        <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {t('dues.totalDue')}
            </span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              ৳{(summary.totalOutstandingDue || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        {/* Customers with Due */}
        <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {t('dues.customersWithDue')}
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.customersWithDueCount || 0}
            </span>
          </div>
        </Card>

        {/* Unpaid Invoices */}
        <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {t('dues.unpaidVouchers')}
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.totalUnpaidSalesCount || 0}
            </span>
          </div>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('dues.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
          />
        </div>
      </Card>

      {/* Customer Dues Table */}
      <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{t('dues.colCustomer')}</th>
                <th className="py-3 px-4">{t('dues.colPhone')}</th>
                <th className="py-3 px-4 text-center">{t('dues.colUnpaidCount')}</th>
                <th className="py-3 px-4 text-right">{t('dues.colTotalPurchases')}</th>
                <th className="py-3 px-4 text-right">{t('dues.colTotalPaid')}</th>
                <th className="py-3 px-4 text-right">{t('dues.colTotalDue')}</th>
                <th className="py-3 px-4 text-right">{t('dues.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading && dues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'bn' ? 'বাকি খাতা লোড হচ্ছে...' : 'Loading dues ledger...'}</span>
                    </div>
                  </td>
                </tr>
              ) : dues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="max-w-sm mx-auto text-center space-y-3">
                      <div className="inline-flex p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {t('dues.emptyState')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('dues.emptyStateSub')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                dues.map((item) => (
                  <tr
                    key={item.customerId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        {item.customer.name}
                      </div>
                      {item.customer.address && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {item.customer.address}
                        </div>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {item.customer.phone || '—'}
                    </td>

                    {/* Unpaid Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
                        {item.unpaidSalesCount}
                      </span>
                    </td>

                    {/* Total Purchases */}
                    <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      ৳{(item.totalPurchases || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Total Paid */}
                    <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      ৳{(item.totalPaid || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Outstanding Due */}
                    <td className="py-3 px-4 text-right font-black text-amber-600 dark:text-amber-400 text-base">
                      ৳{(item.totalDue || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedCustomerIdForStatement(item.customerId)}
                          className="gap-1 text-xs py-1 px-2.5"
                          title="View customer statement"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('dues.viewStatementBtn')}</span>
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleQuickCollectForCustomer(item)}
                          className="gap-1 text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          title="Collect due payment"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>{t('dues.collectDueBtn')}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Collect Due Modal */}
      <CollectDueModal
        isOpen={Boolean(selectedSaleForPayment)}
        onClose={() => setSelectedSaleForPayment(null)}
        sale={selectedSaleForPayment}
        onPaymentCollected={handlePaymentCollected}
      />

      {/* Customer Statement Modal */}
      <CustomerStatementModal
        isOpen={Boolean(selectedCustomerIdForStatement)}
        onClose={() => setSelectedCustomerIdForStatement(null)}
        customerId={selectedCustomerIdForStatement}
        onOpenCollectModal={(sale) => {
          setSelectedCustomerIdForStatement(null);
          setSelectedSaleForPayment(sale);
        }}
      />
    </div>
  );
}
