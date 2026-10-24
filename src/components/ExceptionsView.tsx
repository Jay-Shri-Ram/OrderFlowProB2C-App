import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Trash2, 
  Clock, 
  Check
} from 'lucide-react';
import type { ExceptionItem, Order, CompanySettings } from '../types';
import { formatDateTime } from '../lib/utils';

interface ExceptionsViewProps {
  exceptions: ExceptionItem[];
  orders: Order[];
  settings: CompanySettings;
  onCreateException: (item: Omit<ExceptionItem, 'id' | 'createdAt'>) => Promise<ExceptionItem>;
  onUpdateException: (id: string, updates: Partial<ExceptionItem>) => Promise<ExceptionItem>;
  onDeleteException: (id: string) => Promise<void>;
}

export const ExceptionsView: React.FC<ExceptionsViewProps> = ({
  exceptions,
  orders,
  settings,
  onCreateException,
  onUpdateException,
  onDeleteException,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [formOrderId, setFormOrderId] = useState(orders[0]?.id || '');
  const [formItem, setFormItem] = useState('');
  const [formCategory, setFormCategory] = useState('Produce & Fruits');
  const [formOrderedQty, setFormOrderedQty] = useState<number>(1);
  const [formActualQty, setFormActualQty] = useState<number>(0);
  const [formUnit, setFormUnit] = useState('box');
  const [formIssueType, setFormIssueType] = useState<ExceptionItem['issueType']>('Missing');
  const [formNotes, setFormNotes] = useState('');

  const filteredExceptions = exceptions.filter(e => {
    if (filterStatus !== 'All' && e.status !== filterStatus) return false;
    return true;
  });

  const handleSaveException = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrder = orders.find(o => o.id === formOrderId);
    if (!targetOrder) return;

    await onCreateException({
      orderId: targetOrder.id,
      orderNumber: targetOrder.orderNumber,
      customerName: targetOrder.customerName,
      item: formItem.trim() || 'Unspecified Item',
      category: formCategory,
      orderedQty: formOrderedQty,
      actualQty: formActualQty,
      unit: formUnit,
      issueType: formIssueType,
      notes: formNotes.trim(),
      status: 'Unresolved',
    });

    setShowAddModal(false);
    setFormItem('');
    setFormNotes('');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>Fulfillment Exceptions & Audit Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track order discrepancies, damaged shipments, missing items, and line adjustments
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Log Exception</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 text-xs">
        {['All', 'Unresolved', 'Approved', 'Dismissed'].map((status) => {
          const count = status === 'All' ? exceptions.length : exceptions.filter(e => e.status === status).length;
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <span>{status}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Exceptions Table */}
      <div className="rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Item & Category</th>
                <th className="py-3 px-3 text-center">Ordered vs Actual</th>
                <th className="py-3 px-3 text-center">Issue Type</th>
                <th className="py-3 px-3">Notes & Reason</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredExceptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <p className="font-semibold text-sm">No exceptions matching the filter</p>
                    <p className="text-xs mt-1">All orders are fulfilled accurately without discrepancies.</p>
                  </td>
                </tr>
              ) : (
                filteredExceptions.map((exc) => (
                  <tr key={exc.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {exc.orderNumber}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {exc.customerName}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{exc.item}</div>
                      <div className="text-[11px] text-slate-400">{exc.category}</div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold tabular-nums">
                      <span className="text-slate-500">{exc.orderedQty} {exc.unit}</span>
                      <span className="mx-1 text-slate-300">→</span>
                      <span className="text-rose-500">{exc.actualQty} {exc.unit}</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        exc.issueType === 'Missing'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200'
                          : exc.issueType === 'Damaged'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200'
                          : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200'
                      }`}>
                        {exc.issueType}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {exc.notes || '—'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        exc.status === 'Approved'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                          : exc.status === 'Dismissed'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-600 animate-pulse'
                      }`}>
                        {exc.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {exc.status === 'Unresolved' && (
                          <>
                            <button
                              onClick={() => onUpdateException(exc.id, { status: 'Approved' })}
                              title="Approve credit / adjustment"
                              className="px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onUpdateException(exc.id, { status: 'Dismissed' })}
                              title="Dismiss exception"
                              className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onDeleteException(exc.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Exception Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Log Order Discrepancy</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveException} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Target Sales Order</label>
                <select
                  value={formOrderId}
                  onChange={(e) => setFormOrderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                >
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.customerName} ({o.items.length} items)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Discrepant Item Name *</label>
                <input
                  type="text"
                  required
                  value={formItem}
                  onChange={(e) => setFormItem(e.target.value)}
                  placeholder="e.g. Organic Avocados"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Issue Category</label>
                  <select
                    value={formIssueType}
                    onChange={(e) => setFormIssueType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Missing">Missing from dispatch</option>
                    <option value="Damaged">Damaged / Expired</option>
                    <option value="Rate Discrepancy">Rate Discrepancy</option>
                    <option value="Over Delivery">Over Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Packaging Unit</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="e.g. crate, box"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Ordered Quantity</label>
                  <input
                    type="number"
                    value={formOrderedQty}
                    onChange={(e) => setFormOrderedQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Actual Delivered</label>
                  <input
                    type="number"
                    value={formActualQty}
                    onChange={(e) => setFormActualQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Notes / Driver Description</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="State reason or corrective action..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Save Exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
