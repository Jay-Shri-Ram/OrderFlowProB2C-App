import React, { useState } from 'react';
import { 
  Palette, 
  Moon, 
  Sun, 
  PlusCircle, 
  Check, 
  Database,
  Building2
} from 'lucide-react';
import type { CompanySettings } from '../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  settings: CompanySettings;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentPalette: string;
  onSelectPalette: (palette: string) => void;
  onNewOrder: () => void;
}

const PALETTES = [
  { id: 'indigo', name: 'Indigo', bg: '#6366f1' },
  { id: 'emerald', name: 'Emerald', bg: '#10b981' },
  { id: 'ocean', name: 'Ocean', bg: '#0ea5e9' },
  { id: 'rose', name: 'Rose', bg: '#f43f5e' },
  { id: 'amber', name: 'Amber', bg: '#f59e0b' },
  { id: 'violet', name: 'Violet', bg: '#8b5cf6' },
  { id: 'teal', name: 'Teal', bg: '#14b8a6' },
  { id: 'slate', name: 'Slate', bg: '#64748b' },
];

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Dashboard', subtitle: 'Live sales telemetry & performance KPIs' },
  pos: { title: 'POS Terminal', subtitle: 'High-speed order capture & dynamic ticket' },
  orders: { title: 'Order Operations', subtitle: 'Order records, bulk actions & recycle bin' },
  demand: { title: 'Kitchen Demand Engine', subtitle: 'Aggregated production counts & customer breakdown' },
  customers: { title: 'Customer CRM', subtitle: 'Accounts, delivery areas & Excel imports' },
  products: { title: 'Catalog & Inventory', subtitle: 'Multi-unit packaging, pricing & live stock' },
  exceptions: { title: 'Audit & Exceptions', subtitle: 'Discrepancy logs, returns & approvals' },
  settings: { title: 'Store Profile & Database', subtitle: 'Company logo, tax rules & JSON backups' },
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  settings,
  darkMode,
  onToggleDarkMode,
  currentPalette,
  onSelectPalette,
  onNewOrder,
}) => {
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);
  const activeViewInfo = VIEW_TITLES[currentView] || { title: 'OrderFlow Pro', subtitle: 'Cloud POS' };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0c1220]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shrink-0">
      {/* Zone 1: Breadcrumb and Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider whitespace-nowrap">
              {settings.storeName || 'OrderFlow Pro'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {activeViewInfo.title}
            </h1>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
            {activeViewInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Zone 2: Store quick info & Realtime DB indicator */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60">
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span>Post-Restore Live DB</span>
        </div>
      </div>

      {/* Zone 3: Actions (Palette, Theme Toggle, Primary New Order CTA) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Palette Selector */}
        <div className="relative">
          <button
            onClick={() => setPaletteMenuOpen(!paletteMenuOpen)}
            aria-label="Color Theme Palette"
            title="Choose Color Theme"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Palette className="w-5 h-5" />
          </button>

          {paletteMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 p-2 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[11px] font-semibold text-slate-400 uppercase px-2 py-1">Theme Palette</div>
              <div className="space-y-1">
                {PALETTES.map((p) => {
                  const isSelected = currentPalette === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPalette(p.id);
                        setPaletteMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: p.bg }} />
                        <span>{p.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light Mode Switcher */}
        <button
          onClick={onToggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={darkMode ? "Light Mode" : "Dark Mode"}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Primary Action Button: New Order */}
        {currentView !== 'pos' && (
          <button
            onClick={onNewOrder}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-indigo-500/20 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Order</span>
          </button>
        )}
      </div>
    </header>
  );
};
