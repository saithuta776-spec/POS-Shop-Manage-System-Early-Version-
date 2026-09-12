import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import {
  Package,
  Search,
  AlertTriangle,
  Boxes,
  ArrowUpDown,
  Filter,
  Layers,
  Database,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Coins
} from 'lucide-react';

interface ProductInventoryProps {
  products: Product[];
  onRefreshData: () => Promise<void>;
}

export const ProductInventory: React.FC<ProductInventoryProps> = ({
  products,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Inventory Metrics & Total Valuation
  const metrics = useMemo(() => {
    const totalSKUs = products.length;
    // Total Inventory Retail Value: Sum of (selling_price * stock_quantity) across all products
    const totalRetailValuation = products.reduce((acc, p) => acc + (p.selling_price * (p.stock_quantity || 0)), 0);
    // Estimated Wholesale Cost Basis (~65% standard retail benchmark)
    const estimatedWholesaleCost = totalRetailValuation * 0.65;
    const estimatedGrossMargin = totalRetailValuation - estimatedWholesaleCost;

    const totalUnits = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
    const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;
    // Exact Threshold: stock_quantity > 0 && stock_quantity <= 5
    const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
    const inStockCount = products.filter(p => p.stock_quantity > 5).length;

    return {
      totalSKUs,
      totalRetailValuation,
      estimatedWholesaleCost,
      estimatedGrossMargin,
      totalUnits,
      outOfStockCount,
      lowStockCount,
      inStockCount,
    };
  }, [products]);

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
          p.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

        let matchesStock = true;
        if (stockFilter === 'in_stock') matchesStock = p.stock_quantity > 5;
        if (stockFilter === 'low_stock') matchesStock = p.stock_quantity > 0 && p.stock_quantity <= 5;
        if (stockFilter === 'out_of_stock') matchesStock = p.stock_quantity === 0;

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') diff = a.name.localeCompare(b.name);
        if (sortBy === 'price') diff = a.selling_price - b.selling_price;
        if (sortBy === 'stock') diff = a.stock_quantity - b.stock_quantity;
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy, sortOrder]);

  return (
    <div id="product-inventory-container" className="space-y-6">
      {/* Total Inventory Valuation Summary Banner */}
      <div className="bg-linear-to-r from-[#0d1612] via-[#0a0a0a] to-[#121212] border border-emerald-500/20 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Coins className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                Executive Inventory Valuation
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Warehouse & Catalog Stock Valuation
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Real-time asset valuation calculated from live on-hand quantities and retail selling prices in Supabase.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Total Retail Value */}
            <div className="bg-black/60 p-3.5 rounded-xl border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono font-bold block">
                Total Retail Value
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                ${metrics.totalRetailValuation.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-sans">
                {metrics.totalUnits} on-hand units
              </span>
            </div>

            {/* Estimated Wholesale Cost */}
            <div className="bg-black/60 p-3.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-medium block">
                Est. Wholesale Cost
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-200 font-mono mt-0.5 block">
                ${metrics.estimatedWholesaleCost.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                ~65% cost basis ratio
              </span>
            </div>

            {/* Est. Gross Margin */}
            <div className="bg-black/60 p-3.5 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono font-medium block">
                Est. Potential Margin
              </span>
              <span className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-0.5 block">
                ${metrics.estimatedGrossMargin.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                ~35% gross profit potential
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stock KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0a0a0a] p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Catalog SKUs</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">
              {metrics.totalSKUs} <span className="text-xs text-slate-500 font-normal font-sans">({metrics.totalUnits} units)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">In Stock (&gt;5)</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
              {metrics.inStockCount} Items
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Low Stock (1–5)</div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
              {metrics.lowStockCount} Items
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Out of Stock (0)</div>
            <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">
              {metrics.outOfStockCount} Items
            </div>
          </div>
        </div>
      </div>

      {/* Security & Access Banner */}
      <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-200 block">Read-Only Live Stock & Catalog Viewer</span>
            <span>Product inventory quantities automatically synchronize with PostgreSQL trigger calculations.</span>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <Database className="w-3.5 h-3.5" />
          <span>Auto-Deducted by Supabase Trigger</span>
        </div>
      </div>

      {/* Controls Bar: Search, Category, Stock Filters */}
      <div className="bg-[#0a0a0a] rounded-2xl p-4 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="inventory-search-input"
            type="text"
            placeholder="Search catalog by product name or SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-10 pr-3 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Stock Filter */}
          <div className="inline-flex bg-[#121212] p-1 rounded-xl text-xs border border-white/5">
            {[
              { id: 'all', label: 'All Stock' },
              { id: 'in_stock', label: 'In Stock (>5)' },
              { id: 'low_stock', label: 'Low Stock (1–5)' },
              { id: 'out_of_stock', label: 'Out of Stock (0)' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStockFilter(f.id as any)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
                  stockFilter === f.id
                    ? 'bg-emerald-500 text-black font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          {categories.length > 2 && (
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-[#121212] border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#0e0e0e] border-b border-white/10 text-slate-400 uppercase tracking-wider font-mono text-[11px]">
              <tr>
                <th className="py-3.5 px-4">
                  <button
                    onClick={() => {
                      if (sortBy === 'name') setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('name');
                        setSortOrder('asc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    Product Info <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">
                  <button
                    onClick={() => {
                      if (sortBy === 'price') setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('price');
                        setSortOrder('asc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    Selling Price <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4">
                  <button
                    onClick={() => {
                      if (sortBy === 'stock') setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('stock');
                        setSortOrder('asc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    Live Stock Level <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No matching products found in catalog.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const stockQty = Number(product.stock_quantity) || 0;
                  const isOutOfStock = stockQty === 0;
                  const isLowStock = stockQty > 0 && stockQty <= 5;
                  const isInStock = stockQty > 5;

                  return (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-sm">{product.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>SKU: {product.sku || 'N/A'}</span>
                          <span>•</span>
                          <span className="text-slate-500">ID: {product.id}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-white/5 text-slate-300 font-medium rounded-lg text-[11px] border border-white/5">
                          {product.category || 'General'}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                        ${product.selling_price.toFixed(2)}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={`text-base ${isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-white'}`}>
                          {stockQty}
                        </span>{' '}
                        <span className="text-slate-400 text-xs font-normal">units available</span>
                      </td>

                      {/* Status Badges: Red (0), Yellow (1-5), Green (>5) */}
                      <td className="py-3.5 px-4 text-right">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 font-bold rounded-full text-[11px] border border-rose-500/25 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            OUT OF STOCK
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 font-bold rounded-full text-[11px] border border-amber-500/25 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-full text-[11px] border border-emerald-500/25 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            IN STOCK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
