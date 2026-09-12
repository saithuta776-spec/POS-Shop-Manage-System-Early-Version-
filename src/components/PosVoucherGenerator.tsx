import React, { useState, useMemo } from 'react';
import { Product, DailyLog, CartItem, Voucher, VoucherItem } from '../types';
import { dbService } from '../lib/supabase';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRight,
  User,
  BadgePercent,
  Sparkles,
  Package,
  Layers,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PosVoucherGeneratorProps {
  products: Product[];
  dailyLogs: DailyLog[];
  activeLog: DailyLog | null;
  onSelectLog: (log: DailyLog) => void;
  onCreateTodayLog: () => Promise<DailyLog>;
  onVoucherCreated: (voucher: Voucher, items: VoucherItem[]) => void;
  onRefreshData: () => Promise<void>;
}

export const PosVoucherGenerator: React.FC<PosVoucherGeneratorProps> = ({
  products,
  dailyLogs,
  activeLog,
  onSelectLog,
  onCreateTodayLog,
  onVoucherCreated,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Transfer' | 'PromptPay'>('Cash');
  const [customerName, setCustomerName] = useState('');
  const [staffName, setStaffName] = useState('Staff (POS-01)');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return ['all', ...Array.from(cats)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      setErrorMessage(`Cannot add "${product.name}" - out of stock.`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          setErrorMessage(`Only ${product.stock_quantity} available in stock for "${product.name}".`);
          setTimeout(() => setErrorMessage(null), 3000);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unit_price,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unit_price: product.selling_price,
            subtotal: product.selling_price,
          },
        ];
      }
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stock_quantity) {
              setErrorMessage(`Stock limit reached (${item.product.stock_quantity} max)`);
              setTimeout(() => setErrorMessage(null), 2500);
              return item;
            }
            return {
              ...item,
              quantity: nextQty,
              subtotal: nextQty * item.unit_price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setCustomerName('');
  };

  // Calculations
  const rawSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (rawSubtotal * discountPercent) / 100;
  }, [rawSubtotal, discountPercent]);

  const totalAmount = useMemo(() => {
    return Math.max(0, rawSubtotal - discountAmount);
  }, [rawSubtotal, discountAmount]);

  const totalCartItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Handle confirmation
  const handleConfirmVoucher = async () => {
    if (cart.length === 0) {
      setErrorMessage('Please add at least one product to the voucher cart.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Check if today's record exists in daily_logs. If not, create/retrieve it first
      let targetLog = activeLog;
      if (!targetLog) {
        targetLog = await onCreateTodayLog();
      }

      const itemsPayload = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
      }));

      // 2. Insert into vouchers and voucher_items matching Supabase PostgreSQL schema
      const result = await dbService.createVoucherWithItems({
        dailyLogId: targetLog.id,
        totalAmount,
        items: itemsPayload,
        paymentMethod,
        customerName: customerName || 'Walk-in Customer',
        staffName: staffName || 'Staff (POS-01)',
        notes: discountPercent > 0 ? `Discount applied: ${discountPercent}%` : undefined,
      });

      // Confetti burst animation
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10b981', '#059669', '#34d399', '#f59e0b'],
      });

      // Notify parent & refresh data
      onVoucherCreated(result.voucher, result.items);
      clearCart();
      await onRefreshData();
    } catch (err: any) {
      console.error('Error creating voucher:', err);
      setErrorMessage(err?.message || 'Failed to generate voucher. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="pos-tab-container" className="flex flex-col lg:flex-row gap-6">
      {/* LEFT / MAIN COLUMN: Search, Filters & Product Grid */}
      <div className="flex-1 space-y-5">
        {/* Active Daily Log Notice / Selector */}
        <div
          id="active-log-bar"
          className="bg-[#0a0a0a] rounded-xl p-4 border border-white/10 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Active Daily Log Session</div>
              <div className="flex items-center gap-2 mt-0.5">
                {activeLog ? (
                  <>
                    <span className="font-semibold text-white text-sm">{activeLog.day_label}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono rounded">
                      Open for Sales
                    </span>
                  </>
                ) : (
                  <span className="text-amber-400 font-medium text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> No Active Daily Log Selected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Daily Log Switcher / Auto-create */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                id="daily-log-dropdown"
                value={activeLog?.id || ''}
                onChange={e => {
                  const log = dailyLogs.find(l => l.id === e.target.value);
                  if (log) onSelectLog(log);
                }}
                className="appearance-none bg-[#121212] hover:bg-zinc-800 border border-white/10 text-slate-200 text-xs font-medium rounded-lg pl-3 pr-8 py-2 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="" disabled className="bg-zinc-900 text-slate-400">
                  Select Daily Log...
                </option>
                {dailyLogs.map(log => (
                  <option key={log.id} value={log.id} className="bg-zinc-900 text-slate-200">
                    {log.day_label} ({log.month} {log.year})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {!activeLog && (
              <button
                id="create-today-log-pos-btn"
                onClick={async () => {
                  const log = await onCreateTodayLog();
                  onSelectLog(log);
                }}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                Open Today's Log
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Pills */}
        <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/10 shadow-2xl space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="product-search-input"
              type="text"
              placeholder="Search products by title, keyword, or SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded bg-zinc-800"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer uppercase text-xs ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 underline underline-offset-4 shadow-xs'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-slate-300 border border-white/5'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200 font-bold px-1">
              ×
            </button>
          </div>
        )}

        {/* Product Grid */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Available Catalog ({filteredProducts.length} Items)
            </span>
            <span className="text-xs text-slate-500 font-mono">Click item to add to voucher</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-[#0a0a0a] rounded-xl p-12 text-center border border-white/10">
              <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-slate-200 font-medium text-sm">No products found</p>
              <p className="text-slate-400 text-xs mt-1">Try tweaking your search term or category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(product => {
                const inStock = product.stock_quantity > 0;
                const cartQty = cart.find(c => c.product.id === product.id)?.quantity || 0;

                return (
                  <div
                    key={product.id}
                    id={`product-card-${product.id}`}
                    onClick={() => inStock && addToCart(product)}
                    className={`group relative bg-[#121212] rounded-xl p-4 border transition-all duration-150 flex flex-col justify-between select-none ${
                      inStock
                        ? 'border-white/5 hover:border-emerald-500/50 hover:bg-[#161616] cursor-pointer active:scale-[0.98]'
                        : 'border-white/5 bg-[#0e0e0e] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {/* Top: Category & Stock Badge */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        {product.sku || product.category || 'ITEM'}
                      </span>
                      {inStock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                          {product.stock_quantity} units
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                          OOS
                        </span>
                      )}
                    </div>

                    {/* Middle: Title */}
                    <div className="mb-2">
                      <h3 className="font-semibold text-white text-sm line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
                        {product.name}
                      </h3>
                      {product.category && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {product.category}
                        </p>
                      )}
                    </div>

                    {/* Bottom: Price & Cart Status */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="font-mono font-bold text-base text-emerald-400">
                        ${product.selling_price.toFixed(2)}
                      </div>
                      {cartQty > 0 ? (
                        <span className="inline-flex items-center justify-center bg-emerald-500 text-black font-bold text-xs w-6 h-6 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                          {cartQty}
                        </span>
                      ) : (
                        inStock && (
                          <div className="w-6 h-6 rounded-full bg-zinc-800 group-hover:bg-emerald-500 group-hover:text-black flex items-center justify-center text-slate-400 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Cart / Voucher Builder */}
      <div className="w-full lg:w-96 shrink-0">
        <div
          id="pos-cart-panel"
          className="bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl flex flex-col sticky top-20 overflow-hidden"
        >
          {/* Cart Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0e0e0e]">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="font-bold text-sm text-white uppercase tracking-wider">Active Cart</h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  {totalCartItemsCount} {totalCartItemsCount === 1 ? 'item' : 'items'} queued
                </p>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                id="clear-cart-btn"
                onClick={clearCart}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-zinc-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-4 flex-1 max-h-[320px] overflow-y-auto space-y-2.5 scrollbar-thin">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-zinc-700 stroke-1" />
                <p className="text-sm font-medium text-slate-400">Cart is empty</p>
                <p className="text-xs mt-0.5 text-slate-400">Click products from the catalog to build a voucher.</p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-medium text-xs text-slate-200 truncate">{item.product.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ${item.unit_price.toFixed(2)} / unit
                    </div>
                  </div>

                  {/* Stepper Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-black rounded-full border border-white/10 px-2 py-1">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, -1)}
                        className="text-xs text-slate-400 hover:text-emerald-400 px-1 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono text-slate-200 px-2">
                        {item.quantity < 10 ? `0${item.quantity}` : item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, 1)}
                        className="text-xs text-slate-400 hover:text-emerald-400 px-1 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[50px]">
                      <span className="text-xs font-mono text-slate-200 font-medium">
                        ${item.subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Voucher Details & Metadata Controls */}
          <div className="p-4 bg-[#0a0a0a] border-t border-white/10 space-y-3 text-xs">
            {/* Customer & Staff Info */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Customer</label>
                <input
                  type="text"
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Staff / Cashier</label>
                <input
                  type="text"
                  placeholder="Staff Name"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Payment Method</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'Cash', label: 'Cash', icon: Banknote },
                  { id: 'Card', label: 'Card', icon: CreditCard },
                  { id: 'Transfer', label: 'Bank', icon: ArrowRight },
                  { id: 'PromptPay', label: 'QR Pay', icon: Smartphone },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id as any)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-semibold shadow-2xs'
                          : 'bg-[#121212] border-white/10 text-slate-400 hover:bg-zinc-800 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-0.5" />
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Discount selector */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <BadgePercent className="w-3.5 h-3.5 text-emerald-400" /> Apply Discount:
              </span>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 15].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      discountPercent === pct
                        ? 'bg-emerald-500 text-black font-bold'
                        : 'bg-zinc-800 text-slate-400 hover:bg-zinc-700 hover:text-white border border-white/5'
                    }`}
                  >
                    {pct === 0 ? '0%' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Summary & Confirm Button */}
          <div className="p-5 bg-[#0e0e0e] border-t border-white/10 space-y-3">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono text-slate-200">${rawSubtotal.toFixed(2)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Discount ({discountPercent}%)</span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-slate-400">
              <span>Tax (0%)</span>
              <span className="font-mono text-slate-400">$0.00</span>
            </div>

            {/* Total Row with Dashed Border */}
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-dashed border-white/20">
              <span className="text-lg font-bold text-white">TOTAL</span>
              <span className="text-3xl font-mono text-emerald-400 font-bold">
                ${totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Confirm Button */}
            <button
              id="confirm-print-voucher-btn"
              disabled={isSubmitting || cart.length === 0 || !activeLog}
              onClick={handleConfirmVoucher}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer uppercase tracking-wider ${
                isSubmitting || cart.length === 0 || !activeLog
                  ? 'bg-zinc-800 text-slate-600 border border-white/5 cursor-not-allowed shadow-none'
                  : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>CONFIRM & PRINT VOUCHER</span>
                </>
              )}
            </button>
            {!activeLog && (
              <p className="text-[11px] text-center text-amber-400 mt-1">
                Select or open today's log to enable checkout
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
