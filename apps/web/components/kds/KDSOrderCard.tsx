"use client";

import { useEffect, useState } from "react";

interface KDSItem {
  id: string;
  name_en: string;
  name_am?: string;
  quantity: number;
  options?: string[];
  removals?: string[];
  special_instructions?: string;
  voice_note_url?: string;
  voice_note_data?: string;
  is_off_menu?: boolean;
}

interface KDSOrderCardProps {
  id: string;
  orderNumber: string;
  tableNumber: string;
  status: "Received" | "Cooking" | "Ready";
  paymentStatus: "paid" | "unpaid";
  items: KDSItem[];
  initialSeconds: number;
  onBump: (id: string) => void;
}

export default function KDSOrderCard({
  id,
  orderNumber,
  tableNumber,
  status: initialStatus,
  paymentStatus,
  items,
  initialSeconds,
  onBump,
}: KDSOrderCardProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [status, setStatus] = useState<"Received" | "Cooking" | "Ready">(initialStatus);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  const togglePlayVoiceNote = (itemId: string, audioSrc?: string) => {
    if (!audioSrc) return;
    if (playingItemId === itemId) {
      setPlayingItemId(null);
    } else {
      setPlayingItemId(itemId);
      const audio = new Audio(audioSrc);
      audio.onended = () => setPlayingItemId(null);
      audio.onerror = () => setPlayingItemId(null);
      audio.play().catch(() => setPlayingItemId(null));
    }
  };

  // Live seconds ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTimer = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  // Aging thresholds
  const isAgingWarning = mins >= 8 && mins < 15;
  const isCriticalLate = mins >= 15;

  let cardBorder = "border-[#2d3748]";
  let headerBg = "bg-[#253248]";
  let headerText = "text-white";

  if (isCriticalLate) {
    cardBorder = "border-[#dc2626] ring-2 ring-[#dc2626] animate-pulse";
    headerBg = "bg-[#7f1d1d]";
    headerText = "text-[#fecaca]";
  } else if (isAgingWarning) {
    cardBorder = "border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.25)]";
    headerBg = "bg-[#453414]";
    headerText = "text-[#fef08a]";
  }

  const handleAction = () => {
    if (status === "Received") {
      setStatus("Cooking");
    } else {
      onBump(id);
    }
  };

  return (
    <div
      className={`bg-[#171717] rounded-2xl border-2 ${cardBorder} flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-200 min-h-[380px] max-w-sm w-full`}
    >
      {/* Top Header Banner with Order # and Huge Table Number */}
      <div>
        <div className={`${headerBg} px-5 py-4 flex items-center justify-between border-b border-white/10`}>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-black tracking-widest text-[#38bdf8] bg-black/40 px-3 py-1 rounded-xl border border-[#38bdf8]/40 shadow-inner">
                TABLE {tableNumber}
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#d4d4d4] block pt-1">
              ORDER #{orderNumber}
            </span>
          </div>

          <span
            className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${
              paymentStatus === "paid"
                ? "bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/30"
                : "bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/30"
            }`}
          >
            {paymentStatus === "paid" ? "PAID" : "UNPAID"}
          </span>
        </div>

        {/* Dish Items List with Quantities & High-Contrast Customizations */}
        <div className="p-5 space-y-4 divide-y divide-white/10">
          {items.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between">
              <div className="pr-3 space-y-1.5 flex-1">
                <div className="flex items-baseline space-x-2">
                  <span className="text-lg sm:text-xl font-black text-white block leading-snug">
                    {item.name_en}
                  </span>
                </div>

                {item.name_am && (
                  <span className="text-xs text-[#a3a3a3] block gees-text font-semibold" lang="am">
                    {item.name_am}
                  </span>
                )}

                {/* CUSTOMER CUSTOMIZATION HIGHLIGHT BOX */}
                {((item.removals && item.removals.length > 0) ||
                  (item.options && item.options.length > 0) ||
                  item.special_instructions) && (
                  <div className="bg-[#241a13] border-2 border-[#f59e0b]/50 rounded-xl p-2.5 space-y-1.5 mt-2 shadow-md">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                      ⚡ Customer Customization:
                    </span>

                    {/* Removals / What customer DOES NOT want in RED */}
                    {item.removals && item.removals.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.removals.map((rem, i) => (
                          <span
                            key={i}
                            className="text-xs font-black tracking-wide text-white bg-[#dc2626] border border-[#ef4444] px-2 py-0.5 rounded shadow-sm"
                          >
                            🚫 {rem}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add-ons / What customer WANTS EXTRA in AMBER */}
                    {item.options && item.options.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.options.map((opt, i) => (
                          <span
                            key={i}
                            className="text-xs font-black tracking-wide text-[#fef08a] bg-[#854d0e] border border-[#ca8a04] px-2 py-0.5 rounded shadow-sm"
                          >
                            ⭐ + {opt}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Special Chef Kitchen Instructions */}
                    {item.special_instructions && (
                      <div className="bg-[#171717] border border-amber-400/40 rounded-lg p-2">
                        <span className="text-xs font-black text-amber-300 italic block leading-relaxed">
                          👨‍🍳 Special Note: "{item.special_instructions}"
                        </span>
                      </div>
                    )}

                    {/* Customer Spoken Voice Note Audio Player (Phase 2B) */}
                    {(item.voice_note_data || item.voice_note_url || (item.special_instructions && item.special_instructions.includes("Voice note"))) && (
                      <button
                        type="button"
                        onClick={() => togglePlayVoiceNote(item.id, item.voice_note_data || item.voice_note_url || "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAA")}
                        className="w-full py-2 px-3 bg-[#78350f] hover:bg-[#92400e] text-[#fef08a] border border-[#f59e0b] rounded-lg text-xs font-black flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md mt-1"
                      >
                        <span>{playingItemId === item.id ? "⏸ Pause Voice Note" : "🎙️ Play Guest Voice Instruction"}</span>
                      </button>
                    )}

                    {/* Off-Menu Custom Order Tag */}
                    {(item.is_off_menu || item.name_en.includes("Off-Menu")) && (
                      <div className="bg-[#451a03] border border-[#f59e0b] px-2 py-1 rounded text-center">
                        <span className="text-[10px] font-black text-[#fde68a] uppercase tracking-wider">
                          ✨ OFF-MENU SPECIAL PREPARATION
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Large Quantity Badge on Right */}
              <div className="shrink-0 pl-3 text-center">
                <span className="text-2xl sm:text-3xl font-black text-white bg-white/10 px-3 py-1 rounded-xl block border border-white/20">
                  {item.quantity}x
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Status, Timer & Bump Button */}
      <div className="p-5 pt-2 space-y-3 bg-[#171717]">
        {/* Status Badge & Live Clock */}
        <div className="flex items-center justify-between text-xs">
          <span
            className={`px-3 py-1 rounded-lg font-extrabold uppercase text-xs ${
              status === "Cooking"
                ? "bg-[#ea580c] text-white shadow-sm"
                : status === "Received"
                ? "bg-[#38bdf8]/20 text-[#38bdf8]"
                : "bg-[#22c55e] text-white"
            }`}
          >
            {status}
          </span>

          <div className="font-mono text-sm font-extrabold flex items-center space-x-1.5">
            <span className="text-[#a3a3a3] text-xs font-normal">Timer</span>
            <span
              className={
                isCriticalLate
                  ? "text-[#ef4444]"
                  : isAgingWarning
                  ? "text-[#f59e0b]"
                  : "text-white"
              }
            >
              {formattedTimer}
            </span>
          </div>
        </div>

        {/* Large Tactile 1-Tap Bump Button */}
        <button
          type="button"
          onClick={handleAction}
          className={`w-full min-h-[50px] font-black text-base rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center space-x-2 ${
            status === "Received"
              ? "bg-[#38bdf8] hover:bg-[#0284c7] text-[#0f172a]"
              : "bg-white hover:bg-[#f5f5f5] text-[#171717]"
          }`}
        >
          <span>{status === "Received" ? "Start Cooking ▶" : "Bump"}</span>
        </button>
      </div>
    </div>
  );
}
