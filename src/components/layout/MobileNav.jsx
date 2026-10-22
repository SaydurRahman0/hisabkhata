import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  X,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Wallet,
  FileBarChart2,
  Store
} from 'lucide-react';

export function MobileNav() {
  const {
    isMobileNavOpen,
    closeMobileNav,
    language,
    t,
    activeNav,
    setActiveNav,
    openPreviewModal
  } = useApp();

  if (!isMobileNavOpen) return null;

  const navItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      isActive: activeNav === 'dashboard',
      isAvailable: true
    },
    {
      id: 'products',
      label: t('nav.products'),
      icon: Package,
      isActive: activeNav === 'products',
      isAvailable: false,
      phase: '02'
    },
    {
      id: 'sales',
      label: t('nav.sales'),
      icon: Receipt,
      isActive: activeNav === 'sales',
      isAvailable: false,
      phase: '02'
    },
    {
      id: 'customers',
      label: t('nav.customers'),
      icon: Users,
      isActive: activeNav === 'customers',
      isAvailable: false,
      phase: '02'
    },
    {
      id: 'dueManagement',
      label: t('nav.dueManagement'),
      icon: Wallet,
      isActive: activeNav === 'dueManagement',
      isAvailable: false,
      phase: '02'
    },
    {
      id: 'reports',
      label: t('nav.reports'),
      icon: FileBarChart2,
      isActive: activeNav === 'reports',
      isAvailable: false,
      phase: '03'
    }
  ];

  const handleNavClick = (item) => {
    closeMobileNav();
    if (item.isAvailable) {
      setActiveNav(item.id);
    } else {
      openPreviewModal(
        item.label,
        language === 'bn'
          ? `"${item.label}" ফিচারটি ফেজ ০${item.phase}-এ সম্পূর্ণ ডেটাবেজ ও লজিকসহ যুক্ত করা হবে। এই ফেজে (Phase 01) শুধুমাত্র ড্যাশবোর্ড ও ডিজাইন সিস্টেম প্রস্তুত করা হয়েছে।`
          : `The "${item.label}" module is planned for Phase 0${item.phase} with complete database models and business logic.`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              হি
            </span>
            <span className="font-bold text-base text-slate-900 dark:text-white">
              {language === 'bn' ? 'হিসাবখাতা' : 'HisabKhata'}
            </span>
          </div>
          <button
            type="button"
            onClick={closeMobileNav}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors ${
                  item.isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                {!item.isAvailable && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    P0{item.phase}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Store badge at bottom */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div className="truncate">
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {t('header.currentStore')}
              </p>
              <p className="text-[10px] truncate">{t('header.storeLocation')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
