"use client";

interface Category {
  id: string;
  name_en: string;
  name_am: string;
}

interface CategoryChipsProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  lang: "en" | "am";
}

export default function CategoryChips({
  categories,
  activeCategoryId,
  onSelectCategory,
  lang,
}: CategoryChipsProps) {
  return (
    <div
      role="tablist"
      className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-2 px-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeCategoryId === "all"}
        onClick={() => onSelectCategory("all")}
        className={`min-h-[48px] px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center space-x-1.5 ${
          activeCategoryId === "all"
            ? "bg-buna text-white"
            : "bg-white text-buna border border-buna/10 hover:bg-teff"
        }`}
      >
        <span>🔥</span>
        <span>{lang === "am" ? "ሁሉም (All)" : "All Dishes"}</span>
      </button>

      {categories.map((cat) => {
        const isActive = activeCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectCategory(cat.id)}
            className={`min-h-[48px] px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center space-x-1.5 ${
              isActive
                ? "bg-buna text-white"
                : "bg-white text-buna border border-buna/10 hover:bg-teff"
            }`}
          >
            <span>🍛</span>
            <span lang={lang === "am" ? "am" : "en"} className={lang === "am" ? "gees-text" : ""}>
              {lang === "am" ? cat.name_am : cat.name_en}
            </span>
          </button>
        );
      })}
    </div>
  );
}
