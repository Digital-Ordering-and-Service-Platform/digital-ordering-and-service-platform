"use client";

interface HeaderPillProps {
  label: string;
  type: string; // "table" | "pickup"
  branchName?: string;
}

export default function HeaderPill({ label, type, branchName = "Bole" }: HeaderPillProps) {
  const isPickup = type === "pickup";

  return (
    <div className="inline-flex items-center space-x-2">
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center space-x-1 ${
          isPickup
            ? "bg-primary text-white"
            : "bg-surface-container-high text-primary border border-primary/20"
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-yetsom-container animate-pulse inline-block" />
        <span>{isPickup ? `Pickup #${label} • ${branchName}` : `Table ${label} • ${branchName}`}</span>
      </span>
    </div>
  );
}
