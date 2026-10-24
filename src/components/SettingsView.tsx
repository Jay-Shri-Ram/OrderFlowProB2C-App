import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Upload, 
  Trash2, 
  Save, 
  Database, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  Palette, 
  Check, 
  Image as ImageIcon
} from 'lucide-react';
import type { CompanySettings, DatabaseState } from '../types';

interface SettingsViewProps {
  settings: CompanySettings;
  onSaveSettings: (settings: Partial<CompanySettings>) => Promise<void>;
  onExportDatabase: () => void;
  onRestoreDatabase: (db: DatabaseState) => Promise<void>;
  onResetDatabase: () => Promise<void>;
  currentPalette: string;
  onSelectPalette: (palette: string) => void;
  recordCounts: {
    orders: number;
    customers: number;
    products: number;
    exceptions: number;
  };
}

const PALETTES = [
  { id: 'indigo', name: 'Indigo Corporate', bg: '#6366f1' },
  { id: 'emerald', name: 'Emerald Fresh', bg: '#10b981' },
  { id: 'ocean', name: 'Oceanic Blue', bg: '#0ea5e9' },
  { id: 'rose', name: 'Rose Boutique', bg: '#f43f5e' },
  { id: 'amber', name: 'Amber Warmth', bg: '#f59e0b' },
  { id: 'violet', name: 'Violet Luxury', bg: '#8b5cf6' },
  { id: 'teal', name: 'Teal Modern', bg: '#14b8a6' },
  { id: 'slate', name: 'Slate Industrial', bg: '#64748b' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onExportDatabase,
  onRestoreDatabase,
  onResetDatabase,
  currentPalette,
  onSelectPalette,
  recordCounts,
}) => {
  // Form State
  const [storeName, setStoreName] = useState(settings.storeName || '');
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [email, setEmail] = useState(settings.email || '');
  const [address, setAddress] = useState(settings.address || '');
  const [taxId, setTaxId] = useState(settings.taxId || '');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '$');
  const [currencyCode, setCurrencyCode] = useState(settings.currencyCode || 'USD');
  const [taxRatePercent, setTaxRatePercent] = useState<number>(settings.taxRatePercent ?? 5);
  const [orderPrefix, setOrderPrefix] = useState(settings.orderPrefix || 'ORD-');
  const [nextOrderSequence, setNextOrderSequence] = useState<number>(settings.nextOrderSequence || 1015);
  const [upiId, setUpiId] = useState(settings.upiId || '');
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(settings.invoiceFooterNote || '');
  const [adminPin, setAdminPin] = useState(settings.adminPin || '1234');
  const [logoBase64, setLogoBase64] = useState<string>(settings.logoBase64 || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pinPromptAction, setPinPromptAction] = useState<null | 'reset'>(null);
  const [enteredPin, setEnteredPin] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Logo file upload handler
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        setLogoBase64(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoBase64('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSubmitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings({
        storeName: storeName.trim(),
        tagline: tagline.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        taxId: taxId.trim(),
        currencySymbol: currencySymbol.trim(),
        currencyCode: currencyCode.trim(),
        taxRatePercent,
        orderPrefix: orderPrefix.trim(),
        nextOrderSequence,
        upiId: upiId.trim(),
        invoiceFooterNote: invoiceFooterNote.trim(),
        adminPin: adminPin.trim(),
        logoBase64,
        themePalette: currentPalette,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Restore DB File
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.settings || !parsed.products) {
          throw new Error('File does not match OrderFlow database schema.');
        }
        await onRestoreDatabase(parsed);
        alert('Database restored successfully from backup file!');
      } catch (err: any) {
        alert('Restore failed: ' + err.message);
      } finally {
        if (restoreInputRef.current) restoreInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = async () => {
    if (enteredPin !== adminPin) {
      alert('Incorrect Security PIN. Action cancelled.');
      return;
    }
    await onResetDatabase();
    setPinPromptAction(null);
    setEnteredPin('');
    alert('Database successfully reset to demo state.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <span>Store Configuration & Database Engine</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage company profile, upload your custom logo, customize receipts and persist data
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Saved to Database!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitSettings} className="space-y-6">
        {/* ================= SECTION 1: COMPANY LOGO & BRANDING ================= */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Company Logo & Visual Brand</h3>
              <p className="text-xs text-slate-400">Uploaded logo persists in the database and renders on invoices & header</p>
            </div>
            <span className="text-[10px] font-semibold uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
              High Resolution
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Logo Preview Frame */}
            <div className="relative w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-2 overflow-hidden shrink-0 group">
              {logoBase64 ? (
                <img
                  src={logoBase64}
                  alt="Company Logo Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 p-2">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                  <span className="text-[10px] block">No Logo Uploaded</span>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="space-y-3 flex-1 text-xs">
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoFileChange}
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Store Logo</span>
                </button>

                {logoBase64 && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Logo</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Recommended: Transparent PNG, SVG or JPEG (square or horizontal layout, max 5MB). Automatically scales to thermal slip & A4 format.
              </p>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: COMPANY INFORMATION ================= */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Store Identity & Legal Details</h3>
            <p className="text-xs text-slate-400">Printed on customer receipts, quotes, and tax invoices</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Company / Store Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Apex Mart & Wholesale"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Store Tagline / Slogan</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Quality Groceries & Rapid Dispatch"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Support Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Official Business Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@company.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Physical Store & Billing Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Building, street, district, city, zip code"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tax Registration / GSTIN / VAT ID</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. US-TAX-998822-B"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">UPI Payee ID (for QR payment links)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. merchant@okhdfcbank"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* ================= SECTION 3: INVOICE & CURRENCY CONFIG ================= */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Financial, Currency & Numbering Rules</h3>
            <p className="text-xs text-slate-400">Order ticket increments and tax calculations</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="$"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                placeholder="5.0"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Order ID Prefix</label>
              <input
                type="text"
                value={orderPrefix}
                onChange={(e) => setOrderPrefix(e.target.value)}
                placeholder="ORD-"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Next Sequence No.</label>
              <input
                type="number"
                value={nextOrderSequence}
                onChange={(e) => setNextOrderSequence(parseInt(e.target.value) || 1000)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Invoice Footer Note & Terms</label>
              <textarea
                rows={2}
                value={invoiceFooterNote}
                onChange={(e) => setInvoiceFooterNote(e.target.value)}
                placeholder="Terms and conditions printed at bottom of customer receipt..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* ================= SECTION 4: THEME PALETTE & PIN ================= */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Theme Palette & Security</h3>
              <p className="text-xs text-slate-400">Choose accent palette and master security PIN</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-2">Color Theme Palette</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PALETTES.map((p) => {
                  const isSelected = currentPalette === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectPalette(p.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111a2e] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: p.bg }} />
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Manager Security PIN (4 digits)</label>
              <input
                type="password"
                maxLength={6}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="1234"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono tracking-widest text-center"
              />
            </div>
          </div>
        </div>

        {/* Primary Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md hover:shadow-indigo-500/25 active:scale-98 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Database...' : 'Save Store Details & Logo'}</span>
          </button>
        </div>
      </form>

      {/* ================= SECTION 5: DATABASE BACKUP & RESTORE ================= */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Full Database Persistence & Disaster Recovery</span>
            </h3>
            <p className="text-xs text-slate-400">All data stored atomically in /data/database.json on the server</p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            AUTO-SYNC ON
          </span>
        </div>

        {/* Record Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Orders Saved</span>
            <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
              {recordCounts.orders}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customers</span>
            <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
              {recordCounts.customers}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Products</span>
            <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
              {recordCounts.products}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Exceptions</span>
            <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
              {recordCounts.exceptions}
            </span>
          </div>
        </div>

        {/* Actions Strip */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          <button
            type="button"
            onClick={onExportDatabase}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Database JSON Backup</span>
          </button>

          <input
            type="file"
            ref={restoreInputRef}
            onChange={handleRestoreFile}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => restoreInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
          >
            <Upload className="w-4 h-4 text-sky-500" />
            <span>Restore From JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setPinPromptAction('reset')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset To Clean Demo</span>
          </button>
        </div>
      </div>

      {/* PIN Prompt Modal for Reset */}
      {pinPromptAction === 'reset' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Enter Security PIN to Reset</span>
            </div>
            <p className="text-xs text-slate-400">
              Resetting will replace all custom products, orders, and company settings with default sample data. Default PIN: <code className="font-mono text-indigo-400">{adminPin}</code>.
            </p>
            <input
              type="password"
              autoFocus
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono tracking-widest text-center text-lg"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setPinPromptAction(null); setEnteredPin(''); }}
                className="px-3 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-xl"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
