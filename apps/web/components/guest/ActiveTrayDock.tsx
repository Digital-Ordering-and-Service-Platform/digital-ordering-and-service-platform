"use client";

interface ActiveTrayDockProps {
  itemCount: number;
  totalPriceETB: number;
  onOpenTray: () => void;
  onCheckout: () => void;
}

export default function ActiveTrayDock({
  itemCount,
  totalPriceETB,
  onOpenTray,
  onCheckout,
}: ActiveTrayDockProps) {
  if (itemCount <= 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-buna/10 p-3 shadow-xl flex items-center justify-between">
        {/* Tray Summary Pill */}
        <div
          onClick={onOpenTray}
          className="flex items-center space-x-3 cursor-pointer pl-1"
        >
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-lg font-bold shadow-sm">
            🛒
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-buna-mocha block">
              Active Tray
            </span>
            <span className="text-sm font-bold text-primary">
              {itemCount} {itemCount === 1 ? "item" : "items"} • {totalPriceETB} ETB
            </span>
          </div>
        </div>

        {/* Checkout Action Button */}
        <button
          type="button"
          onClick={onCheckout}
          className="min-h-[48px] px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-container transition-all flex items-center space-x-1.5"
        >
          <span>Checkout</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
