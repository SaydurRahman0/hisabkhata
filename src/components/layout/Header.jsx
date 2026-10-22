import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  Menu,
  Sun,
  Moon,
  Globe,
  Store,
  ChevronDown,
  User,
  ShieldCheck,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Dropdown } from '../ui/Dropdown.jsx';

/**
 * Top Header component.
 * Follows 1-row, 3-zone contract with clean single-line controls and zero clutter.
 */
export function Header() {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    t,
    toggleMobileNav,
    openPreviewModal
  } = useApp();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Zone 1: Mobile Hamburger & Context Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleMobileNav}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Wordmark in mobile view or Breadcrumb trail in desktop view */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="lg:hidden flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              হি
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              {language === 'bn' ? 'হিসাবখাতা' : 'HisabKhata'}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
              {t('nav.dashboard')}
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</span>
            <span className="truncate text-slate-600 dark:text-slate-300">
              {language === 'bn' ? 'সারসংক্ষেপ ও হিসাব খতিয়ান' : 'Overview & Summary Ledger'}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Store Identity Quick Indicator */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-lg text-xs text-slate-600 dark:text-slate-300">
        <Store className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
        <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
          {t('header.currentStore')}
        </span>
        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
        <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">
          {t('header.storeLocation')}
        </span>
      </div>

      {/* Zone 3: Controls (Language Switch, Theme Toggle, Profile Menu) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Language Switch Button */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          aria-label={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
        >
          <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          <span className="font-semibold">{language === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>

        {/* Dark/Light Mode Switch */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title={theme === 'dark' ? t('header.themeLight') : t('header.themeDark')}
          aria-label={theme === 'dark' ? 'Activate Light Mode' : 'Activate Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" aria-hidden="true" />
          )}
        </button>

        {/* Store Profile Dropdown Placeholder (No fake authentication) */}
        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Store Profile Menu"
            >
              <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                র
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="font-semibold text-slate-900 dark:text-slate-100 max-w-[120px] truncate">
                  {t('header.storeOwner')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {t('header.ownerRole')}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" aria-hidden="true" />
            </button>
          }
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {t('header.currentStore')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('header.storeLocation')}
            </p>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() =>
                openPreviewModal(
                  t('header.profile'),
                  language === 'bn'
                    ? 'দোকানের ঠিকানা, ট্রেড লাইসেন্স নম্বর, এবং ভ্যাট নিবন্ধন সংক্রান্ত সেটিংস ফেজ ০২-এ যুক্ত করা হবে।'
                    : 'Store profile, trade license number, and billing parameters will be configured in Phase 02.'
                )
              }
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('header.profile')}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                openPreviewModal(
                  language === 'bn' ? 'নিরাপত্তা তথ্য' : 'Security Details',
                  language === 'bn'
                    ? 'হিসাবখাতা সিস্টেমটি মাল্টি-ইউজার রোল এবং নিরাপদ সেশন ভিত্তিক ডাটাবেজ সুরক্ষায় ডিজাইন করা হচ্ছে।'
                    : 'HisabKhata is architected for secure multi-user role-based access in future phases.'
                )
              }
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'bn' ? 'নিরাপত্তা ও ডাটাবেজ স্ট্যাটাস' : 'Security & Database Status'}</span>
            </button>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
            <div className="px-3 py-1.5 text-[11px] text-slate-400 dark:text-slate-500 italic">
              {t('header.logoutPlaceholder')}
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
