"use client";

interface LanguageToggleProps {
  currentLang: "en" | "am";
  onChange: (lang: "en" | "am") => void;
}

export default function LanguageToggle({ currentLang, onChange }: LanguageToggleProps) {
  return (
    <div className="inline-flex items-center bg-surface-container-lowest border border-buna/10 rounded-full p-0.5 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
          currentLang === "en"
            ? "bg-primary-fixed text-primary"
            : "text-buna-mocha hover:text-buna"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange("am")}
        lang="am"
        className={`px-2.5 py-1 rounded-full text-xs font-bold gees-text transition-colors ${
          currentLang === "am"
            ? "bg-primary-fixed text-primary"
            : "text-buna-mocha hover:text-buna"
        }`}
      >
        አማ
      </button>
    </div>
  );
}
