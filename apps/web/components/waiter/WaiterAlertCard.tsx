"use client";

interface WaiterItem {
  name: string;
  quantity: number;
  customizations?: string[];
}

interface WaiterAlertCardProps {
  id: string;
  orderRef: string;
  tableLabel: string;
  items: WaiterItem[];
  readyAt: string;
  source: "chef" | "cashier";
  onDeliver: (id: string) => void;
}

export default function WaiterAlertCard({
  id,
  orderRef,
  tableLabel,
  items,
  readyAt,
  source,
  onDeliver,
}: WaiterAlertCardProps) {
  const isChef = source === "chef";

  return (
    <div className="bg-white rounded-3xl p-5 border-2 border-[#ebdcd3] shadow-md hover:shadow-lg transition-all text-left space-y-4 relative overflow-hidden">
      {/* Top Banner with Source (Chef vs Cashier) & Timer */}
      <div className="flex items-center justify-between border-b border-[#ebdcd3] pb-3">
        {/* Source Badge: Chef or Cashier */}
        <div className="flex items-center space-x-1.5">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 ${
              isChef
                ? "bg-[#9d3e0f]/15 text-[#9d3e0f] border border-[#9d3e0f]/30"
                : "bg-emerald-100 text-emerald-800 border border-emerald-300"
            }`}
          >
            <span>{isChef ? "👨‍🍳 Kitchen Pass (Chef)" : "💵 Counter / Bar (Cashier)"}</span>
          </span>
        </div>

        {/* Ready Timer */}
        <div className="flex items-center space-x-1 text-xs font-mono font-bold text-primary">
          <span>⏱️</span>
          <span>Ready {readyAt}</span>
        </div>
      </div>

      {/* Prominent Table Number Banner */}
      <div className="flex items-center justify-between bg-[#faf2ee] p-3.5 rounded-2xl border border-[#ebdcd3]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-buna-mocha block">
            Deliver To Location:
          </span>
          <span className="text-2xl font-black text-primary tracking-wide block mt-0.5">
            {tableLabel}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-buna-mocha block">
            Ref: {orderRef}
          </span>
          <span className="text-[11px] font-bold text-buna bg-white px-2 py-0.5 rounded-md border border-[#ebdcd3] mt-1 inline-block">
            {items.reduce((acc, i) => acc + i.quantity, 0)} Items Ready
          </span>
        </div>
      </div>

      {/* Itemized Food & Drinks with Highlighted Customizations */}
      <div className="space-y-2">
        <span className="text-[11px] font-black text-buna-mocha uppercase tracking-wider block">
          Dishes to Pick Up & Serve:
        </span>
        <div className="space-y-2 divide-y divide-[#ebdcd3]/40">
          {items.map((item, idx) => (
            <div key={idx} className="pt-2 first:pt-0 space-y-1">
              <div className="flex items-baseline space-x-2 text-sm font-bold text-buna">
                <span className="text-primary font-black">{item.quantity}x</span>
                <span>{item.name}</span>
              </div>

              {/* Customizations tags */}
              {item.customizations && item.customizations.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-5">
                  {item.customizations.map((c, cIdx) => (
                    <span
                      key={cIdx}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        c.toLowerCase().includes("no ")
                          ? "bg-red-100 text-red-700"
                          : c.toLowerCase().includes("voice note")
                          ? "bg-amber-100 text-amber-800 border border-amber-300 font-black"
                          : c.toLowerCase().includes("off-menu")
                          ? "bg-amber-200 text-amber-900 border border-amber-400 font-black"
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

      {/* Action Button: Mark Delivered to Table */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => onDeliver(id)}
          className="w-full min-h-[50px] bg-primary hover:bg-primary-container text-white rounded-2xl text-sm font-black shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
        >
          <span>🚀</span>
          <span>MARK DELIVERED TO {tableLabel.toUpperCase()} ✓</span>
        </button>
      </div>
    </div>
  );
}
