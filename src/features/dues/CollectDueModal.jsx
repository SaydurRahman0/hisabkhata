import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import {
  Wallet,
  Receipt,
  User,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { apiCollectPayment } from '../../lib/api.js';

export function CollectDueModal({ isOpen, onClose, sale, onPaymentCollected }) {
  const { t, language } = useApp();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const remainingDue = sale
    ? Math.round(Math.max(0, (sale.grandTotal || 0) - (sale.paidAmount || 0)) * 100) / 100
    : 0;

  useEffect(() => {
    if (isOpen && sale) {
      setAmount(String(remainingDue > 0 ? remainingDue : ''));
      setPaymentMethod('cash');
      setNotes('');
      setErrorMessage('');
    }
  }, [isOpen, sale, remainingDue]);

  if (!sale) return null;

  const customerName = sale.customerSnapshot?.name || sale.customer?.name || (language === 'bn' ? 'ক্রেতা' : 'Customer');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return setErrorMessage(
        language === 'bn'
          ? 'আদায়ের পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।'
          : 'Payment amount must be greater than zero.'
      );
    }

    if (numAmount > remainingDue) {
      return setErrorMessage(
        language === 'bn'
          ? `আদায়ের পরিমাণ অবশিষ্ট বকেয়ার (৳${remainingDue.toFixed(2)}) চেয়ে বেশি হতে পারে না।`
          : `Payment amount cannot exceed remaining due (৳${remainingDue.toFixed(2)}).`
      );
    }

    setIsSubmitting(true);
    try {
      const res = await apiCollectPayment(sale._id || sale.id, {
        amount: Math.round(numAmount * 100) / 100,
        paymentMethod,
        notes: notes.trim(),
        idempotencyKey: `pay-${sale._id || sale.id}-${Date.now()}`
      });

      if (onPaymentCollected) {
        onPaymentCollected(res);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to collect payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('dues.modalCollectTitle')} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Voucher & Customer Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              {t('dues.voucherNumber')}:
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {sale.saleNumber}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              {t('dues.customerName')}:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {customerName}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                {t('dues.saleGrandTotal')}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                ৳{(sale.grandTotal || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                {t('dues.salePaidAmount')}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ৳{(sale.paidAmount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold block">
                {t('dues.currentDue')}
              </span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                ৳{remainingDue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('dues.collectAmountLabel')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
              ৳
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              max={remainingDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('dues.collectAmountPlaceholder')}
              disabled={isSubmitting}
              className="w-full pl-8 pr-4 py-2 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>
              {language === 'bn' ? 'সর্বোচ্চ গ্রহণযোগ্য:' : 'Max payable:'} ৳{remainingDue.toFixed(2)}
            </span>
            {Number(amount) !== remainingDue && (
              <button
                type="button"
                onClick={() => setAmount(String(remainingDue))}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                {language === 'bn' ? 'সম্পূর্ণ বকেয়া পরিশোধ' : 'Pay Full Due'}
              </button>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('dues.paymentMethodLabel')}
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="cash">{t('sales.method_cash')}</option>
            <option value="bkash">{t('sales.method_bkash')}</option>
            <option value="nagad">{t('sales.method_nagad')}</option>
            <option value="rocket">{t('sales.method_rocket')}</option>
            <option value="bank_transfer">{t('sales.method_bank_transfer')}</option>
          </select>
        </div>

        {/* Payment Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('dues.paymentNotesLabel')}
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('dues.paymentNotesPlaceholder')}
            maxLength={500}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('dues.cancelBtn')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !amount || Number(amount) <= 0 || Number(amount) > remainingDue}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('dues.processingPayment')}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t('dues.submitPaymentBtn')}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
