"use client";

import { useState } from "react";
import Link from "next/link";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  customizations?: string[];
}

interface CashierOrder {
  id: string;
  orderRef: string;
  tableLabel: string;
  items: OrderItem[];
  subtotal: number;
  serviceCharge: number;
  vat: number;
  totalAmount: number;
  paymentStatus: "paid" | "unpaid";
  provider: "telebirr" | "cbe" | "chapa" | "cash";
  bankReference?: string;
  createdAt: string;
  settledAt?: string;
}

export default function CashierRegisterPage() {
  // Cashier View Toggle: "live" (Table, What is ordered, Paid/Unpaid) vs "history" (Orders, Attached receipts, Respective bank payment)
  const [activeView, setActiveView] = useState<"live" | "history">("live");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<CashierOrder | null>(null);
  const [historyBankFilter, setHistoryBankFilter] = useState<string>("all");

  // Initial active & history orders
  const [orders, setOrders] = useState<CashierOrder[]>([
    {
      id: "ord-101",
      orderRef: "MF-8942-T4",
      tableLabel: "Table 04",
      items: [
        {
          name: "Classic Addis Cheeseburger",
          quantity: 1,
          price: 380,
          customizations: ["No Onions", "No Ketchup", "+ Extra Cheddar Cheese"],
        },
        {
          name: "Iced Caramel Macchiato",
          quantity: 1,
          price: 130,
          customizations: ["No Ice"],
        },
      ],
      subtotal: 510,
      serviceCharge: 51,
      vat: 77,
      totalAmount: 638,
      paymentStatus: "unpaid",
      provider: "cash",
      createdAt: "3 mins ago",
    },
    {
      id: "ord-102",
      orderRef: "MF-8945-T2",
      tableLabel: "Table 02",
      items: [
        {
          name: "Special Sizzling Shekla Tibs",
          quantity: 2,
          price: 450,
          customizations: ["No Jalapeños / Mild", "+ Extra Spiced Butter"],
        },
        {
          name: "Traditional Jebena Buna",
          quantity: 2,
          price: 60,
          customizations: ["No Sugar"],
        },
      ],
      subtotal: 1020,
      serviceCharge: 102,
      vat: 153,
      totalAmount: 1275,
      paymentStatus: "unpaid",
      provider: "cash",
      createdAt: "8 mins ago",
    },
    {
      id: "ord-103",
      orderRef: "MF-8947-T5",
      tableLabel: "Table 05",
      items: [
        {
          name: "Smoky BBQ Bacon Burger",
          quantity: 1,
          price: 440,
          customizations: ["No Onions", "+ Extra Beef Bacon"],
        },
        {
          name: "Fresh Avocado Mango Spris",
          quantity: 1,
          price: 110,
          customizations: ["No Sugar"],
        },
      ],
      subtotal: 550,
      serviceCharge: 55,
      vat: 83,
      totalAmount: 688,
      paymentStatus: "paid",
      provider: "telebirr",
      bankReference: "TB-7740192841",
      createdAt: "12 mins ago",
      settledAt: "10 mins ago",
    },
    // Past completed history orders
    {
      id: "ord-104",
      orderRef: "MF-8939-T7",
      tableLabel: "Table 07",
      items: [
        {
          name: "Slow-Cooked Doro Wat",
          quantity: 1,
          price: 520,
          customizations: ["Extra Injera"],
        },
        {
          name: "Traditional Jebena Buna",
          quantity: 1,
          price: 60,
        },
      ],
      subtotal: 580,
      serviceCharge: 58,
      vat: 87,
      totalAmount: 725,
      paymentStatus: "paid",
      provider: "cbe",
      bankReference: "CBE-991204857",
      createdAt: "35 mins ago",
      settledAt: "30 mins ago",
    },
    {
      id: "ord-105",
      orderRef: "MF-8935-T1",
      tableLabel: "Table 01",
      items: [
        {
          name: "Special Bozena Shiro",
          quantity: 2,
          price: 320,
          customizations: ["No Garlic"],
        },
        {
          name: "Ambo Mineral Water",
          quantity: 2,
          price: 45,
        },
      ],
      subtotal: 730,
      serviceCharge: 73,
      vat: 110,
      totalAmount: 913,
      paymentStatus: "paid",
      provider: "chapa",
      bankReference: "CHP-TX-4482019",
      createdAt: "50 mins ago",
      settledAt: "48 mins ago",
    },
    {
      id: "ord-106",
      orderRef: "MF-8930-T9",
      tableLabel: "Table 09",
      items: [
        {
          name: "Classic Addis Cheeseburger",
          quantity: 2,
          price: 380,
          customizations: ["No Mayo"],
        },
        {
          name: "Crispy Peri-Peri Chicken Burger",
          quantity: 1,
          price: 360,
        },
        {
          name: "Chilled Coca-Cola",
          quantity: 3,
          price: 50,
        },
      ],
      subtotal: 1270,
      serviceCharge: 127,
      vat: 191,
      totalAmount: 1588,
      paymentStatus: "paid",
      provider: "cash",
      bankReference: "CASH-REG-04-8930",
      createdAt: "1 hour ago",
      settledAt: "58 mins ago",
    },
  ]);

  // Mark an unpaid cash order as paid
  const handleMarkPaid = (id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              paymentStatus: "paid",
              settledAt: "Just now",
              bankReference: `CASH-REG-04-${Math.floor(1000 + Math.random() * 9000)}`,
            }
          : o
      )
    );
  };

  // Filter live active orders
  const activeOrders = orders.filter((o) => o.paymentStatus === "unpaid" || o.createdAt.includes("mins ago"));
  
  // Filter history orders (all paid/settled orders)
  const historyOrders = orders.filter((o) => {
    if (o.paymentStatus !== "paid") return false;
    if (historyBankFilter === "all") return true;
    return o.provider === historyBankFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans text-buna">
      {/* Top Header & Tab Navigation */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ebdcd3]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link href="/admin" className="text-xs font-bold text-primary hover:underline">
              ← Dashboard
            </Link>
            <span className="text-xs text-[#ebdcd3]">•</span>
            <span className="text-xs text-buna-mocha font-semibold">Cashier Till #04</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-buna tracking-tight">
            Cashier Desk
          </h1>
        </div>

        {/* View Switcher: Live Orders vs History */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-[#ebdcd3] shadow-sm">
          <button
            type="button"
            onClick={() => setActiveView("live")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
              activeView === "live"
                ? "bg-primary text-white shadow-sm"
                : "text-buna-mocha hover:text-buna"
            }`}
          >
            <span>🔔 Live Table Orders</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
              {orders.filter((o) => o.paymentStatus === "unpaid").length} Unpaid
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("history")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
              activeView === "history"
                ? "bg-[#381a10] text-white shadow-sm"
                : "text-buna-mocha hover:text-buna"
            }`}
          >
            <span>📜 Payment History & Receipts</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
              {historyOrders.length}
            </span>
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* VIEW 1: LIVE ORDERS (Table Number, What is Ordered, Paid or Not)     */}
      {/* "that is all the cashier should see"                                */}
      {/* =================================================================== */}
      {activeView === "live" && (
        <section className="space-y-4 animate-in fade-in duration-150">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-buna-mocha uppercase tracking-wider">
              Active Tables Ordering Screen
            </span>
            <span className="text-xs font-semibold text-buna-mocha">
              Auto-updating via WebSockets
            </span>
          </div>

          <div className="space-y-3.5">
            {activeOrders.map((ord) => {
              const isPaid = ord.paymentStatus === "paid";
              return (
                <div
                  key={ord.id}
                  className={`bg-white rounded-3xl p-5 border-2 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isPaid ? "border-[#2D7A4D]/40 bg-[#fafcf9]" : "border-[#DC2626]/40 bg-white"
                  }`}
                >
                  {/* Left: Table Number & Time */}
                  <div className="md:w-48 shrink-0 space-y-1">
                    <span className="text-xs font-mono text-buna-mocha block">
                      Ref: {ord.orderRef} • {ord.createdAt}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl sm:text-2xl font-black text-buna">
                        {ord.tableLabel}
                      </span>
                    </div>
                  </div>

                  {/* Middle: What is Ordered (Itemized dishes, drinks & customizations) */}
                  <div className="flex-1 space-y-2 border-t md:border-t-0 md:border-l border-[#ebdcd3] pt-3 md:pt-0 md:pl-5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-buna-mocha block">
                      What is Ordered:
                    </span>
                    <div className="space-y-1.5">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex items-baseline space-x-2 text-sm font-bold text-buna">
                            <span className="w-5 text-primary font-black">{item.quantity}x</span>
                            <span>{item.name}</span>
                            <span className="text-xs font-semibold text-buna-mocha">
                              (ETB {item.price * item.quantity})
                            </span>
                          </div>

                          {/* Customizations tags: No onions, no ketchup, extras */}
                          {item.customizations && item.customizations.length > 0 && (
                            <div className="flex flex-wrap gap-1 pl-7">
                              {item.customizations.map((c, cIdx) => (
                                <span
                                  key={cIdx}
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    c.toLowerCase().includes("no ")
                                      ? "bg-red-100 text-red-700"
                                      : "bg-primary/10 text-primary"
                                  }`}
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Paid or Not & Settlement Button */}
                  <div className="md:w-56 shrink-0 flex flex-col items-start md:items-end justify-center border-t md:border-t-0 md:border-l border-[#ebdcd3] pt-3 md:pt-0 md:pl-5 space-y-2">
                    <div className="text-left md:text-right">
                      <span className="text-xs text-buna-mocha block">Total Bill:</span>
                      <span className="text-xl font-black text-buna">
                        ETB {ord.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    {/* Paid or Not Status & Waiter Alert Action */}
                    {isPaid ? (
                      <div className="space-y-1.5 w-full md:w-auto text-left md:text-right">
                        <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#2D7A4D]/15 text-[#2D7A4D] border border-[#2D7A4D]/30 inline-flex items-center space-x-1">
                          <span>✓ PAID</span>
                          {ord.provider !== "cash" && (
                            <span className="text-[10px] opacity-75">({ord.provider})</span>
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `🔔 Waiter Notified: Floor runners alerted that ${ord.tableLabel} items are ready for delivery!`
                            )
                          }
                          className="w-full md:w-auto px-3 py-1.5 bg-[#faf2ee] hover:bg-[#ebdcd3] text-primary border border-[#ebdcd3] text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1"
                          title="Ping Waiter Handheld App"
                        >
                          <span>🔔</span>
                          <span>Notify Waiter (Ready)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 w-full md:w-auto">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/30">
                          ● UNPAID (Cash Pending)
                        </span>
                        <div className="flex flex-col sm:flex-row gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(ord.id)}
                            className="w-full md:w-auto px-4 py-2 bg-[#2D7A4D] hover:bg-[#23603d] text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5"
                          >
                            <span>💵</span>
                            <span>Mark Paid</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `🔔 Waiter Notified: Floor runners alerted that ${ord.tableLabel} items are ready!`
                              )
                            }
                            className="w-full md:w-auto px-3 py-2 bg-[#faf2ee] hover:bg-[#ebdcd3] text-primary border border-[#ebdcd3] text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1"
                          >
                            <span>🔔</span>
                            <span>Ping Waiter</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* VIEW 2: HISTORY PAGE (Orders, Attached Receipt & Respective Bank)    */}
      {/* =================================================================== */}
      {activeView === "history" && (
        <section className="space-y-4 animate-in fade-in duration-150">
          {/* Filter Bar for Respective Bank Payment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#ebdcd3] shadow-sm">
            <span className="text-xs font-black text-buna uppercase tracking-wider">
              Filter by Bank Payment Method:
            </span>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "All Banks" },
                { id: "telebirr", label: "Telebirr" },
                { id: "cbe", label: "CBE Birr" },
                { id: "chapa", label: "Chapa" },
                { id: "cash", label: "Cash Register" },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setHistoryBankFilter(b.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    historyBankFilter === b.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-[#faf2ee] text-buna-mocha hover:text-buna"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* History Orders Table / Card List */}
          <div className="bg-white rounded-3xl border border-[#ebdcd3] shadow-sm overflow-hidden">
            <div className="divide-y divide-[#ebdcd3]/50">
              {historyOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#faf5f0]/50 transition-colors"
                >
                  {/* Table & Order Details */}
                  <div className="lg:w-48 shrink-0 space-y-1">
                    <span className="text-xs font-mono text-buna-mocha block">
                      Ref: {ord.orderRef}
                    </span>
                    <span className="text-lg font-black text-buna block">
                      {ord.tableLabel}
                    </span>
                    <span className="text-[11px] text-buna-mocha block">
                      {ord.createdAt} • Settled {ord.settledAt}
                    </span>
                  </div>

                  {/* What Was Ordered */}
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-black uppercase text-buna-mocha block">
                      Dishes & Drinks Ordered:
                    </span>
                    <div className="text-xs font-bold text-buna space-y-0.5">
                      {ord.items.map((i, iIdx) => (
                        <div key={iIdx} className="flex items-center space-x-1.5 flex-wrap">
                          <span className="text-primary font-black">{i.quantity}x</span>
                          <span>{i.name}</span>
                          {i.customizations && (
                            <span className="text-[10px] text-buna-mocha font-normal">
                              ({i.customizations.join(", ")})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Respective Bank Payment Method & Reference */}
                  <div className="lg:w-56 shrink-0 space-y-1 text-left lg:text-right">
                    <span className="text-[10px] font-black uppercase text-buna-mocha block">
                      Bank Payment Rail:
                    </span>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ord.provider === "telebirr"
                          ? "bg-blue-100 text-blue-900 border border-blue-300"
                          : ord.provider === "cbe"
                          ? "bg-purple-100 text-purple-900 border border-purple-300"
                          : ord.provider === "chapa"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      {ord.provider.toUpperCase()}
                    </span>
                    {ord.bankReference && (
                      <span className="text-[10px] font-mono text-buna-mocha block">
                        Txn: {ord.bankReference}
                      </span>
                    )}
                    <span className="text-sm font-black text-buna block pt-0.5">
                      ETB {ord.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Attached Payment Receipt Button */}
                  <div className="lg:w-44 shrink-0 flex items-center lg:justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptOrder(ord)}
                      className="w-full lg:w-auto px-4 py-2.5 bg-white hover:bg-[#faf2ee] border-2 border-[#ebdcd3] text-buna hover:text-primary rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span>🧾</span>
                      <span>Attached Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* ATTACHED PAYMENT RECEIPT MODAL (Itemized Ethiopian Tax Invoice)      */}
      {/* =================================================================== */}
      {selectedReceiptOrder && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedReceiptOrder(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#ebdcd3] space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Receipt Modal Header */}
            <div className="flex justify-between items-start border-b border-[#ebdcd3] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
                  OFFICIAL TAX INVOICE RECEIPT
                </span>
                <h3 className="text-lg font-black text-buna">Bole Kitchen & Roastery</h3>
                <span className="text-[11px] text-buna-mocha">TIN: 0049281902 • Addis Ababa</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="w-8 h-8 rounded-full bg-[#faf2ee] flex items-center justify-center text-buna font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Receipt Info */}
            <div className="grid grid-cols-2 gap-2 text-xs text-buna bg-[#faf5f0] p-3 rounded-2xl border border-[#ebdcd3]/70">
              <div>
                <span className="text-[10px] text-buna-mocha uppercase block font-bold">Table</span>
                <strong className="text-sm font-black">{selectedReceiptOrder.tableLabel}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-buna-mocha uppercase block font-bold">Order Ref</span>
                <span className="font-mono font-bold text-xs">{selectedReceiptOrder.orderRef}</span>
              </div>
              <div className="pt-1">
                <span className="text-[10px] text-buna-mocha uppercase block font-bold">Bank Method</span>
                <strong className="uppercase font-bold text-primary">
                  {selectedReceiptOrder.provider}
                </strong>
              </div>
              <div className="text-right pt-1">
                <span className="text-[10px] text-buna-mocha uppercase block font-bold">Bank Ref</span>
                <span className="font-mono text-[11px]">
                  {selectedReceiptOrder.bankReference || "N/A"}
                </span>
              </div>
            </div>

            {/* Itemized Lines */}
            <div className="space-y-2 border-b border-[#ebdcd3] pb-3">
              <span className="text-[10px] font-black uppercase text-buna-mocha block">
                Itemized Dishes & Drinks:
              </span>
              <div className="space-y-1.5 text-xs text-buna">
                {selectedReceiptOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <span className="font-bold">
                        {it.quantity}x {it.name}
                      </span>
                      {it.customizations && (
                        <p className="text-[10px] text-buna-mocha italic">
                          {it.customizations.join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="font-bold">ETB {it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Breakdown */}
            <div className="space-y-1.5 text-xs text-buna-mocha border-b border-[#ebdcd3] pb-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-buna">ETB {selectedReceiptOrder.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge (10%)</span>
                <span>ETB {selectedReceiptOrder.serviceCharge}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (15%)</span>
                <span>ETB {selectedReceiptOrder.vat}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-buna pt-1 border-t border-[#ebdcd3]/50">
                <span>Total Paid</span>
                <span className="text-primary">ETB {selectedReceiptOrder.totalAmount}</span>
              </div>
            </div>

            {/* Verified Stamp & Print Action */}
            <div className="pt-1 space-y-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wide flex items-center justify-center space-x-1">
                  <span>✓</span>
                  <span>
                    Payment Reconciled via {selectedReceiptOrder.provider.toUpperCase()}
                  </span>
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => alert("Receipt sent to POS printer!")}
                  className="flex-1 py-3 bg-[#381a10] hover:bg-primary text-white text-xs font-black rounded-xl shadow transition-colors flex items-center justify-center space-x-2"
                >
                  <span>🖨️</span>
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="px-4 py-3 bg-[#faf2ee] text-buna font-bold text-xs rounded-xl hover:bg-[#ebdcd3] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
