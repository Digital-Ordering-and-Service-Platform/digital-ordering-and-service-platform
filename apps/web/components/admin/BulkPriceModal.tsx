"use client";

import { useState } from "react";

interface BulkPriceModalProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onApply: (adjustmentPct: number, fixedETB: number) => void;
}

export default function BulkPriceModal({ isOpen, selectedCount, onClose, onApply }: BulkPriceModalProps) {
  const [adjustmentPct, setAdjustmentPct] = useState<number>(10);
  const [fixedETB, setFixedETB] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(Number(adjustmentPct), Number(fixedETB));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-buna/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg border border-buna/10 p-6 max-w-md w-full space-y-4">
        <h2 className="text-lg font-bold text-primary">Bulk Price Adjustment</h2>
        <p className="text-xs text-buna-mocha">
          Apply price updates to <strong className="text-buna">{selectedCount > 0 ? `${selectedCount} selected items` : "all menu items"}</strong>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-buna-mocha mb-1">Percentage Increase/Decrease (%)</label>
            <input
              type="number"
              value={adjustmentPct}
              onChange={(e) => setAdjustmentPct(Number(e.target.value))}
              placeholder="e.g. 10 for +10%"
              className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-buna-mocha mb-1">Fixed Amount Adjustment (ETB)</label>
            <input
              type="number"
              value={fixedETB}
              onChange={(e) => setFixedETB(Number(e.target.value))}
              placeholder="e.g. 20 for +20 ETB"
              className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-buna/20 rounded-md text-sm text-buna hover:bg-teff">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-container">
              Apply Price Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
