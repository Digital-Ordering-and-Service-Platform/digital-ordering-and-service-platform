"use client";

import { useState } from "react";

interface ModifierOption {
  name_en: string;
  name_am: string;
  price_delta: number;
}

interface ModifierGroup {
  id: string;
  group_name_en: string;
  group_name_am: string;
  selection_type: "single" | "multi";
  required: boolean;
  options: ModifierOption[];
}

interface ModifierGroupBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGroup: (group: ModifierGroup) => void;
}

export default function ModifierGroupBuilderModal({
  isOpen,
  onClose,
  onSaveGroup,
}: ModifierGroupBuilderModalProps) {
  const [groupNameEN, setGroupNameEN] = useState("Meat Doneness / Spice Level");
  const [groupNameAM, setGroupNameAM] = useState("የአበሳሰል ወይም የቃሪያ መጠን");
  const [selectionType, setSelectionType] = useState<"single" | "multi">("single");
  const [isRequired, setIsRequired] = useState(true);

  const [options, setOptions] = useState<ModifierOption[]>([
    { name_en: "Mild (No Chili / አልጫ)", name_am: "አልጫ (ቃሪያ የሌለው)", price_delta: 0 },
    { name_en: "Medium Spicy (መካከለኛ)", name_am: "መካከለኛ ቃሪያ", price_delta: 0 },
    { name_en: "Extra Spicy Awaze (በሚጥሚጣና አዋዜ)", name_am: "በአዋዜና በሚጥሚጣ", price_delta: 15 },
  ]);

  const [newOptEN, setNewOptEN] = useState("");
  const [newOptAM, setNewOptAM] = useState("");
  const [newOptDelta, setNewOptDelta] = useState(0);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (!newOptEN.trim()) return;
    setOptions([
      ...options,
      {
        name_en: newOptEN.trim(),
        name_am: newOptAM.trim() || newOptEN.trim(),
        price_delta: Number(newOptDelta) || 0,
      },
    ]);
    setNewOptEN("");
    setNewOptAM("");
    setNewOptDelta(0);
  };

  const handleRemoveOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameEN.trim() || options.length === 0) return;

    onSaveGroup({
      id: `grp-${Date.now()}`,
      group_name_en: groupNameEN.trim(),
      group_name_am: groupNameAM.trim() || groupNameEN.trim(),
      selection_type: selectionType,
      required: isRequired,
      options: options,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-buna/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#ebdcd3] max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start border-b border-[#ebdcd3] pb-3">
          <div>
            <h2 className="text-lg font-black text-buna">Modifier Groups Builder</h2>
            <p className="text-xs text-buna-mocha">
              Build custom single-choice or multi-choice options with Ethiopian Birr price deltas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#faf2ee] text-buna font-bold text-sm hover:bg-[#ebdcd3] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-buna">Group Title (English) *</label>
              <input
                type="text"
                required
                value={groupNameEN}
                onChange={(e) => setGroupNameEN(e.target.value)}
                placeholder="e.g. Meat Doneness, Add-ons"
                className="w-full p-2.5 border border-[#ebdcd3] rounded-xl text-xs text-buna bg-white focus:outline-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-buna">የቡድን ስም (Amharic)</label>
              <input
                type="text"
                value={groupNameAM}
                onChange={(e) => setGroupNameAM(e.target.value)}
                placeholder="ለምሳሌ፦ የአበሳሰል ምርጫ"
                className="w-full p-2.5 border border-[#ebdcd3] rounded-xl text-xs text-buna bg-white focus:outline-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-buna">Selection Rule</label>
              <select
                value={selectionType}
                onChange={(e) => setSelectionType(e.target.value as any)}
                className="w-full p-2.5 border border-[#ebdcd3] rounded-xl text-xs text-buna bg-white focus:outline-primary font-bold cursor-pointer"
              >
                <option value="single">Single Choice (Radio - Exactly 1)</option>
                <option value="multi">Multi Choice (Checkboxes - Any)</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 pt-5">
              <input
                type="checkbox"
                id="reqCheck"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 text-primary focus:ring-primary rounded"
              />
              <label htmlFor="reqCheck" className="text-xs font-bold text-buna cursor-pointer">
                Required for Customer
              </label>
            </div>
          </div>

          {/* Current Options List */}
          <div className="space-y-2 bg-[#faf5f0] p-3.5 rounded-2xl border border-[#ebdcd3]">
            <span className="text-[11px] font-black uppercase tracking-wider text-buna-mocha block">
              Options in this Group ({options.length})
            </span>

            <div className="space-y-2">
              {options.map((opt, i) => (
                <div
                  key={i}
                  className="bg-white p-2.5 rounded-xl border border-[#ebdcd3] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-black text-buna block">{opt.name_en}</span>
                    <span className="text-[10px] text-primary gees-text block" lang="am">
                      {opt.name_am}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-buna bg-[#faf2ee] px-2 py-0.5 rounded text-[11px]">
                      {opt.price_delta > 0 ? `+ETB ${opt.price_delta}` : "Free (0 ETB)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="text-red-500 hover:text-red-700 font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Option Sub-Form */}
            <div className="pt-2 border-t border-[#ebdcd3]/70 space-y-2">
              <span className="text-[10px] font-bold text-buna-mocha uppercase block">+ Add Option</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Option EN (e.g. Rare)"
                  value={newOptEN}
                  onChange={(e) => setNewOptEN(e.target.value)}
                  className="p-2 border border-[#ebdcd3] rounded-lg text-xs bg-white text-buna"
                />
                <input
                  type="text"
                  placeholder="Option AM (ጥሬ)"
                  value={newOptAM}
                  onChange={(e) => setNewOptAM(e.target.value)}
                  className="p-2 border border-[#ebdcd3] rounded-lg text-xs bg-white text-buna"
                />
                <div className="flex space-x-1.5">
                  <input
                    type="number"
                    placeholder="+ETB"
                    value={newOptDelta}
                    onChange={(e) => setNewOptDelta(Number(e.target.value))}
                    className="w-20 p-2 border border-[#ebdcd3] rounded-lg text-xs bg-white text-buna font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex-1 py-1.5 bg-primary text-white font-black text-xs rounded-lg hover:bg-primary-container"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary hover:bg-primary-container text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow transition-all"
          >
            Save Modifier Group & Apply to Catalog ✓
          </button>
        </form>
      </div>
    </div>
  );
}
