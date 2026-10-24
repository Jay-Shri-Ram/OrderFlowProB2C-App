import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  MapPin, 
  Phone, 
  Store, 
  Trash2, 
  Edit3,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Customer, CompanySettings } from '../types';
import { formatMoney, exportToExcel } from '../lib/utils';

interface CustomersViewProps {
  customers: Customer[];
  settings: CompanySettings;
  areas: string[];
  onCreateCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalSpend'>) => Promise<Customer>;
  onUpdateCustomer: (id: string, customer: Partial<Customer>) => Promise<Customer>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onBulkUpdateArea: (ids: string[], area: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  settings,
  areas,
  onCreateCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onBulkUpdateArea,
  onBulkDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showBulkAreaModal, setShowBulkAreaModal] = useState(false);
  const [bulkAreaTarget, setBulkAreaTarget] = useState(areas[0] || 'Downtown Central');

  // Form state
  const [formName, setFormName] = useState('');
  const [formShop, setFormShop] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formArea, setFormArea] = useState(areas[0] || 'Downtown Central');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (selectedArea !== 'All' && c.area !== selectedArea) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchShop = c.shopName.toLowerCase().includes(q);
        const matchPhone = c.phone.toLowerCase().includes(q);
        const matchArea = c.area.toLowerCase().includes(q);
        if (!matchName && !matchShop && !matchPhone && !matchArea) return false;
      }
      return true;
    });
  }, [customers, selectedArea, searchQuery]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormShop('');
    setFormPhone('');
    setFormArea(areas[0] || 'Downtown Central');
    setFormAddress('');
    setFormNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormShop(c.shopName);
    setFormPhone(c.phone);
    setFormArea(c.area);
    setFormAddress(c.address);
    setFormNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCustomer) {
      await onUpdateCustomer(editingCustomer.id, {
        name: formName.trim(),
        shopName: formShop.trim() || formName.trim(),
        phone: formPhone.trim(),
        area: formArea,
        address: formAddress.trim(),
        notes: formNotes.trim(),
      });
    } else {
      await onCreateCustomer({
        name: formName.trim(),
        shopName: formShop.trim() || formName.trim(),
        phone: formPhone.trim(),
        area: formArea,
        address: formAddress.trim(),
        notes: formNotes.trim(),
      });
    }
    setShowModal(false);
  };

  // Export to Excel
  const handleExport = () => {
    const rows = filteredCustomers.map(c => ({
      'Customer Name': c.name,
      'Shop / Store Name': c.shopName,
      'Phone': c.phone,
      'Delivery Area': c.area,
      'Address': c.address,
      'Total Orders': c.totalOrders,
      'Total Spend': c.totalSpend,
      'Notes': c.notes || ''
    }));
    exportToExcel(rows, `Customers_Export_${new Date().toISOString().slice(0, 10)}.xlsx`, 'Customers');
  };

  // Download Template
  const handleDownloadTemplate = () => {
    const template = [
      {
        'Customer Name': 'Example Merchant',
        'Shop / Store Name': 'Metro Supermart',
        'Phone': '+1 555-0199',
        'Delivery Area': 'Downtown Central',
        'Address': '123 Market Square, Suite 4',
        'Notes': 'Morning deliveries only'
      }
    ];
    exportToExcel(template, 'Customer_Import_Template.xlsx', 'Template');
  };

  // Import from Excel file
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        let count = 0;
        for (const row of data) {
          const name = row['Customer Name'] || row['name'] || row['Customer'];
          if (name) {
            await onCreateCustomer({
              name: String(name).trim(),
              shopName: String(row['Shop / Store Name'] || row['shopName'] || name).trim(),
              phone: String(row['Phone'] || row['phone'] || '').trim(),
              area: String(row['Delivery Area'] || row['area'] || areas[0]).trim(),
              address: String(row['Address'] || row['address'] || '').trim(),
              notes: String(row['Notes'] || row['notes'] || '').trim(),
            });
            count++;
          }
        }
        alert(`Successfully imported ${count} customers from Excel file.`);
      } catch (err: any) {
        alert('Failed to parse Excel file: ' + err.message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
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
            placeholder="Search customer name, shop, phone or territory..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        {/* Territory Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs"
          >
            <option value="All">All Territories</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-indigo-400 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-indigo-400 shadow-2xs"
          >
            <Upload className="w-4 h-4 text-sky-500" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            title="Download blank Excel customer template"
            className="p-2 rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white shadow-2xs"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length}
                    onChange={() => {
                      if (selectedIds.length === filteredCustomers.length) setSelectedIds([]);
                      else setSelectedIds(filteredCustomers.map(c => c.id));
                    }}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
                  />
                </th>
                <th className="py-3 px-3">Contact Name</th>
                <th className="py-3 px-3">Business / Shop</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Delivery Area</th>
                <th className="py-3 px-3">Street Address</th>
                <th className="py-3 px-3 text-center">Orders</th>
                <th className="py-3 px-3 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No customers found</p>
                    <p className="text-xs mt-1">Add your first merchant account or import from Excel.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isChecked = selectedIds.includes(cust.id);
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedIds(prev =>
                              prev.includes(cust.id) ? prev.filter(i => i !== cust.id) : [...prev, cust.id]
                            );
                          }}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
                        />
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {cust.name}
                      </td>

                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {cust.shopName}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {cust.phone || '—'}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                          {cust.area}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {cust.address || '—'}
                      </td>

                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {cust.totalOrders}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatMoney(cust.totalSpend, settings.currencySymbol)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(cust)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete customer "${cust.name}"?`)) {
                                onDeleteCustomer(cust.id);
                              }
                            }}
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

      {/* Floating Batch Bar for Customers */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl p-3 px-5 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-200 border border-slate-700">
          <span className="text-xs font-bold text-indigo-300">
            {selectedIds.length} customers selected
          </span>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkAreaModal(true)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Assign Area</span>
            </button>

            <button
              onClick={() => {
                if (confirm(`Permanently delete ${selectedIds.length} customers?`)) {
                  onBulkDelete(selectedIds);
                  setSelectedIds([]);
                }
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete</span>
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

      {/* Bulk Area Assignment Modal */}
      {showBulkAreaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Batch Assign Territory</h3>
            <p className="text-xs text-slate-400">Reassign {selectedIds.length} selected customers to:</p>
            <select
              value={bulkAreaTarget}
              onChange={(e) => setBulkAreaTarget(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            >
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkAreaModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onBulkUpdateArea(selectedIds, bulkAreaTarget);
                  setShowBulkAreaModal(false);
                  setSelectedIds([]);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl"
              >
                Update Territories
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingCustomer ? 'Edit Customer Account' : 'Register New Customer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Contact Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Jane Foster"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Shop / Business Name</label>
                <input
                  type="text"
                  value={formShop}
                  onChange={(e) => setFormShop(e.target.value)}
                  placeholder="e.g. North Bay Deli"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+1 555-..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Delivery Territory</label>
                  <select
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Physical Delivery Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Street name, floor, landmark"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Special Notes / Terms</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. 30-day billing, morning gate code"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
