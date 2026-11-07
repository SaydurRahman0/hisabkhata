import React from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Header } from './components/layout/Header.jsx';
import { MobileNav } from './components/layout/MobileNav.jsx';
import { DashboardOverview } from './features/dashboard/DashboardOverview.jsx';
import { ProductsView } from './features/products/ProductsView.jsx';
import { CustomersView } from './features/customers/CustomersView.jsx';
import { SalesView } from './features/sales/SalesView.jsx';
import { AuthModal } from './features/auth/AuthModal.jsx';
import { Modal } from './components/ui/Modal.jsx';
import { Button } from './components/ui/Button.jsx';
import { ShieldCheck } from 'lucide-react';

function MainLayout() {
  const {
    language,
    t,
    activeNav,
    modalState,
    closeModal,
    isAuthModalOpen,
    closeAuthModal
  } = useApp();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navigation Drawer */}
      <MobileNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeNav === 'products' ? (
            <ProductsView />
          ) : activeNav === 'customers' ? (
            <CustomersView />
          ) : activeNav === 'sales' ? (
            <SalesView />
          ) : (
            <DashboardOverview />
          )}
        </main>

        {/* Quiet Footer */}
        <footer className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p>{t('footer.rights')}</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                Phase 05: Sales & Transactions
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span>Bangladesh</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Interactive Modal for Actions & Previews */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        footer={
          <Button variant="primary" size="sm" onClick={closeModal}>
            {t('modal.closeBtn')}
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {modalState.actionBadge || (language === 'bn' ? 'ফেজ ০৪এ সিস্টেম' : 'Phase 04A System')}
            </span>
          </div>
          <p className="whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
            {modalState.message || t('modal.noticeText')}
          </p>
        </div>
      </Modal>

      {/* Authentication Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
