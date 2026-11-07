import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { SaleModal } from './SaleModal.jsx';
import { SaleDetailModal } from './SaleDetailModal.jsx';
import { CollectDueModal } from '../dues/CollectDueModal.jsx';
import { apiGetSales, apiGetCustomers } from '../../lib/api.js';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  User,
  Eye,
  Lock,
  LogIn,
  RefreshCw,
  ShoppingBag,
  Wallet,
  Clock,
  AlertCircle
} from 'lucide-react';

export function SalesView() {
  const { t, language, isAuthenticated, openAuthModal } = useApp();

  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({
    totalSalesCount: 0,
    totalRevenue: 0,
    totalCollected: 0,
    totalDue: 0
  });
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'thisWeek' | 'thisMonth'
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // 'all' | 'paid' | 'partial' | 'due'

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);

  const fetchSales = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await apiGetSales({
        search: searchTerm,
        dateFilter: dateFilter,
        customer: selectedCustomer,
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined
      });
      setSales(data.sales || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load sales register');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, searchTerm, dateFilter, selectedCustomer, paymentStatusFilter]);

  // Load customer list for filter
  useEffect(() => {
    if (isAuthenticated) {
      apiGetCustomers({ status: 'active' })
        .then((res) => setCustomers(res.customers || []))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleSaleSaved = (newSale) => {
    fetchSales();
    setFeedbackNotice(
      language === 'bn'
        ? `বিক্রয় ভাউচার ${newSale.saleNumber} সফলভাবে তৈরি ও স্টক সমন্বয় করা হয়েছে!`
        : `Sale voucher ${newSale.saleNumber} created and stock deducted successfully!`
    );
    setTimeout(() => setFeedbackNotice(''), 5000);
  };

  const handlePaymentCollected = (result) => {
    fetchSales();
    setFeedbackNotice(
      language === 'bn'
        ? `ভাউচার ${result.sale?.saleNumber} এর জন্য ৳${result.payment?.amount} বকেয়া আদায় সফল হয়েছে!`
        : `Due payment of ৳${result.payment?.amount} for ${result.sale?.saleNumber} recorded successfully!`
    );
    setTimeout(() => setFeedbackNotice(''), 5000);
  };

  const handleOpenDetail = (sale) => {
    setSelectedSaleDetail(sale);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t('sales.authRequiredTitle')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm">
          {t('sales.authRequiredText')}
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
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {t('sales.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('sales.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchSales}
            disabled={isLoading}
            className="gap-1.5"
            title="Refresh sales list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t('sales.newSaleBtn')}
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

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Vouchers */}
        <Card className="p-4 flex items-center gap-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {t('sales.totalSales')}
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {summary.totalSalesCount ?? 0}
            </span>
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="p-4 flex items-center gap-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {t('sales.totalRevenue')}
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              ৳{(summary.totalRevenue || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        {/* Cash Collected */}
        <Card className="p-4 flex items-center gap-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {t('sales.cashReceived')}
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              ৳{(summary.totalCollected ?? summary.cashReceived ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        {/* Total Outstanding Due */}
        <Card className="p-4 flex items-center gap-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {t('dues.totalDue')}
            </span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
              ৳{(summary.totalDue || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('sales.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Payment Status Filter */}
          <div className="md:col-span-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            >
              <option value="all">{t('sales.filterAllPayments')}</option>
              <option value="paid">{t('sales.filterPaid')}</option>
              <option value="partial">{t('sales.filterPartial')}</option>
              <option value="due">{t('sales.filterDue')}</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="md:col-span-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            >
              <option value="all">{t('sales.allDates')}</option>
              <option value="today">{t('sales.today')}</option>
              <option value="thisWeek">{t('sales.thisWeek')}</option>
              <option value="thisMonth">{t('sales.thisMonth')}</option>
            </select>
          </div>

          {/* Customer Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            >
              <option value="all">
                {language === 'bn' ? 'সকল ক্রেতা / সাধারণ' : 'All Customers'}
              </option>
              <option value="walk-in">
                {language === 'bn' ? 'শুধুমাত্র ওয়াক-ইন ক্রেতা' : 'Walk-in Customers Only'}
              </option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Sales Table / List */}
      <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{t('sales.colInvoice')}</th>
                <th className="py-3 px-4">{t('sales.colDate')}</th>
                <th className="py-3 px-4">{t('sales.colCustomer')}</th>
                <th className="py-3 px-4">{t('sales.colItems')}</th>
                <th className="py-3 px-4 text-right">{t('sales.colTotal')}</th>
                <th className="py-3 px-4 text-right">{t('sales.colPaid')} / {t('sales.colDue')}</th>
                <th className="py-3 px-4 text-center">{t('sales.colPayment')}</th>
                <th className="py-3 px-4 text-right">{t('sales.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading && sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'bn' ? 'বিক্রয় তালিকা লোড হচ্ছে...' : 'Loading sales records...'}</span>
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="max-w-sm mx-auto text-center space-y-3">
                      <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {t('sales.emptyState')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('sales.emptyStateSub')}
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        {t('sales.newSaleBtn')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const customer = sale.customerSnapshot || {};
                  const isWalkIn = !sale.customer && !customer.name;
                  const formattedDate = new Date(sale.saleDate || sale.createdAt).toLocaleString(
                    language === 'bn' ? 'bn-BD' : 'en-US',
                    {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }
                  );

                  // Items summary
                  const totalItemLines = sale.items?.length || 0;
                  const totalUnits = (sale.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
                  const status = sale.paymentStatus || 'paid';
                  const remainingDue = typeof sale.dueAmount === 'number'
                    ? sale.dueAmount
                    : Math.max(0, (sale.grandTotal || 0) - (sale.paidAmount || 0));

                  return (
                    <tr
                      key={sale._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Voucher # */}
                      <td className="py-3 px-4 font-mono font-medium text-emerald-700 dark:text-emerald-400">
                        {sale.saleNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        {isWalkIn ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {t('sales.walkInCustomer')}
                          </span>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                              {customer.name}
                            </div>
                            {customer.phone && (
                              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {totalItemLines} {language === 'bn' ? 'টি পণ্য' : 'item lines'}
                        </span>{' '}
                        ({totalUnits} {language === 'bn' ? 'একক' : 'units'})
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        ৳{(sale.grandTotal || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Paid & Due Breakdown */}
                      <td className="py-3 px-4 text-right text-xs">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ৳{(sale.paidAmount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {remainingDue > 0 && (
                          <div className="font-bold text-amber-600 dark:text-amber-400">
                            ৳{remainingDue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : status === 'partial'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                          {status === 'partial' && <Clock className="w-3 h-3" />}
                          {status === 'due' && <AlertCircle className="w-3 h-3" />}
                          {t(`sales.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenDetail(sale)}
                            className="gap-1 text-xs py-1 px-2.5"
                            title="View sale voucher details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('sales.viewDetailsBtn')}</span>
                          </Button>
                          {remainingDue > 0 && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setSelectedSaleForPayment(sale)}
                              className="gap-1 text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                              title="Collect due payment"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span>{t('sales.collectDueBtn')}</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <SaleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaleSaved={handleSaleSaved}
      />

      <SaleDetailModal
        isOpen={Boolean(selectedSaleDetail)}
        onClose={() => setSelectedSaleDetail(null)}
        sale={selectedSaleDetail}
        onOpenCollectModal={(sale) => setSelectedSaleForPayment(sale)}
      />

      <CollectDueModal
        isOpen={Boolean(selectedSaleForPayment)}
        onClose={() => setSelectedSaleForPayment(null)}
        sale={selectedSaleForPayment}
        onPaymentCollected={handlePaymentCollected}
      />
    </div>
  );
}
