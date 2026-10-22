import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Info, Sparkles } from 'lucide-react';

/**
 * Notice banner clearly separating sample preview data from real database records.
 * Required by section 6: "Clearly separate demo data from real application data. Do not present hardcoded demo data as live database results."
 */
export function DemoNoticeBanner() {
  const { language, t } = useApp();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">
          <span className="font-semibold">{t('dashboard.demoDataBadge')}:</span>{' '}
          {t('dashboard.demoDataNotice')}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 text-[11px] text-indigo-700 dark:text-indigo-300 font-mono">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
        <span>Phase 01 UI Spec</span>
      </div>
    </div>
  );
}
