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
  LogIn,
  LogOut
} from 'lucide-react';
import { Dropdown } from '../ui/Dropdown.jsx';
import { Button } from '../ui/Button.jsx';

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
    openPreviewModal,
    user,
    isAuthenticated,
    openAuthModal,
    handleLogout
  } = useApp();

  const userInitial = user && user.fullName ? user.fullName.charAt(0).toUpperCase() : 'র';

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

      {/* Zone 3: Controls (Language Switch, Theme Toggle, Auth / Profile Menu) */}
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

        {/* Authentication or Profile Dropdown */}
        {isAuthenticated ? (
          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="User Profile Menu"
              >
                <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitial}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 max-w-[120px] truncate">
                    {user.fullName}
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
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user.fullName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                {user.email}
              </p>
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={() =>
                  openPreviewModal(
                    t('header.profile'),
                    language === 'bn'
                      ? 'দোকানের ঠিকানা, ট্রেড লাইসেন্স নম্বর, এবং ভ্যাট নিবন্ধন সংক্রান্ত প্রোফাইল সেটিংস পরবর্তীতে যুক্ত হবে।'
                      : 'Store profile, trade license number, and billing parameters will be configured in subsequent phases.'
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
                      ? `অ্যাকাউন্ট আইডি: ${user.id}\nভূমিকা: ${user.role}\n\nআপনার সেশনটি সুরক্ষিত HTTP-only কুকি এবং CSRF সুরক্ষার মাধ্যমে এনক্রিপ্ট করা আছে।`
                      : `Account ID: ${user.id}\nRole: ${user.role}\n\nYour session is encrypted and protected via HTTP-only cookies and CSRF tokens.`
                  )
                }
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'bn' ? 'সেশন ও নিরাপত্তা' : 'Session & Security'}</span>
              </button>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('header.logoutBtn')}</span>
              </button>
            </div>
          </Dropdown>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={openAuthModal}
            icon={LogIn}
            className="text-xs"
          >
            {t('header.loginBtn')}
          </Button>
        )}
      </div>
    </header>
  );
}
