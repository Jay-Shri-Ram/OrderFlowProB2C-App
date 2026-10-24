import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ClipboardList, 
  Layers, 
  Users, 
  Package, 
  AlertTriangle, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Menu,
  X
} from 'lucide-react';
import type { CompanySettings } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  settings: CompanySettings;
  counts: {
    pendingOrders: number;
    unresolvedExceptions: number;
  };
  mobileMenuOpen: boolean;
  onToggleMobileMenu: (open: boolean) => void;
}

export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'POS Terminal', icon: ShoppingBag, highlight: true },
  { id: 'orders', label: 'Orders', icon: ClipboardList, badgeKey: 'pendingOrders' },
  { id: 'demand', label: 'Kitchen Demand', icon: Layers },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'products', label: 'Catalog & Stock', icon: Package },
  { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle, badgeKey: 'unresolvedExceptions' },
  { id: 'settings', label: 'Store Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  settings,
  counts,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  return (
    <>
      {/* ===================== DESKTOP SIDEBAR ===================== */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-md transition-all duration-300 z-30 shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Lockup */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            {settings.logoBase64 ? (
              <img
                src={settings.logoBase64}
                alt={settings.storeName}
                className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {settings.storeName ? settings.storeName.charAt(0).toUpperCase() : 'O'}
              </div>
            )}
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {settings.storeName || 'OrderFlow Pro'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Cloud POS & Engine
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const badgeCount = item.badgeKey === 'pendingOrders' ? counts.pendingOrders : item.badgeKey === 'unresolvedExceptions' ? counts.unresolvedExceptions : 0;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                } ${item.highlight && !isActive ? 'border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && badgeCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 tabular-nums">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Database Persistence Status Badge */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs">
            <Database className="w-4 h-4 shrink-0 animate-pulse" />
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-semibold leading-tight">Database Connected</span>
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 truncate">Auto-saving in realtime</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ===================== MOBILE BOTTOM TAB BAR ===================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 h-16 px-2 flex items-center justify-around pb-safe">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] ${
            currentView === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Home</span>
        </button>

        <button
          onClick={() => onNavigate('pos')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] ${
            currentView === 'pos' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <div className="p-1 rounded-lg bg-indigo-600 text-white shadow-xs">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold mt-0.5">POS</span>
        </button>

        <button
          onClick={() => onNavigate('orders')}
          className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] ${
            currentView === 'orders' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          {counts.pendingOrders > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500"></span>
          )}
          <span className="text-[10px] font-medium mt-1">Orders</span>
        </button>

        <button
          onClick={() => onNavigate('customers')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] ${
            currentView === 'customers' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">CRM</span>
        </button>

        <button
          onClick={() => onToggleMobileMenu(!mobileMenuOpen)}
          className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] ${
            mobileMenuOpen || ['demand', 'products', 'exceptions', 'settings'].includes(currentView)
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Menu className="w-5 h-5" />
          {counts.unresolvedExceptions > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
          )}
          <span className="text-[10px] font-medium mt-1">More</span>
        </button>
      </nav>

      {/* ===================== MOBILE SLIDE-UP DRAWER FOR "MORE" ===================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div 
            className="w-full bg-white dark:bg-[#0c1220] rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {settings.logoBase64 ? (
                  <img src={settings.logoBase64} alt={settings.storeName} className="w-7 h-7 object-contain rounded" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {settings.storeName ? settings.storeName.charAt(0).toUpperCase() : 'O'}
                  </div>
                )}
                <span className="font-bold text-sm text-slate-900 dark:text-white">{settings.storeName}</span>
              </div>
              <button
                onClick={() => onToggleMobileMenu(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <button
                onClick={() => { onNavigate('demand'); onToggleMobileMenu(false); }}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-left"
              >
                <Layers className="w-5 h-5 text-indigo-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Kitchen Demand</div>
                  <div className="text-[10px] text-slate-500">Aggregated items</div>
                </div>
              </button>

              <button
                onClick={() => { onNavigate('products'); onToggleMobileMenu(false); }}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-left"
              >
                <Package className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Catalog & Units</div>
                  <div className="text-[10px] text-slate-500">Pricing & stock</div>
                </div>
              </button>

              <button
                onClick={() => { onNavigate('exceptions'); onToggleMobileMenu(false); }}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-left relative"
              >
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Exceptions</div>
                  <div className="text-[10px] text-slate-500">Audit & voids</div>
                </div>
                {counts.unresolvedExceptions > 0 && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {counts.unresolvedExceptions}
                  </span>
                )}
              </button>

              <button
                onClick={() => { onNavigate('settings'); onToggleMobileMenu(false); }}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-left"
              >
                <Settings className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Settings & Logo</div>
                  <div className="text-[10px] text-slate-500">Company profile</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
