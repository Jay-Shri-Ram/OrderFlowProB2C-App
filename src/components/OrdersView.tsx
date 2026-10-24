import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  RotateCcw, 
  Printer, 
  Copy, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  Eye,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import type { Order, CompanySettings } from '../types';
import { formatMoney, formatDateTime, exportToExcel } from '../lib/utils';

interface OrdersViewProps {
  orders: Order[];
  settings: CompanySettings;
  areas: string[];
  onUpdateStatus: (id: string, status: Order['orderStatus']) => void;
  onBulkUpdateStatus: (ids: string[], status: Order['orderStatus']) => void;
  onBulkDelete: (ids: string[]) => void;
  onDeleteOrder: (id: string, permanent?: boolean) => void;
  onRestoreOrder: (id: string) => void;
  onDuplicateOrder: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
  onPrintBatchInvoices: (orders: Order[]) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  settings,
  areas,
  onUpdateStatus,
  onBulkUpdateStatus,
  onBulkDelete,
  onDeleteOrder,
  onRestoreOrder,
  onDuplicateOrder,
  onPrintInvoice,
  onPrintBatchInvoices,
}) => {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showRecycleBin, setShowRecycleBin] = useState<boolean>(false);
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);

  // Separate active and deleted orders
  const activeOrders = useMemo(() => orders.filter(o => !o.isDeleted), [orders]);
  const deletedOrders = useMemo(() => orders.filter(o => !!o.isDeleted), [orders]);

  // Filter Active Orders
  const filteredOrders = useMemo(() => {
    return activeOrders.filter((o) => {
      // Tab status filter
      if (activeTab !== 'All' && o.orderStatus !== activeTab) return false;
      // Area filter
      if (selectedArea !== 'All' && o.area !== selectedArea) return false;
      // Query search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = o.orderNumber.toLowerCase().includes(q);
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchShop = o.customerShop && o.customerShop.toLowerCase().includes(q);
        const matchPhone = o.customerPhone && o.customerPhone.toLowerCase().includes(q);
        if (!matchNo && !matchName && !matchShop && !matchPhone) return false;
      }
      return true;
    });
  }, [activeOrders, activeTab, selectedArea, searchQuery]);

  // Checkbox handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  // Export to Excel
  const handleExportOrders = () => {
    const rows = filteredOrders.map(o => ({
      'Order Number': o.orderNumber,
      'Date': formatDateTime(o.createdAt),
      'Customer Name': o.customerName,
      'Shop Name': o.customerShop || '',
      'Phone': o.customerPhone || '',
      'Area': o.area,
      'Subtotal': o.subtotal,
      'Discount': o.discount,
      'Tax Amount': o.taxAmount,
      'Delivery Fee': o.deliveryFee,
      'Total Amount': o.total,
      'Payment Method': o.paymentMethod,
      'Payment Status': o.paymentStatus,
      'Order Status': o.orderStatus,
      'Items Count': o.items.reduce((sum, item) => sum + item.qty, 0),
      'Notes': o.notes || ''
    }));
    exportToExcel(rows, `Orders_Export_${new Date().toISOString().slice(0, 10)}.xlsx`, 'Orders');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, shop, phone..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        {/* Territory Filter & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Delivery Areas</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <button
            onClick={handleExportOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-indigo-400 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={() => setShowRecycleBin(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium hover:text-slate-800 dark:hover:text-white shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Recycle Bin ({deletedOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Status Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['All', 'Pending', 'In Progress', 'Complete', 'Cancelled'].map((tab) => {
          const count = tab === 'All' ? activeOrders.length : activeOrders.filter(o => o.orderStatus === tab).length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Table Container */}
      <div className="rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
                  />
                </th>
                <th className="py-3 px-3">Order Number</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Customer / Business</th>
                <th className="py-3 px-3">Area</th>
                <th className="py-3 px-3 text-right">Items</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No orders matching the current filter</p>
                    <p className="text-xs mt-1">Try resetting search filters or capture a new sale in POS.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isChecked = selectedIds.includes(order.id);
                  const totalUnits = order.items.reduce((sum, item) => sum + item.qty, 0);

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors ${
                        isChecked ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(order.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
                        />
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        <button
                          onClick={() => setInspectingOrder(order)}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <span>{order.orderNumber}</span>
                          <Eye className="w-3 h-3 text-slate-400 hover:text-indigo-500" />
                        </button>
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{order.customerName}</div>
                        <div className="text-[11px] text-slate-400">{order.customerShop || order.customerPhone}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {order.area}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {totalUnits}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {formatMoney(order.total, settings.currencySymbol)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {order.paymentMethod} · {order.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => onUpdateStatus(order.id, e.target.value as Order['orderStatus'])}
                          className={`text-[11px] font-semibold px-2 py-1 rounded-lg border focus:outline-hidden ${
                            order.orderStatus === 'Complete'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : order.orderStatus === 'In Progress'
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                              : order.orderStatus === 'Cancelled'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Complete">Complete</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPrintInvoice(order)}
                            title="Print Thermal / A4 Receipt"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDuplicateOrder(order)}
                            title="Duplicate order to POS ticket"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteOrder(order.id, false)}
                            title="Move to Recycle Bin"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl p-3 px-5 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-200 border border-slate-700">
          <span className="text-xs font-bold text-indigo-300">
            {selectedIds.length} orders selected
          </span>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkUpdateStatus(selectedIds, 'In Progress')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white"
            >
              Mark In Progress
            </button>
            <button
              onClick={() => onBulkUpdateStatus(selectedIds, 'Complete')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Mark Complete
            </button>
            <button
              onClick={() => {
                const targets = activeOrders.filter(o => selectedIds.includes(o.id));
                onPrintBatchInvoices(targets);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Batch</span>
            </button>
            <button
              onClick={() => onBulkDelete(selectedIds)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-slate-400 hover:text-white ml-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* Recycle Bin Modal */}
      {showRecycleBin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Recycle Bin (Soft-Deleted Orders)</span>
                </h3>
                <p className="text-xs text-slate-400">Restore accidentally deleted sales orders</p>
              </div>
              <button onClick={() => setShowRecycleBin(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {deletedOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Trash2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p>Recycle bin is completely empty</p>
                </div>
              ) : (
                deletedOrders.map(order => (
                  <div key={order.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {order.orderNumber} · {formatMoney(order.total, settings.currencySymbol)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.customerName} ({order.area}) · Deleted on {formatDateTime(order.updatedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRestoreOrder(order.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => onDeleteOrder(order.id, true)}
                        className="px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 font-semibold"
                      >
                        Purge
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Inspection Slide-Over */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c1220] h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="font-mono text-base font-black text-indigo-600 dark:text-indigo-400">
                    {inspectingOrder.orderNumber}
                  </span>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Created on {formatDateTime(inspectingOrder.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => setInspectingOrder(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {/* Customer summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">{inspectingOrder.customerName}</div>
                <div className="text-slate-500">{inspectingOrder.customerShop} · {inspectingOrder.customerPhone}</div>
                <div className="text-slate-500 font-medium">Delivery Territory: {inspectingOrder.area}</div>
                {inspectingOrder.notes && (
                  <div className="pt-2 text-indigo-600 dark:text-indigo-400 italic">"{inspectingOrder.notes}"</div>
                )}
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items</div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {inspectingOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.qty} × {formatMoney(item.rate, settings.currencySymbol)} ({item.unit})
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatMoney(item.total, settings.currencySymbol)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="space-y-1.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">{formatMoney(inspectingOrder.subtotal, settings.currencySymbol)}</span>
                </div>
                {inspectingOrder.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount</span>
                    <span className="font-mono tabular-nums">-{formatMoney(inspectingOrder.discount, settings.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Tax ({inspectingOrder.taxPercent}%)</span>
                  <span className="font-mono tabular-nums">{formatMoney(inspectingOrder.taxAmount, settings.currencySymbol)}</span>
                </div>
                {inspectingOrder.deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Charge</span>
                    <span className="font-mono tabular-nums">{formatMoney(inspectingOrder.deliveryFee, settings.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Amount</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {formatMoney(inspectingOrder.total, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onPrintInvoice(inspectingOrder);
                  setInspectingOrder(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={() => {
                  onDuplicateOrder(inspectingOrder);
                  setInspectingOrder(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicate To POS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
