"use client";

import { useState } from "react";
import Link from "next/link";

interface MenuItemStock {
  id: string;
  name: string;
  nameAm: string;
  category: string;
  price: number;
  inStock: boolean;
  tag: string;
  imageBg: string;
  icon: string;
}

interface TableStatus {
  id: string;
  number: string;
  status: "occupied" | "attention" | "available";
  seatedTime?: string;
  guestCount?: number;
  currentBill?: number;
}

export default function AdminDashboardPage() {
  const [salesTimeframe, setSalesTimeframe] = useState("Past month");
  const [tableFilter, setTableFilter] = useState("all");
  const [selectedTable, setSelectedTable] = useState<TableStatus | null>(null);

  // Quick Stock Items State
  const [menuItems, setMenuItems] = useState<MenuItemStock[]>([
    {
      id: "item-1",
      name: "Shekla Tibs",
      nameAm: "የሸክላ ጥብስ",
      category: "Traditional Mains",
      price: 480,
      inStock: true,
      tag: "In Stock",
      imageBg: "bg-amber-800",
      icon: "🥩",
    },
    {
      id: "item-2",
      name: "Doro Wat",
      nameAm: "የዶሮ ወጥ",
      category: "Specialties",
      price: 520,
      inStock: true,
      tag: "In Stock",
      imageBg: "bg-red-900",
      icon: "🍗",
    },
    {
      id: "item-3",
      name: "Gomen Be Siga",
      nameAm: "ጎመን በስጋ",
      category: "Sides & Mains",
      price: 240,
      inStock: false,
      tag: "Out of Stock",
      imageBg: "bg-emerald-900",
      icon: "🥬",
    },
    {
      id: "item-4",
      name: "Special Kitfo",
      nameAm: "ልዩ ክትፎ",
      category: "Traditional Mains",
      price: 550,
      inStock: true,
      tag: "In Stock",
      imageBg: "bg-rose-950",
      icon: "🥩",
    },
  ]);

  // Live Tables State matching visual floor layout
  const [tables, setTables] = useState<TableStatus[]>([
    { id: "t1", number: "01", status: "occupied", seatedTime: "24m ago", guestCount: 4, currentBill: 1420 },
    { id: "t2", number: "02", status: "occupied", seatedTime: "45m ago", guestCount: 2, currentBill: 890 },
    { id: "t3", number: "03", status: "attention", seatedTime: "1h 10m ago", guestCount: 6, currentBill: 3200 },
    { id: "t4", number: "01", status: "available" },
    { id: "t5", number: "02", status: "attention", seatedTime: "15m ago", guestCount: 3, currentBill: 1100 },
    { id: "t6", number: "04", status: "attention", seatedTime: "52m ago", guestCount: 2, currentBill: 760 },
    { id: "t7", number: "04", status: "available" },
    { id: "t8", number: "05", status: "occupied", seatedTime: "30m ago", guestCount: 5, currentBill: 2100 },
    { id: "t9", number: "04", status: "occupied", seatedTime: "18m ago", guestCount: 2, currentBill: 640 },
    { id: "t10", number: "06", status: "available" },
    { id: "t11", number: "05", status: "available" },
  ]);

  const toggleStock = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              inStock: !item.inStock,
              tag: !item.inStock ? "In Stock" : "Out of Stock",
            }
          : item
      )
    );
  };

  // Staff Activity Analytics data (daily order volumes)
  const staffActivityData = [
    { label: "Mon", value: 76 },
    { label: "Tue", value: 124 },
    { label: "Wed", value: 98 },
    { label: "May", value: 126 },
    { label: "Jun", value: 148 },
    { label: "Jul", value: 86 },
    { label: "Aug", value: 64 },
    { label: "Sep", value: 110 },
    { label: "Oct", value: 94 },
    { label: "Nov", value: 150 },
    { label: "Dec", value: 118 },
  ];

  return (
    <div className="p-5 md:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-buna">Dashboard</h1>
          <p className="text-xs text-buna-mocha font-medium mt-0.5">
            Real-time restaurant operations, active floor map, and quick stock controls.
          </p>
        </div>

        {/* Top Right Utilities */}
        <div className="flex items-center space-x-3 self-end sm:self-auto">
          {/* Notifications */}
          <button
            title="Notifications"
            className="w-10 h-10 rounded-full bg-white border border-[#ebdcd3] flex items-center justify-center text-buna hover:bg-[#faf2ee] transition-colors relative shadow-sm"
          >
            <svg className="w-5 h-5 text-buna-mocha" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-white" />
          </button>

          {/* Search Trigger */}
          <button
            title="Quick Search"
            className="w-10 h-10 rounded-full bg-white border border-[#ebdcd3] flex items-center justify-center text-buna hover:bg-[#faf2ee] transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 text-buna-mocha" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Profile Pill */}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#ebdcd3]">
            <div className="w-10 h-10 rounded-full bg-[#ebdcd3] flex items-center justify-center text-primary font-bold overflow-hidden border border-white shadow-sm ring-1 ring-primary/20">
              <span className="text-xs font-black">BM</span>
            </div>
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-bold text-buna leading-none">Bole Manager</span>
              <span className="block text-[10px] text-buna-mocha font-medium">Duty Shift</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2x2 Dashboard Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ========================================================= */}
        {/* CARD 1: WEEKLY SALES                                      */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-buna">Weekly Sales</h2>
              <select
                aria-label="Sales timeframe selector"
                value={salesTimeframe}
                onChange={(e) => setSalesTimeframe(e.target.value)}
                className="text-xs font-semibold text-buna-mocha bg-[#faf2ee] border border-[#ebdcd3] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Past month">Past month</option>
                <option value="This week">This week</option>
                <option value="Today">Today</option>
              </select>
            </div>

            <div className="mb-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-buna tracking-tight">
                Birr 24,500
              </div>
              <p className="text-xs text-yetsom font-semibold flex items-center mt-1">
                <span className="inline-block mr-1">↑ 18.4%</span> vs previous cycle
              </p>
            </div>
          </div>

          {/* Smooth SVG Area Spline Chart */}
          <div className="relative pt-3">
            {/* Peak Tooltip Callout */}
            <div className="absolute top-1 left-[63%] -translate-x-1/2 bg-white/95 border border-[#38bdf8] text-buna text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm pointer-events-none flex items-center space-x-1 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
              <span>Birr 24,500</span>
            </div>

            <svg viewBox="0 0 500 170" className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f0ebe6" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#f0ebe6" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#f0ebe6" strokeDasharray="3 3" />

              {/* Gradient Area Fill */}
              <path
                d="M 10 140 
                   C 50 110, 80 85, 110 82 
                   C 145 80, 160 115, 195 110 
                   C 230 105, 270 32, 315 32 
                   C 360 32, 385 102, 420 85 
                   C 455 68, 475 40, 495 28 
                   L 495 150 L 10 150 Z"
                fill="url(#salesGradient)"
              />

              {/* Curved Line Stroke */}
              <path
                d="M 10 140 
                   C 50 110, 80 85, 110 82 
                   C 145 80, 160 115, 195 110 
                   C 230 105, 270 32, 315 32 
                   C 360 32, 385 102, 420 85 
                   C 455 68, 475 40, 495 28"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.75"
                strokeLinecap="round"
              />

              {/* Peak Point Circle */}
              <circle cx="315" cy="32" r="5" fill="#0284c7" />
              <circle cx="315" cy="32" r="8" fill="#38bdf8" fillOpacity="0.35" />
            </svg>

            {/* X-Axis Day Markers */}
            <div className="flex justify-between text-[11px] font-semibold text-buna-mocha/80 pt-2 px-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* CARD 2: ACTIVE TABLES (LIVE TABLE MAP)                    */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-buna">Active Tables</h2>
              <button
                onClick={() => setTableFilter(tableFilter === "all" ? "occupied" : "all")}
                className="text-xs font-semibold text-buna-mocha bg-[#faf2ee] border border-[#ebdcd3] rounded-xl px-3 py-1.5 hover:bg-[#ebdcd3]/40 transition-colors"
              >
                Live grid map ▾
              </button>
            </div>
            <p className="text-xs text-buna-mocha mb-5">Live floor status & guest bill requests</p>
          </div>

          {/* Interactive Floor Plan Grid */}
          <div className="bg-[#faf5f0] p-5 rounded-2xl border border-[#ebdcd3]/70">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3.5 justify-items-center items-center">
              {tables.map((table, idx) => {
                let badgeClass = "";
                let labelText = "available";

                if (table.status === "occupied") {
                  badgeClass = "bg-[#2D7A4D] text-white shadow-sm hover:bg-[#256640]";
                  labelText = "occupied";
                } else if (table.status === "attention") {
                  badgeClass = "bg-[#DC2626] text-white shadow-sm hover:bg-[#b91c1c] animate-pulse";
                  labelText = "bill requested";
                } else {
                  badgeClass = "bg-white text-buna border-2 border-[#D8CFC3] hover:border-primary";
                  labelText = "available";
                }

                return (
                  <button
                    key={`${table.id}-${idx}`}
                    onClick={() => setSelectedTable(table)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center p-1 transition-all duration-150 transform hover:scale-105 ${badgeClass}`}
                    title={`Table ${table.number} - ${labelText}`}
                  >
                    <span className="text-xs sm:text-sm font-black leading-none">{table.number}</span>
                    <span className="text-[9px] font-semibold leading-tight mt-1 text-center truncate max-w-full opacity-90">
                      {table.status === "available" ? "" : labelText === "bill requested" ? "bill" : "active"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Legend Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-5 pt-3 border-t border-[#ebdcd3]/60 text-[11px] font-medium text-buna-mocha">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-md bg-[#2D7A4D]" />
                <span>Occupied</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-md bg-[#DC2626]" />
                <span>Bill Requested / Attention</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-md bg-white border border-[#D8CFC3]" />
                <span>Vacant</span>
              </div>
            </div>
          </div>

          {/* Active Table Details Modal / Drawer */}
          {selectedTable && (
            <div className="mt-4 p-3.5 bg-[#faf2ee] rounded-xl border border-[#ebdcd3] flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-buna">Table {selectedTable.number}: </span>
                <span className="text-buna-mocha capitalize">{selectedTable.status}</span>
                {selectedTable.currentBill && (
                  <span className="ml-2 font-bold text-primary">• Birr {selectedTable.currentBill}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* CARD 3: MENU ITEMS (QUICK STOCK MANAGER)                  */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-buna">Menu Items</h2>
              <span className="text-xs font-semibold text-buna-mocha bg-[#faf2ee] border border-[#ebdcd3] rounded-xl px-3 py-1.5">
                All tags ▾
              </span>
            </div>
            <p className="text-xs text-buna-mocha mb-4">Quick stock manager table (1-tap 86 item)</p>

            {/* Table of items */}
            <div className="divide-y divide-[#ebdcd3]/50">
              <div className="grid grid-cols-12 text-[11px] font-bold uppercase tracking-wider text-buna-mocha pb-2 px-1">
                <div className="col-span-6 sm:col-span-7">Dish / Name</div>
                <div className="col-span-3 sm:col-span-3 text-center">Toggle</div>
                <div className="col-span-3 sm:col-span-2 text-right">Status</div>
              </div>

              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center py-3 px-1 hover:bg-[#faf5f0]/60 rounded-xl transition-colors"
                >
                  {/* Dish Thumbnail & Name */}
                  <div className="col-span-6 sm:col-span-7 flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${item.imageBg} text-white flex items-center justify-center text-lg shadow-sm shrink-0`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-buna truncate leading-snug">{item.name}</h3>
                      <p className="text-[11px] text-buna-mocha truncate">
                        {item.nameAm} • {item.price} ETB
                      </p>
                    </div>
                  </div>

                  {/* Stock Toggle Switch */}
                  <div className="col-span-3 sm:col-span-3 flex justify-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.inStock}
                      aria-label={`Toggle availability for ${item.name}`}
                      onClick={() => toggleStock(item.id)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.inStock ? "bg-[#0284c7]" : "bg-[#D8CFC3]"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          item.inStock ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.inStock
                          ? "bg-[#2D7A4D]/10 text-[#2D7A4D]"
                          : "bg-[#DC2626]/10 text-[#DC2626]"
                      }`}
                    >
                      {item.inStock ? "In Stock" : "Out"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-[#ebdcd3]/60 flex justify-between items-center text-xs">
            <span className="text-buna-mocha">
              {menuItems.filter((m) => m.inStock).length} of {menuItems.length} active on guest menus
            </span>
            <Link
              href="/admin/menu"
              className="font-bold text-primary hover:text-primary-container transition-colors"
            >
              Full Menu Catalog →
            </Link>
          </div>
        </section>

        {/* ========================================================= */}
        {/* CARD 4: STAFF ACTIVITY ANALYTICS                          */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-buna">Staff Activity Analytics</h2>
              <span className="text-xs font-semibold text-buna-mocha bg-[#faf2ee] border border-[#ebdcd3] rounded-xl px-3 py-1.5">
                Orders Completed
              </span>
            </div>
            <p className="text-xs text-buna-mocha mb-5">Hourly kitchen bump & waiter turnaround throughput</p>
          </div>

          {/* Bar Chart Visualization */}
          <div className="relative pt-4">
            {/* Horizontal Guide Lines with Y-Axis Values */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-buna-mocha/60 pr-2 pb-6">
              <div className="border-b border-[#f0ebe6] w-full flex justify-between">
                <span>160</span>
              </div>
              <div className="border-b border-[#f0ebe6] w-full flex justify-between">
                <span>120</span>
              </div>
              <div className="border-b border-[#f0ebe6] w-full flex justify-between">
                <span>80</span>
              </div>
              <div className="border-b border-[#f0ebe6] w-full flex justify-between">
                <span>40</span>
              </div>
              <div className="border-b border-[#ebdcd3] w-full flex justify-between">
                <span>0</span>
              </div>
            </div>

            {/* Bars Container */}
            <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-2 px-6 pt-4 pb-1 relative z-10">
              {staffActivityData.map((d, index) => {
                const heightPercent = Math.min(100, Math.round((d.value / 160) * 100));
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 bg-buna text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none">
                      {d.value} orders
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[20px] bg-[#0284c7] hover:bg-[#0369a1] rounded-t-md transition-all duration-200"
                    />
                    <span className="text-[10px] font-semibold text-buna-mocha mt-2 truncate w-full text-center">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-1 flex justify-between items-center text-xs text-buna-mocha">
            <span>Peak rush: Nov (150 orders handled)</span>
            <span className="text-yetsom font-bold">98.2% on-time delivery</span>
          </div>
        </section>
      </div>
    </div>
  );
}
