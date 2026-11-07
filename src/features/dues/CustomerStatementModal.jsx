import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import {
  FileText,
  User,
  Phone,
  MapPin,
  Receipt,
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { apiGetCustomerDues } from '../../lib/api.js';

export function CustomerStatementModal({ isOpen, onClose, customerId, onOpenCollectModal }) {
  const { t, language } = useApp();

  const [statementData, setStatementData] = useState(null);
  const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid' | 'payments' | 'all'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchStatement = async () => {
    if (!customerId) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await apiGetCustomerDues(customerId);
      setStatementData(data);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load customer statement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customerId) {
      setActiveTab('unpaid');
      fetchStatement();
    } else {
      setStatementData(null);
    }
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const customer = statementData?.customer || {};
  const summary = statementData?.summary || { totalPurchases: 0, totalPaid: 0, totalDue: 0 };
  const unpaidSales = statementData?.unpaidSales || [];
  const payments = statementData?.payments || [];
  const allSales = statementData?.allSales || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('dues.statementTitle')} size="lg">
      <div className="space-y-5">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Customer Header Info */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {customer.name || 'Customer'}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {customer.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5" />
                    {customer.phone}
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {customer.address}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchStatement}
              disabled={isLoading}
              className="self-start sm:self-auto gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </Button>
          </div>

          {/* 3 Metrics Cards */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                {t('dues.colTotalPurchases')}
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                ৳{(summary.totalPurchases || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                {t('dues.colTotalPaid')}
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ৳{(summary.totalPaid || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                {t('dues.colTotalDue')}
              </span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                ৳{(summary.totalDue || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('unpaid')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'unpaid'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('dues.unpaidInvoicesTab')} ({unpaidSales.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('dues.paymentLedgerTab')} ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('dues.allInvoicesTab')} ({allSales.length})
          </button>
        </div>

        {/* Tab Content */}
        {isLoading && !statementData ? (
          <div className="py-12 text-center text-slate-500">
            <div className="inline-flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>{language === 'bn' ? 'খতিয়ান লোড হচ্ছে...' : 'Loading statement...'}</span>
            </div>
          </div>
        ) : activeTab === 'unpaid' ? (
          /* Unpaid Sales Table */
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            {unpaidSales.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                {t('dues.noUnpaidInvoices')}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  <tr>
                    <th className="py-2 px-3">{t('sales.colInvoice')}</th>
                    <th className="py-2 px-3">{t('sales.colDate')}</th>
                    <th className="py-2 px-3 text-right">{t('sales.colTotal')}</th>
                    <th className="py-2 px-3 text-right">{t('sales.colPaid')}</th>
                    <th className="py-2 px-3 text-right">{t('sales.colDue')}</th>
                    <th className="py-2 px-3 text-right">{t('sales.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {unpaidSales.map((sale) => {
                    const formattedDate = new Date(sale.saleDate).toLocaleDateString(
                      language === 'bn' ? 'bn-BD' : 'en-US'
                    );
                    const dueAmt = typeof sale.dueAmount === 'number'
                      ? sale.dueAmount
                      : Math.max(0, (sale.grandTotal || 0) - (sale.paidAmount || 0));

                    return (
                      <tr key={sale._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                          {sale.saleNumber}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{formattedDate}</td>
                        <td className="py-2 px-3 text-right font-medium">৳{sale.grandTotal}</td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-medium">৳{sale.paidAmount}</td>
                        <td className="py-2 px-3 text-right font-bold text-amber-600 dark:text-amber-400">৳{dueAmt}</td>
                        <td className="py-2 px-3 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              if (onOpenCollectModal) {
                                onOpenCollectModal(sale);
                              }
                            }}
                            className="text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                          >
                            {t('dues.collectDueBtn')}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : activeTab === 'payments' ? (
          /* Payment Ledger Table */
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            {payments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                {t('dues.noPayments')}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  <tr>
                    <th className="py-2 px-3">{t('dues.colReceiptNo')}</th>
                    <th className="py-2 px-3">{t('dues.colPaidAt')}</th>
                    <th className="py-2 px-3">{t('dues.colMethod')}</th>
                    <th className="py-2 px-3 text-right">{t('dues.colAmount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {payments.map((p) => {
                    const formattedDate = new Date(p.paidAt || p.createdAt).toLocaleString(
                      language === 'bn' ? 'bn-BD' : 'en-US',
                      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    );
                    const methodKey = `sales.method_${p.paymentMethod}`;

                    return (
                      <tr key={p._id || p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                          {p.paymentNumber}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{formattedDate}</td>
                        <td className="py-2 px-3 uppercase text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {t(methodKey) || p.paymentMethod}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ৳{(p.amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* All Sales Table */
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-300 uppercase">
                <tr>
                  <th className="py-2 px-3">{t('sales.colInvoice')}</th>
                  <th className="py-2 px-3">{t('sales.colDate')}</th>
                  <th className="py-2 px-3 text-right">{t('sales.colTotal')}</th>
                  <th className="py-2 px-3 text-right">{t('sales.colPaid')}</th>
                  <th className="py-2 px-3 text-center">{t('sales.paymentStatusLabel')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {allSales.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {s.saleNumber}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {new Date(s.saleDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">৳{s.grandTotal}</td>
                    <td className="py-2 px-3 text-right text-emerald-600 font-medium">৳{s.paidAmount}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : s.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                        }`}
                      >
                        {t(`sales.status${s.paymentStatus.charAt(0).toUpperCase() + s.paymentStatus.slice(1)}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
