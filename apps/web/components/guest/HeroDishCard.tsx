"use client";

interface HeroDishCardProps {
  id: string;
  nameEN: string;
  nameAM: string;
  descriptionEN: string;
  descriptionAM: string;
  price: number;
  prepTimeMinutes: number;
  isAvailable: boolean;
  allergenTags: string[];
  lang: "en" | "am";
  onAddToCart: (item: any) => void;
}

export default function HeroDishCard({
  id,
  nameEN,
  nameAM,
  descriptionEN,
  descriptionAM,
  price,
  isAvailable,
  allergenTags,
  lang,
  onAddToCart,
}: HeroDishCardProps) {
  const handleTap = () => {
    if (!isAvailable) return;
    onAddToCart({
      id,
      nameEN,
      nameAM,
      basePrice: price,
      options: [
        { name_en: "Extra Injera", name_am: "ተጨማሪ እንጀራ", price_delta: 30, type: "addon" },
      ],
    });
  };

  return (
    <div
      onClick={handleTap}
      className="bg-white rounded-2xl border border-buna/10 shadow-md overflow-hidden space-y-3 cursor-pointer hover:shadow-lg transition-all"
    >
      {/* Hero Image Tile */}
      <div className="relative h-48 bg-buna/80 flex items-end p-4">
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            Chef's Special
          </span>
          <span className="bg-yetsom-container text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center space-x-1">
            <span>🌿</span>
            <span>Ye'Tsom / የጾም</span>
          </span>
        </div>

        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-buna shadow-sm">
          🔥 Medium Spicy
        </div>

        <div className="relative z-10 text-left text-white">
          <span className="text-[10px] uppercase font-bold tracking-wider text-primary-fixed block">
            COMMUNAL FEAST
          </span>
          <h2 className="text-xl font-bold leading-tight">{nameEN}</h2>
        </div>
      </div>

      {/* Details & Action */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-bold text-buna">{nameEN}</h3>
            <span className="text-xs text-primary font-bold gees-text block" lang="am">
              {nameAM}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-bold text-buna-mocha block">ETB</span>
            <span className="text-lg font-bold text-primary">{price}</span>
          </div>
        </div>

        <p className="text-xs text-buna-mocha leading-relaxed">
          {lang === "am" ? descriptionAM : descriptionEN}
        </p>

        {allergenTags.length > 0 && (
          <div className="flex space-x-1.5 pt-1">
            {allergenTags.map((tag) => (
              <span key={tag} className="text-[10px] bg-buna/10 text-buna px-2 py-0.5 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="pt-2">
          {isAvailable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTap();
              }}
              className="w-full min-h-[48px] bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-container transition-all flex items-center justify-center space-x-2"
            >
              <span>🛒</span>
              <span>Customize & Add • {price} ETB</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full min-h-[48px] bg-buna/20 text-buna-mocha rounded-xl text-sm font-bold cursor-not-allowed"
            >
              Out of Stock / አልቋል
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
