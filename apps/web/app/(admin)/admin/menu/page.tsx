"use client";

import { useEffect, useState } from "react";
import CategoryFormModal from "@/components/admin/CategoryFormModal";
import ItemFormModal from "@/components/admin/ItemFormModal";
import BulkPriceModal from "@/components/admin/BulkPriceModal";
import ModifierGroupBuilderModal from "@/components/admin/ModifierGroupBuilderModal";

interface ItemOption {
  name_en: string;
  name_am: string;
  price_delta: number;
  type: string;
}

interface MenuItem {
  id: string;
  category_id: string;
  name_en: string;
  name_am: string;
  description_en: string;
  description_am: string;
  price: number;
  is_available: boolean;
  prep_time_minutes: number;
  allergen_tags: string[];
  options: ItemOption[];
}

interface MenuCategory {
  id: string;
  name_en: string;
  name_am: string;
  sort_order: number;
  items: MenuItem[];
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  useEffect(() => {
    setCategories([
      {
        id: "01J8CAT1",
        name_en: "Traditional Meals",
        name_am: "የባህል ምግቦች",
        sort_order: 1,
        items: [
          {
            id: "01J8ITEM1",
            category_id: "01J8CAT1",
            name_en: "Special Shekla Tibs",
            name_am: "የሸክላ ጥብስ",
            description_en: "Sizzling prime beef seared in spiced butter",
            description_am: "በተነጠረ ቅቤ የተጠበሰ የሸክላ ጥብስ",
            price: 480,
            is_available: true,
            prep_time_minutes: 15,
            allergen_tags: ["Dairy"],
            options: [{ name_en: "Extra Injera", name_am: "ተጨማሪ እንጀራ", price_delta: 30, type: "addon" }],
          },
        ],
      },
      {
        id: "01J8CAT2",
        name_en: "Coffee & Drinks",
        name_am: "ቡናና መጠጦች",
        sort_order: 2,
        items: [
          {
            id: "01J8ITEM2",
            category_id: "01J8CAT2",
            name_en: "Traditional Jebena Buna",
            name_am: "የጀበና ቡና ሥነ ሥርዓት",
            description_en: "Fresh wood-roasted Buna ceremony coffee",
            description_am: "በእንጨት እሳት የተቆላ የጀበና ቡና",
            price: 120,
            is_available: true,
            prep_time_minutes: 10,
            allergen_tags: [],
            options: [],
          },
        ],
      },
    ]);
  }, []);

  const handleCreateCategory = (cat: { name_en: string; name_am: string; sort_order: number }) => {
    const newCat: MenuCategory = {
      id: `01J8CAT${Date.now()}`,
      name_en: cat.name_en,
      name_am: cat.name_am,
      sort_order: cat.sort_order,
      items: [],
    };
    setCategories([...categories, newCat]);
  };

  const handleCreateItem = (itemData: any) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `01J8ITEM${Date.now()}`,
    };
    setCategories(
      categories.map((cat) => (cat.id === itemData.category_id ? { ...cat, items: [...cat.items, newItem] } : cat))
    );
  };

  const toggleAvailability = (itemId: string) => {
    setCategories(
      categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => (item.id === itemId ? { ...item, is_available: !item.is_available } : item)),
      }))
    );
  };

  const handleApplyBulkPrice = (adjustmentPct: number, fixedETB: number) => {
    setCategories(
      categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => {
          let newPrice = item.price;
          if (adjustmentPct !== 0) newPrice *= 1 + adjustmentPct / 100;
          if (fixedETB !== 0) newPrice += fixedETB;
          return { ...item, price: Math.round(newPrice) };
        }),
      }))
    );
  };

  const filteredCategories =
    activeCategoryId === "all"
      ? categories
      : categories.filter((cat) => cat.id === activeCategoryId);

  return (
    <div className="space-y-6 text-left">
      <header className="flex justify-between items-center border-b border-buna/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Menu Management Dashboard</h1>
          <p className="text-sm text-buna-mocha">CRUD menu categories, items, prices, options, and availability toggles.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsModifierModalOpen(true)}
            className="px-3 py-2 border border-[#f59e0b] bg-[#faf5f0] text-amber-900 rounded-md text-xs font-bold hover:bg-[#ebdcd3] transition-colors"
          >
            ⚡ Modifier Groups
          </button>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3 py-2 border border-primary text-primary rounded-md text-xs font-semibold hover:bg-teff"
          >
            Bulk Price Adjust
          </button>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-md text-xs font-semibold hover:bg-primary-container"
          >
            + Add Category
          </button>
        </div>
      </header>

      {/* 2-Column Desktop Grid Layout (`grid grid-cols-1 lg:grid-cols-12 gap-8`) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (3 cols, Sticky): Category Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-buna/10 p-4 space-y-3 sticky top-6">
          <h2 className="text-xs font-bold text-buna-mocha uppercase tracking-wider border-b border-buna/10 pb-2">
            Categories ({categories.length})
          </h2>
          <div className="space-y-1">
            <button
              onClick={() => setActiveCategoryId("all")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeCategoryId === "all" ? "bg-primary text-white" : "text-buna hover:bg-teff"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex justify-between items-center ${
                  activeCategoryId === cat.id ? "bg-primary text-white" : "text-buna hover:bg-teff"
                }`}
              >
                <span>{cat.name_en}</span>
                <span className="text-[10px] opacity-70">({cat.items.length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column (9 cols): Items Table & Management */}
        <div className="lg:col-span-9 space-y-6">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-buna/10 p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-buna/10 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-buna">
                    {cat.name_en} <span className="text-sm text-primary font-normal gees-text" lang="am">({cat.name_am})</span>
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                    setIsItemModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-buna text-white rounded-md text-xs font-semibold hover:bg-buna-mocha"
                >
                  + Add Item
                </button>
              </div>

              <div className="divide-y divide-buna/10">
                {cat.items.length === 0 ? (
                  <p className="text-xs text-buna-mocha py-4">No items in this category yet.</p>
                ) : (
                  cat.items.map((item) => (
                    <div key={item.id} className="py-3 flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm text-buna">{item.name_en}</span>
                          <span className="text-xs text-primary gees-text" lang="am">({item.name_am})</span>
                          {item.allergen_tags.map((tag) => (
                            <span key={tag} className="text-[10px] bg-buna/10 text-buna px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-buna-mocha">{item.description_en}</p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="text-base font-bold text-primary">ETB {item.price}</span>
                        <button
                          onClick={() => toggleAvailability(item.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.is_available ? "bg-yetsom-container text-white" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.is_available ? "In Stock" : "Out of Stock"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleCreateCategory}
      />

      <ItemFormModal
        isOpen={isItemModalOpen}
        categoryId={activeCategoryId === "all" ? categories[0]?.id || "" : activeCategoryId}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleCreateItem}
      />

      <BulkPriceModal
        isOpen={isBulkModalOpen}
        selectedCount={0}
        onClose={() => setIsBulkModalOpen(false)}
        onApply={handleApplyBulkPrice}
      />

      <ModifierGroupBuilderModal
        isOpen={isModifierModalOpen}
        onClose={() => setIsModifierModalOpen(false)}
        onSaveGroup={(group) => {
          alert(`Modifier group "${group.group_name_en}" saved with ${group.options.length} options!`);
        }}
      />
    </div>
  );
}
