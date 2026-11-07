import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Package, Tag, Layers, DollarSign, Archive, AlertCircle, Hash, Scale } from 'lucide-react';
import { apiCreateProduct, apiUpdateProduct } from '../../lib/api.js';

const AVAILABLE_UNITS = [
  'piece',
  'kg',
  'gram',
  'litre',
  'ml',
  'box',
  'packet',
  'dozen',
  'meter',
  'other'
];

export function ProductModal({ isOpen, onClose, product, onProductSaved }) {
  const { t, language } = useApp();

  const isEditing = Boolean(product && product._id);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('piece');
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form when editing or resetting on open
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCode(product.code || '');
      setCategory(product.category || 'General');
      setUnit(product.unit || 'piece');
      setPurchasePrice(String(product.purchasePrice ?? '0'));
      setSellingPrice(String(product.sellingPrice ?? '0'));
      setStockQuantity(String(product.stockQuantity ?? '0'));
      setLowStockThreshold(String(product.lowStockThreshold ?? '5'));
    } else {
      setName('');
      setCode('');
      setCategory('');
      setUnit('piece');
      setPurchasePrice('0');
      setSellingPrice('0');
      setStockQuantity('0');
      setLowStockThreshold('5');
    }
    setErrorMessage('');
  }, [product, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      return setErrorMessage(t('products.nameLabel') + ' ' + (language === 'bn' ? 'প্রয়োজন' : 'is required'));
    }

    const pPrice = Number(purchasePrice);
    const sPrice = Number(sellingPrice);
    const sQty = Number(stockQuantity);
    const lowThresh = Number(lowStockThreshold);

    if (isNaN(pPrice) || pPrice < 0) {
      return setErrorMessage(language === 'bn' ? 'ক্রয়মূল্য শূন্য বা ধনাত্মক সংখ্যা হতে হবে' : 'Purchase price must be >= 0');
    }
    if (isNaN(sPrice) || sPrice < 0) {
      return setErrorMessage(language === 'bn' ? 'বিক্রয়মূল্য শূন্য বা ধনাত্মক সংখ্যা হতে হবে' : 'Selling price must be >= 0');
    }
    if (isNaN(sQty) || sQty < 0) {
      return setErrorMessage(language === 'bn' ? 'স্টক পরিমাণ ঋণাত্মক হতে পারবে না' : 'Stock quantity cannot be negative');
    }
    if (isNaN(lowThresh) || lowThresh < 0) {
      return setErrorMessage(language === 'bn' ? 'স্বল্প স্টক সীমা ঋণাত্মক হতে পারবে না' : 'Low stock threshold cannot be negative');
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category: category.trim() || 'General',
      unit,
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      stockQuantity: sQty,
      lowStockThreshold: lowThresh
    };

    setIsLoading(true);
    try {
      if (isEditing) {
        await apiUpdateProduct(product._id || product.id, payload);
      } else {
        await apiCreateProduct(payload);
      }
      onProductSaved();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error saving product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('products.modalEditTitle') : t('products.modalAddTitle')}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Product Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('products.nameLabel')}
            </label>
            <div className="relative flex items-center">
              <Package className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('products.namePlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* Product Code / SKU */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('products.codeLabel')}
            </label>
            <div className="relative flex items-center">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('products.codePlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('products.categoryLabel')}
            </label>
            <div className="relative flex items-center">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t('products.categoryPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* Unit of Measurement */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('products.unitLabel')}
            </label>
            <div className="relative flex items-center">
              <Scale className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {AVAILABLE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {t(`products.unit_${u}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Purchase Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('products.purchasePriceLabel')}
            </label>
            <div className="relative flex items-center">
              <span className="text-sm font-semibold text-slate-400 absolute left-3 pointer-events-none">৳</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('products.sellingPriceLabel')}
            </label>
            <div className="relative flex items-center">
              <span className="text-sm font-semibold text-slate-400 absolute left-3 pointer-events-none">৳</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* Opening / Current Stock Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('products.stockQuantityLabel')}
            </label>
            <div className="relative flex items-center">
              <Layers className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* Low Stock Alert Threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('products.lowStockThresholdLabel')}
            </label>
            <div className="relative flex items-center">
              <AlertCircle className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {t('products.cancelBtn')}
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
            {isLoading ? t('products.savingBtn') : t('products.saveBtn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
