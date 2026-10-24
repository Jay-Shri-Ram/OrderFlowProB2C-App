import React, { useState } from 'react';
import { 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Receipt, 
  FileText, 
  X,
  Building2
} from 'lucide-react';
import type { Order, CompanySettings } from '../types';
import { formatMoney, formatDateTime, generateUpiUrl, getUpiQrCodeUrl } from '../lib/utils';

interface InvoiceModalProps {
  order: Order | null;
  settings: CompanySettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  settings,
  onClose,
}) => {
  const [printMode, setPrintMode] = useState<'thermal' | 'a4'>('thermal');
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const upiUrl = generateUpiUrl(
    settings.upiId || 'store@upi',
    settings.storeName,
    order.total,
    order.orderNumber
  );
  const upiQrCodeUrl = getUpiQrCodeUrl(upiUrl);

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp text representation
  const generateBillText = () => {
    const lines = [
      `*${settings.storeName.toUpperCase()}*`,
      settings.tagline ? `${settings.tagline}` : '',
      `Phone: ${settings.phone}`,
      `--------------------------------`,
      `*Order #:* ${order.orderNumber}`,
      `*Date:* ${formatDateTime(order.createdAt)}`,
      `*Customer:* ${order.customerName}`,
      order.customerShop ? `*Shop:* ${order.customerShop}` : '',
      `*Area:* ${order.area}`,
      `--------------------------------`,
      ...order.items.map(i => `${i.name} (${i.unit})\n  ${i.qty} x ${settings.currencySymbol}${i.rate.toFixed(2)} = *${settings.currencySymbol}${i.total.toFixed(2)}*`),
      `--------------------------------`,
      `Subtotal: ${settings.currencySymbol}${order.subtotal.toFixed(2)}`,
      order.discount > 0 ? `Discount: -${settings.currencySymbol}${order.discount.toFixed(2)}` : '',
      `Tax (${order.taxPercent}%): ${settings.currencySymbol}${order.taxAmount.toFixed(2)}`,
      order.deliveryFee > 0 ? `Delivery: ${settings.currencySymbol}${order.deliveryFee.toFixed(2)}` : '',
      `*TOTAL: ${settings.currencySymbol}${order.total.toFixed(2)}*`,
      `*Payment:* ${order.paymentMethod} (${order.paymentStatus})`,
      `--------------------------------`,
      `${settings.invoiceFooterNote}`,
    ].filter(Boolean).join('\n');
    return lines;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(generateBillText());
    const phoneClean = order.customerPhone.replace(/[^0-9]/g, '');
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateBillText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Control Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/40">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setPrintMode('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                printMode === 'thermal'
                  ? 'bg-white dark:bg-[#0c1220] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Thermal Slip (80mm)</span>
            </button>
            <button
              onClick={() => setPrintMode('a4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                printMode === 'a4'
                  ? 'bg-white dark:bg-[#0c1220] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Formal A4 Tax Invoice</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= PRINTABLE AREA CONTAINER ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="printable-receipt-area"
            className={`bg-white text-slate-900 shadow-xl transition-all ${
              printMode === 'thermal'
                ? 'w-full max-w-[340px] p-4 text-[12px] font-mono leading-tight'
                : 'w-full max-w-xl p-8 text-xs font-sans'
            }`}
          >
            {/* ================= THERMAL RECEIPT LAYOUT ================= */}
            {printMode === 'thermal' ? (
              <div className="space-y-3 text-center">
                {/* Store Header with Logo */}
                <div className="flex flex-col items-center">
                  {settings.logoBase64 ? (
                    <img
                      src={settings.logoBase64}
                      alt={settings.storeName}
                      className="h-12 object-contain mb-1.5"
                    />
                  ) : null}
                  <div className="font-bold text-sm uppercase tracking-wider">{settings.storeName}</div>
                  {settings.tagline && <div className="text-[10px] text-slate-500">{settings.tagline}</div>}
                  <div className="text-[10px] text-slate-600 mt-0.5">{settings.address}</div>
                  <div className="text-[10px] text-slate-600">Tel: {settings.phone}</div>
                  {settings.taxId && <div className="text-[10px] text-slate-600">GST/Tax: {settings.taxId}</div>}
                </div>

                <div className="border-t border-dashed border-slate-300 my-2" />

                {/* Ticket Details */}
                <div className="text-left text-[11px] space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>Order: {order.orderNumber}</span>
                    <span>{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div>Customer: {order.customerName}</div>
                  {order.customerShop && <div>Shop: {order.customerShop}</div>}
                  {order.customerPhone && <div>Phone: {order.customerPhone}</div>}
                  <div>Area: {order.area}</div>
                </div>

                <div className="border-t border-dashed border-slate-300 my-2" />

                {/* Items Table */}
                <div className="text-left space-y-1.5">
                  <div className="flex justify-between font-bold text-[10px] border-b border-slate-200 pb-1">
                    <span>ITEM</span>
                    <span>QTY · RATE</span>
                    <span>TOTAL</span>
                  </div>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-bold truncate">{item.name}</div>
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span>{item.qty} {item.unit} @ {formatMoney(item.rate, settings.currencySymbol)}</span>
                        <span className="font-bold text-slate-900">{formatMoney(item.total, settings.currencySymbol)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-slate-300 my-2" />

                {/* Totals */}
                <div className="text-left space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatMoney(order.subtotal, settings.currencySymbol)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Discount:</span>
                      <span>-{formatMoney(order.discount, settings.currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({order.taxPercent}%):</span>
                    <span>{formatMoney(order.taxAmount, settings.currencySymbol)}</span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Fee:</span>
                      <span>{formatMoney(order.deliveryFee, settings.currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold border-t border-b border-slate-900 py-1 my-1">
                    <span>GRAND TOTAL:</span>
                    <span>{formatMoney(order.total, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>PAYMENT:</span>
                    <span>{order.paymentMethod.toUpperCase()} ({order.paymentStatus.toUpperCase()})</span>
                  </div>
                </div>

                {/* UPI QR Code for instant payment */}
                {settings.upiId && (
                  <div className="pt-2 flex flex-col items-center">
                    <img
                      src={upiQrCodeUrl}
                      alt="UPI QR Code"
                      className="w-24 h-24 border border-slate-300 p-1 rounded"
                    />
                    <span className="text-[9px] text-slate-500 mt-1">Scan to Pay via Any UPI App</span>
                  </div>
                )}

                {/* Footer Note */}
                <div className="text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
                  {settings.invoiceFooterNote}
                </div>
              </div>
            ) : (
              /* ================= FORMAL A4 TAX INVOICE LAYOUT ================= */
              <div className="space-y-6">
                {/* Header Strip */}
                <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-4">
                  <div className="flex items-center gap-3">
                    {settings.logoBase64 ? (
                      <img
                        src={settings.logoBase64}
                        alt={settings.storeName}
                        className="h-16 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl">
                        {settings.storeName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{settings.storeName}</h2>
                      <div className="text-xs text-slate-500">{settings.tagline}</div>
                      <div className="text-[11px] text-slate-600">{settings.address}</div>
                      <div className="text-[11px] text-slate-600">Phone: {settings.phone} · Email: {settings.email}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Tax Invoice</span>
                    <div className="text-lg font-black font-mono mt-0.5">{order.orderNumber}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</div>
                    {settings.taxId && (
                      <div className="text-[11px] text-slate-600 mt-1 font-mono">Tax ID: {settings.taxId}</div>
                    )}
                  </div>
                </div>

                {/* Bill To */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Billed To Customer:</span>
                    <div className="font-bold text-slate-900 text-sm">{order.customerName}</div>
                    {order.customerShop && <div className="text-slate-600">{order.customerShop}</div>}
                    {order.customerPhone && <div className="text-slate-600">Phone: {order.customerPhone}</div>}
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Delivery Destination:</span>
                    <div className="font-bold text-slate-800">Territory: {order.area}</div>
                    <div className="text-slate-600 mt-1">Payment Method: <span className="font-bold">{order.paymentMethod}</span> ({order.paymentStatus})</div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 font-bold uppercase text-[10px] tracking-wider text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Description & Category</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.category}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">{item.unit}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatMoney(item.rate, settings.currencySymbol)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{item.qty}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatMoney(item.total, settings.currencySymbol)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Bottom Calculation & QR */}
                <div className="flex items-start justify-between gap-6 pt-2">
                  <div className="flex items-center gap-3">
                    {settings.upiId && (
                      <div className="border border-slate-200 p-2 rounded-xl text-center bg-slate-50">
                        <img src={upiQrCodeUrl} alt="UPI QR" className="w-20 h-20" />
                        <span className="text-[9px] text-slate-500 block mt-1">Instant Scan Pay</span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 max-w-xs">
                      {settings.invoiceFooterNote}
                    </div>
                  </div>

                  <div className="w-60 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatMoney(order.subtotal, settings.currencySymbol)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Discount:</span>
                        <span className="font-mono">-{formatMoney(order.discount, settings.currencySymbol)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Tax ({order.taxPercent}%):</span>
                      <span className="font-mono">{formatMoney(order.taxAmount, settings.currencySymbol)}</span>
                    </div>
                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Delivery Fee:</span>
                        <span className="font-mono">{formatMoney(order.deliveryFee, settings.currencySymbol)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black border-t-2 border-indigo-600 pt-1 text-slate-900">
                      <span>Grand Total:</span>
                      <span className="font-mono text-indigo-600">{formatMoney(order.total, settings.currencySymbol)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#0c1220]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Invoice</span>
            </button>

            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Bill Text'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print {printMode === 'thermal' ? 'Slip' : 'A4 Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
