"use client";

import { useState } from "react";
import VoiceNoteRecorder from "./VoiceNoteRecorder";

interface OffMenuRequestModalProps {
  isOpen: boolean;
  lang: "en" | "am";
  onClose: () => void;
  onAddOffMenu: (item: any) => void;
}

export default function OffMenuRequestModal({
  isOpen,
  lang,
  onClose,
  onAddOffMenu,
}: OffMenuRequestModalProps) {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<"food" | "drink">("food");
  const [instructions, setInstructions] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<number>(200);
  const [voiceNoteData, setVoiceNoteData] = useState<{ audioBase64: string; durationSec: number } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const customItem = {
      id: `offmenu-${Date.now()}`,
      name_en: `⭐ Off-Menu: ${itemName}`,
      name_am: `⭐ ልዩ ትዕዛዝ፦ ${itemName}`,
      final_price: estimatedPrice > 0 ? estimatedPrice : 150,
      quantity: 1,
      is_available: true,
      is_off_menu: true,
      special_instructions: [
        instructions.trim() ? instructions.trim() : "",
        voiceNoteData ? "🎙️ Voice note attached" : "",
        "Price subject to floor waiter confirmation",
      ].filter(Boolean).join(" | "),
      voice_note_data: voiceNoteData?.audioBase64,
      voice_note_duration: voiceNoteData?.durationSec,
    };

    onAddOffMenu(customItem);
    setItemName("");
    setInstructions("");
    setVoiceNoteData(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-buna/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl border border-[#ebdcd3] max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start border-b border-[#ebdcd3]/70 pb-3">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl">✨</span>
              <h2 className="text-lg font-black text-buna">
                {lang === "am" ? "የልዩ ትዕዛዝ ጥያቄ (Off-Menu)" : "Request Off-Menu Item"}
              </h2>
            </div>
            <p className="text-[11px] text-buna-mocha font-medium mt-0.5">
              {lang === "am"
                ? "በሜኑ ውስጥ የሌለ ምግብ ወይም መጠጥ በቀጥታ ለሼፉ ወይም ባሬስታው ያዝዙ"
                : "Craving a dish or beverage not listed? Request custom preparation."}
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

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Category Toggle */}
          <div className="flex rounded-xl bg-[#faf5f0] p-1 border border-[#ebdcd3]">
            <button
              type="button"
              onClick={() => setCategory("food")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                category === "food" ? "bg-primary text-white shadow-sm" : "text-buna-mocha"
              }`}
            >
              🍲 {lang === "am" ? "ልዩ ምግብ" : "Custom Food"}
            </button>
            <button
              type="button"
              onClick={() => setCategory("drink")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                category === "drink" ? "bg-primary text-white shadow-sm" : "text-buna-mocha"
              }`}
            >
              ☕ {lang === "am" ? "ልዩ መጠጥ" : "Custom Drink"}
            </button>
          </div>

          {/* Item Name */}
          <div className="space-y-1">
            <label className="block text-xs font-black text-buna uppercase tracking-wider">
              {lang === "am" ? "የምግብ/መጠጥ ስም" : "Item or Dish Name"} *
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={
                category === "food"
                  ? lang === "am" ? "ለምሳሌ፦ እንቁላል ፍርፍር ከቲማቲም ጋር..." : "e.g., Avocado Egg Toast, Extra Spicy Kifto..."
                  : lang === "am" ? "ለምሳሌ፦ ትኩስ ዝንጅብል ከማርና ሎሚ ጋር..." : "e.g., Iced Ginger Honey Lemonade..."
              }
              className="w-full p-3 border border-[#ebdcd3] rounded-xl text-xs text-buna bg-white focus:outline-primary placeholder:text-buna-mocha/60"
            />
          </div>

          {/* Preparation Instructions */}
          <div className="space-y-1">
            <label className="block text-xs font-black text-buna uppercase tracking-wider">
              {lang === "am" ? "የአዘገጃጀት መመሪያ (Text Instructions)" : "Detailed Preparation Instructions"}
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={
                lang === "am"
                  ? "የማብሰያ ዝርዝር፣ ንጥረ ነገሮች ወይም አለርጂ ካለ እዚህ ያብራሩ..."
                  : "Specify cooking preferences, ingredients, dressing, or dietary restrictions..."
              }
              className="w-full p-3 border border-[#ebdcd3] rounded-xl text-xs text-buna bg-white focus:outline-primary placeholder:text-buna-mocha/60"
            />
          </div>

          {/* Voice Note Recorder for Chef */}
          <VoiceNoteRecorder lang={lang} onVoiceNoteChange={setVoiceNoteData} />

          {/* Price note */}
          <div className="p-3 bg-[#faf2ee] rounded-xl border border-[#ebdcd3] flex items-center justify-between text-xs">
            <span className="text-buna-mocha font-bold">
              {lang === "am" ? "የዋጋ ማረጋገጫ፦" : "Estimated Base Price:"}
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-buna">ETB</span>
              <input
                type="number"
                min="50"
                step="10"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(Number(e.target.value))}
                className="w-20 p-1 border border-[#ebdcd3] rounded-lg text-xs font-black text-right text-primary bg-white"
              />
            </div>
          </div>

          <p className="text-[10px] text-buna-mocha italic">
            * Note: Floor waiter will confirm item availability and final pricing at Table 04 upon kitchen dispatch.
          </p>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#9d3e0f] to-[#bd5627] hover:from-[#88350d] hover:to-[#a84c22] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>✨</span>
            <span>{lang === "am" ? "ልዩ ትዕዛዝ ወደ ትሪው ጨምር" : "Add Off-Menu Item to Tray"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
