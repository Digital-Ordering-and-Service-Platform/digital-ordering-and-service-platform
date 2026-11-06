"use client";

import { useEffect } from "react";

interface PickupAlarmModalProps {
  isOpen: boolean;
  orderRef: string;
  lang?: "en" | "am";
  onPickedUp: () => void;
}

export default function PickupAlarmModal({
  isOpen,
  orderRef,
  lang = "en",
  onPickedUp,
}: PickupAlarmModalProps) {
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      // Play short warm chime sound on ready event per UX-DR7
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 chime
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (err) {
        console.warn("audio chime unavailable", err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-live="assertive"
      aria-label="Self-service pickup alarm"
      className="fixed inset-0 bg-buna/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in"
    >
      <div className="bg-inverse-surface border-2 border-gold text-inverse-on-surface rounded-2xl p-6 text-center max-w-sm w-full space-y-5 shadow-2xl">
        {/* Pulsing Gold Dot per UX-DR7 */}
        <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto border border-gold">
          <span className="w-6 h-6 rounded-full bg-gold animate-ping inline-block" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-gold block">
            ORDER READY FOR PICKUP
          </span>
          <h2 className="text-xl font-black text-white">
            {lang === "am"
              ? "ዝግጁ — እባክዎን ከካውንተሩ ይውሰዱ"
              : "Ready — Please pick up at counter"}
          </h2>
          <span className="text-xs text-outline font-mono block">Order Ref: {orderRef}</span>
        </div>

        <p className="text-xs text-inverse-on-surface/80 leading-relaxed">
          Your food is hot and prepared on the counter pass. Present your order ref to collect.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={onPickedUp}
            className="w-full min-h-[48px] bg-gold text-buna rounded-xl text-sm font-extrabold shadow-lg hover:bg-gold-text hover:text-white transition-all"
          >
            ✓ I Have Picked Up My Order
          </button>
        </div>
      </div>
    </div>
  );
}
