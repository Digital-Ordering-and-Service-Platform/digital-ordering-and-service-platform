"use client";

import { useState } from "react";

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cat: { name_en: string; name_am: string; sort_order: number }) => void;
}

export default function CategoryFormModal({ isOpen, onClose, onSave }: CategoryFormProps) {
  const [nameEN, setNameEN] = useState("");
  const [nameAM, setNameAM] = useState("");
  const [sortOrder, setSortOrder] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEN && !nameAM) return;
    onSave({ name_en: nameEN, name_am: nameAM, sort_order: Number(sortOrder) });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-buna/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg border border-buna/10 p-6 max-w-md w-full space-y-4">
        <h2 className="text-lg font-bold text-primary">Add Menu Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-buna-mocha mb-1">Category Name (English)</label>
            <input
              type="text"
              value={nameEN}
              onChange={(e) => setNameEN(e.target.value)}
              placeholder="e.g. Traditional Meals"
              className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna focus:outline-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-buna-mocha mb-1 gees-text" lang="am">የምድብ ስም (አማርኛ)</label>
            <input
              type="text"
              value={nameAM}
              onChange={(e) => setNameAM(e.target.value)}
              placeholder="ምሳሌ፡ የባህል ምግቦች"
              lang="am"
              className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna focus:outline-primary gees-text"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-buna-mocha mb-1">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna focus:outline-primary"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-buna/20 rounded-md text-sm text-buna hover:bg-teff">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-container">
              Save Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
