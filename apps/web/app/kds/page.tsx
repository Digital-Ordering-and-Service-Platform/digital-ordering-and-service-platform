"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import KDSOrderCard from "@/components/kds/KDSOrderCard";
import { MenuFlowWebSocketClient } from "@/lib/websocket";

interface KDSOrder {
  id: string;
  orderNumber: string;
  tableNumber: string;
  status: "Received" | "Cooking" | "Ready";
  paymentStatus: "paid" | "unpaid";
  initialSeconds: number;
  items: {
    id: string;
    name_en: string;
    name_am?: string;
    quantity: number;
    options?: string[];
    removals?: string[];
    special_instructions?: string;
  }[];
}

export default function KDSPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [orders, setOrders] = useState<KDSOrder[]>([
    {
      id: "ord-154",
      orderNumber: "154",
      tableNumber: "04",
      status: "Received",
      paymentStatus: "paid",
      initialSeconds: 95, // 1 min 35s
      items: [
        {
          id: "i1",
          name_en: "Classic Addis Cheeseburger",
          name_am: "ክላሲክ አዲስ ቺዝበርገር",
          quantity: 1,
          removals: ["NO ONIONS", "NO KETCHUP"],
          options: ["Extra Cheddar Cheese"],
          special_instructions: "Medium well, fries on side",
        },
        {
          id: "i2",
          name_en: "Iced Caramel Macchiato",
          name_am: "አይስድ ካራሜል ማኪያቶ",
          quantity: 1,
          removals: ["NO ICE"],
          options: ["Oat Milk Swap"],
        },
      ],
    },
    {
      id: "ord-123",
      orderNumber: "123",
      tableNumber: "02",
      status: "Cooking",
      paymentStatus: "paid",
      initialSeconds: 723, // 12 mins 03 secs (Aging warning)
      items: [
        {
          id: "i4",
          name_en: "Special Shekla Tibs",
          name_am: "የሸክላ ጥብስ",
          quantity: 2,
          removals: ["NO JALAPEÑOS / MILD"],
          options: ["Extra Spiced Butter (ቅቤ)"],
          special_instructions: "Serve extra hot in clay pot",
        },
        { id: "i5", name_en: "Traditional Jebena Buna", name_am: "የጀበና ቡና", quantity: 2 },
      ],
    },
    {
      id: "ord-160",
      orderNumber: "160",
      tableNumber: "05",
      status: "Cooking",
      paymentStatus: "unpaid",
      initialSeconds: 480, // 8 mins
      items: [
        {
          id: "i7",
          name_en: "Smoky BBQ Bacon Burger",
          name_am: "ስሞኪ ቢቢኪው ቤከን በርገር",
          quantity: 1,
          removals: ["NO ONIONS"],
          options: ["Extra Beef Bacon"],
        },
        { id: "i8", name_en: "Fresh Avocado Mango Spris", name_am: "አቮካዶ ማንጎ ስፕሪስ", quantity: 1, removals: ["NO SUGAR"] },
      ],
    },
  ]);

  // Audio chime synthesizer
  const playAudioChime = (frequency = 600, duration = 0.2) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy handled silently
    }
  };

  // 1. Fetch live active orders from backend on mount
  useEffect(() => {
    async function loadActiveOrders() {
      try {
        const backendUrl = typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.hostname}:8080/api/v1/kds/orders/active`
          : "http://localhost:8080/api/v1/kds/orders/active";

        const res = await fetch(backendUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && data.active_orders && data.active_orders.length > 0) {
            const mapped: KDSOrder[] = data.active_orders.map((o: any) => ({
              id: o.id,
              orderNumber: o.order_ref ? o.order_ref.split("-")[1] || o.id.slice(-3) : o.id.slice(-3),
              tableNumber: o.table_label ? o.table_label.replace("Table ", "") : "04",
              status: o.status === "Preparing" ? "Cooking" : o.status,
              paymentStatus: o.payment_status || "paid",
              initialSeconds: (o.elapsed_mins || 1) * 60,
              items: (o.items || []).map((it: any) => ({
                id: it.id,
                name_en: it.name_en,
                name_am: it.name_am,
                quantity: it.quantity,
                options: it.options || [],
                special_instructions: it.special_instructions,
              })),
            }));

            // Merge with default orders to avoid duplicates
            setOrders((prev) => {
              const existingIds = new Set(prev.map((x) => x.id));
              const newItems = mapped.filter((x) => !existingIds.has(x.id));
              return [...newItems, ...prev];
            });
          }
        }
      } catch (err) {
        console.warn("kds: failed to fetch active orders from backend", err);
      }
    }

    loadActiveOrders();
  }, []);

  // 2. Connect to real-time WebSocket for new orders & bump broadcasts
  useEffect(() => {
    const ws = new MenuFlowWebSocketClient("restaurant:01J8RESTAURANT000000000001:kds");
    ws.connect((msg) => {
      setWsConnected(true);
      if (msg && msg.event_type === "order.created" && msg.payload) {
        const p = msg.payload;
        playAudioChime(750, 0.3); // High ping for new incoming kitchen order

        const newOrder: KDSOrder = {
          id: p.id,
          orderNumber: p.id ? p.id.slice(-3) : `${Math.floor(100 + Math.random() * 900)}`,
          tableNumber: p.table_id || "04",
          status: "Received",
          paymentStatus: p.payment_status || "paid",
          initialSeconds: 0,
          items: (p.items || []).map((it: any) => ({
            id: it.id || `i-${Math.random()}`,
            name_en: it.menu_item_id || "Special Dish",
            name_am: it.menu_item_id || "ምግብ",
            quantity: it.quantity || 1,
            special_instructions: it.special_instructions,
          })),
        };

        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      }
    });

    return () => {
      ws.disconnect();
    };
  }, [soundEnabled]);

  const handleBump = async (id: string) => {
    const target = orders.find((o) => o.id === id);
    if (!target) return;

    playAudioChime(450, 0.15); // Tactile bump click sound

    if (target.status === "Received") {
      // Transition from Received -> Cooking
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "Cooking" } : o))
      );

      try {
        const backendUrl = typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.hostname}:8080/api/v1/kds/orders/status?id=${id}`
          : `http://localhost:8080/api/v1/kds/orders/status?id=${id}`;

        await fetch(backendUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from_status: "Received", to_status: "Preparing" }),
        });
      } catch (err) {
        console.warn("kds bump status sync error", err);
      }
    } else {
      // Transition from Cooking -> Ready (Dish is ready for floor runner!)
      setOrders((prev) => prev.filter((o) => o.id !== id));

      try {
        const backendUrl = typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.hostname}:8080/api/v1/kds/orders/status?id=${id}`
          : `http://localhost:8080/api/v1/kds/orders/status?id=${id}`;

        await fetch(backendUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from_status: "Preparing", to_status: "Ready" }),
        });
      } catch (err) {
        console.warn("kds ready status sync error", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#121110] text-white font-sans select-none flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div>
        {/* Tablet Top Navigation Bar */}
        <header className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          {/* Back Navigation Button */}
          <Link
            href="/"
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
            title="Return to Main Navigation Hub"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Centered KDS Title */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-widest uppercase text-white">
                KDS
              </h1>
              <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-[#22c55e] animate-ping" : "bg-amber-400"}`} />
            </div>
            <span className="text-[10px] text-[#a3a3a3] uppercase tracking-wider font-semibold block">
              Kitchen Display Pass • Bole Kitchen {wsConnected && "• Live Stream Active"}
            </span>
          </div>

          {/* Right Action Icons: Notification, Settings, Volume */}
          <div className="flex items-center space-x-2">
            <Link
              href="/admin/settings"
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
              title="KDS Operational Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playAudioChime(600, 0.2);
              }}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                soundEnabled
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  : "bg-white/5 text-[#a3a3a3] border-white/10"
              }`}
              title={soundEnabled ? "Audio chime ON" : "Audio chime MUTED"}
            >
              <span className="text-sm">{soundEnabled ? "🔔" : "🔕"}</span>
            </button>
          </div>
        </header>

        {/* Live Ticket Orders Grid */}
        {orders.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <span className="text-5xl block">🍳</span>
            <h3 className="text-xl font-bold text-white">All Clear, Chef!</h3>
            <p className="text-xs text-[#a3a3a3]">
              No pending orders in the kitchen queue. New tickets will appear automatically via live WebSockets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {orders.map((order) => (
              <KDSOrderCard
                key={order.id}
                id={order.id}
                orderNumber={order.orderNumber}
                tableNumber={order.tableNumber}
                status={order.status}
                paymentStatus={order.paymentStatus}
                items={order.items}
                initialSeconds={order.initialSeconds}
                onBump={handleBump}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info Bar */}
      <footer className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#a3a3a3] gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
          <span>Active Kitchen Queue: <strong className="text-white">{orders.length} Tickets</strong></span>
        </div>
        <div>
          <span>Tap <strong>Bump</strong> once to start cooking, tap again when ready for table runner.</span>
        </div>
      </footer>
    </div>
  );
}
