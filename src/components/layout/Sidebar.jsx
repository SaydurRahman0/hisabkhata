import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Wallet,
  FileBarChart2,
  Store,
  Info
} from 'lucide-react';

/**
 * Sidebar Navigation Component.
 * Contains the primary navigation for HisabKhata with clear indicators for Phase 01.
 */
export function Sidebar() {
  const { language, t, activeNav, setActiveNav, openPreviewModal } = useApp();

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
    if (item.isAvailable) {
      setActiveNav(item.id);
    } else {
      openPreviewModal(
        item.label,
        language === 'bn'
          ? `"${item.label}" ফিচারটি ফেজ ০${item.phase}-এ সম্পূর্ণ ডেটাবেজ ও লজিকসহ যুক্ত করা হবে। এই ফেজে (Phase 01) শুধুমাত্র ড্যাশবোর্ড ও ডিজাইন সিস্টেম প্রস্তুত করা হয়েছে।`
          : `The "${item.label}" module is planned for Phase 0${item.phase} with complete database models and business logic. Phase 01 establishes the foundation design system.`
      );
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
          হি
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            {language === 'bn' ? 'হিসাবখাতা' : 'HisabKhata'}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'ব্যবসার ডিজিটাল খতিয়ান' : 'Digital Business Ledger'}
          </p>
        </div>
      </div>

      {/* Primary Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          {language === 'bn' ? 'মূল মেন্যু' : 'Main Menu'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : item.isAvailable
                  ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </div>

              {!item.isAvailable && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                  P0{item.phase}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Store Identity & Phase Card at bottom */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-start gap-2.5">
            <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {t('header.currentStore')}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {t('header.storeLocation')}
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span>{language === 'bn' ? 'বর্তমান স্ট্যাটাস:' : 'Current Status:'}</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Phase 01 UI</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
