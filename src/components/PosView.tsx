import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  RotateCw, 
  Lock, 
  Unlock, 
  Printer, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CalendarClock, 
  Check,
  ChevronDown
} from 'lucide-react';
import type { Customer, Product, Order, OrderItem, PaymentMethod, PaymentStatus, CompanySettings } from '../types';
import { formatMoney } from '../lib/utils';

interface PosViewProps {
  products: Product[];
  categories: string[];
  customers: Customer[];
  settings: CompanySettings;
  areas: string[];
  onSaveOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>, printReceipt: boolean) => Promise<Order>;
  onCreateCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalSpend'>) => Promise<Customer>;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  categories,
  customers,
  settings,
  areas,
  onSaveOrder,
  onCreateCustomer,
}) => {
  // State for Customer & Area
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>(areas[0] || 'Downtown Central');

  // Fast Customer Quick-Add Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustShop, setNewCustShop] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustArea, setNewCustArea] = useState(areas[0] || 'Downtown Central');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Catalog State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedUnits, setSelectedUnits] = useState<Record<string, { unitName: string; rate: number }>>({});

  // Cart / Line Items State
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [notes, setNotes] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected customer object
  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  // Filtered customers for search dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers.slice(0, 8);
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(
      c => c.name.toLowerCase().includes(q) || 
           c.shopName.toLowerCase().includes(q) || 
           c.phone.toLowerCase().includes(q) ||
           c.area.toLowerCase().includes(q)
    );
  }, [customers, customerSearchQuery]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchQuery = !productSearch.trim() || 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, productSearch]);

  // Handlers for Products & Units
  const handleSelectUnit = (productId: string, unitName: string, rate: number) => {
    setSelectedUnits(prev => ({
      ...prev,
      [productId]: { unitName, rate }
    }));
  };

  const getProductActiveUnit = (product: Product) => {
    if (selectedUnits[product.id]) return selectedUnits[product.id];
    if (product.units && product.units.length > 0) {
      return { unitName: product.units[0].unitName, rate: product.units[0].rate };
    }
    return { unitName: product.baseUnit, rate: product.rate };
  };

  const handleAddToCart = (product: Product) => {
    if (isLocked) return;
    const activeUnit = getProductActiveUnit(product);
    
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.productId === product.id && item.unit === activeUnit.unitName);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].qty += 1;
        next[existingIdx].total = +(next[existingIdx].qty * next[existingIdx].rate).toFixed(2);
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          unit: activeUnit.unitName,
          rate: activeUnit.rate,
          qty: 1,
          total: activeUnit.rate
        }
      ];
    });
  };

  const handleUpdateQty = (idx: number, delta: number) => {
    if (isLocked) return;
    setCartItems(prev => {
      const next = [...prev];
      const target = next[idx];
      const newQty = target.qty + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== idx);
      }
      target.qty = newQty;
      target.total = +(target.qty * target.rate).toFixed(2);
      return next;
    });
  };

  const handleUpdateRate = (idx: number, newRate: number) => {
    if (isLocked) return;
    setCartItems(prev => {
      const next = [...prev];
      const target = next[idx];
      target.rate = Math.max(0, newRate);
      target.total = +(target.qty * target.rate).toFixed(2);
      return next;
    });
  };

  const handleRemoveItem = (idx: number) => {
    if (isLocked) return;
    setCartItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleClearCart = () => {
    if (isLocked) return;
    setCartItems([]);
    setDiscount(0);
    setDeliveryFee(0);
    setNotes('');
  };

  // Calculations
  const subtotal = useMemo(() => {
    return +(cartItems.reduce((sum, item) => sum + item.total, 0)).toFixed(2);
  }, [cartItems]);

  const taxPercent = settings.taxRatePercent || 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxAmount = +(taxableAmount * (taxPercent / 100)).toFixed(2);
  const total = +(taxableAmount + taxAmount + deliveryFee).toFixed(2);

  // Quick Customer Creation
  const handleSaveQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    try {
      const created = await onCreateCustomer({
        name: newCustName.trim(),
        shopName: newCustShop.trim() || newCustName.trim(),
        phone: newCustPhone.trim(),
        area: newCustArea,
        address: newCustAddress.trim(),
        notes: ''
      });
      setSelectedCustomerId(created.id);
      setSelectedArea(created.area);
      setShowAddCustomerModal(false);
      setNewCustName('');
      setNewCustShop('');
      setNewCustPhone('');
      setNewCustAddress('');
    } catch (err: any) {
      alert(err.message || 'Failed to save customer');
    }
  };

  // Submit Order
  const handleProcessOrder = async (printReceipt = false) => {
    if (cartItems.length === 0) {
      alert('Cannot create an empty order. Please add products to the ticket.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveOrder({
        customerId: selectedCustomerId || 'walk-in',
        customerName: activeCustomer ? activeCustomer.name : 'Walk-in Counter Guest',
        customerShop: activeCustomer ? activeCustomer.shopName : 'Over-the-counter',
        customerPhone: activeCustomer ? activeCustomer.phone : '',
        area: selectedArea,
        items: cartItems,
        subtotal,
        taxPercent,
        taxAmount,
        discount,
        deliveryFee,
        total,
        paymentMethod,
        paymentStatus,
        orderStatus: 'Pending',
        notes
      }, printReceipt);

      // Reset cart after successful order creation
      setCartItems([]);
      setDiscount(0);
      setDeliveryFee(0);
      setNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4 max-w-[1600px] mx-auto pb-16 lg:pb-0 overflow-hidden">
      {/* ================= LEFT COLUMN: CATALOG & SEARCH (60%) ================= */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0d1424] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Top Header: Customer Picker & Delivery Area */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-wrap items-center gap-2 sm:gap-4 justify-between">
          {/* Customer Selection Dropdown */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 text-xs text-left shadow-2xs hover:border-indigo-400 transition-colors"
              >
                <div className="truncate">
                  {activeCustomer ? (
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{activeCustomer.name}</span>
                      <span className="text-[11px] text-slate-400 ml-1.5">({activeCustomer.shopName})</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Select or Search Customer...</span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              </button>

              <button
                onClick={() => setShowAddCustomerModal(true)}
                title="Add New Customer"
                className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors shrink-0"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Dropdown Menu */}
            {customerDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full sm:w-80 p-2 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="Search name, phone, shop..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <button
                    onClick={() => {
                      setSelectedCustomerId('');
                      setCustomerDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white">Walk-in Counter Guest</div>
                    <div className="text-[10px] text-slate-400">Standard direct sale</div>
                  </button>
                  {filteredCustomers.map(cust => (
                    <button
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomerId(cust.id);
                        setSelectedArea(cust.area);
                        setCustomerDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">{cust.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span>{cust.shopName}</span>
                        <span>·</span>
                        <span>{cust.area}</span>
                        <span>·</span>
                        <span>{cust.phone}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Area Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Territory:</span>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              {areas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar & Category Filter Chips */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product name or SKU..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Category Chips Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product) => {
            const activeUnit = getProductActiveUnit(product);
            const inCart = cartItems.find(item => item.productId === product.id && item.unit === activeUnit.unitName);

            return (
              <div
                key={product.id}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111a2e] hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between group shadow-2xs hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                      {product.category}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                      {product.stock} {product.baseUnit}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-1 line-clamp-2">
                    {product.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {/* Unit Selector if multiple units exist */}
                  {product.units && product.units.length > 1 ? (
                    <select
                      value={activeUnit.unitName}
                      onChange={(e) => {
                        const target = product.units.find(u => u.unitName === e.target.value);
                        if (target) handleSelectUnit(product.id, target.unitName, target.rate);
                      }}
                      className="w-full text-[11px] font-medium py-1 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {product.units.map(u => (
                        <option key={u.unitName} value={u.unitName}>
                          {u.unitName} — {formatMoney(u.rate, settings.currencySymbol)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[11px] text-slate-400">
                      Unit: <span className="font-medium text-slate-600 dark:text-slate-300">{product.baseUnit}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs sm:text-sm font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                      {formatMoney(activeUnit.rate, settings.currencySymbol)}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                        inCart
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                      }`}
                    >
                      {inCart ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>+{inCart.qty}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= RIGHT COLUMN: ORDER TICKET & CART (40%) ================= */}
      <div className="w-full lg:w-[440px] flex flex-col bg-white dark:bg-[#0d1424] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden shrink-0">
        {/* Ticket Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                {settings.orderPrefix || 'ORD-'}{settings.nextOrderSequence || 1015}
              </span>
              <button
                onClick={() => setIsLocked(!isLocked)}
                title={isLocked ? "Unlock cart ticket" : "Lock cart ticket"}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-[11px] text-slate-400">
              {activeCustomer ? `${activeCustomer.name} (${activeCustomer.area})` : 'Walk-in Counter Order'}
            </div>
          </div>

          <button
            onClick={handleClearCart}
            disabled={cartItems.length === 0 || isLocked}
            className="text-xs font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Ticket Line Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">Ticket is empty</div>
              <div className="text-xs mt-1">Tap items from the catalog on the left to add to this order ticket.</div>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={`${item.productId}-${item.unit}`} className="py-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-400">{item.unit}</div>
                  </div>
                  <div className="text-xs font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                    {formatMoney(item.total, settings.currencySymbol)}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handleUpdateQty(idx, -1)}
                      disabled={isLocked}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold px-1 min-w-[20px] text-center tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(idx, 1)}
                      disabled={isLocked}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Rate override */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">@</span>
                    <input
                      type="number"
                      step="0.01"
                      disabled={isLocked}
                      value={item.rate}
                      onChange={(e) => handleUpdateRate(idx, parseFloat(e.target.value) || 0)}
                      className="w-16 px-1.5 py-0.5 text-right font-mono text-xs rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveItem(idx)}
                    disabled={isLocked}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Ticket Calculations & Payment Controls */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
          {/* Discount & Delivery */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Discount ({settings.currencySymbol})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={isLocked}
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Delivery Fee ({settings.currencySymbol})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={isLocked}
                value={deliveryFee || ''}
                onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-2 py-1 text-xs rounded-lg bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
          </div>

          {/* Subtotal & Tax Breakdown */}
          <div className="space-y-1 text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{formatMoney(subtotal, settings.currencySymbol)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>Discount</span>
                <span className="font-mono tabular-nums">-{formatMoney(discount, settings.currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Tax ({taxPercent}%)</span>
              <span className="font-mono tabular-nums">{formatMoney(taxAmount, settings.currencySymbol)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Delivery Charge</span>
                <span className="font-mono tabular-nums">{formatMoney(deliveryFee, settings.currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Grand Total</span>
              <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                {formatMoney(total, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 mb-1">Payment Method</div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'Cash' as PaymentMethod, icon: Banknote, label: 'Cash' },
                { id: 'UPI' as PaymentMethod, icon: QrCode, label: 'UPI QR' },
                { id: 'Card' as PaymentMethod, icon: CreditCard, label: 'Card' },
                { id: 'Pay Later' as PaymentMethod, icon: CalendarClock, label: 'Credit' },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id);
                      if (method.id === 'Pay Later') setPaymentStatus('Unpaid');
                      else setPaymentStatus('Paid');
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-0.5" />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Order Actions: Instant Print & Pay or Save Order */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleProcessOrder(true)}
              disabled={isSubmitting || cartItems.length === 0}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print & Pay</span>
            </button>

            <button
              onClick={() => handleProcessOrder(false)}
              disabled={isSubmitting || cartItems.length === 0}
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Save Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= QUICK ADD CUSTOMER MODAL ================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Add Customer</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveQuickCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Customer / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Shop / Business Name</label>
                <input
                  type="text"
                  value={newCustShop}
                  onChange={(e) => setNewCustShop(e.target.value)}
                  placeholder="e.g. Doe Cafe & Pantry"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+1 555-..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Delivery Area</label>
                  <select
                    value={newCustArea}
                    onChange={(e) => setNewCustArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Street name, suite or floor"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
