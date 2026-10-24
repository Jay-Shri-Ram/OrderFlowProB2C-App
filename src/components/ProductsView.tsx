import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  Tags, 
  Layers, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';
import type { Product, UnitRateTier, CompanySettings } from '../types';
import { formatMoney, exportToExcel } from '../lib/utils';

interface ProductsViewProps {
  products: Product[];
  categories: string[];
  commonUnits: string[];
  settings: CompanySettings;
  onCreateProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  onUpdateProduct: (id: string, product: Partial<Product>) => Promise<Product>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAddCategory: (cat: string) => Promise<void>;
  onDeleteCategory: (cat: string) => Promise<void>;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  commonUnits,
  settings,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0] || 'Produce & Fruits');
  const [formBaseUnit, setFormBaseUnit] = useState('kg');
  const [formRate, setFormRate] = useState<number>(10);
  const [formStock, setFormStock] = useState<number>(100);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formUnits, setFormUnits] = useState<UnitRateTier[]>([
    { unitName: 'kg', conversionFactor: 1, rate: 10 }
  ]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku && p.sku.toLowerCase().includes(q);
        if (!matchName && !matchSku) return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategory(categories[0] || 'Produce & Fruits');
    setFormBaseUnit('kg');
    setFormRate(10);
    setFormStock(100);
    setFormIsActive(true);
    setFormUnits([{ unitName: 'kg', conversionFactor: 1, rate: 10 }]);
    setShowProductModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku || '');
    setFormCategory(p.category);
    setFormBaseUnit(p.baseUnit);
    setFormRate(p.rate);
    setFormStock(p.stock);
    setFormIsActive(p.isActive);
    setFormUnits(p.units && p.units.length > 0 ? [...p.units] : [{ unitName: p.baseUnit, conversionFactor: 1, rate: p.rate }]);
    setShowProductModal(true);
  };

  // Add Unit Row
  const handleAddUnitRow = () => {
    setFormUnits(prev => [
      ...prev,
      { unitName: 'box (5kg)', conversionFactor: 5, rate: +(formRate * 4.8).toFixed(2) }
    ]);
  };

  const handleRemoveUnitRow = (index: number) => {
    if (formUnits.length <= 1) return;
    setFormUnits(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateUnitRow = (index: number, field: keyof UnitRateTier, val: any) => {
    setFormUnits(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, {
        name: formName.trim(),
        sku: formSku.trim(),
        category: formCategory,
        baseUnit: formBaseUnit,
        rate: formRate,
        stock: formStock,
        isActive: formIsActive,
        units: formUnits,
      });
    } else {
      await onCreateProduct({
        name: formName.trim(),
        sku: formSku.trim(),
        category: formCategory,
        baseUnit: formBaseUnit,
        rate: formRate,
        stock: formStock,
        isActive: formIsActive,
        units: formUnits,
      });
    }
    setShowProductModal(false);
  };

  // Export to Excel
  const handleExport = () => {
    const rows = filteredProducts.map(p => ({
      'SKU': p.sku || '',
      'Product Name': p.name,
      'Category': p.category,
      'Base Unit': p.baseUnit,
      'Base Rate': p.rate,
      'Stock Level': p.stock,
      'Active': p.isActive ? 'Yes' : 'No',
      'Packaging Tiers': p.units.map(u => `${u.unitName} ($${u.rate})`).join('; ')
    }));
    exportToExcel(rows, `Catalog_Export_${new Date().toISOString().slice(0, 10)}.xlsx`, 'Catalog');
  };

  const handleAddNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await onAddCategory(newCatName.trim());
    setNewCatName('');
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
            placeholder="Search product name or SKU..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        {/* Category Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs"
          >
            <option value="All">All Categories ({products.length})</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-indigo-400 shadow-2xs"
          >
            <Tags className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Categories</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-indigo-400 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Base Unit</th>
                <th className="py-3 px-3 text-right">Base Rate</th>
                <th className="py-3 px-3">Pack Variations & Rates</th>
                <th className="py-3 px-3 text-center">In Stock</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No catalog products found</p>
                    <p className="text-xs mt-1">Add your first item with custom unit tiers.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-500">
                      {p.sku || '—'}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </td>

                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {p.category}
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                        {p.baseUnit}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatMoney(p.rate, settings.currencySymbol)}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {p.units && p.units.map((u, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800"
                          >
                            {u.unitName}: {formatMoney(u.rate, settings.currencySymbol)}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold tabular-nums">
                      <span className={p.stock < 20 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}>
                        {p.stock}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete product "${p.name}"?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Categories Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Product Categories</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddNewCategory} className="flex gap-2">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New category name..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Add
              </button>
            </form>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {categories.map((c) => (
                <div key={c} className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{c}</span>
                  <button
                    onClick={() => onDeleteCategory(c)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Organic Avocados"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. AVO-001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Base Unit</label>
                  <select
                    value={formBaseUnit}
                    onChange={(e) => setFormBaseUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  >
                    {commonUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Base Rate ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formRate}
                    onChange={(e) => setFormRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Current Stock Level</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-active"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="chk-active" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Item is Available for Sale
                  </label>
                </div>
              </div>

              {/* Multi-Unit Pricing Tiers */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white">Packaging & Unit Variants</label>
                  <button
                    type="button"
                    onClick={handleAddUnitRow}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formUnits.map((u, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                      <input
                        type="text"
                        placeholder="Variant name (e.g. box 5kg)"
                        value={u.unitName}
                        onChange={(e) => handleUpdateUnitRow(idx, 'unitName', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ratio"
                        title="Conversion ratio to base unit"
                        value={u.conversionFactor}
                        onChange={(e) => handleUpdateUnitRow(idx, 'conversionFactor', parseFloat(e.target.value) || 1)}
                        className="w-16 px-2 py-1.5 text-right rounded-lg bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 font-mono"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">{settings.currencySymbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={u.rate}
                          onChange={(e) => handleUpdateUnitRow(idx, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-right rounded-lg bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 font-mono font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUnitRow(idx)}
                        disabled={formUnits.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
