import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import {
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  User,
  Package,
  DollarSign,
  FileText,
  CreditCard,
  Wallet
} from 'lucide-react';
import { apiGetProducts, apiGetCustomers, apiCreateSale } from '../../lib/api.js';

export function SaleModal({ isOpen, onClose, onSaleSaved }) {
  const { t, language } = useApp();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState([
    { productId: '', quantity: 1 }
  ]);
  
  // Phase 06 Payment State
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' | 'credit' | 'partial'
  const [initialPayment, setInitialPayment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch active products and customers when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingCatalog(true);
    setErrorMessage('');
    setSelectedCustomerId('');
    setItems([{ productId: '', quantity: 1 }]);
    setPaymentType('cash');
    setInitialPayment('');
    setPaymentMethod('cash');
    setNotes('');

    Promise.all([
      apiGetProducts({ status: 'active' }),
      apiGetCustomers({ status: 'active' })
    ])
      .then(([productsRes, customersRes]) => {
        if (!isMounted) return;
        setProducts(productsRes.products || []);
        setCustomers(customersRes.customers || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Failed to load catalogue');
      })
      .finally(() => {
        if (isMounted) setIsLoadingCatalog(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Product map for quick lookup
  const productMap = React.useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p._id, p));
    return map;
  }, [products]);

  // Handle item change
  const handleItemProductChange = (index, prodId) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: prodId,
      quantity: 1
    };
    setItems(newItems);
  };

  const handleItemQuantityChange = (index, qty) => {
    const newItems = [...items];
    const val = Number(qty);
    newItems[index] = {
      ...newItems[index],
      quantity: isNaN(val) ? 0 : val
    };
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      setItems([{ productId: '', quantity: 1 }]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedItems = items.map((it) => {
    const prod = productMap.get(it.productId);
    const unitPrice = prod ? Number(prod.sellingPrice || 0) : 0;
    const stockQuantity = prod ? Number(prod.stockQuantity || 0) : 0;
    const lineTotal = unitPrice * (it.quantity || 0);
    const isOutOfStock = prod && it.quantity > stockQuantity;
    return {
      ...it,
      product: prod,
      unitPrice,
      stockQuantity,
      lineTotal,
      isOutOfStock
    };
  });

  const grandTotal = Math.round(calculatedItems.reduce((acc, it) => acc + it.lineTotal, 0) * 100) / 100;
  const hasOutOfStock = calculatedItems.some((it) => it.isOutOfStock);

  // Financial calculations for paidNow & remainingDue
  let calculatedPaidNow = 0;
  if (paymentType === 'cash') {
    calculatedPaidNow = grandTotal;
  } else if (paymentType === 'credit') {
    calculatedPaidNow = 0;
  } else if (paymentType === 'partial') {
    const numInit = Number(initialPayment);
    calculatedPaidNow = isNaN(numInit) ? 0 : Math.max(0, Math.min(grandTotal, numInit));
  }

  const calculatedRemainingDue = Math.round(Math.max(0, grandTotal - calculatedPaidNow) * 100) / 100;
  const isCustomerRequired = calculatedRemainingDue > 0 || paymentType === 'credit' || paymentType === 'partial';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Filter valid items
    const validLines = items.filter((it) => it.productId && it.quantity > 0);

    if (validLines.length === 0) {
      return setErrorMessage(t('sales.noItemsAlert'));
    }

    if (hasOutOfStock) {
      return setErrorMessage(
        language === 'bn'
          ? 'নির্বাচিত পণ্যের স্টক অপর্যাপ্ত। অনুগ্রহ করে পরিমাণ কমান।'
          : 'Selected quantity exceeds available stock for one or more items.'
      );
    }

    // Require registered customer if any balance remains due
    if (isCustomerRequired && !selectedCustomerId) {
      return setErrorMessage(t('sales.customerRequiredForCredit'));
    }

    if (paymentType === 'partial') {
      const numInit = Number(initialPayment);
      if (isNaN(numInit) || numInit < 0) {
        return setErrorMessage(
          language === 'bn'
            ? 'এখন জমার পরিমাণ সঠিক ও অঋণাত্মক হতে হবে।'
            : 'Paid now amount must be a valid non-negative number.'
        );
      }
      if (numInit > grandTotal) {
        return setErrorMessage(
          language === 'bn'
            ? `এখন জমার পরিমাণ সর্বমোট মূল্যের (৳${grandTotal}) চেয়ে বেশি হতে পারবে না।`
            : `Paid now amount cannot exceed grand total (৳${grandTotal}).`
        );
      }
    }

    const payload = {
      customerId: selectedCustomerId || null,
      items: validLines.map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity)
      })),
      paymentType,
      initialPayment: paymentType === 'cash' ? grandTotal : (paymentType === 'credit' ? 0 : Number(initialPayment)),
      paymentMethod,
      notes: notes.trim(),
      idempotencyKey: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    setIsSubmitting(true);
    try {
      const res = await apiCreateSale(payload);
      if (onSaleSaved) {
        onSaleSaved(res.sale);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('sales.modalTitle')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer Selection */}
        <div className={`p-4 rounded-xl border transition-colors ${
          isCustomerRequired && !selectedCustomerId
            ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
            : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40'
        } space-y-2`}>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t('sales.selectCustomer')}
              {isCustomerRequired && <span className="text-red-500">*</span>}
            </label>
            {isCustomerRequired && (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                {language === 'bn' ? 'বাকিতে ক্রেতা আবশ্যক' : 'Customer required for dues'}
              </span>
            )}
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            disabled={isLoadingCatalog || isSubmitting}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
          >
            <option value="">{t('sales.walkInCustomer')}</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} — {c.phone} {c.address ? `(${c.address})` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {selectedCustomerId
              ? (language === 'bn' ? 'ক্রেতার নাম বিক্রয় ভাউচারে সংযুক্ত থাকবে।' : 'Customer will be linked and recorded on voucher.')
              : (language === 'bn' ? 'নগদ বিক্রয়ের ক্ষেত্রে সাধারণ ক্রেতা হিসেবে রেকর্ড হবে।' : 'Walk-in cash customer (no customer account required).')}
          </p>
        </div>

        {/* Product Lines Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t('sales.itemBreakdown')}
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddItem}
              disabled={isLoadingCatalog || isSubmitting}
              className="gap-1.5 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('sales.addItemBtn')}
            </Button>
          </div>

          <div className="space-y-2.5">
            {calculatedItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border transition-all ${
                  item.isOutOfStock
                    ? 'border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="grid grid-cols-12 gap-2.5 items-center">
                  {/* Product Picker */}
                  <div className="col-span-12 sm:col-span-5">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemProductChange(idx, e.target.value)}
                      disabled={isLoadingCatalog || isSubmitting}
                      className="w-full px-2.5 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">{t('sales.selectProductPlaceholder')}</option>
                      {products.map((p) => (
                        <option
                          key={p._id}
                          value={p._id}
                          disabled={p.stockQuantity <= 0}
                        >
                          {p.name} {p.code ? `[${p.code}]` : ''} — ৳{p.sellingPrice} (Stock: {p.stockQuantity} {p.unit})
                        </option>
                      ))}
                    </select>
                    {item.product && (
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          {t('sales.availableStock')}{' '}
                          <strong className={item.stockQuantity <= (item.product.lowStockThreshold || 5) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}>
                            {item.stockQuantity} {item.product.unit}
                          </strong>
                        </span>
                        {item.isOutOfStock && (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {t('sales.outOfStockNotice')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min="0.001"
                      step="any"
                      placeholder={t('sales.qtyLabel')}
                      value={item.quantity || ''}
                      onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                      disabled={!item.productId || isSubmitting}
                      className={`w-full px-2 py-1.5 text-sm text-center rounded border ${
                        item.isOutOfStock
                          ? 'border-red-400 text-red-600 bg-red-50 dark:bg-red-950/40'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                      } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t('sales.priceLabel')}</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      ৳{item.unitPrice.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t('sales.totalLabel')}</div>
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      ৳{item.lineTotal.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="col-span-2 sm:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={isSubmitting || items.length === 1}
                      title="Remove item"
                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 06: Payment Type Selection & Breakdown */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {t('sales.paymentTypeLabel')}
          </label>

          {/* 3 Payment Type Radios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setPaymentType('cash');
                setInitialPayment('');
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                paymentType === 'cash'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="font-semibold text-xs">{t('sales.paymentTypeCash')}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn' ? 'সম্পূর্ণ টাকা নগদ গ্রহণ' : '100% paid immediately'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentType('partial');
                if (!initialPayment) setInitialPayment(String(Math.round(grandTotal * 0.5 * 100) / 100));
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                paymentType === 'partial'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="font-semibold text-xs">{t('sales.paymentTypePartial')}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn' ? 'কিছু জমা + বাকি' : 'Deposit + remaining due'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentType('credit');
                setInitialPayment('0');
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                paymentType === 'credit'
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="font-semibold text-xs">{t('sales.paymentTypeCredit')}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn' ? 'পুরোটাই বকেয়া থাকবে' : 'Full amount outstanding'}
              </div>
            </button>
          </div>

          {/* Conditional Input for Partial Payment */}
          {paymentType === 'partial' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('sales.initialPaymentLabel')}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={grandTotal}
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(e.target.value)}
                    placeholder="0"
                    disabled={isSubmitting}
                    className="w-full pl-7 pr-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('dues.paymentMethodLabel')}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">{t('sales.method_cash')}</option>
                  <option value="bkash">{t('sales.method_bkash')}</option>
                  <option value="nagad">{t('sales.method_nagad')}</option>
                  <option value="rocket">{t('sales.method_rocket')}</option>
                  <option value="bank_transfer">{t('sales.method_bank_transfer')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Payment Method selector for cash full payment */}
          {paymentType === 'cash' && (
            <div className="sm:w-1/2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('dues.paymentMethodLabel')}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="cash">{t('sales.method_cash')}</option>
                <option value="bkash">{t('sales.method_bkash')}</option>
                <option value="nagad">{t('sales.method_nagad')}</option>
                <option value="rocket">{t('sales.method_rocket')}</option>
                <option value="bank_transfer">{t('sales.method_bank_transfer')}</option>
              </select>
            </div>
          )}
        </div>

        {/* Grand Total & Summary Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block">
                {t('sales.grandTotal')}
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                ৳{grandTotal.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block">
                {t('sales.initialPaymentLabel')}
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ৳{calculatedPaidNow.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-400 block">
                {t('sales.remainingDueLabel')}
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                ৳{calculatedRemainingDue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('sales.notesLabel')}
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            placeholder={t('sales.notesPlaceholder')}
            maxLength={500}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('sales.cancelBtn')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || hasOutOfStock || grandTotal <= 0 || (isCustomerRequired && !selectedCustomerId)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('sales.submittingSale')}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t('sales.submitSaleBtn')}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
