"use client";

interface Option {
  name_en: string;
  name_am: string;
  price_delta: number;
  type: string;
}

interface CompactDishCardProps {
  id: string;
  nameEN: string;
  nameAM: string;
  descriptionEN: string;
  descriptionAM: string;
  price: number;
  isAvailable: boolean;
  lang: "en" | "am";
  icon?: string;
  ingredientsEN?: string[];
  ingredientsAM?: string[];
  removals?: Option[];
  addons?: Option[];
  onAddToCart: (item: any) => void;
}

export default function CompactDishCard({
  id,
  nameEN,
  nameAM,
  descriptionEN,
  descriptionAM,
  price,
  isAvailable,
  lang,
  icon = "🍽️",
  ingredientsEN = [],
  ingredientsAM = [],
  removals = [],
  addons = [],
  onAddToCart,
}: CompactDishCardProps) {
  const itemPayload = {
    id,
    nameEN,
    nameAM,
    basePrice: price,
    descriptionEN,
    descriptionAM,
    ingredientsEN,
    ingredientsAM,
    removals,
    addons,
  };

  const handleTap = () => {
    if (!isAvailable) return;
    onAddToCart(itemPayload);
  };

  const ingredients = lang === "am" && ingredientsAM.length ? ingredientsAM : ingredientsEN;

  return (
    <div
      onClick={handleTap}
      className="bg-white rounded-2xl border border-buna/10 p-3.5 shadow-sm flex items-start justify-between space-x-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
    >
      {/* Left Info */}
      <div className="space-y-1.5 flex-1 text-left">
        <div className="flex items-baseline space-x-1.5 flex-wrap">
          <h4 className="text-sm font-black text-buna">{nameEN}</h4>
          <span className="text-xs text-primary font-bold gees-text" lang="am">
            ({nameAM})
          </span>
        </div>

        <p className="text-xs text-buna-mocha line-clamp-2 leading-relaxed">
          {lang === "am" ? descriptionAM : descriptionEN}
        </p>

        {/* What's Inside tags */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {ingredients.slice(0, 3).map((ing, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold bg-[#faf2ee] text-buna-mocha px-1.5 py-0.5 rounded border border-[#ebdcd3]"
              >
                {ing}
              </span>
            ))}
            {ingredients.length > 3 && (
              <span className="text-[10px] font-semibold text-primary px-1 py-0.5">
                +{ingredients.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2 pt-0.5">
          <span className="text-sm font-black text-primary">ETB {price}</span>
        </div>
      </div>

      {/* Right Thumbnail & Action */}
      <div className="flex flex-col items-center space-y-2 shrink-0">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#ebdcd3] to-[#faf2ee] border border-buna/10 flex items-center justify-center text-2xl shadow-inner">
          {icon}
        </div>
        {isAvailable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTap();
            }}
            className="min-h-[34px] px-3 py-1 bg-primary text-white text-xs font-black rounded-xl shadow-sm hover:bg-primary-container transition-all active:scale-95"
          >
            + Customize
          </button>
        ) : (
          <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
            Sold Out
          </span>
        )}
      </div>
    </div>
  );
}
