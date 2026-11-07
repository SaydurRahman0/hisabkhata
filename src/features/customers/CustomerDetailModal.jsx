import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import {
  User,
  Phone,
  MapPin,
  ShieldCheck,
  FileText,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Edit2,
  Archive,
  RotateCcw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { apiGetCustomer } from '../../lib/api.js';

export function CustomerDetailModal({
  isOpen,
  onClose,
  customerId,
  onEdit,
  onArchiveToggle
}) {
  const { t, language } = useApp();

  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showNid, setShowNid] = useState(false);

  useEffect(() => {
    if (!isOpen || !customerId) {
      setCustomer(null);
      setErrorMessage('');
      setShowNid(false);
      return;
    }

    let mounted = true;
    async function loadCustomerDetail() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await apiGetCustomer(customerId);
        if (mounted) {
          setCustomer(data.customer);
        }
      } catch (err) {
        if (mounted) {
          setErrorMessage(err.message || 'Failed to load customer profile');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadCustomerDetail();

    return () => {
      mounted = false;
    };
  }, [isOpen, customerId]);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const maskNid = (val) => {
    if (!val) return t('customers.nidNotProvided');
    if (showNid) return val;
    if (val.length <= 4) return '••••';
    return val.slice(0, 4) + '•'.repeat(Math.max(4, val.length - 8)) + val.slice(-4);
  };

  const footer = (
    <div className="flex items-center justify-between w-full">
      {customer && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => {
              onClose();
              if (onEdit) onEdit(customer);
            }}
          >
            {t('customers.edit')}
          </Button>
          <Button
            type="button"
            variant={customer.isArchived ? 'outline' : 'ghost'}
            size="sm"
            icon={customer.isArchived ? RotateCcw : Archive}
            className={customer.isArchived ? 'text-indigo-600' : 'text-slate-500 hover:text-amber-600'}
            onClick={() => {
              onClose();
              if (onArchiveToggle) onArchiveToggle(customer);
            }}
          >
            {customer.isArchived ? t('customers.restore') : t('customers.archive')}
          </Button>
        </div>
      )}
      <Button type="button" variant="primary" size="md" onClick={onClose} className="ml-auto">
        {t('customers.cancelBtn')}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('customers.detailTitle')}
      footer={footer}
      maxWidth="max-w-xl"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-xs">{t('common.loading') || 'Loading customer details...'}</p>
        </div>
      ) : errorMessage ? (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      ) : customer ? (
        <div className="space-y-4">
          {/* Header Card with Name & Phone */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-base">
                {customer.name?.charAt(0) || <User className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {customer.name}
                </h3>
                <a
                  href={`tel:${customer.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {customer.phone}
                </a>
              </div>
            </div>

            <span
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                customer.isArchived
                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
              }`}
            >
              {customer.isArchived ? t('customers.statusArchived') : t('customers.statusActive')}
            </span>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Address */}
            <div className="p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {t('customers.addressLabel')}
              </span>
              <p className="text-slate-800 dark:text-slate-200 font-medium">
                {customer.address || '—'}
              </p>
            </div>

            {/* Confidential NID with Toggle */}
            <div className="p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {t('customers.nidField')}
                </span>
                {customer.nid && (
                  <button
                    type="button"
                    onClick={() => setShowNid(!showNid)}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showNid ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showNid ? 'Hide' : 'Reveal'}
                  </button>
                )}
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-mono font-medium tracking-wide">
                {maskNid(customer.nid)}
              </p>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-xs">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {t('customers.notesField')}
            </span>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {customer.notes || t('customers.noNotes')}
            </p>
          </div>

          {/* Timestamps */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {t('customers.registeredOn')}: {formatDate(customer.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {t('customers.lastUpdated')}: {formatDate(customer.updatedAt)}
            </span>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
