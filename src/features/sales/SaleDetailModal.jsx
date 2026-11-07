import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import {
  FileText,
  User,
  Calendar,
  Receipt,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  MapPin,
  Phone,
  Wallet,
  Clock,
  AlertCircle
} from 'lucide-react';
import { apiGetSalePayments } from '../../lib/api.js';

export function SaleDetailModal({ isOpen, onClose, sale, onOpenCollectModal }) {
  const { t, language } = useApp();

  const [payments, setPayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    if (isOpen && sale && (sale._id || sale.id)) {
      if (Array.isArray(sale.payments)) {
        setPayments(sale.payments);
      } else {
        setIsLoadingPayments(true);
        apiGetSalePayments(sale._id || sale.id)
          .then((res) => setPayments(res.payments || []))
          .catch(() => setPayments([]))
          .finally(() => setIsLoadingPayments(false));
      }
    } else {
      setPayments([]);
    }
  }, [isOpen, sale]);

  if (!sale) return null;

  const formattedDate = new Date(sale.saleDate || sale.createdAt).toLocaleString(
    language === 'bn' ? 'bn-BD' : 'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
  );

  const customer = sale.customerSnapshot || {};
  const isWalkIn = !sale.customer && !customer.name;
  const status = sale.paymentStatus || 'paid';
  const remainingDue = typeof sale.dueAmount === 'number'
    ? sale.dueAmount
    : Math.max(0, (sale.grandTotal || 0) - (sale.paidAmount || 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('sales.detailTitle')} size="lg">
      <div className="space-y-6">
        {/* Header Voucher Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                  {sale.saleNumber}
                </span>
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
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-left sm:text-right">
                <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 block">
                  {t('sales.grandTotalLabel')}
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  ৳{(sale.grandTotal || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {remainingDue > 0 && onOpenCollectModal && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenCollectModal(sale);
                  }}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs ml-2"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{t('sales.collectDueBtn')}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            {t('sales.customerInfo')}
          </h4>
          {isWalkIn ? (
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('sales.walkInCustomer')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('customers.colCustomer')}:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{customer.name}</span>
              </div>
              {customer.phone && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('customers.colPhone')}:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('customers.colAddress')}:</span>
                  <span className="text-slate-700 dark:text-slate-300">{customer.address}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Itemised Product Lines */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            {t('sales.itemBreakdown')}
          </h4>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                <tr>
                  <th className="py-2.5 px-3">{t('sales.colProduct')}</th>
                  <th className="py-2.5 px-3">{t('sales.colCode')}</th>
                  <th className="py-2.5 px-3 text-right">{t('sales.colUnitPrice')}</th>
                  <th className="py-2.5 px-3 text-center">{t('sales.colQty')}</th>
                  <th className="py-2.5 px-3 text-right">{t('sales.colLineTotal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(sale.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                      {item.category && item.category !== 'General' && (
                        <span className="ml-2 text-xs text-slate-400">({item.category})</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {item.code || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800 dark:text-slate-200">
                      ৳{(item.unitPrice || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-900 dark:text-slate-100">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      ৳{(item.lineTotal || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial & Payment Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Remarks */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {t('sales.notesLabelDetail')}
            </h5>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic">
              {sale.notes ? sale.notes : t('sales.noNotes')}
            </p>
          </div>

          {/* Payment Status & Balances */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{t('sales.subtotalLabel')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                ৳{(sale.subtotal || sale.grandTotal || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{t('sales.paidAmountLabel')}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ৳{(sale.paidAmount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-bold">
              <span className={remainingDue > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>
                {t('sales.dueAmountLabel')}
              </span>
              <span className={remainingDue > 0 ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-emerald-600 dark:text-emerald-400'}>
                ৳{remainingDue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History / Receipts Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            {t('sales.paymentHistory')}
          </h4>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            {isLoadingPayments ? (
              <div className="py-4 text-center text-xs text-slate-400">Loading receipts...</div>
            ) : payments.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 italic">
                {t('sales.noPaymentsRecorded')}
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
                  {payments.map((p) => (
                    <tr key={p._id || p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {p.paymentNumber}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {new Date(p.paidAt || p.createdAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </td>
                      <td className="py-2 px-3 uppercase text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        {t(`sales.method_${p.paymentMethod}`) || p.paymentMethod}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{(p.amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

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
