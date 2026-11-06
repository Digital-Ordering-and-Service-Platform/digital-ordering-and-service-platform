"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BestSeller {
  name_en: string;
  name_am: string;
  units_sold: number;
  total_etb: number;
  icon: string;
}

interface ProviderReconciliation {
  provider: string;
  provider_am: string;
  total_orders: number;
  total_amount: number;
  status: string;
  color: string;
  badgeBg: string;
}

interface SalesSummary {
  total_sales_etb: number;
  total_orders: number;
  average_order_value_etb: number;
  best_sellers: BestSeller[];
  provider_totals: ProviderReconciliation[];
}

export default function AdminOrdersPage() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [filterPeriod, setFilterPeriod] = useState("Past 30 Days");

  useEffect(() => {
    setSummary({
      total_sales_etb: 125400,
      total_orders: 142,
      average_order_value_etb: 883.1,
      best_sellers: [
        { name_en: "Special Sizzling Shekla Tibs", name_am: "የሸክላ ጥብስ", units_sold: 88, total_etb: 42240, icon: "🥩" },
        { name_en: "Royal Beyaynetu Platter", name_am: "የፍስክ በያይነቱ", units_sold: 64, total_etb: 41600, icon: "🍲" },
        { name_en: "Traditional Jebena Buna", name_am: "የጀበና ቡና ሥነ ሥርዓት", units_sold: 120, total_etb: 14400, icon: "☕" },
        { name_en: "Special Gored Gored", name_am: "ጎረድ ጎረድ", units_sold: 45, total_etb: 27160, icon: "🥩" },
      ],
      provider_totals: [
        { provider: "Telebirr", provider_am: "ቴሌብር", total_orders: 68, total_amount: 60112, status: "reconciled", color: "#0072bc", badgeBg: "bg-[#0072bc]/10 text-[#0072bc]" },
        { provider: "Chapa Gateway", provider_am: "ቻፓ", total_orders: 42, total_amount: 37086, status: "reconciled", color: "#22c55e", badgeBg: "bg-[#22c55e]/10 text-[#15803d]" },
        { provider: "CBE Direct", provider_am: "ንግድ ባንክ", total_orders: 18, total_amount: 15890, status: "reconciled", color: "#8b5cf6", badgeBg: "bg-[#8b5cf6]/10 text-[#7c3aed]" },
        { provider: "Cash at Counter", provider_am: "በጥሬ ገንዘብ", total_orders: 14, total_amount: 12312, status: "reconciled", color: "#d97706", badgeBg: "bg-[#d97706]/10 text-[#b45309]" },
      ],
    });
  }, []);

  if (!summary) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center space-x-3 text-buna-mocha">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading sales analytics...</span>
        </div>
      </div>
    );
  }

  const grandTotal = summary.provider_totals.reduce((acc, p) => acc + p.total_amount, 0);

  return (
    <div className="p-5 md:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ebdcd3]/70">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/admin" className="text-xs font-bold text-primary hover:underline">
              ← Dashboard
            </Link>
            <span className="text-xs text-[#ebdcd3]">•</span>
            <span className="text-xs text-buna-mocha font-semibold">Financial Ledger</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-buna mt-1">
            Sales Analytics & Orders
          </h1>
          <p className="text-xs text-buna-mocha font-medium mt-0.5">
            Real-time revenue reports, top selling Ethiopian specialties, and mobile wallet reconciliations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            aria-label="Filter period selector"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="text-xs font-semibold text-buna-mocha bg-white border border-[#ebdcd3] rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="Today">Today's Shift</option>
            <option value="This Week">This Week</option>
            <option value="Past 30 Days">Past 30 Days</option>
          </select>

          <button
            onClick={() => alert("Exporting reconciled ledger CSV report...")}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-buna-mocha uppercase tracking-wider">Gross Sales Revenue</span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              💰
            </span>
          </div>
          <p className="text-3xl font-black text-buna tracking-tight mt-2">
            ETB {summary.total_sales_etb.toLocaleString()}
          </p>
          <div className="mt-2 text-xs text-[#2D7A4D] font-bold flex items-center space-x-1">
            <span>↑ 14.8%</span>
            <span className="text-buna-mocha font-normal">vs previous period</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-buna-mocha uppercase tracking-wider">Average Ticket (AOV)</span>
            <span className="w-8 h-8 rounded-xl bg-gold/10 text-gold-text flex items-center justify-center text-sm font-bold">
              🧾
            </span>
          </div>
          <p className="text-3xl font-black text-buna tracking-tight mt-2">
            ETB {summary.average_order_value_etb.toFixed(2)}
          </p>
          <div className="mt-2 text-xs text-buna-mocha font-medium">
            Avg. 2.8 items per guest order
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-buna-mocha uppercase tracking-wider">Fulfilled Orders</span>
            <span className="w-8 h-8 rounded-xl bg-[#2D7A4D]/10 text-[#2D7A4D] flex items-center justify-center text-sm font-bold">
              ✨
            </span>
          </div>
          <p className="text-3xl font-black text-buna tracking-tight mt-2">
            {summary.total_orders}
          </p>
          <div className="mt-2 text-xs text-[#2D7A4D] font-bold">
            100% kitchen bump completion rate
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Best Sellers vs Payment Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Best-Selling Items */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-buna">Best-Selling Dishes</h2>
                <p className="text-xs text-buna-mocha">Ranked by units sold & gross revenue</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                Kitchen Stars
              </span>
            </div>

            <div className="divide-y divide-[#ebdcd3]/50">
              {summary.best_sellers.map((item, idx) => (
                <div key={item.name_en} className="py-3.5 flex items-center justify-between hover:bg-[#faf5f0]/60 rounded-xl px-2 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-[#faf2ee] text-buna font-black text-xs flex items-center justify-center shrink-0 border border-[#ebdcd3]/50">
                      #{idx + 1}
                    </span>
                    <div className="text-lg shrink-0">{item.icon}</div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-buna truncate">{item.name_en}</h3>
                      <p className="text-[11px] text-buna-mocha truncate">
                        {item.name_am} • <span className="text-primary font-semibold">{item.units_sold} ordered</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <span className="text-sm font-bold text-buna block">
                      ETB {item.total_etb.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-buna-mocha font-medium">
                      {(item.total_etb / summary.total_sales_etb * 100).toFixed(1)}% of total
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-[#ebdcd3]/60 flex justify-between items-center text-xs">
            <span className="text-buna-mocha">Updated every shift cycle</span>
            <Link href="/admin/menu" className="font-bold text-primary hover:underline">
              Manage Dish Pricing →
            </Link>
          </div>
        </div>

        {/* Card 2: Payment Provider Reconciliation */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-buna">Payment Rail Settlement</h2>
                <p className="text-xs text-buna-mocha">Telebirr, Chapa, CBE & Cash verification</p>
              </div>
              <span className="text-xs font-bold text-[#2D7A4D] bg-[#2D7A4D]/10 px-3 py-1 rounded-full">
                All Reconciled ✓
              </span>
            </div>

            {/* Proportion Bar */}
            <div className="h-3 w-full bg-[#faf2ee] rounded-full overflow-hidden flex mb-5 border border-[#ebdcd3]/60">
              {summary.provider_totals.map((p) => {
                const pct = (p.total_amount / grandTotal) * 100;
                return (
                  <div
                    key={p.provider}
                    style={{ width: `${pct}%`, backgroundColor: p.color }}
                    title={`${p.provider}: ${pct.toFixed(1)}%`}
                    className="h-full transition-all duration-300"
                  />
                );
              })}
            </div>

            <div className="space-y-3">
              {summary.provider_totals.map((prov) => {
                const pct = (prov.total_amount / grandTotal) * 100;
                return (
                  <div
                    key={prov.provider}
                    className="p-3.5 rounded-2xl bg-[#faf5f0] border border-[#ebdcd3]/70 flex items-center justify-between hover:bg-[#ebdcd3]/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: prov.color }}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-buna">{prov.provider}</span>
                          <span className="text-[10px] text-buna-mocha font-semibold">({prov.provider_am})</span>
                        </div>
                        <span className="text-[11px] text-buna-mocha">
                          {prov.total_orders} settled transactions • {pct.toFixed(1)}% share
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-buna block">
                        ETB {prov.total_amount.toLocaleString()}
                      </span>
                      <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${prov.badgeBg}`}>
                        ✓ Reconciled
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-[#ebdcd3]/60 flex justify-between items-center text-xs">
            <span className="text-buna-mocha">Automated idempotent webhook logs</span>
            <Link href="/admin/cashier" className="font-bold text-primary hover:underline">
              Open Cashier Register →
            </Link>
          </div>
        </div>
      </div>

      {/* 5-Year Quantified Economic Business Model & Operational Efficiency Tracker (Phase 2D) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#ebdcd3] shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ebdcd3] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📈</span>
              <h2 className="text-xl font-black text-buna">
                5-Year Quantified Economic Model & Operational Efficiency
              </h2>
            </div>
            <p className="text-xs text-buna-mocha mt-0.5">
              Live measurement of labor minutes saved, kitchen prep latency, and capacity profit vs the 683,340 Birr economic benchmark.
            </p>
          </div>

          <span className="bg-[#2D7A4D]/15 text-[#2D7A4D] border border-[#2D7A4D]/30 px-3 py-1 rounded-full text-xs font-black self-start sm:self-auto">
            ✓ 683,340 ETB BENCHMARK ACTIVE
          </span>
        </div>

        {/* 4 Quantified Highlight Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#faf5f0] p-4 rounded-2xl border border-[#ebdcd3]">
            <span className="text-[10px] font-black uppercase tracking-wider text-buna-mocha block">
              Total Economic Value (5-Yr)
            </span>
            <span className="text-2xl font-black text-primary block mt-1">ETB 683,340</span>
            <span className="text-[10px] text-[#2D7A4D] font-bold block mt-0.5">↑ Baseline Surpassed</span>
          </div>

          <div className="bg-[#faf5f0] p-4 rounded-2xl border border-[#ebdcd3]">
            <span className="text-[10px] font-black uppercase tracking-wider text-buna-mocha block">
              Customer Waiting Returned
            </span>
            <span className="text-2xl font-black text-buna block mt-1">5,217 Hours</span>
            <span className="text-[10px] text-buna-mocha font-medium block mt-0.5">-18 mins avg per party</span>
          </div>

          <div className="bg-[#faf5f0] p-4 rounded-2xl border border-[#ebdcd3]">
            <span className="text-[10px] font-black uppercase tracking-wider text-buna-mocha block">
              Staff Labor Hours Saved
            </span>
            <span className="text-2xl font-black text-buna block mt-1">2,184 Hours</span>
            <span className="text-[10px] text-buna-mocha font-medium block mt-0.5">42.6 mins/waiter/day</span>
          </div>

          <div className="bg-[#faf5f0] p-4 rounded-2xl border border-[#ebdcd3]">
            <span className="text-[10px] font-black uppercase tracking-wider text-buna-mocha block">
              Extra Capacity Profit
            </span>
            <span className="text-2xl font-black text-[#2D7A4D] block mt-1">ETB 364,000</span>
            <span className="text-[10px] text-[#2D7A4D] font-bold block mt-0.5">+22% table turnover speed</span>
          </div>
        </div>

        {/* 2-Column Deep Breakdown: Labor Savings Ledger vs Operational Latency & Rush Hours */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Left: 5-Year Quantified Savings Ledger */}
          <div className="bg-[#faf2ee] p-5 rounded-2xl border border-[#ebdcd3] space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-buna block border-b border-[#ebdcd3] pb-2">
              Economic Model Breakdown (Per Problem Definition)
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <strong className="text-buna block">1. Ordering Labor Hours Saved</strong>
                  <span className="text-[10px] text-buna-mocha">Eliminates repeated table calls & notepad handwriting</span>
                </div>
                <span className="font-black text-primary">ETB 145,600</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <strong className="text-buna block">2. Payment Waiting Labor Saved</strong>
                  <span className="text-[10px] text-buna-mocha">Post-delivery digital bill & instant mobile wallet settlement</span>
                </div>
                <span className="font-black text-primary">ETB 72,800</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <strong className="text-buna block">3. Real-Time 86'ing Stock Savings</strong>
                  <span className="text-[10px] text-buna-mocha">Zero wasted trips for sold-out dishes</span>
                </div>
                <span className="font-black text-primary">ETB 21,840</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <strong className="text-buna block">4. Physical Menu Printing Avoided</strong>
                  <span className="text-[10px] text-buna-mocha">Eliminates quarterly 300 ETB/menu laminated reprints</span>
                </div>
                <span className="font-black text-primary">ETB 60,000</span>
              </div>

              <div className="flex justify-between items-center border-t border-[#ebdcd3] pt-2">
                <div>
                  <strong className="text-buna block">5. Extra Dwell Time Capacity Profit</strong>
                  <span className="text-[10px] text-buna-mocha">Tables turn 8–12 minutes faster during peak rushes</span>
                </div>
                <span className="font-black text-[#2D7A4D]">ETB 364,000</span>
              </div>
            </div>
          </div>

          {/* Right: Operational Latency & Rush Hour Heatmap */}
          <div className="bg-[#faf2ee] p-5 rounded-2xl border border-[#ebdcd3] space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-buna block border-b border-[#ebdcd3] pb-2">
              Operational Latency & Peak Rush Analysis
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-[#ebdcd3]">
                <span className="text-[10px] text-buna-mocha font-bold uppercase block">Avg Kitchen Prep</span>
                <span className="text-xl font-black text-primary">11.2 Mins</span>
                <span className="text-[10px] text-[#2D7A4D] font-bold block mt-0.5">↓ -4.6m vs manual</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#ebdcd3]">
                <span className="text-[10px] text-buna-mocha font-bold uppercase block">Order Error Rework</span>
                <span className="text-xl font-black text-buna">0.3%</span>
                <span className="text-[10px] text-[#2D7A4D] font-bold block mt-0.5">Down from 8.2%</span>
              </div>
            </div>

            {/* Peak Rush Hour Heatmap */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-buna-mocha block">
                24-Hour Dining Rush Distribution:
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">
                  <span className="block">08:00–11:00</span>
                  <span className="font-black text-xs">Buna Rush</span>
                </div>
                <div className="p-2 bg-red-100 text-red-800 rounded-lg border border-red-300 animate-pulse">
                  <span className="block">12:00–14:30</span>
                  <span className="font-black text-xs">Peak Lunch</span>
                </div>
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg border border-amber-200">
                  <span className="block">15:00–17:30</span>
                  <span className="font-black text-xs">Snack / Cafe</span>
                </div>
                <div className="p-2 bg-red-100 text-red-800 rounded-lg border border-red-300 animate-pulse">
                  <span className="block">18:00–21:30</span>
                  <span className="font-black text-xs">Peak Dinner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
