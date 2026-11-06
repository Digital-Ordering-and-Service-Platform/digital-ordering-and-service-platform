"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WaiterAlertCard from "@/components/waiter/WaiterAlertCard";
import { MenuFlowWebSocketClient } from "@/lib/websocket";

interface WaiterItem {
  name: string;
  quantity: number;
  customizations?: string[];
}

interface WaiterAlert {
  id: string;
  orderRef: string;
  tableLabel: string;
  items: WaiterItem[];
  readyAt: string;
  source: "chef" | "cashier";
}

interface ServiceRequestItem {
  id: string;
  table_id: string;
  table_label: string;
  request_type: string;
  details?: string;
  status: "pending" | "in_progress" | "resolved";
  created_at?: string;
}

export default function WaiterAppPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "chef" | "cashier">("all");
  const [staffView, setStaffView] = useState<"all" | "abebe" | "tigist">("all");
  const [is86DrawerOpen, setIs86DrawerOpen] = useState(false);
  const [deliveredCount, setDeliveredCount] = useState(14);

  // Quick 86ing Mobile Stock State per Phase 2C
  const [menuStock, setMenuStock] = useState([
    { id: "1", name: "Special Sizzling Shekla Tibs", nameAm: "የሸክላ ጥብስ", available: true },
    { id: "2", name: "Classic Addis Cheeseburger", nameAm: "አዲስ ቺዝበርገር", available: true },
    { id: "3", name: "Special Kitfo with Ayib & Gomen", nameAm: "ልዩ ክትፎ ከአይብና ጎመን", available: false },
    { id: "4", name: "Traditional Jebena Buna", nameAm: "የጀበና ቡና ሥነ ሥርዓት", available: true },
    { id: "5", name: "St George Cold Beer", nameAm: "ቅዱስ ጊዮርጊስ ቢራ", available: true },
    { id: "6", name: "Iced Caramel Macchiato", nameAm: "አይስድ ካራሜል ማኪያቶ", available: true },
  ]);

  const [serviceRequests, setServiceRequests] = useState<ServiceRequestItem[]>([
    {
      id: "req-init-1",
      table_id: "03",
      table_label: "Table 03",
      request_type: "call_waiter",
      details: "Requested table waiter assistance",
      status: "pending",
    },
  ]);

  // Audio synthesizer for waiter alert bell
  const playChime = (freq = 800, count = 2) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }, i * 220);
      }
    } catch {
      // Audio autoplay policy
    }
  };

  // Active Ready Orders waiting for runner delivery
  const [alerts, setAlerts] = useState<WaiterAlert[]>([
    {
      id: "alert-1",
      orderRef: "MF-8942-T4",
      tableLabel: "Table 04",
      items: [
        {
          name: "Classic Addis Cheeseburger",
          quantity: 1,
          customizations: ["No Onions", "No Ketchup", "+ Extra Cheddar"],
        },
        {
          name: "Iced Caramel Macchiato",
          quantity: 1,
          customizations: ["No Ice"],
        },
      ],
      readyAt: "Just now",
      source: "chef",
    },
    {
      id: "alert-2",
      orderRef: "MF-8945-T2",
      tableLabel: "Table 02",
      items: [
        {
          name: "Special Sizzling Shekla Tibs",
          quantity: 2,
          customizations: ["No Jalapeños / Mild", "+ Extra Spiced Butter"],
        },
        {
          name: "Traditional Jebena Buna",
          quantity: 2,
        },
      ],
      readyAt: "1 min ago",
      source: "cashier",
    },
  ]);

  interface SettledNotification {
    id: string;
    tableLabel: string;
    totalAmount: number;
    provider: string;
    bankReference?: string;
    timestamp: string;
  }

  const [settledNotifs, setSettledNotifs] = useState<SettledNotification[]>([]);

  // 1. Fetch initial service requests from backend
  useEffect(() => {
    async function loadRequests() {
      try {
        const backendUrl = typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.hostname}:8080/api/v1/waiter/service-requests?restaurant_id=01J8RESTAURANT000000000001`
          : "http://localhost:8080/api/v1/waiter/service-requests?restaurant_id=01J8RESTAURANT000000000001";

        const res = await fetch(backendUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && data.requests && data.requests.length > 0) {
            setServiceRequests((prev) => {
              const existingIds = new Set(prev.map((r) => r.id));
              const newReqs = data.requests.filter((r: any) => !existingIds.has(r.id));
              return [...newReqs, ...prev];
            });
          }
        }
      } catch (err) {
        console.warn("waiter: failed to load service requests", err);
      }
    }
    loadRequests();
  }, []);

  // 2. Connect to real-time WebSocket for kitchen ready pings & guest assistance calls & settlement
  useEffect(() => {
    const ws = new MenuFlowWebSocketClient("restaurant:01J8RESTAURANT000000000001:waiter");
    ws.connect((msg) => {
      if (!msg) return;

      const eventType = msg.event_type || msg.event;

      // Handle Kitchen Ready Order alert
      if (eventType === "order.ready" && msg.payload) {
        playChime(850, 3);
        const p = msg.payload;
        const newAlert: WaiterAlert = {
          id: `alert-${Date.now()}`,
          orderRef: p.order_ref || p.id || `MF-${Math.floor(1000 + Math.random() * 9000)}`,
          tableLabel: p.table_label || "Table 04",
          items: (p.items || []).map((it: any) => ({
            name: it.name_en || "Prepared Dish",
            quantity: it.quantity || 1,
            customizations: it.options || (it.special_instructions ? [it.special_instructions] : []),
          })),
          readyAt: "Just now",
          source: "chef",
        };
        setAlerts((prev) => [newAlert, ...prev]);
      }

      // Handle Table Bill Settled notification
      if (eventType === "table.settled" && msg.payload) {
        playChime(950, 3);
        const p = msg.payload;
        const notif: SettledNotification = {
          id: `settle-${Date.now()}`,
          tableLabel: p.table_label || `Table ${p.table_id || "04"}`,
          totalAmount: p.total_amount || 0,
          provider: p.provider || "telebirr",
          bankReference: p.bank_reference,
          timestamp: "Just now",
        };
        setSettledNotifs((prev) => [notif, ...prev]);
      }

      // Handle Guest Table Bill Request
      if (eventType === "table.bill_requested" && msg.payload) {
        playChime(750, 2);
        const p = msg.payload;
        const newReq: ServiceRequestItem = {
          id: `req-bill-${Date.now()}`,
          table_id: p.table_id || "04",
          table_label: `Table ${p.table_id || "04"}`,
          request_type: "bill",
          details: p.message || "Customer requested final bill / cash collection",
          status: "pending",
        };
        setServiceRequests((prev) => [newReq, ...prev]);
      }

      // Handle Guest Table Service Request alert
      if (eventType === "service.requested" && msg.payload) {
        playChime(650, 2);
        const p = msg.payload;
        const newReq: ServiceRequestItem = {
          id: p.id || `req-${Date.now()}`,
          table_id: p.table_id || "04",
          table_label: p.table_label || `Table ${p.table_id || "04"}`,
          request_type: p.request_type || "call_waiter",
          details: p.details,
          status: p.status || "pending",
        };
        setServiceRequests((prev) => [newReq, ...prev.filter((r) => r.id !== newReq.id)]);
      }
    });

    return () => {
      ws.disconnect();
    };
  }, [soundEnabled]);

  const handleDeliver = async (id: string) => {
    const target = alerts.find((a) => a.id !== id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setDeliveredCount((prev) => prev + 1);

    try {
      const backendUrl = typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:8080/api/v1/waiter/deliver`
        : "http://localhost:8080/api/v1/waiter/deliver";

      await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: target?.orderRef || id }),
      });
    } catch (err) {
      console.warn("waiter deliver sync error", err);
    }
  };

  const handleUpdateServiceRequest = async (id: string, newStatus: "in_progress" | "resolved") => {
    if (newStatus === "resolved") {
      setServiceRequests((prev) => prev.filter((r) => r.id !== id));
    } else {
      setServiceRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "in_progress" } : r))
      );
    }

    try {
      const backendUrl = typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:8080/api/v1/waiter/service-requests?id=${id}`
        : `http://localhost:8080/api/v1/waiter/service-requests?id=${id}`;

      await fetch(backendUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolved_by: "waiter_runner_01" }),
      });
    } catch (err) {
      console.warn("service request status update error", err);
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case "water":
        return "💧";
      case "cutlery":
        return "🍴";
      case "bill":
        return "🧾";
      case "issue":
        return "⚠️";
      default:
        return "🛎️";
    }
  };

  const isTableInZone = (tbl: string) => {
    const clean = tbl.replace(/\D/g, "");
    const num = parseInt(clean, 10);
    if (staffView === "all") return true;
    if (staffView === "abebe") return num >= 1 && num <= 4;
    if (staffView === "tigist") return num >= 5 && num <= 8;
    return true;
  };

  const zoneFilteredRequests = serviceRequests.filter((r) => isTableInZone(r.table_id || r.table_label));

  const filteredAlerts = alerts
    .filter((a) => isTableInZone(a.tableLabel))
    .filter((a) => {
      if (activeFilter === "all") return true;
      return a.source === activeFilter;
    });

  const chefAlertsCount = alerts.filter((a) => a.source === "chef" && isTableInZone(a.tableLabel)).length;
  const cashierAlertsCount = alerts.filter((a) => a.source === "cashier" && isTableInZone(a.tableLabel)).length;

  return (
    <div className="min-h-screen bg-[#fff8f5] text-buna font-sans p-4 max-w-md mx-auto space-y-4 pb-20 select-none">
      {/* Handheld Waiter Mobile Top Bar */}
      <header className="sticky top-0 z-40 bg-[#fff8f5]/95 backdrop-blur-md border-b border-[#ebdcd3] py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link
            href="/admin"
            className="w-8 h-8 rounded-xl bg-white border border-[#ebdcd3] flex items-center justify-center text-xs font-bold text-buna hover:bg-[#faf2ee]"
          >
            ←
          </Link>
          <div>
            <h1 className="text-base font-black text-buna leading-none">
              Waiter Handheld
            </h1>
            <span className="text-[10px] text-primary font-bold block mt-0.5">
              Floor Service Mode • Active Shift
            </span>
          </div>
        </div>

        {/* Action Controls: 86 Stock & Audio Chime */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setIs86DrawerOpen(true)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-black border bg-white hover:bg-[#faf2ee] text-primary border-[#ebdcd3] transition-all flex items-center space-x-1 shadow-sm active:scale-95"
            title="Instant Sold-Out Stock Manager"
          >
            <span>⚡ 86 Items</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime(800, 1);
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black border transition-all flex items-center space-x-1 ${
              soundEnabled
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-buna-mocha border-[#ebdcd3]"
            }`}
          >
            <span>{soundEnabled ? "🔔 ON" : "🔕"}</span>
          </button>
        </div>
      </header>

      {/* Staff Zone & Table Assignment Filter (Phase 2C) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
        <button
          type="button"
          onClick={() => setStaffView("all")}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
            staffView === "all"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-buna border border-[#ebdcd3] hover:bg-[#faf2ee]"
          }`}
        >
          🌐 All Floor ({alerts.length})
        </button>
        <button
          type="button"
          onClick={() => setStaffView("abebe")}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
            staffView === "abebe"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-buna border border-[#ebdcd3] hover:bg-[#faf2ee]"
          }`}
        >
          👤 My Tables: Abebe (T1–T4)
        </button>
        <button
          type="button"
          onClick={() => setStaffView("tigist")}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
            staffView === "tigist"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-buna border border-[#ebdcd3] hover:bg-[#faf2ee]"
          }`}
        >
          👤 My Tables: Tigist (T5–T8)
        </button>
      </div>

      {/* Real-Time Table Settlement Notification Banners */}
      {settledNotifs.length > 0 && (
        <div className="space-y-2">
          {settledNotifs.map((sn) => (
            <div
              key={sn.id}
              className="p-3.5 bg-[#2D7A4D]/10 border-2 border-[#2D7A4D]/40 rounded-2xl flex items-center justify-between text-xs shadow-sm animate-pulse"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-[#2D7A4D]">💰 {sn.tableLabel} BILL SETTLED!</span>
                  <span className="bg-[#2D7A4D] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                    {sn.provider}
                  </span>
                </div>
                <p className="text-[11px] text-buna-mocha">
                  Amount: <strong className="text-buna">ETB {sn.totalAmount}</strong> • Ref: {sn.bankReference || "TB-DIRECT"}. Table cleared for turnover.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettledNotifs((prev) => prev.filter((x) => x.id !== sn.id))}
                className="px-2.5 py-1.5 bg-white border border-[#2D7A4D]/40 text-[#2D7A4D] font-black text-[10px] rounded-xl hover:bg-[#2D7A4D]/10 shrink-0 ml-2"
              >
                Clear ✓
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Guest Assistance Bell Alert Queue */}
      {zoneFilteredRequests.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 flex items-center space-x-1">
              <span>🛎️ Active Table Assistance Calls</span>
              <span className="bg-amber-500 text-black text-[9px] px-1.5 py-0.2 rounded-full font-black">
                {zoneFilteredRequests.length}
              </span>
            </span>
          </div>

          {zoneFilteredRequests.map((req) => (
            <div
              key={req.id}
              className={`p-3.5 rounded-2xl shadow-md border-2 transition-all ${
                req.status === "in_progress"
                  ? "bg-amber-50 border-amber-300 text-amber-950"
                  : "bg-amber-400 border-amber-500 text-black animate-pulse"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="text-2xl">{getRequestIcon(req.request_type)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black uppercase tracking-wider block">
                        {req.table_label}
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-black/10 uppercase">
                        {req.request_type.replace("_", " ")}
                      </span>
                    </div>
                    {req.details ? (
                      <p className="text-xs font-bold mt-0.5 text-black/80">{req.details}</p>
                    ) : (
                      <p className="text-[11px] font-medium mt-0.5 text-black/70">
                        Guest requested {req.request_type.replace("_", " ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {req.status === "pending" && (
                    <button
                      onClick={() => handleUpdateServiceRequest(req.id, "in_progress")}
                      className="px-2.5 py-1.5 bg-black text-white text-[10px] font-black rounded-xl hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                      On My Way 🏃
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateServiceRequest(req.id, "resolved")}
                    className="px-2.5 py-1.5 bg-[#2D7A4D] text-white text-[10px] font-black rounded-xl hover:bg-[#23603d] transition-colors shadow-sm"
                  >
                    Done ✓
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Runner Delivery Queue Filter Tabs */}
      <div className="flex items-center justify-between bg-white p-1 rounded-2xl border border-[#ebdcd3] shadow-sm">
        <button
          onClick={() => setActiveFilter("all")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeFilter === "all"
              ? "bg-primary text-white shadow-sm"
              : "text-buna-mocha hover:text-buna"
          }`}
        >
          All Ready ({alerts.length})
        </button>
        <button
          onClick={() => setActiveFilter("chef")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeFilter === "chef"
              ? "bg-primary text-white shadow-sm"
              : "text-buna-mocha hover:text-buna"
          }`}
        >
          Kitchen Pass ({chefAlertsCount})
        </button>
        <button
          onClick={() => setActiveFilter("cashier")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeFilter === "cashier"
              ? "bg-primary text-white shadow-sm"
              : "text-buna-mocha hover:text-buna"
          }`}
        >
          Till Settle ({cashierAlertsCount})
        </button>
      </div>

      {/* Priority Ready Delivery Queue */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-[#ebdcd3] text-center space-y-2">
            <span className="text-3xl block">🏃💨</span>
            <h3 className="text-sm font-black text-buna">No Ready Deliveries!</h3>
            <p className="text-xs text-buna-mocha">
              The runner pass is clear. New orders ready from the kitchen or cashier will chime here automatically.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <WaiterAlertCard
              key={alert.id}
              id={alert.id}
              orderRef={alert.orderRef}
              tableLabel={alert.tableLabel}
              items={alert.items}
              readyAt={alert.readyAt}
              source={alert.source}
              onDeliver={() => handleDeliver(alert.id)}
            />
          ))
        )}
      </div>

      {/* Runner Shift Stats Pill */}
      <div className="bg-white border border-[#ebdcd3] p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold text-buna shadow-sm">
        <span className="text-buna-mocha">Completed Deliveries This Shift:</span>
        <span className="text-primary font-black text-sm bg-primary/10 px-2.5 py-0.5 rounded-lg">
          {deliveredCount} Orders
        </span>
      </div>

      {/* Mobile 86ing Item Stock Drawer (Phase 2C) */}
      {is86DrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-buna/60 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in"
          onClick={() => setIs86DrawerOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl border-t border-[#ebdcd3] max-w-md w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-[#ebdcd3] pb-3">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg">⚡</span>
                  <h3 className="text-base font-black text-buna">Mobile 86'ing Stock Tool</h3>
                </div>
                <p className="text-[11px] text-buna-mocha">
                  Toggle items sold out instantly from your phone when kitchen runs out
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIs86DrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-[#faf2ee] flex items-center justify-center text-xs font-bold text-buna"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {menuStock.map((it) => (
                <div
                  key={it.id}
                  className="p-3.5 rounded-2xl border border-[#ebdcd3] flex items-center justify-between bg-[#faf5f0]"
                >
                  <div className="text-left space-y-0.5">
                    <span className="text-xs font-black text-buna block">{it.name}</span>
                    <span className="text-[10px] text-primary gees-text block" lang="am">
                      {it.nameAm}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuStock((prev) =>
                        prev.map((x) => (x.id === it.id ? { ...x, available: !x.available } : x))
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all shadow-sm ${
                      it.available
                        ? "bg-[#2D7A4D] text-white hover:bg-[#23633e]"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {it.available ? "🟢 In Stock" : "🔴 86'd Out"}
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIs86DrawerOpen(false)}
              className="w-full py-3 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow hover:bg-primary-container transition-all"
            >
              Done / Close Drawer ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
