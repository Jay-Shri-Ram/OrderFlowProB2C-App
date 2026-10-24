import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Clock, 
  ArrowUpRight, 
  ChevronRight,
  PackageCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { Order, Customer, Product, CompanySettings } from '../types';
import { formatMoney, formatDate } from '../lib/utils';

interface DashboardViewProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
  settings: CompanySettings;
  onNavigate: (view: string) => void;
  onSelectOrder: (order: Order) => void;
  onQuickStatusChange: (orderId: string, status: Order['orderStatus']) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  customers,
  products,
  settings,
  onNavigate,
  onSelectOrder,
  onQuickStatusChange,
}) => {
  const activeOrders = orders.filter(o => !o.isDeleted);
  const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.orderStatus !== 'Cancelled' ? o.total : 0), 0);
  const pendingOrders = activeOrders.filter(o => o.orderStatus === 'Pending');
  const inProgressOrders = activeOrders.filter(o => o.orderStatus === 'In Progress');
  const completedOrders = activeOrders.filter(o => o.orderStatus === 'Complete');

  // Compute Area sales
  const areaRevenueMap: Record<string, number> = {};
  for (const o of activeOrders) {
    if (o.orderStatus !== 'Cancelled' && o.area) {
      areaRevenueMap[o.area] = (areaRevenueMap[o.area] || 0) + o.total;
    }
  }
  const topAreas = Object.entries(areaRevenueMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Compute Top Products
  const productQuantityMap: Record<string, { name: string; qty: number; revenue: number; unit: string }> = {};
  for (const o of activeOrders) {
    if (o.orderStatus !== 'Cancelled') {
      for (const item of o.items) {
        if (!productQuantityMap[item.productId]) {
          productQuantityMap[item.productId] = { name: item.name, qty: 0, revenue: 0, unit: item.unit };
        }
        productQuantityMap[item.productId].qty += item.qty;
        productQuantityMap[item.productId].revenue += item.total;
      }
    }
  }
  const topProducts = Object.values(productQuantityMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Net Revenue</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatMoney(totalRevenue, settings.currencySymbol)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Realtime ledger synced</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">All Order Tickets</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {activeOrders.length}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{completedOrders.length} completed</span>
              <span>·</span>
              <span>{inProgressOrders.length} active</span>
            </div>
          </div>
        </div>

        {/* Active Customers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified CRM Accounts</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {customers.length}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Across {Object.keys(areaRevenueMap).length} delivery zones</span>
            </div>
          </div>
        </div>

        {/* Pending Fulfillment */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kitchen & Dispatch Queue</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {pendingOrders.length}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <button onClick={() => onNavigate('demand')} className="hover:underline flex items-center gap-1">
                View Kitchen Demand <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Top Territory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - 2 Columns */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Orders</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live operational order stream</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
            >
              All Orders ({orders.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="pb-3">Order #</th>
                  <th className="pb-3">Customer / Shop</th>
                  <th className="pb-3">Area</th>
                  <th className="pb-3 text-right">Total</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Fast Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {activeOrders.slice(0, 6).map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        <button onClick={() => onSelectOrder(order)} className="hover:underline">
                          {order.orderNumber}
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{order.customerName}</div>
                        <div className="text-[11px] text-slate-400">{order.customerShop || order.customerPhone}</div>
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {order.area || 'Direct Counter'}
                      </td>
                      <td className="py-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {formatMoney(order.total, settings.currencySymbol)}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            order.orderStatus === 'Complete'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : order.orderStatus === 'In Progress'
                              ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400'
                              : order.orderStatus === 'Cancelled'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {order.orderStatus === 'Pending' && (
                          <button
                            onClick={() => onQuickStatusChange(order.id, 'In Progress')}
                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800"
                          >
                            Dispatch
                          </button>
                        )}
                        {order.orderStatus === 'In Progress' && (
                          <button
                            onClick={() => onQuickStatusChange(order.id, 'Complete')}
                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {order.orderStatus === 'Complete' && (
                          <span className="text-[11px] text-slate-400">Delivered</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Territory Sales & Top Products - 1 Column */}
        <div className="space-y-6">
          {/* Territory Breakdown */}
          <div className="rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delivery Territory Volume</h3>
            <div className="space-y-3">
              {topAreas.map(([areaName, rev]) => {
                const percent = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0;
                return (
                  <div key={areaName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{areaName}</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-white font-bold">
                        {formatMoney(rev, settings.currencySymbol)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Sold Items</h3>
              <button
                onClick={() => onNavigate('demand')}
                className="text-[11px] font-semibold text-indigo-500 hover:underline"
              >
                Production View
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {topProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-[11px] text-slate-400">Total units sold: {p.qty} {p.unit}</div>
                  </div>
                  <div className="text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatMoney(p.revenue, settings.currencySymbol)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
