import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Mail, Lock, User, AlertCircle, CheckCircle, Store, ShieldCheck } from 'lucide-react';

export function AuthModal({ isOpen, onClose }) {
  const { t, language, handleLogin, handleRegister } = useApp();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (tab === 'register') {
      if (!fullName.trim()) {
        return setErrorMessage(t('auth.fullNameRequired'));
      }
      if (password !== confirmPassword) {
        return setErrorMessage(t('auth.passwordMismatch'));
      }
      if (password.length < 8) {
        return setErrorMessage(t('auth.passwordTooShort'));
      }

      setIsLoading(true);
      try {
        await handleRegister(fullName.trim(), email.trim(), password);
        setSuccessMessage(t('auth.registrationSuccess'));
        setTimeout(() => {
          onClose();
          resetForm();
        }, 800);
      } catch (err) {
        setErrorMessage(err.message || 'Registration failed');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Login
      if (!email.trim() || !password) {
        return setErrorMessage(t('auth.emailInvalid'));
      }

      setIsLoading(true);
      try {
        await handleLogin(email.trim(), password);
        setSuccessMessage(t('auth.welcomeBack'));
        setTimeout(() => {
          onClose();
          resetForm();
        }, 800);
      } catch (err) {
        setErrorMessage(err.message || 'Login failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title={t('auth.modalTitle')}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('auth.loginTab')}
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('register')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'register'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('auth.registerTab')}
          </button>
        </div>

        {/* Security / Phase 03 Indicator */}
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-lg border border-indigo-100 dark:border-indigo-900/60 text-[11px] text-indigo-700 dark:text-indigo-300">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{t('auth.authNotice')}</span>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-lg text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.fullNameLabel')}
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('auth.emailLabel')}
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('auth.passwordLabel')}
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.confirmPasswordLabel')}
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading
                ? t('auth.processing')
                : tab === 'register'
                ? t('auth.registerSubmitBtn')
                : t('auth.loginSubmitBtn')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
