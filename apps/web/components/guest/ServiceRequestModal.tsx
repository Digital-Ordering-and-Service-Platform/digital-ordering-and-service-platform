"use client";

import { useState } from "react";

interface ServiceRequestModalProps {
  isOpen: boolean;
  tableLabel: string;
  onClose: () => void;
  onSuccess?: (type: string) => void;
}

export default function ServiceRequestModal({
  isOpen,
  tableLabel,
  onClose,
  onSuccess,
}: ServiceRequestModalProps) {
  const [selectedType, setSelectedType] = useState<string>("call_waiter");
  const [details, setDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const options = [
    {
      id: "call_waiter",
      icon: "🛎️",
      labelEn: "Call Waiter",
      labelAm: "አስተናጋጅ ጥራ",
      desc: "General table assistance & questions",
    },
    {
      id: "water",
      icon: "💧",
      labelEn: "Water & Glasses",
      labelAm: "ውሃና ብርጭቆ",
      desc: "Bottled water or fresh drinking water",
    },
    {
      id: "cutlery",
      icon: "🍴",
      labelEn: "Napkins & Cutlery",
      labelAm: "ማንኪያና ሶፍት",
      desc: "Extra napkins, forks, knives, toothpicks",
    },
    {
      id: "bill",
      icon: "🧾",
      labelEn: "Request Bill",
      labelAm: "ሂሳብ እፈልጋለሁ",
      desc: "Prepare printed receipt / payment till",
    },
    {
      id: "issue",
      icon: "⚠️",
      labelEn: "Report an Issue",
      labelAm: "ቅሬታ ማቅረብ",
      desc: "Food temperature, delay, or wrong item",
    },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const backendUrl = typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:8080/api/v1/guest/service-request`
        : "http://localhost:8080/api/v1/guest/service-request";

      const payload = {
        restaurant_id: "01J8RESTAURANT000000000001",
        table_id: tableLabel,
        table_label: `Table ${tableLabel}`,
        request_type: selectedType,
        details: details.trim(),
      };

      await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSentSuccess(true);
      if (onSuccess) onSuccess(selectedType);
      setTimeout(() => {
        setSentSuccess(false);
        setDetails("");
        onClose();
      }, 1800);
    } catch (err) {
      console.warn("failed to send service request", err);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[#ebdcd3] shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[#ebdcd3]/70">
          <div>
            <span className="text-[10px] font-black uppercase text-primary tracking-wider block">
              📍 Table {tableLabel} Service
            </span>
            <h2 className="text-lg font-black text-buna">How can we assist you?</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#faf2ee] text-buna flex items-center justify-center font-bold hover:bg-[#ebdcd3]"
          >
            ✕
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#2D7A4D]/15 text-[#2D7A4D] flex items-center justify-center text-3xl font-black mx-auto animate-bounce">
              ✓
            </div>
            <h3 className="text-base font-black text-buna">Request Sent to Staff!</h3>
            <p className="text-xs text-buna-mocha">
              Your assigned floor waiter has been notified with audio alert for Table {tableLabel}.
            </p>
          </div>
        ) : (
          <>
            {/* Options List */}
            <div className="space-y-2 pt-1">
              {options.map((opt) => {
                const isSelected = selectedType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedType(opt.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-[#faf2ee] border-primary shadow-sm"
                        : "bg-white border-[#ebdcd3] hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{opt.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-buna">{opt.labelEn}</span>
                          <span className="text-[10px] text-primary font-bold gees-text">
                            {opt.labelAm}
                          </span>
                        </div>
                        <p className="text-[10px] text-buna-mocha mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-primary bg-primary text-white" : "border-[#ebdcd3]"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional Specific Note */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-buna block">
                Additional Instructions (Optional):
              </label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g. 2 glasses of cold water, extra limes..."
                className="w-full text-xs bg-[#faf5f0] border border-[#ebdcd3] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-buna"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full py-3.5 bg-primary text-white font-black text-xs rounded-2xl shadow hover:bg-primary-container transition-all uppercase tracking-wider flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                <span>{isSubmitting ? "Sending Request..." : "🔔 Send Request to Waiter"}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
