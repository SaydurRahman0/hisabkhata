import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ProductModal } from './ProductModal.jsx';
import { apiGetProducts, apiArchiveProduct } from '../../lib/api.js';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Archive,
  RotateCcw,
  Edit2,
  DollarSign,
  Layers,
  Lock,
  LogIn,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export function ProductsView() {
  const { t, language, isAuthenticated, openAuthModal } = useApp();

  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, lowStockCount: 0, totalStockValue: 0 });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'archived' | 'all'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await apiGetProducts({
        search: searchTerm,
        category: selectedCategory,
        status: statusFilter
      });
      setProducts(data.products || []);
      if (data.summary) {
        setSummary(data.summary);
      }

      // Extract unique categories for filter
      const uniqueCats = Array.from(
        new Set(
          (data.products || [])
            .map((p) => p.category)
            .filter((c) => c && c.trim())
        )
      );
      setCategories(uniqueCats);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, searchTerm, selectedCategory, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleArchiveToggle = async (prod) => {
    const isCurrentlyArchived = prod.isArchived;
    const confirmMsg = isCurrentlyArchived
      ? t('products.confirmRestore')
      : t('products.confirmArchive');

    if (!window.confirm(confirmMsg)) return;

    try {
      await apiArchiveProduct(prod._id || prod.id, !isCurrentlyArchived);
      setFeedbackNotice(
        isCurrentlyArchived
          ? language === 'bn' ? 'পণ্য সফলভাবে পুনঃসক্রিয় করা হয়েছে' : 'Product restored'
          : language === 'bn' ? 'পণ্য সফলভাবে আর্কাইভ করা হয়েছে' : 'Product archived'
      );
      setTimeout(() => setFeedbackNotice(''), 3000);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const formatBDT = (amount) => {
    return `৳${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // If user is not logged in: display secure login invitation
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('products.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('products.subtitle')}
            </p>
          </div>
        </div>

        <Card className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {t('products.authRequiredTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t('products.authRequiredText')}
          </p>
          <div className="pt-2">
            <Button variant="primary" size="md" icon={LogIn} onClick={openAuthModal}>
              {t('header.loginBtn')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('products.title')}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-semibold">
              Phase 04A
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('products.subtitle')}
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={handleOpenAdd}>
          {t('products.addProductBtn')}
        </Button>
      </div>

      {/* 2. Inventory KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('products.totalProducts')}
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {summary.totalProducts}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            summary.lowStockCount > 0
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('products.lowStockAlerts')}
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {summary.lowStockCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('products.totalInventoryValue')}
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
              {formatBDT(summary.totalStockValue)}
            </p>
          </div>
        </Card>
      </div>

      {/* Notification Toast */}
      {feedbackNotice && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 rounded-lg text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-700 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* 3. Filter & Search Controls */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('products.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="all">{t('products.allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Status Tabs */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('products.filterActive')}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('archived')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  statusFilter === 'archived'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('products.filterArchived')}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('products.filterAll')}
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchProducts}
              disabled={isLoading}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4. Products Table View */}
        <div className="overflow-x-auto pt-2">
          {products.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t('products.emptyState')}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                {t('products.emptyStateSub')}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">{t('products.colProduct')}</th>
                  <th className="py-2.5 px-3">{t('products.colCategory')}</th>
                  <th className="py-2.5 px-3">{t('products.colUnit')}</th>
                  <th className="py-2.5 px-3 text-right">{t('products.colPurchasePrice')}</th>
                  <th className="py-2.5 px-3 text-right">{t('products.colSellingPrice')}</th>
                  <th className="py-2.5 px-3 text-right">{t('products.colStock')}</th>
                  <th className="py-2.5 px-3 text-center">{t('products.colStatus')}</th>
                  <th className="py-2.5 px-3 text-right">{t('products.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {products.map((prod) => {
                  const isLow = prod.stockQuantity <= prod.lowStockThreshold;
                  const isOut = prod.stockQuantity <= 0;

                  return (
                    <tr
                      key={prod._id || prod.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        prod.isArchived ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/30' : ''
                      }`}
                    >
                      {/* Product Name & Code */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {prod.name}
                        </div>
                        {prod.code ? (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {prod.code}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No code</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {prod.category || 'General'}
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {t(`products.unit_${prod.unit}`) || prod.unit}
                      </td>

                      {/* Purchase Price */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {formatBDT(prod.purchasePrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {formatBDT(prod.sellingPrice)}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {prod.stockQuantity}{' '}
                        <span className="text-[10px] font-normal text-slate-500">
                          {prod.unit}
                        </span>
                      </td>

                      {/* Status Badges */}
                      <td className="py-3 px-3 text-center">
                        {prod.isArchived ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Archive className="w-3 h-3" />
                            {t('products.statusArchived')}
                          </span>
                        ) : isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            {t('products.statusOutOfStock')}
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            <AlertTriangle className="w-3 h-3" />
                            {t('products.statusLowStock')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {t('products.statusInStock')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={t('products.edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchiveToggle(prod)}
                            className="p-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={prod.isArchived ? t('products.restore') : t('products.archive')}
                          >
                            {prod.isArchived ? (
                              <RotateCcw className="w-3.5 h-3.5" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onProductSaved={() => {
          fetchProducts();
          setFeedbackNotice(
            editingProduct
              ? language === 'bn' ? 'পণ্য সফলভাবে হালনাগাদ করা হয়েছে' : 'Product updated'
              : language === 'bn' ? 'নতুন পণ্য সফলভাবে যুক্ত করা হয়েছে' : 'Product created'
          );
          setTimeout(() => setFeedbackNotice(''), 3000);
        }}
      />
    </div>
  );
}
