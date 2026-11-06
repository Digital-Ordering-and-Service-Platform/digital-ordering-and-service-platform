"use client";
import { useEffect, useState } from "react";
import VoiceNoteRecorder from "./VoiceNoteRecorder";

export interface Option {
  name_en: string;
  name_am: string;
  price_delta: number;
  type: string; // "addon" | "removal" | "variant"
}

export interface ItemPayload {
  id: string;
  nameEN: string;
  nameAM: string;
  basePrice: number;
  descriptionEN?: string;
  descriptionAM?: string;
  ingredientsEN?: string[];
  ingredientsAM?: string[];
  options?: Option[];
  removals?: Option[];
  addons?: Option[];
}

interface CustomizeSheetProps {
  isOpen: boolean;
  item: ItemPayload | null;
  lang: "en" | "am";
  onClose: () => void;
  onConfirm: (customizedItem: any) => void;
}

export default function CustomizeSheet({
  isOpen,
  item,
  lang,
  onClose,
  onConfirm,
}: CustomizeSheetProps) {
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [selectedRemovals, setSelectedRemovals] = useState<Record<string, boolean>>({});
  const [selectedVariant, setSelectedVariant] = useState<string>("default");
  const [instructions, setInstructions] = useState("");
  const [voiceNoteData, setVoiceNoteData] = useState<{ audioBase64: string; durationSec: number } | null>(null);

  // Reset form whenever a new item is opened
  useEffect(() => {
    if (item) {
      setSelectedAddons({});
      setSelectedRemovals({});
      setSelectedVariant("default");
      setInstructions("");
      setVoiceNoteData(null);
    }
  }, [item?.id]);

  if (!isOpen || !item) return null;

  // Resolve item addons and removals with sensible defaults
  const effectiveAddons = item.addons && item.addons.length > 0
    ? item.addons
    : (item.options?.filter((o) => o.type === "addon") || []);

  const effectiveRemovals = item.removals && item.removals.length > 0
    ? item.removals
    : (item.options?.filter((o) => o.type === "removal") || [
        { name_en: "No Onions", name_am: "ሽንኩርት የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Ketchup", name_am: "ኬትቸፕ የሌለው", price_delta: 0, type: "removal" },
      ]);

  // Calculate live item price with selected option deltas
  let calculatedPrice = item.basePrice;
  Object.keys(selectedAddons).forEach((optName) => {
    if (selectedAddons[optName]) {
      const opt = effectiveAddons.find((o) => o.name_en === optName);
      if (opt) calculatedPrice += opt.price_delta;
    }
  });

  const handleAddonToggle = (nameEN: string) => {
    setSelectedAddons((prev) => ({ ...prev, [nameEN]: !prev[nameEN] }));
  };

  const handleRemovalToggle = (nameEN: string) => {
    setSelectedRemovals((prev) => ({ ...prev, [nameEN]: !prev[nameEN] }));
  };

  const handleSubmit = () => {
    onConfirm({
      item_id: item.id,
      name_en: item.nameEN,
      name_am: item.nameAM,
      final_price: calculatedPrice,
      selected_addons: selectedAddons,
      selected_removals: selectedRemovals,
      selected_variant: selectedVariant,
      special_instructions: instructions,
      voice_note_data: voiceNoteData?.audioBase64,
      voice_note_duration: voiceNoteData?.durationSec,
    });
    onClose();
  };

  const ingredients = lang === "am" && item.ingredientsAM?.length
    ? item.ingredientsAM
    : item.ingredientsEN;

  return (
    <div
      role="dialog"
      aria-expanded={isOpen}
      aria-controls="customize-sheet-modal"
      className="fixed inset-0 bg-buna/50 backdrop-blur-sm z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        id="customize-sheet-modal"
        className="bg-surface-container border-t border-buna/10 rounded-t-3xl max-w-md w-full p-5 space-y-4 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-buna/10 pb-3">
          <div>
            <h2 className="text-lg font-black text-buna">
              {lang === "am" ? "ትዕዛዝዎን ያስተካክሉ" : "Customize Your Order"}
            </h2>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-xs font-bold text-primary">
                {item.nameEN} {item.nameAM && `(${item.nameAM})`}
              </span>
              <span className="text-xs font-extrabold text-buna-mocha">
                • Base ETB {item.basePrice}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-buna/15 flex items-center justify-center text-buna font-bold text-sm hover:bg-[#faf2ee] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* What's Inside / Ingredients Breakdown */}
        {ingredients && ingredients.length > 0 && (
          <div className="p-3 bg-[#faf2ee] rounded-2xl border border-[#ebdcd3] space-y-1.5 text-left">
            <span className="text-[10px] font-black text-buna-mocha uppercase tracking-wider block">
              🥗 {lang === "am" ? "የምግቡ/መጠጡ ይዘት (What's inside)" : "What's Inside (Ingredients)"}
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {ingredients.map((ing, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-semibold bg-white text-buna px-2 py-0.5 rounded-lg border border-[#ebdcd3]"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Removals Section ("Hold / Don't Want") */}
        {effectiveRemovals.length > 0 && (
          <div className="space-y-2 text-left">
            <div>
              <span className="text-xs font-black text-[#dc2626] uppercase tracking-wider block">
                {lang === "am" ? "የሚቀነሱ ነገሮች (Hold / Remove)" : "Removals (Hold / Remove)"}
              </span>
              <p className="text-[11px] text-buna-mocha">
                {lang === "am"
                  ? "የማይፈልጉትን ይምረጡ (ለሼፉና ገንዘብ ተቀባይ ይተላለፋል)"
                  : "Tap any item you do not want (sent directly to chef & cashier)"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {effectiveRemovals.map((opt) => {
                const isSelected = !!selectedRemovals[opt.name_en];
                return (
                  <button
                    type="button"
                    key={opt.name_en}
                    onClick={() => handleRemovalToggle(opt.name_en)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-red-50 border-red-500 text-red-700 shadow-sm"
                        : "bg-white border-buna/10 text-buna hover:border-buna/30"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 overflow-hidden">
                      <span className="text-xs">{isSelected ? "❌" : "⚪"}</span>
                      <span className="text-xs font-bold truncate">
                        {lang === "am" ? opt.name_am : opt.name_en}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add-ons Section */}
        {effectiveAddons.length > 0 && (
          <div className="space-y-2 text-left">
            <span className="text-xs font-black text-buna-mocha uppercase tracking-wider block">
              ➕ {lang === "am" ? "ተጨማሪዎች (Add-ons)" : "Add-ons (Extras)"}
            </span>
            <div className="space-y-1.5">
              {effectiveAddons.map((opt) => {
                const isSelected = !!selectedAddons[opt.name_en];
                return (
                  <button
                    type="button"
                    key={opt.name_en}
                    onClick={() => handleAddonToggle(opt.name_en)}
                    className={`w-full p-2.5 rounded-xl border transition-all flex items-center justify-between text-left ${
                      isSelected
                        ? "bg-[#faf2ee] border-primary text-buna shadow-sm"
                        : "bg-white border-buna/10 text-buna hover:border-buna/30"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs">{isSelected ? "✅" : "⚪"}</span>
                      <span className="text-xs font-bold">
                        {lang === "am" ? opt.name_am : opt.name_en}
                      </span>
                    </div>
                    <span className="text-xs font-black text-primary">
                      +{opt.price_delta} ETB
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        <div className="space-y-1 text-left">
          <label className="block text-xs font-bold text-buna-mocha uppercase tracking-wider">
            📝 {lang === "am" ? "ለማብሰያ ክፍሉ ልዩ ማስታወሻ" : "Special Kitchen Instructions"}
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={
              lang === "am"
                ? "ለምሳሌ፦ ጨው አታብዙበት፣ ቃሪያ በጥንቃቄ..."
                : "e.g., Well-done burger patty, dressing on the side, allergy notes..."
            }
            className="w-full p-3 border border-buna/20 rounded-xl text-xs text-buna bg-white focus:outline-primary placeholder:text-buna-mocha/60"
            rows={2}
          />
        </div>

        {/* Spoken Voice Note Audio Recorder per Phase 2B */}
        <VoiceNoteRecorder lang={lang} onVoiceNoteChange={setVoiceNoteData} />

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full min-h-[48px] bg-primary hover:bg-primary-container text-white rounded-2xl text-sm font-black shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <span>🛒</span>
            <span>
              {lang === "am" ? "ወደ ትሪው ጨምር" : "Add to Tray"} • ETB {calculatedPrice}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
