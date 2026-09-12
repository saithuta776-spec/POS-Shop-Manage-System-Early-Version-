'use client';

/**
 * Next.js 15 App Router Entry Point (`app/page.tsx`)
 * ShopFlow Inventory & POS Sales Voucher System
 *
 * Integrated with:
 * - Supabase client (@/lib/supabase)
 * - PostgreSQL Tables: products, daily_logs, vouchers, voucher_items
 * - Tab 1: POS & Voucher Generator (Search, Stock badges, Active Daily Log Selector, Cart, Confirm & Print)
 * - Tab 2: Notion-Style Voucher Archive (Year > Month > Daily File, Revenue metrics, Line items)
 * - Tab 3: Product Inventory (Owner management, Stock counts, Prices, Quick adjust, Add/Edit)
 */

import App from '../src/App';

export default function Page() {
  return <App />;
}
