import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { User, Phone, MapPin, ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import { apiCreateCustomer, apiUpdateCustomer, apiGetCustomer } from '../../lib/api.js';

export function CustomerModal({ isOpen, onClose, customer, onCustomerSaved }) {
  const { t } = useApp();

  const isEditing = Boolean(customer && (customer._id || customer.id));

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nid, setNid] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form when editing or reset on open
  useEffect(() => {
    let isMounted = true;
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setNid(customer.nid || '');
      setNotes(customer.notes || '');

      // If customer was passed from the list (where sensitive nid and notes are not selected), fetch full details
      const customerId = customer._id || customer.id;
      if (customerId && (customer.nid === undefined || customer.notes === undefined)) {
        apiGetCustomer(customerId)
          .then((data) => {
            if (isMounted && data?.customer) {
              if (data.customer.nid) setNid(data.customer.nid);
              if (data.customer.notes) setNotes(data.customer.notes);
              if (data.customer.address) setAddress(data.customer.address);
            }
          })
          .catch(() => {
            // Silently retain current values on network failure
          });
      }
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setNid('');
      setNotes('');
    }
    setErrorMessage('');
    return () => {
      isMounted = false;
    };
  }, [customer, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validations
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage(t('customers.nameLabel') + ' is required');
      return;
    }

    if (!trimmedPhone) {
      setErrorMessage(t('customers.phoneLabel') + ' is required');
      return;
    }

    const payload = {
      name: trimmedName,
      phone: trimmedPhone,
      address: address.trim(),
      nid: nid.trim(),
      notes: notes.trim()
    };

    setIsLoading(true);
    try {
      let result;
      const customerId = customer?._id || customer?.id;
      if (isEditing && customerId) {
        result = await apiUpdateCustomer(customerId, payload);
      } else {
        result = await apiCreateCustomer(payload);
      }

      if (onCustomerSaved) {
        onCustomerSaved(result.customer, isEditing);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while saving customer profile');
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={onClose}
        disabled={isLoading}
      >
        {t('customers.cancelBtn')}
      </Button>
      <Button
        type="button"
        variant="primary"
        size="md"
        isLoading={isLoading}
        onClick={handleSubmit}
      >
        {isLoading ? t('customers.savingBtn') : t('customers.saveBtn')}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('customers.modalEditTitle') : t('customers.modalAddTitle')}
      footer={footer}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* 1. Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('customers.nameLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('customers.namePlaceholder')}
              maxLength={150}
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* 2. Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('customers.phoneLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('customers.phonePlaceholder')}
              maxLength={25}
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {t('customers.phoneHint')}
          </p>
        </div>

        {/* 3. Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('customers.addressLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('customers.addressPlaceholder')}
              maxLength={300}
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* 4. Sensitive NID */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {t('customers.nidLabel')}
            </label>
            <span className="text-[10px] text-slate-400 font-medium">
              Confidential
            </span>
          </div>
          <input
            type="text"
            value={nid}
            onChange={(e) => setNid(e.target.value)}
            placeholder={t('customers.nidPlaceholder')}
            maxLength={30}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-mono"
          />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            {t('customers.nidSecurityNotice')}
          </p>
        </div>

        {/* 5. Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            {t('customers.notesLabel')}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('customers.notesPlaceholder')}
            maxLength={1000}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
