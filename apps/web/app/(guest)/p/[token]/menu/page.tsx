"use client";

import { useEffect, useState } from "react";
import CategoryChips from "@/components/guest/CategoryChips";
import CompactDishCard from "@/components/guest/CompactDishCard";
import CustomizeSheet from "@/components/guest/CustomizeSheet";
import ActiveTrayDock from "@/components/guest/ActiveTrayDock";
import ActiveTrayDrawer from "@/components/guest/ActiveTrayDrawer";
import OfflineBanner from "@/components/guest/OfflineBanner";
import QRErrorCard from "@/components/guest/QRErrorCard";
import { loadActiveTrayLocal, saveActiveTrayLocal } from "@/lib/offline-storage";

interface LandingProps {
  params: { token: string };
}

interface HeroDish {
  id: string;
  nameEN: string;
  nameAM: string;
  price: number;
  subtitleEN: string;
  subtitleAM: string;
  descriptionEN: string;
  descriptionAM: string;
  bgColor: string;
  badge: string;
}

export default function TakeawayQRLandingPage({ params }: LandingProps) {
  const [resolved, setResolved] = useState<any>(null);
  const [isError, setIsError] = useState(false);
  const [lang, setLang] = useState<"en" | "am">("en");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isTrayDrawerOpen, setIsTrayDrawerOpen] = useState(false);
  const [trayItems, setTrayItems] = useState<any[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const heroDishes: HeroDish[] = [
    {
      id: "hero-takeaway-1",
      nameEN: "Shekla Tibs (Takeaway Pack)",
      nameAM: "የሸክላ ጥብስ (የጥቅል)",
      price: 450,
      subtitleEN: "Thermal pack, injera & awaze",
      subtitleAM: "በሙቀት መጠበቂያ የታሸገ እንጀራና አዋዜ",
      descriptionEN: "Tender prime lamb seared in seasoned butter, sealed in thermal container with warm injera.",
      descriptionAM: "በሙቀት መጠበቂያ የታሸገ ጣፋጭ የሸክላ ጥብስ ከእንጀራ ጋር።",
      bgColor: "from-[#381a10] to-[#1e0e09]",
      badge: "Thermal Pack",
    },
    {
      id: "hero-takeaway-2",
      nameEN: "Royal Beyaynetu Box",
      nameAM: "የፍስክ በያይነቱ",
      price: 420,
      subtitleEN: "Compartment container, fresh teff",
      subtitleAM: "በጥንቃቄ የታሸገ የፍስክ በያይነቱ",
      descriptionEN: "Full fasting sampler carefully separated in eco-friendly takeaway boxes.",
      descriptionAM: "ጎመን፣ ምስር፣ አልጫና ጤፍ እንጀራ በንጽህና የታሸገ።",
      bgColor: "from-[#1c2e17] to-[#0d170a]",
      badge: "Eco Box",
    },
  ];

  const currentHero = heroDishes[heroIndex];

  useEffect(() => {
    if (params.token.includes("invalid")) {
      setIsError(true);
    } else {
      setResolved({
        restaurant_name: "Habesha Gourmet Cafe",
        label: "P04",
        type: "pickup",
      });
      const savedTray = loadActiveTrayLocal(params.token);
      if (savedTray && savedTray.length > 0) {
        setTrayItems(savedTray);
      }
    }
  }, [params.token]);

  useEffect(() => {
    if (params.token && !isError) {
      saveActiveTrayLocal(params.token, trayItems);
    }
  }, [trayItems, params.token, isError]);

  const categories = [
    { id: "cat1", name_en: "Takeaway Platters", name_am: "የጥቅል ምግቦች" },
    { id: "cat2", name_en: "Drinks & Coffee", name_am: "መጠጦችና ቡና" },
  ];

  const handleOpenCustomize = (item: any) => {
    setSelectedItem(item);
    setIsCustomizeOpen(true);
  };

  const handleConfirmCustomization = (customizedItem: any) => {
    setTrayItems((prev) => {
      const existing = prev.find((i) => i.item_id === customizedItem.item_id);
      if (existing) {
        return prev.map((i) =>
          i.item_id === customizedItem.item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...customizedItem, id: `tray-${Date.now()}`, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setTrayItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setTrayItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
      );
    }
  };

  const totalItemCount = trayItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalPriceETB = trayItems.reduce((acc, i) => acc + i.final_price * i.quantity, 0);

  const handleCheckout = () => {
    window.location.href = "/checkout";
  };

  if (isError) return <QRErrorCard />;
  if (!resolved) return <div className="p-6 text-center text-xs text-buna">Loading menu...</div>;

  return (
    <div className="min-h-screen bg-[#fff8f5] text-buna font-sans relative pb-28">
      <OfflineBanner lang={lang} />

      {/* Sticky Top Bar matching Mobile Phone UI */}
      <header className="sticky top-0 z-40 bg-[#fff8f5]/95 backdrop-blur-md border-b border-[#ebdcd3]/70 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center text-gold-text">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.5 7.5c-.83 0-1.5.67-1.5 1.5v1.09C15.86 8.94 14.04 8 12 8c-3.87 0-7 3.13-7 7v1c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-1c0-.34-.04-.67-.1-1h.1c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5h-.5v-1c0-.83-.67-1.5-1.5-1.5zm-3.5 10.5H9c-1.1 0-2-.9-2-2v-1c0-2.76 2.24-5 5-5s5 2.24 5 5v1c0 1.1-.9 2-2 2zM12 2c-.55 0-1 .45-1 1v2.08C11.33 5.03 11.66 5 12 5s.67.03 1 .08V3c0-.55-.45-1-1-1z" />
            </svg>
          </div>
          <span className="font-black text-lg tracking-wider text-buna">MENUFLOW</span>
        </div>

        <span className="bg-gold/15 text-gold-text text-[11px] font-extrabold px-3 py-1 rounded-full">
          Pickup #{resolved.label}
        </span>
      </header>

      {/* Mobile Main Container */}
      <main className="max-w-md mx-auto px-4 pt-3 space-y-5">
        {/* HERO DISH SHOWCASE */}
        <section className="bg-white rounded-3xl overflow-hidden border border-[#ebdcd3] shadow-md relative">
          <div className={`relative h-64 bg-gradient-to-br ${currentHero.bgColor} flex items-center justify-center overflow-hidden`}>
            <div className="relative text-center select-none">
              <div className="relative w-40 h-40 mx-auto rounded-full bg-gradient-to-b from-[#8c3b1b] to-[#451808] border-4 border-[#331408] shadow-2xl flex items-center justify-center p-3">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#2d1208] via-[#4d200e] to-[#6e2a10] flex flex-col items-center justify-center text-center p-2">
                  <span className="text-5xl block animate-bounce">
                    {heroIndex === 0 ? "🥡" : "🍲"}
                  </span>
                  <span className="text-[10px] font-extrabold text-[#ffb598] tracking-wider uppercase mt-1">
                    {currentHero.badge}
                  </span>
                </div>
              </div>
              <div className="w-48 h-3.5 mx-auto bg-[#2b170c] rounded-full mt-2 shadow-lg" />
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
              {heroDishes.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    heroIndex === idx ? "bg-white scale-125" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-6 space-y-4 text-center">
            <button
              type="button"
              onClick={() =>
                handleOpenCustomize({
                  id: currentHero.id,
                  nameEN: currentHero.nameEN,
                  nameAM: currentHero.nameAM,
                  basePrice: currentHero.price,
                  descriptionEN: currentHero.descriptionEN,
                  descriptionAM: currentHero.descriptionAM,
                  options: [
                    { name_en: "Eco Cutlery Set", name_am: "የምግብ መመገቢያ ቁሳቁስ", price_delta: 15, type: "addon" },
                    { name_en: "Extra Injera Roll", name_am: "ተጨማሪ እንጀራ", price_delta: 30, type: "addon" },
                  ],
                })
              }
              className="w-full py-4 px-6 bg-gradient-to-r from-[#9d3e0f] to-[#bd5627] hover:from-[#88350d] hover:to-[#a84c22] text-white text-lg font-black tracking-wider uppercase rounded-2xl shadow-lg transition-all transform active:scale-95"
            >
              ORDER NOW
            </button>

            <div className="space-y-1 pt-1">
              <h2 className="text-2xl font-black text-buna tracking-tight">
                {lang === "am" ? `${currentHero.nameAM}፡ ${currentHero.price} ብር` : `${currentHero.nameEN}: Birr ${currentHero.price}`}
              </h2>
              <p className="text-sm font-semibold text-buna-mocha">
                {lang === "am" ? currentHero.subtitleAM : currentHero.subtitleEN}
              </p>
              <p className="text-lg font-bold text-buna gees-text pt-0.5" lang="am">
                {currentHero.nameAM}
              </p>
            </div>
          </div>
        </section>

        {/* Bilingual Language Switcher Pill */}
        <div className="flex justify-center pt-1">
          <div className="inline-flex items-center bg-[#ebdcd3]/70 backdrop-blur-md rounded-full p-1 shadow-sm border border-[#ebdcd3]">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                lang === "en" ? "bg-primary text-white shadow-sm" : "text-buna-mocha hover:text-buna"
              }`}
            >
              EN
            </button>
            <span className="text-xs text-buna-mocha font-bold px-1.5">/</span>
            <button
              type="button"
              onClick={() => setLang("am")}
              lang="am"
              className={`px-4 py-1.5 rounded-full text-xs font-black gees-text transition-all ${
                lang === "am" ? "bg-primary text-white shadow-sm" : "text-buna-mocha hover:text-buna"
              }`}
            >
              አማ
            </button>
          </div>
        </div>

        {/* Categories & Items */}
        <section className="space-y-4 pt-3">
          <CategoryChips
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={setActiveCategoryId}
            lang={lang}
          />

          <div className="space-y-3">
            <CompactDishCard
              id="item-t1"
              nameEN="Royal Beyaynetu Box"
              nameAM="የፍስክ በያይነቱ"
              descriptionEN="Sealed eco-box with gomen, misir, and fresh brown teff rolls"
              descriptionAM="በጥንቃቄ የታሸገ የፍስክ በያይነቱ"
              price={420}
              isAvailable={true}
              lang={lang}
              onAddToCart={handleOpenCustomize}
            />
            <CompactDishCard
              id="item-t2"
              nameEN="Traditional Jebena Buna Cup"
              nameAM="የጀበና ቡና"
              descriptionEN="Fresh brewed spiced coffee in takeaway cup"
              descriptionAM="የተፈላ የጀበና ቡና"
              price={60}
              isAvailable={true}
              lang={lang}
              onAddToCart={handleOpenCustomize}
            />
          </div>
        </section>
      </main>

      {/* Slide-Up Customization Drawer */}
      <CustomizeSheet
        isOpen={isCustomizeOpen}
        item={selectedItem}
        lang={lang}
        onClose={() => setIsCustomizeOpen(false)}
        onConfirm={handleConfirmCustomization}
      />

      {/* Floating Active Tray Dock */}
      <ActiveTrayDock
        itemCount={totalItemCount}
        totalPriceETB={totalPriceETB}
        onOpenTray={() => setIsTrayDrawerOpen(true)}
        onCheckout={handleCheckout}
      />

      {/* Active Tray Full Drawer */}
      <ActiveTrayDrawer
        isOpen={isTrayDrawerOpen}
        items={trayItems}
        totalPriceETB={totalPriceETB}
        lang={lang}
        onClose={() => setIsTrayDrawerOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
