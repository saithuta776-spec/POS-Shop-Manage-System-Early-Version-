import React, { useRef } from 'react';
import { Voucher, VoucherItem } from '../types';
import { Printer, CheckCircle, Copy, X, Receipt, ShoppingBag } from 'lucide-react';

interface ReceiptModalProps {
  voucher: Voucher | null;
  items: VoucherItem[];
  isOpen: boolean;
  onClose: () => void;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  voucher,
  items,
  isOpen,
  onClose,
  shopName = 'THE BOTANICAL CORNER',
  shopAddress = '108 Greenfield Avenue, Suite 4B',
  shopPhone = '+1 (555) 349-2810',
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !voucher) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (!voucher) return;
    const dateFormatted = new Date(voucher.created_at).toLocaleString();
    const itemLines = items
      .map(i => `${i.quantity}x ${i.product_name} @ $${i.unit_price.toFixed(2)} = $${i.subtotal.toFixed(2)}`)
      .join('\n');

    const textReceipt = `
========================================
${shopName.toUpperCase()}
${shopAddress}
Tel: ${shopPhone}
----------------------------------------
VOUCHER #: ${voucher.voucher_number}
DATE: ${dateFormatted}
STAFF: ${voucher.staff_name || 'Cashier'}
CUSTOMER: ${voucher.customer_name || 'Walk-in'}
PAYMENT: ${voucher.payment_method || 'Cash'}
----------------------------------------
ITEMS:
${itemLines}
----------------------------------------
TOTAL AMOUNT: $${voucher.total_amount.toFixed(2)}
========================================
Thank you for supporting our local shop!
========================================
`;
    navigator.clipboard.writeText(textReceipt.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedDate = new Date(voucher.created_at).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = new Date(voucher.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    >
      <div
        id="receipt-modal-card"
        className="bg-[#0a0a0a] rounded-2xl shadow-2xl border border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0e0e0e] border-b border-white/10 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">Official Sales Voucher</span>
          </div>
          <button
            id="close-receipt-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Canvas */}
        <div
          ref={receiptRef}
          id="printable-receipt"
          className="p-6 sm:p-8 bg-[#0d0d0d] text-slate-200 font-mono text-sm border-b border-white/10 print:p-0 print:bg-white print:text-black"
        >
          {/* Shop Header */}
          <div className="text-center pb-4 border-b border-dashed border-white/10 print:border-black/20">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2 print:bg-emerald-100 print:text-emerald-800">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base tracking-wider text-white uppercase print:text-black">{shopName}</h2>
            <p className="text-xs text-slate-400 mt-0.5 print:text-neutral-600">{shopAddress}</p>
            <p className="text-xs text-slate-400 print:text-neutral-600">Tel: {shopPhone}</p>
          </div>

          {/* Voucher Info */}
          <div className="py-3 border-b border-dashed border-white/10 print:border-black/20 text-xs space-y-1 text-slate-400 print:text-neutral-700">
            <div className="flex justify-between">
              <span className="text-slate-500 print:text-neutral-500">VOUCHER NO:</span>
              <span className="font-bold text-emerald-400 font-mono print:text-black">{voucher.voucher_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 print:text-neutral-500">DATE & TIME:</span>
              <span className="text-slate-300 print:text-black">{formattedDate} {formattedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 print:text-neutral-500">CASHIER / STAFF:</span>
              <span className="text-slate-300 print:text-black">{voucher.staff_name || 'Staff'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 print:text-neutral-500">CUSTOMER:</span>
              <span className="text-slate-300 print:text-black">{voucher.customer_name || 'Walk-in'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 print:text-neutral-500">PAYMENT METHOD:</span>
              <span className="font-semibold px-2 py-0.5 bg-white/5 border border-white/10 rounded text-slate-200 text-[11px] print:bg-neutral-200 print:text-black">
                {voucher.payment_method || 'Cash'}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-3 border-b border-dashed border-white/10 print:border-black/20">
            <div className="grid grid-cols-12 text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-white/10 print:border-neutral-200 print:text-neutral-500">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            <div className="divide-y divide-white/5 print:divide-neutral-200 mt-2 space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-xs pt-1.5">
                  <div className="col-span-6 pr-2 font-medium text-slate-200 break-words leading-tight print:text-black">
                    {item.product_name}
                  </div>
                  <div className="col-span-2 text-center text-slate-400 print:text-neutral-700">
                    {item.quantity}
                  </div>
                  <div className="col-span-2 text-right text-slate-400 print:text-neutral-600">
                    ${item.unit_price.toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right font-bold text-white print:text-black">
                    ${item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="py-3 space-y-1.5 text-xs text-slate-400 print:text-neutral-700 border-b border-dashed border-white/10 print:border-black/20">
            <div className="flex justify-between">
              <span>Total Items:</span>
              <span className="font-medium text-slate-200 print:text-black">
                {items.reduce((acc, i) => acc + i.quantity, 0)} pcs
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-1 print:text-black">
              <span>GRAND TOTAL:</span>
              <span className="text-emerald-400 text-lg font-mono print:text-emerald-700">${voucher.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Barcode & Footer */}
          <div className="pt-4 text-center space-y-2">
            <div className="inline-block py-1.5 px-4 bg-[#050505] border border-white/10 rounded print:bg-white print:border-black/30">
              <div className="font-mono tracking-widest text-[10px] text-slate-500 print:text-black">
                ||| | |||| || | ||||| || ||| || ||||
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider print:text-neutral-600">{voucher.voucher_number}</div>
            </div>
            <p className="text-[11px] text-slate-500 italic print:text-neutral-600">
              Thank you for your visit! Please retain this voucher for your records.
            </p>
          </div>
        </div>

        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-[#0a0a0a] flex flex-col sm:flex-row items-center gap-2.5 print:hidden">
          <button
            id="print-receipt-btn"
            onClick={handlePrint}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold rounded-xl text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <button
            id="copy-receipt-btn"
            onClick={handleCopyText}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 font-medium rounded-xl text-xs transition-colors cursor-pointer border border-white/5"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            id="done-receipt-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-slate-300 font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
};
