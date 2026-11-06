import Link from "next/link";

export default function RootHubPage() {
  return (
    <div className="min-h-screen bg-[#fff8f5] text-buna font-sans selection:bg-primary-fixed selection:text-primary pb-16">
      {/* Top Navbar */}
      <header className="border-b border-[#ebdcd3] bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.5 7.5c-.83 0-1.5.67-1.5 1.5v1.09C15.86 8.94 14.04 8 12 8c-3.87 0-7 3.13-7 7v1c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-1c0-.34-.04-.67-.1-1h.1c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5h-.5v-1c0-.83-.67-1.5-1.5-1.5zm-3.5 10.5H9c-1.1 0-2-.9-2-2v-1c0-2.76 2.24-5 5-5s5 2.24 5 5v1c0 1.1-.9 2-2 2zM12 2c-.55 0-1 .45-1 1v2.08C11.33 5.03 11.66 5 12 5s.67.03 1 .08V3c0-.55-.45-1-1-1z" />
              </svg>
            </div>
            <div>
              <span className="font-black text-xl tracking-wider text-buna block leading-none">MENUFLOW</span>
              <span className="text-[11px] text-buna-mocha font-semibold">Ethiopian Hospitality Suite</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2D7A4D]/10 text-[#2D7A4D]">
              <span className="w-2 h-2 rounded-full bg-[#2D7A4D] animate-ping" />
              <span>System Live • v2.0</span>
            </span>
            <Link
              href="/admin"
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary-container transition-all"
            >
              Open Admin Portal →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#ebdcd3] text-primary text-xs font-bold">
            <span>🇪🇹 Addis Ababa Hospitality Technology</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-buna tracking-tight leading-tight">
            One Cohesive Platform, <br />
            <span className="text-primary">Every Restaurant Surface.</span>
          </h1>
          <p className="text-sm sm:text-base text-buna-mocha font-medium max-w-2xl mx-auto">
            Scan QR, order via Telebirr or Chapa, bump tickets in high-contrast KDS, dispatch runners, and analyze live sales on desktop. Choose any surface below to explore.
          </p>
        </div>

        {/* Featured Desktop Admin Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#9d3e0f] via-[#bd5627] to-[#e5a93b] text-white p-8 sm:p-10 shadow-lg border border-primary/20">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[11px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full">
                Featured Desktop Experience
              </span>
              <h2 className="text-3xl font-black tracking-tight">
                Manager Command Center & Desktop UI
              </h2>
              <p className="text-sm text-white/90 leading-relaxed">
                The full widescreen administrative dashboard with live <b>Weekly Sales (Birr 24,500)</b> spline charts, interactive <b>Active Tables floor map</b> (seated vs bill requested), <b>1-tap menu stock availability</b>, and staff throughput analytics.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="bg-black/20 text-xs px-2.5 py-1 rounded-lg font-medium">📈 Live Area Chart</span>
                <span className="bg-black/20 text-xs px-2.5 py-1 rounded-lg font-medium">🟢 Floor Grid Map</span>
                <span className="bg-black/20 text-xs px-2.5 py-1 rounded-lg font-medium">⚡ 86 Stock Toggles</span>
                <span className="bg-black/20 text-xs px-2.5 py-1 rounded-lg font-medium">👥 Staff Activity</span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
              <Link
                href="/admin"
                className="px-6 py-4 rounded-2xl bg-white text-primary font-black text-sm shadow-md hover:bg-[#faf2ee] hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center space-x-2"
              >
                <span>Launch Desktop Dashboard</span>
                <span>→</span>
              </Link>
              <div className="flex justify-center gap-3 text-xs text-white/80 font-medium">
                <Link href="/admin/orders" className="hover:underline">Orders</Link>
                <span>•</span>
                <Link href="/admin/tables" className="hover:underline">Tables</Link>
                <span>•</span>
                <Link href="/admin/menu" className="hover:underline">Menu</Link>
                <span>•</span>
                <Link href="/admin/cashier" className="hover:underline">Cashier</Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Multi-Device Experience Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Surface 1: Customer Mobile PWA */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#006a3b]/10 text-[#006a3b] flex items-center justify-center text-2xl shadow-sm">
                  📱
                </div>
                <span className="text-[11px] font-bold text-[#006a3b] bg-[#006a3b]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  Customer PWA
                </span>
              </div>

              <h3 className="text-xl font-bold text-buna">Bilingual Guest Ordering</h3>
              <p className="text-xs text-buna-mocha mt-1.5 leading-relaxed">
                Mobile-first thumb-friendly experience for guests. Scans table QR code, switches between English and Amharic (አማርኛ), customizes dishes, and pays via Telebirr, Chapa, CBE Birr, or Cash.
              </p>

              <div className="mt-5 space-y-2">
                <Link
                  href="/t/demo_token/menu"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#faf5f0] hover:bg-[#ebdcd3]/50 transition-colors text-xs font-bold text-buna"
                >
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#006a3b]" />
                    <span>Table 04 Dine-In Menu (`/t/demo_token/menu`)</span>
                  </span>
                  <span className="text-primary font-bold">Open →</span>
                </Link>

                <Link
                  href="/p/demo_token/menu"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#faf5f0] hover:bg-[#ebdcd3]/50 transition-colors text-xs font-bold text-buna"
                >
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-gold" />
                    <span>Takeaway Pickup Menu (`/p/demo_token/menu`)</span>
                  </span>
                  <span className="text-primary font-bold">Open →</span>
                </Link>

                <Link
                  href="/order/01J8ORD100"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#faf5f0] hover:bg-[#ebdcd3]/50 transition-colors text-xs font-bold text-buna"
                >
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>Live Order Tracker Timeline (`/order/01J8ORD100`)</span>
                  </span>
                  <span className="text-primary font-bold">Open →</span>
                </Link>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#ebdcd3]/60 flex items-center justify-between text-xs text-buna-mocha">
              <span>Tray & Checkout support</span>
              <Link href="/checkout" className="text-primary font-bold hover:underline">
                View Checkout (`/checkout`) →
              </Link>
            </div>
          </div>

          {/* Surface 2: Kitchen Display System (KDS) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1e1b19] text-[#ffb598] flex items-center justify-center text-2xl shadow-sm">
                  🍳
                </div>
                <span className="text-[11px] font-bold text-buna bg-[#1e1b19]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  Kitchen Tablet / TV
                </span>
              </div>

              <h3 className="text-xl font-bold text-buna">Kitchen Display System (KDS)</h3>
              <p className="text-xs text-buna-mocha mt-1.5 leading-relaxed">
                High-contrast native dark mode display for chefs. Order tickets update in real time via WebSockets with visual aging indicators (&lt;8m green, 8–15m amber, &gt;15m flashing red).
              </p>

              <div className="mt-5 space-y-2">
                <Link
                  href="/kds"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#1e1b19] text-[#ffb598] hover:bg-[#26211e] transition-colors text-xs font-bold shadow-sm"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006a3b] animate-pulse" />
                    <span>Launch Live Kitchen Display (`/kds`)</span>
                  </div>
                  <span className="text-white">Full Screen →</span>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px] font-semibold">
                <div className="bg-[#faf5f0] p-2 rounded-xl text-[#006a3b]">
                  <span className="block font-bold">&lt; 8m</span>
                  <span className="text-[10px] text-buna-mocha">Normal</span>
                </div>
                <div className="bg-[#faf5f0] p-2 rounded-xl text-[#d97706]">
                  <span className="block font-bold">8–15m</span>
                  <span className="text-[10px] text-buna-mocha">Warning</span>
                </div>
                <div className="bg-[#faf5f0] p-2 rounded-xl text-[#b83226]">
                  <span className="block font-bold">&gt; 15m</span>
                  <span className="text-[10px] text-buna-mocha">Urgent</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#ebdcd3]/60 flex items-center justify-between text-xs text-buna-mocha">
              <span>Optimized for iPad & Android Tablets</span>
              <span className="text-buna font-semibold">1-Tap Bump</span>
            </div>
          </div>

          {/* Surface 3: Waiter Runner View */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold-text flex items-center justify-center text-2xl shadow-sm">
                  🏃
                </div>
                <span className="text-[11px] font-bold text-gold-text bg-gold/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  Handheld Staff
                </span>
              </div>

              <h3 className="text-xl font-bold text-buna">Waiter Runner App</h3>
              <p className="text-xs text-buna-mocha mt-1.5 leading-relaxed">
                Floor staff handheld interface. Receives instant notifications when kitchen marks dishes "Ready", displays big table numbers, and offers a single 54px "Mark Delivered" tap.
              </p>

              <div className="mt-5 space-y-2">
                <Link
                  href="/waiter"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#faf5f0] hover:bg-[#ebdcd3]/50 transition-colors text-xs font-bold text-buna"
                >
                  <span className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                    <span>Open Waiter Runner Handheld (`/waiter`)</span>
                  </span>
                  <span className="text-primary font-bold">Open →</span>
                </Link>

                <Link
                  href="/admin/cashier"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#faf5f0] hover:bg-[#ebdcd3]/50 transition-colors text-xs font-bold text-buna"
                >
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>Cashier Counter Register (`/admin/cashier`)</span>
                  </span>
                  <span className="text-primary font-bold">Open →</span>
                </Link>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#ebdcd3]/60 flex items-center justify-between text-xs text-buna-mocha">
              <span>Ready queue & table call alerts</span>
              <span className="text-yetsom font-bold">Instant Delivery ACK</span>
            </div>
          </div>

          {/* Surface 4: Tenant Management & Ops */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl shadow-sm">
                  ⚙️
                </div>
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  Admin & Backoffice
                </span>
              </div>

              <h3 className="text-xl font-bold text-buna">Restaurant Configuration & Tools</h3>
              <p className="text-xs text-buna-mocha mt-1.5 leading-relaxed">
                Fine-tune menu items, bulk price updates, generate signed table QR codes, toggle between Table Service and Counter Pickup, and audit system health.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-5">
                <Link
                  href="/admin/menu"
                  className="p-3 rounded-xl bg-[#faf5f0] hover:bg-[#ebdcd3]/50 transition-colors text-xs font-bold text-buna block"
                >
                  <span className="block text-primary">Menu Manager</span>
                  <span className="text-[10px] text-buna-mocha font-medium">Categories, prices, 86s</span>
                </Link>

                <Link
                  href="/admin/tables"
                  className="p-3 rounded-xl bg-[#faf5f0] hover:bg-[#ebdcd3]/50 transition-colors text-xs font-bold text-buna block"
                >
                  <span className="block text-primary">Tables & QRs</span>
                  <span className="text-[10px] text-buna-mocha font-medium">Signed token print sheets</span>
                </Link>

                <Link
                  href="/admin/settings"
                  className="p-3 rounded-xl bg-[#faf5f0] hover:bg-[#ebdcd3]/50 transition-colors text-xs font-bold text-buna block"
                >
                  <span className="block text-primary">Settings</span>
                  <span className="text-[10px] text-buna-mocha font-medium">Tax %, service %, modes</span>
                </Link>

                <Link
                  href="/admin/ops/health"
                  className="p-3 rounded-xl bg-[#faf5f0] hover:bg-[#ebdcd3]/50 transition-colors text-xs font-bold text-buna block"
                >
                  <span className="block text-primary">Platform Health</span>
                  <span className="text-[10px] text-buna-mocha font-medium">WS & API connections</span>
                </Link>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#ebdcd3]/60 flex items-center justify-between text-xs text-buna-mocha">
              <span>Role-Based Access Control</span>
              <Link href="/admin" className="text-primary font-bold hover:underline">
                Open Admin Hub →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-6 border-t border-[#ebdcd3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-buna-mocha">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-buna">MenuFlow</span>
            <span>•</span>
            <span>Tailored for Ethiopian Food & Beverage Industry</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Next.js 14 + Go API</span>
            <span>•</span>
            <span>PostgreSQL 16 + Redis</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
