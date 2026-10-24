import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  FileSpreadsheet, 
  Printer, 
  Users, 
  Search, 
  Filter, 
  Download,
  ChevronRight
} from 'lucide-react';
import type { Order, CompanySettings } from '../types';
import { formatMoney, exportToExcel, exportToCsv } from '../lib/utils';

interface DemandViewProps {
  orders: Order[];
  settings: CompanySettings;
}

interface AggregatedItem {
  productId: string;
  name: string;
  category: string;
  unit: string;
  totalQty: number;
  totalValue: number;
  ordersCount: number;
  breakdown: Array<{
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerShop?: string;
    area: string;
    qty: number;
    total: number;
  }>;
}

export const DemandView: React.FC<DemandViewProps> = ({ orders, settings }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [drilldownItem, setDrilldownItem] = useState<AggregatedItem | null>(null);

  // Consider all active orders that are Pending or In Progress (i.e., needing production / fulfillment)
  const activeOrders = useMemo(() => {
    return orders.filter(o => !o.isDeleted && (o.orderStatus === 'Pending' || o.orderStatus === 'In Progress'));
  }, [orders]);

  // Aggregate by product and unit
  const aggregatedData = useMemo(() => {
    const map: Record<string, AggregatedItem> = {};

    for (const order of activeOrders) {
      for (const item of order.items) {
        const key = `${item.productId}__${item.unit}`;
        if (!map[key]) {
          map[key] = {
            productId: item.productId,
            name: item.name,
            category: item.category,
            unit: item.unit,
            totalQty: 0,
            totalValue: 0,
            ordersCount: 0,
            breakdown: []
          };
        }
        map[key].totalQty += item.qty;
        map[key].totalValue = +(map[key].totalValue + item.total).toFixed(2);
        map[key].ordersCount += 1;
        map[key].breakdown.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerShop: order.customerShop,
          area: order.area,
          qty: item.qty,
          total: item.total
        });
      }
    }

    return Object.values(map);
  }, [activeOrders]);

  // Extract available categories
  const categories = useMemo(() => {
    const cats = new Set(aggregatedData.map(i => i.category));
    return Array.from(cats);
  }, [aggregatedData]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return aggregatedData.filter(item => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [aggregatedData, selectedCategory, searchQuery]);

  // Export to Excel
  const handleExportExcel = () => {
    const rows = filteredItems.map(item => ({
      'Item Name': item.name,
      'Category': item.category,
      'Packaging Unit': item.unit,
      'Total Required Qty': item.totalQty,
      'Total Demand Value': item.totalValue,
      'Active Orders Count': item.ordersCount,
    }));
    exportToExcel(rows, `Kitchen_Demand_${new Date().toISOString().slice(0, 10)}.xlsx`, 'ProductionDemand');
  };

  const handleExportCsv = () => {
    const rows = filteredItems.map(item => ({
      'Item Name': item.name,
      'Category': item.category,
      'Packaging Unit': item.unit,
      'Total Required Qty': item.totalQty,
      'Total Demand Value': item.totalValue,
      'Active Orders Count': item.ordersCount,
    }));
    exportToCsv(rows, `Kitchen_Demand_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  const grandTotalUnits = filteredItems.reduce((sum, item) => sum + item.totalQty, 0);
  const grandTotalValue = filteredItems.reduce((sum, item) => sum + item.totalValue, 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* Top Banner and Summary */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            <span>Kitchen & Dispatch Production Demand</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Realtime aggregation of {activeOrders.length} pending and in-progress orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-indigo-400 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-indigo-400 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 text-sky-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Filter Chips & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search demand items..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Demand Table */}
      <div className="rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Packaging Unit</th>
                <th className="py-3 px-3 text-center">Active Orders</th>
                <th className="py-3 px-3 text-right">Total Demand</th>
                <th className="py-3 px-3 text-right">Demand Value</th>
                <th className="py-3 px-4 text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No pending items in the production queue</p>
                    <p className="text-xs mt-1">All orders are either complete or none have been submitted yet.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={`${item.productId}-${item.unit}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </td>

                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {item.category}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.unit}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {item.ordersCount}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-extrabold text-sm text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {item.totalQty}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatMoney(item.totalValue, settings.currencySymbol)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDrilldownItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                      >
                        <Users className="w-3 h-3" />
                        <span>Who Ordered</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 font-bold text-slate-900 dark:text-white">
                  <td colSpan={4} className="py-3 px-4 uppercase text-[11px] tracking-wider">
                    Total Production Requirements
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm tabular-nums text-indigo-600 dark:text-indigo-400">
                    {grandTotalUnits} units
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm tabular-nums">
                    {formatMoney(grandTotalValue, settings.currencySymbol)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* "Who Ordered This" Drilldown Modal */}
      {drilldownItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Customer Breakdown: {drilldownItem.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total {drilldownItem.totalQty} {drilldownItem.unit} across {drilldownItem.ordersCount} orders
                </p>
              </div>
              <button onClick={() => setDrilldownItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {drilldownItem.breakdown.map((row, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{row.customerName}</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                        ({row.orderNumber})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {row.customerShop} · Area: {row.area}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {row.qty} {drilldownItem.unit}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {formatMoney(row.total, settings.currencySymbol)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setDrilldownItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
