"use client";

import { useState } from "react";

interface ItemFormProps {
  isOpen: boolean;
  categoryId: string;
  onClose: () => void;
  onSave: (item: any) => void;
}

export default function ItemFormModal({ isOpen, categoryId, onClose, onSave }: ItemFormProps) {
  const [nameEN, setNameEN] = useState("");
  const [nameAM, setNameAM] = useState("");
  const [descEN, setDescEN] = useState("");
  const [descAM, setDescAM] = useState("");
  const [price, setPrice] = useState(480);
  const [prepTime, setPrepTime] = useState(15);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      category_id: categoryId,
      name_en: nameEN,
      name_am: nameAM,
      description_en: descEN,
      description_am: descAM,
      price: Number(price),
      prep_time_minutes: Number(prepTime),
      is_available: true,
      allergen_tags: ["Dairy"],
      options: [
        { name_en: "Extra Injera", name_am: "ተጨማሪ እንጀራ", price_delta: 30, type: "addon" },
      ],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-buna/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg border border-buna/10 p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-primary">Add Menu Item</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-buna-mocha mb-1">Item Name (English)</label>
              <input
                type="text"
                value={nameEN}
                onChange={(e) => setNameEN(e.target.value)}
                placeholder="Special Shekla Tibs"
                className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-buna-mocha mb-1 gees-text" lang="am">የምግብ ስም (አማርኛ)</label>
              <input
                type="text"
                value={nameAM}
                onChange={(e) => setNameAM(e.target.value)}
                placeholder="የሸክላ ጥብስ"
                lang="am"
                className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna gees-text"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-buna-mocha mb-1">Price (ETB)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-buna-mocha mb-1">Prep Time (mins)</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-buna-mocha mb-1">Description (English)</label>
            <textarea
              value={descEN}
              onChange={(e) => setDescEN(e.target.value)}
              placeholder="Sizzling prime beef seared in spiced butter"
              className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-buna-mocha mb-1 gees-text" lang="am">መግለጫ (አማርኛ)</label>
            <textarea
              value={descAM}
              onChange={(e) => setDescAM(e.target.value)}
              placeholder="በተነጠረ ቅቤ የተጠበሰ የሸክላ ጥብስ"
              lang="am"
              className="w-full px-3 py-2 border border-buna/20 rounded-md text-sm text-buna gees-text"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-buna/20 rounded-md text-sm text-buna hover:bg-teff">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-container">
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
