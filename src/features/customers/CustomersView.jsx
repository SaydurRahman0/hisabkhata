import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { CustomerModal } from './CustomerModal.jsx';
import { CustomerDetailModal } from './CustomerDetailModal.jsx';
import { apiGetCustomers, apiArchiveCustomer } from '../../lib/api.js';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  MapPin,
  Archive,
  RotateCcw,
  Edit2,
  Lock,
  LogIn,
  CheckCircle2,
  RefreshCw,
  Eye,
  ShieldCheck
} from 'lucide-react';

export function CustomersView() {
  const { t, language, isAuthenticated, openAuthModal } = useApp();

  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({ totalCustomers: 0, activeCount: 0, archivedCount: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'archived' | 'all'

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [detailCustomerId, setDetailCustomerId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await apiGetCustomers({
        search: searchTerm,
        status: statusFilter
      });
      setCustomers(data.customers || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to fetch customer list');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, searchTerm, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Clear notice after 4 seconds
  useEffect(() => {
    if (feedbackNotice) {
      const timer = setTimeout(() => setFeedbackNotice(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackNotice]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (customerId) => {
    setDetailCustomerId(customerId);
    setIsDetailModalOpen(true);
  };

  const handleCustomerSaved = (savedCustomer, isEditing) => {
    setFeedbackNotice(
      isEditing
        ? language === 'bn'
          ? `"${savedCustomer.name}" এর তথ্য সফলভাবে আপডেট করা হয়েছে।`
          : `Customer "${savedCustomer.name}" updated successfully.`
        : language === 'bn'
          ? `"${savedCustomer.name}" গ্রাহক সফলভাবে নিবন্ধিত হয়েছে।`
          : `Customer "${savedCustomer.name}" registered successfully.`
    );
    fetchCustomers();
  };

  const handleToggleArchive = async (customer) => {
    const isArchiving = !customer.isArchived;
    const confirmPrompt = isArchiving
      ? t('customers.confirmArchive')
      : t('customers.confirmRestore');

    if (!window.confirm(confirmPrompt)) return;

    try {
      const customerId = customer._id || customer.id;
      await apiArchiveCustomer(customerId, isArchiving);
      setFeedbackNotice(
        isArchiving
          ? language === 'bn'
            ? `"${customer.name}" কে আর্কাইভ করা হয়েছে।`
            : `Customer "${customer.name}" archived.`
          : language === 'bn'
            ? `"${customer.name}" পুনরায় সক্রিয় করা হয়েছে।`
            : `Customer "${customer.name}" restored.`
      );
      fetchCustomers();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('customers.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('customers.subtitle')}
            </p>
          </div>
        </div>

        <Card className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {t('customers.authRequiredTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t('customers.authRequiredText')}
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
              {t('customers.title')}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-semibold">
              Phase 04B
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('customers.subtitle')}
          </p>
        </div>

        <Button variant="primary" size="md" icon={UserPlus} onClick={handleOpenAdd}>
          {t('customers.addCustomerBtn')}
        </Button>
      </div>

      {/* 2. Customer Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('customers.totalCustomers')}
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {summary.totalCustomers}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('customers.activeCustomers')}
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {summary.activeCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('customers.archivedCustomers')}
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {summary.archivedCount}
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Success / Feedback Banner */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* 4. Search & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('customers.searchPlaceholder')}
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('customers.filterActive')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'archived'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('customers.filterArchived')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('customers.filterAll')}
            </button>
          </div>
        </div>
      </Card>

      {/* 5. Customer Table & Cards */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-xs">{t('common.loading') || 'Loading customers...'}</p>
          </div>
        ) : errorMessage ? (
          <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400">
            {errorMessage}
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t('customers.emptyState')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {t('customers.emptyStateSub')}
            </p>
            <div className="mt-4">
              <Button variant="primary" size="sm" icon={UserPlus} onClick={handleOpenAdd}>
                {t('customers.addCustomerBtn')}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-5 py-3">
                      {t('customers.colCustomer')}
                    </th>
                    <th scope="col" className="px-5 py-3">
                      {t('customers.colPhone')}
                    </th>
                    <th scope="col" className="px-5 py-3">
                      {t('customers.colAddress')}
                    </th>
                    <th scope="col" className="px-5 py-3">
                      {t('customers.colStatus')}
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      {t('customers.colActions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {customers.map((c) => {
                    const customerId = c._id || c.id;
                    return (
                      <tr
                        key={customerId}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          c.isArchived ? 'opacity-60 bg-slate-50/30 dark:bg-slate-900/30' : ''
                        }`}
                      >
                        {/* Name */}
                        <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(customerId)}
                            className="flex items-center gap-2.5 text-left group cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-100 transition-colors">
                              {c.name?.charAt(0) || 'C'}
                            </div>
                            <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-semibold transition-colors">
                              {c.name}
                            </span>
                          </button>
                        </td>

                        {/* Phone */}
                        <td className="px-5 py-3.5 font-mono text-slate-800 dark:text-slate-200">
                          <a
                            href={`tel:${c.phone}`}
                            className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {c.phone}
                          </a>
                        </td>

                        {/* Address */}
                        <td className="px-5 py-3.5 max-w-xs truncate text-slate-600 dark:text-slate-300">
                          {c.address ? (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{c.address}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              c.isArchived
                                ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            }`}
                          >
                            {c.isArchived ? t('customers.statusArchived') : t('customers.statusActive')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(customerId)}
                            title={t('customers.viewDetailsBtn')}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            title={t('customers.edit')}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleArchive(c)}
                            title={c.isArchived ? t('customers.restore') : t('customers.archive')}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            {c.isArchived ? (
                              <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Grid View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {customers.map((c) => {
                const customerId = c._id || c.id;
                return (
                  <div
                    key={customerId}
                    className={`p-4 space-y-3 ${
                      c.isArchived ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(customerId)}
                        className="text-left font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {c.name}
                      </button>
                      <span
                        className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          c.isArchived
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                        }`}
                      >
                        {c.isArchived ? t('customers.statusArchived') : t('customers.statusActive')}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${c.phone}`} className="hover:underline">
                          {c.phone}
                        </a>
                      </div>
                      {c.address && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleOpenDetail(customerId)}
                      >
                        {t('customers.viewDetailsBtn')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() => handleOpenEdit(c)}
                      >
                        {t('customers.edit')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={c.isArchived ? RotateCcw : Archive}
                        onClick={() => handleToggleArchive(c)}
                      >
                        {c.isArchived ? t('customers.restore') : t('customers.archive')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Add / Edit Form Modal */}
      <CustomerModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        customer={editingCustomer}
        onCustomerSaved={handleCustomerSaved}
      />

      {/* Full Details Modal */}
      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        customerId={detailCustomerId}
        onEdit={handleOpenEdit}
        onArchiveToggle={handleToggleArchive}
      />
    </div>
  );
}
