"use client";

import { useState } from "react";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tableNumber: string, type: string) => void;
}

export default function CreateTableModal({ isOpen, onClose, onSave }: CreateTableModalProps) {
  const [tableNumber, setTableNumber] = useState("");
  const [type, setType] = useState("table");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) return;
    onSave(tableNumber, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-buna/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg border border-buna/10 p-6 max-w-md w-full space-y-4">
        <h2 className="text-lg font-bold text-primary">Add Table or Pickup Point</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-buna-mocha mb-1">Entity Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna"
            >
              <option value="table">Physical Table (Table Service)</option>
              <option value="pickup">Takeaway Pickup Point (Counter)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-buna-mocha mb-1">
              {type === "pickup" ? "Pickup Point Label (e.g. P04)" : "Table Number (e.g. T04)"}
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder={type === "pickup" ? "P04" : "T04"}
              className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna font-bold"
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-buna/20 rounded-md text-sm text-buna hover:bg-teff">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-container">
              Generate QR Entity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
