"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CompactDishCard from "@/components/guest/CompactDishCard";
import CustomizeSheet from "@/components/guest/CustomizeSheet";
import ActiveTrayDock from "@/components/guest/ActiveTrayDock";
import ActiveTrayDrawer from "@/components/guest/ActiveTrayDrawer";
import OfflineBanner from "@/components/guest/OfflineBanner";
import QRErrorCard from "@/components/guest/QRErrorCard";
import ServiceRequestModal from "@/components/guest/ServiceRequestModal";
import OffMenuRequestModal from "@/components/guest/OffMenuRequestModal";
import { loadActiveTrayLocal, saveActiveTrayLocal } from "@/lib/offline-storage";

interface LandingProps {
  params: { token: string };
}

export default function TableQRLandingPage({ params }: LandingProps) {
  const [resolved, setResolved] = useState<any>(null);
  const [isError, setIsError] = useState(false);
  const [lang, setLang] = useState<"en" | "am">("en");
  
  // Navigation State: "home" (Two primary cards), "food", or "drinks"
  const [activeSection, setActiveSection] = useState<"home" | "food" | "drinks">("home");
  const [activeSubCategory, setActiveSubCategory] = useState<string>("all");

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isTrayDrawerOpen, setIsTrayDrawerOpen] = useState(false);
  const [trayItems, setTrayItems] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isOffMenuOpen, setIsOffMenuOpen] = useState(false);

  useEffect(() => {
    if (params.token.includes("invalid")) {
      setIsError(true);
    } else {
      setResolved({
        restaurant_name: "Bole Kitchen & Roastery",
        label: "04",
        type: "table",
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

  // Food Subcategories
  const foodCategories = [
    { id: "all_food", name_en: "All Foods", name_am: "ሁሉም ምግቦች" },
    { id: "fast_food", name_en: "Burgers & Fast Food", name_am: "በርገርና ፈጣን ምግብ" },
    { id: "traditional", name_en: "Traditional Meals", name_am: "የባህል ምግቦች" },
    { id: "breakfast", name_en: "Breakfast", name_am: "ቁርስ" },
    { id: "lunch_dinner", name_en: "Lunch & Dinner", name_am: "ምሳና እራት" },
    { id: "desserts", name_en: "Desserts", name_am: "ጣፋጭ" },
  ];

  // Drinks Subcategories
  const drinksCategories = [
    { id: "all_drinks", name_en: "All Drinks", name_am: "ሁሉም መጠጦች" },
    { id: "hot_coffee", name_en: "Hot Buna & Coffee", name_am: "ትኩስ ቡና" },
    { id: "cold_drinks", name_en: "Cold & Iced Drinks", name_am: "ቀዝቃዛ መጠጦች" },
    { id: "fresh_juices", name_en: "Fresh Juices & Smoothies", name_am: "ትኩስ ጭማቂዎች" },
    { id: "soft_drinks", name_en: "Soft Drinks & Water", name_am: "ለስላሳ መጠጦች" },
    { id: "cocktails", name_en: "Cocktails & Bar", name_am: "ኮክቴልና ባር" },
  ];

  // Full Menu Catalog with What's Inside & Customizations
  const menuCatalog = [
    // --- FOOD: FAST FOOD & BURGERS ---
    {
      id: "burger-1",
      section: "food",
      subCategory: "fast_food",
      nameEN: "Classic Addis Cheeseburger",
      nameAM: "ክላሲክ አዲስ ቺዝበርገር",
      descriptionEN: "100% prime beef patty, toasted brioche bun, melted cheddar, lettuce, onions & house ketchup.",
      descriptionAM: "የተመረጠ የበሬ ስጋ፣ የተጠበሰ ብሪዮሽ ዳቦ፣ ቼዳር ቺዝ፣ ሰላጣ፣ ሽንኩርት እና ኬትቸፕ።",
      price: 380,
      icon: "🍔",
      isAvailable: true,
      ingredientsEN: ["Beef Patty", "Brioche Bun", "Cheddar Cheese", "Caramelized Onions", "Lettuce", "Sliced Tomato", "House Ketchup", "Signature Mayo"],
      ingredientsAM: ["የበሬ ስጋ", "ብሪዮሽ ዳቦ", "ቼዳር ቺዝ", "ሽንኩርት", "ሰላጣ", "ቲማቲም", "ኬትቸፕ", "ማዮኔዝ"],
      removals: [
        { name_en: "No Onions", name_am: "ሽንኩርት የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Ketchup", name_am: "ኬትቸፕ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Mayo", name_am: "ማዮኔዝ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Pickles", name_am: "ፒክልስ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Tomato", name_am: "ቲማቲም የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Extra Cheddar Cheese", name_am: "ተጨማሪ ቼዳር ቺዝ", price_delta: 40, type: "addon" },
        { name_en: "Double Beef Patty", name_am: "ድርብ የበሬ ስጋ", price_delta: 120, type: "addon" },
        { name_en: "Seasoned French Fries", name_am: "ድንች ጥብስ", price_delta: 80, type: "addon" },
      ],
    },
    {
      id: "burger-2",
      section: "food",
      subCategory: "fast_food",
      nameEN: "Smoky BBQ Bacon Burger",
      nameAM: "ስሞኪ ቢቢኪው ቤከን በርገር",
      descriptionEN: "Charbroiled beef patty, crispy beef bacon, melted cheddar, onion rings & smoky BBQ glaze.",
      descriptionAM: "በከሰል የተጠበሰ ስጋ፣ ስሞክድ ቢፍ ቤከን፣ የተጠበሰ ሽንኩርትና የቢቢኪው ሶስ።",
      price: 440,
      icon: "🥓",
      isAvailable: true,
      ingredientsEN: ["Beef Patty", "Beef Bacon", "Brioche Bun", "Cheddar", "Onions", "BBQ Sauce", "Ketchup"],
      ingredientsAM: ["የበሬ ስጋ", "ቢፍ ቤከን", "ዳቦ", "ቺዝ", "ሽንኩርት", "ቢቢኪው ሶስ", "ኬትቸፕ"],
      removals: [
        { name_en: "No Onions", name_am: "ሽንኩርት የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No BBQ Sauce", name_am: "ቢቢኪው የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Ketchup", name_am: "ኬትቸፕ የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Extra Cheddar", name_am: "ተጨማሪ ቺዝ", price_delta: 40, type: "addon" },
        { name_en: "Extra Beef Bacon", name_am: "ተጨማሪ ቤከን", price_delta: 60, type: "addon" },
      ],
    },
    {
      id: "burger-3",
      section: "food",
      subCategory: "fast_food",
      nameEN: "Crispy Peri-Peri Chicken Burger",
      nameAM: "ክሪስፒ ፔሪ-ፔሪ ዶሮ በርገር",
      descriptionEN: "Crispy golden fried chicken breast fillet, spicy peri-peri mayo, pickles & shredded slaw.",
      descriptionAM: "የተጠበሰ የዶሮ ስጋ፣ ቅመም የበዛበት ማዮኔዝ፣ ፒክልስ እና ጎመን ሰላጣ።",
      price: 360,
      icon: "🍗",
      isAvailable: true,
      ingredientsEN: ["Fried Chicken Fillet", "Brioche Bun", "Peri-Peri Mayo", "Pickles", "Shredded Cabbage"],
      ingredientsAM: ["የዶሮ ስጋ", "ዳቦ", "ማዮኔዝ", "ፒክልስ", "ሰላጣ"],
      removals: [
        { name_en: "No Peri-Peri Sauce (Mild)", name_am: "ቃሪያ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Pickles", name_am: "ፒክልስ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Mayo", name_am: "ማዮኔዝ የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Extra Melted Cheese", name_am: "ተጨማሪ ቺዝ", price_delta: 40, type: "addon" },
        { name_en: "Large French Fries", name_am: "ትልቅ ድንች ጥብስ", price_delta: 80, type: "addon" },
      ],
    },

    // --- FOOD: TRADITIONAL MEALS ---
    {
      id: "trad-1",
      section: "food",
      subCategory: "traditional",
      nameEN: "Special Sizzling Shekla Tibs",
      nameAM: "ልዩ የሸክላ ጥብስ",
      descriptionEN: "Prime tender lamb/beef seared sizzling with rosemary, purified butter & jalapeños in clay pot.",
      descriptionAM: "በሸክላ ድስት በተነጠረ ቅቤ፣ ሮዝመሪ እና ቃሪያ የተጠበሰ ጣፋጭ የበግ ጥብስ።",
      price: 450,
      icon: "🥩",
      isAvailable: true,
      ingredientsEN: ["Prime Lamb/Beef", "Nitir Qibe (Spiced Butter)", "Fresh Rosemary", "Jalapeños (Qariya)", "Red Onions", "Pure Teff Injera"],
      ingredientsAM: ["የበግ/የበሬ ስጋ", "የተነጠረ ቅቤ", "ሮዝመሪ", "ቃሪያ", "ቀይ ሽንኩርት", "የጤፍ እንጀራ"],
      removals: [
        { name_en: "No Jalapeños / Mild", name_am: "ቃሪያ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Onions", name_am: "ሽንኩርት የሌለው", price_delta: 0, type: "removal" },
        { name_en: "Less Spiced Butter", name_am: "ቀለል ያለ ቅቤ", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Extra Teff Injera", name_am: "ተጨማሪ የጤፍ እንጀራ", price_delta: 30, type: "addon" },
        { name_en: "Extra Nitir Qibe (ቅቤ)", name_am: "ተጨማሪ የተነጠረ ቅቤ", price_delta: 40, type: "addon" },
        { name_en: "Fresh Ayib Cheese", name_am: "ትኩስ አይብ", price_delta: 35, type: "addon" },
      ],
    },
    {
      id: "trad-2",
      section: "food",
      subCategory: "traditional",
      nameEN: "Slow-Cooked Doro Wat",
      nameAM: "የዶሮ ወጥ ከእንቁላል ጋር",
      descriptionEN: "Authentic slow-simmered chicken drumstick in rich berbere sauce with hardboiled organic egg.",
      descriptionAM: "በበርበሬና በተነጠረ ቅቤ ተለስልሶ የበሰለ የዶሮ ወጥ ከእንቁላል ጋር።",
      price: 520,
      icon: "🍲",
      isAvailable: true,
      ingredientsEN: ["Organic Chicken", "Hardboiled Egg", "Rich Berbere Stew", "Spiced Butter", "Teff Injera"],
      ingredientsAM: ["የዶሮ ስጋ", "እንቁላል", "የበርበሬ ወጥ", "የተነጠረ ቅቤ", "የጤፍ እንጀራ"],
      removals: [
        { name_en: "No Egg", name_am: "እንቁላል የሌለው", price_delta: 0, type: "removal" },
        { name_en: "Less Spicy", name_am: "ቀለል ያለ በርበሬ", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Extra Egg", name_am: "ተጨማሪ እንቁላል", price_delta: 25, type: "addon" },
        { name_en: "Extra Injera", name_am: "ተጨማሪ እንጀራ", price_delta: 30, type: "addon" },
      ],
    },
    {
      id: "trad-3",
      section: "food",
      subCategory: "traditional",
      nameEN: "Special Bozena Shiro",
      nameAM: "ቦዘና ሽሮ",
      descriptionEN: "Clay pot spiced chickpea stew blended with tender beef cuts and clarified butter.",
      descriptionAM: "በስጋ ተለውሶ በጥንቃቄ የበሰለ ቦዘና ሽሮ ከንጹህ ጤፍ እንጀራ ጋር።",
      price: 320,
      icon: "🥘",
      isAvailable: true,
      ingredientsEN: ["Ground Chickpea Flour", "Diced Tender Beef", "Garlic & Ginger", "Spiced Butter", "Teff Injera"],
      ingredientsAM: ["የሽሮ ዱቄት", "የተከተፈ የበሬ ስጋ", "ነጭ ሽንኩርት", "የተነጠረ ቅቤ", "ጤፍ እንጀራ"],
      removals: [
        { name_en: "No Jalapeños / Mild", name_am: "ቃሪያ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Garlic", name_am: "ነጭ ሽንኩርት የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Extra Injera", name_am: "ተጨማሪ እንጀራ", price_delta: 30, type: "addon" },
        { name_en: "Extra Spiced Butter", name_am: "ተጨማሪ ቅቤ", price_delta: 40, type: "addon" },
      ],
    },

    // --- FOOD: BREAKFAST ---
    {
      id: "bfast-1",
      section: "food",
      subCategory: "breakfast",
      nameEN: "Chechebsa (Kita Firfir) with Honey",
      nameAM: "ጨጨብሳ በማርና በቅቤ",
      descriptionEN: "Warm torn pan flatbread tossed in spiced clarified butter, berbere and organic highland honey.",
      descriptionAM: "በተነጠረ ቅቤና በርበሬ የተለወሰ ጣፋጭ ቂጣ ፍርፍር ከማር ጋር።",
      price: 240,
      icon: "🥞",
      isAvailable: true,
      ingredientsEN: ["Wheat Kita Bread", "Nitir Qibe (Spiced Butter)", "Mild Berbere", "Pure Honey"],
      ingredientsAM: ["የስንዴ ቂጣ", "የተነጠረ ቅቤ", "በርበሬ", "ንጹህ ማር"],
      removals: [
        { name_en: "No Honey (Savory Only)", name_am: "ማር የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Berbere (Mild)", name_am: "በርበሬ የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Fried Egg on Top", name_am: "የተጠበሰ እንቁላል", price_delta: 30, type: "addon" },
        { name_en: "Plain Yogurt (Ergo)", name_am: "እርጎ", price_delta: 35, type: "addon" },
      ],
    },
    {
      id: "bfast-2",
      section: "food",
      subCategory: "breakfast",
      nameEN: "Special Ful Mudammas",
      nameAM: "ልዩ ፉል በቅቤና በእንቁላል",
      descriptionEN: "Fava bean stew garnished with boiled egg, diced tomatoes, jalapeños, feta & warm crusty bread.",
      descriptionAM: "የተቀቀለ ፉል በእንቁላል፣ ቲማቲም፣ ቃሪያና አይብ ከትኩስ ዳቦ ጋር።",
      price: 210,
      icon: "🍳",
      isAvailable: true,
      ingredientsEN: ["Fava Beans", "Fresh Tomato", "Jalapeños", "Feta Cheese", "Hardboiled Egg", "Warm Bread Roll"],
      ingredientsAM: ["ፉል", "ቲማቲም", "ቃሪያ", "አይብ", "እንቁላል", "ዳቦ"],
      removals: [
        { name_en: "No Onions", name_am: "ሽንኩርት የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Jalapeños", name_am: "ቃሪያ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Cheese / Dairy", name_am: "አይብ የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Extra Bread Roll", name_am: "ተጨማሪ ዳቦ", price_delta: 15, type: "addon" },
        { name_en: "Extra Spiced Butter", name_am: "ተጨማሪ ቅቤ", price_delta: 30, type: "addon" },
      ],
    },

    // --- FOOD: LUNCH & DINNER ---
    {
      id: "mains-1",
      section: "food",
      subCategory: "lunch_dinner",
      nameEN: "Rotisserie Half Roasted Chicken",
      nameAM: "ግማሽ የተጠበሰ ዶሮ ከድንች ጥብስ ጋር",
      descriptionEN: "Marinated herb roasted half chicken served with crispy french fries and garlic dipping sauce.",
      descriptionAM: "በቅመማ ቅመም የተጠበሰ ግማሽ ዶሮ ከድንች ጥብስ እና ከነጭ ሽንኩርት ሶስ ጋር።",
      price: 480,
      icon: "🍗",
      isAvailable: true,
      ingredientsEN: ["Roasted Half Chicken", "French Fries", "Garlic Mayo Sauce", "Side Salad"],
      ingredientsAM: ["የተጠበሰ ዶሮ", "ድንች ጥብስ", "ጋርሊክ ሶስ", "ሰላጣ"],
      removals: [
        { name_en: "No Garlic Sauce", name_am: "ነጭ ሽንኩርት ሶስ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Mayo", name_am: "ማዮኔዝ የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Extra Fries", name_am: "ተጨማሪ ድንች", price_delta: 60, type: "addon" },
      ],
    },
    {
      id: "mains-2",
      section: "food",
      subCategory: "lunch_dinner",
      nameEN: "Grilled Nile Perch Fish Cutlet",
      nameAM: "የተጠበሰ የዓሳ ቁራጭ",
      descriptionEN: "Fresh whole grilled fish steak with lemon garlic baste, steamed veggies and herbed rice.",
      descriptionAM: "በሎሚና ቅቤ የተጠበሰ ዓሳ ከሩዝ እና ከአታክልት ጋር።",
      price: 490,
      icon: "🐟",
      isAvailable: true,
      ingredientsEN: ["Nile Perch Fillet", "Lemon Butter Herb Glaze", "Seasoned Rice", "Steamed Veggies"],
      ingredientsAM: ["የዓሳ ስጋ", "ሎሚና ቅቤ", "ሩዝ", "አታክልት"],
      removals: [
        { name_en: "No Garlic", name_am: "ነጭ ሽንኩርት የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Butter (Dry Grilled)", name_am: "ቅቤ የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Extra Rice Bowl", name_am: "ተጨማሪ ሩዝ", price_delta: 50, type: "addon" },
      ],
    },

    // --- FOOD: DESSERTS ---
    {
      id: "dessert-1",
      section: "food",
      subCategory: "desserts",
      nameEN: "Highland Honey Walnut Baklava",
      nameAM: "ባቅላቫ በማርና ዋልነት",
      descriptionEN: "Crisp flaky filo pastry layers packed with crushed walnuts and Ethiopian wildflower honey.",
      descriptionAM: "በዋልነት እና በተፈጥሮ ማር የተዘጋጀ ጥርት ያለ ጣፋጭ ባቅላቫ።",
      price: 180,
      icon: "🍯",
      isAvailable: true,
      ingredientsEN: ["Filo Pastry Sheets", "Crushed Walnuts", "Pure Wildflower Honey", "Cinnamon"],
      ingredientsAM: ["የፊሎ ሊጥ", "ዋልነት", "ንጹህ ማር", "ቀረፋ"],
      removals: [
        { name_en: "Less Sweet", name_am: "ቀለል ያለ ጣፋጭ", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Vanilla Ice Cream Scoop", name_am: "የቫኒላ አይስክሬም", price_delta: 40, type: "addon" },
      ],
    },

    // --- DRINKS: HOT BUNA & COFFEE ---
    {
      id: "drink-hot-1",
      section: "drinks",
      subCategory: "hot_coffee",
      nameEN: "Traditional Jebena Buna Ceremony",
      nameAM: "የጀበና ቡና ሥነ ሥርዓት",
      descriptionEN: "Fresh clay-pot wood roasted Ethiopian buna ceremony served with sprig of rue herb.",
      descriptionAM: "በእንጨት እሳት የተቆላ ትኩስ የጀበና ቡና ከጤና አዳም ጋር።",
      price: 60,
      icon: "☕",
      isAvailable: true,
      ingredientsEN: ["Wood-Roasted Coffee", "Fresh Water", "Rue (Tena'adam) Herb"],
      ingredientsAM: ["የተቆላ ቡና", "ውሃ", "ጤና አዳም"],
      removals: [
        { name_en: "No Tena'adam Herb", name_am: "ጤና አዳም የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Sugar", name_am: "ስኳር የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Fresh Warm Popcorn (ፈንዲሻ)", name_am: "ትኩስ ፈንዲሻ", price_delta: 20, type: "addon" },
      ],
    },
    {
      id: "drink-hot-2",
      section: "drinks",
      subCategory: "hot_coffee",
      nameEN: "Classic Double Espresso Macchiato",
      nameAM: "ክላሲክ ኤስፕሬሶ ማኪያቶ",
      descriptionEN: "Rich bold double espresso topped with velvety steamed milk foam.",
      descriptionAM: "ድርብ ጠንካራ ኤስፕሬሶ በወተት አረፋ የተዘጋጀ።",
      price: 80,
      icon: "☕",
      isAvailable: true,
      ingredientsEN: ["Double Espresso", "Steamed Whole Milk Foam"],
      ingredientsAM: ["ድርብ ኤስፕሬሶ", "የወተት አረፋ"],
      removals: [
        { name_en: "No Sugar", name_am: "ስኳር የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Extra Espresso Shot", name_am: "ተጨማሪ ሾት", price_delta: 25, type: "addon" },
        { name_en: "Oat Milk Swap", name_am: "የኦት ወተት", price_delta: 35, type: "addon" },
      ],
    },

    // --- DRINKS: COLD & ICED DRINKS ---
    {
      id: "drink-cold-1",
      section: "drinks",
      subCategory: "cold_drinks",
      nameEN: "Iced Caramel Macchiato",
      nameAM: "አይስድ ካራሜል ማኪያቶ",
      descriptionEN: "Chilled espresso over cold milk, Madagascar vanilla syrup, caramel drizzle & ice.",
      descriptionAM: "ቀዝቃዛ ኤስፕሬሶ ከወተት፣ የካራሜል ሽሮፕ እና በረዶ ጋር።",
      price: 130,
      icon: "🧊",
      isAvailable: true,
      ingredientsEN: ["Espresso", "Cold Milk", "Caramel Drizzle", "Vanilla Syrup", "Ice"],
      ingredientsAM: ["ኤስፕሬሶ", "ወተት", "ካራሜል", "ቫኒላ", "በረዶ"],
      removals: [
        { name_en: "No Ice", name_am: "በረዶ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Sugar / Syrup", name_am: "ስኳር የሌለው", price_delta: 0, type: "removal" },
        { name_en: "Less Sweet", name_am: "ቀለል ያለ ጣፋጭ", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Extra Shot", name_am: "ተጨማሪ ሾት", price_delta: 25, type: "addon" },
        { name_en: "Oat Milk Swap", name_am: "የኦት ወተት", price_delta: 35, type: "addon" },
      ],
    },
    {
      id: "drink-cold-2",
      section: "drinks",
      subCategory: "cold_drinks",
      nameEN: "Hibiscus Iced Karkadeh Tea",
      nameAM: "አይስድ ከርከዴህ ሻይ",
      descriptionEN: "Ruby red organic hibiscus tea infused with fresh mint, lime juice and crushed ice.",
      descriptionAM: "የከርከዴህ አበባ ሻይ ከትኩስ ናና፣ ሎሚ እና ከተፈጨ በረዶ ጋር።",
      price: 90,
      icon: "🌺",
      isAvailable: true,
      ingredientsEN: ["Hibiscus Flower Tea", "Fresh Mint Leaves", "Fresh Lime", "Ice"],
      ingredientsAM: ["ከርከዴህ", "ናና", "ሎሚ", "በረዶ"],
      removals: [
        { name_en: "No Sugar", name_am: "ስኳር የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Ice", name_am: "በረዶ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Mint", name_am: "ናና የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Chia Seeds Boost", name_am: "ቺያ ሲድስ", price_delta: 25, type: "addon" },
      ],
    },

    // --- DRINKS: FRESH JUICES & SMOOTHIES ---
    {
      id: "drink-juice-1",
      section: "drinks",
      subCategory: "fresh_juices",
      nameEN: "Special Avocado Mango Spris",
      nameAM: "ልዩ የአቮካዶና ማንጎ ስፕሪስ",
      descriptionEN: "Layers of thick creamy avocado and sweet mango puree with hint of fresh lime.",
      descriptionAM: "በጥንቃቄ የተደራረበ የሀበሻ አቮካዶና ማንጎ ጭማቂ ከሎሚ ጋር።",
      price: 110,
      icon: "🥑",
      isAvailable: true,
      ingredientsEN: ["Fresh Avocado Puree", "Sweet Mango Puree", "Fresh Lime", "Sugar", "Ice"],
      ingredientsAM: ["አቮካዶ", "ማንጎ", "ሎሚ", "ስኳር", "በረዶ"],
      removals: [
        { name_en: "No Sugar (Natural)", name_am: "ስኳር የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Ice", name_am: "በረዶ የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Vimto Cordial Drizzle", name_am: "የቪምቶ ጠብታ", price_delta: 20, type: "addon" },
      ],
    },
    {
      id: "drink-juice-2",
      section: "drinks",
      subCategory: "fresh_juices",
      nameEN: "Fresh Papaya Orange Blend",
      nameAM: "የፓፓያ እና ብርቱካን ጭማቂ",
      descriptionEN: "Sun-ripened papaya blended smoothly with fresh squeezed sweet Ethiopian orange juice.",
      descriptionAM: "ጣፋጭ ፓፓያ ከትኩስ ብርቱካን ጋር ተጨምቆ የተዘጋጀ።",
      price: 100,
      icon: "🍊",
      isAvailable: true,
      ingredientsEN: ["Fresh Papaya", "Fresh Squeezed Orange Juice", "Ice"],
      ingredientsAM: ["ፓፓያ", "ብርቱካን", "በረዶ"],
      removals: [
        { name_en: "No Sugar", name_am: "ስኳር የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Ice", name_am: "በረዶ የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [
        { name_en: "Ginger Kick Shot", name_am: "የዝንጅብል ጭማቂ", price_delta: 20, type: "addon" },
      ],
    },

    // --- DRINKS: SOFT DRINKS & WATER ---
    {
      id: "drink-soft-1",
      section: "drinks",
      subCategory: "soft_drinks",
      nameEN: "Ambo Sparkling Mineral Water (Glass)",
      nameAM: "አምቦ ውሃ (ብርጭቆ ጠርሙስ)",
      descriptionEN: "Naturally carbonated mineral water straight from the Ethiopian volcanic springs.",
      descriptionAM: "የተፈጥሮ አምቦ ውሃ ከሎሚ ቁራጭ ጋር።",
      price: 45,
      icon: "💧",
      isAvailable: true,
      ingredientsEN: ["Natural Mineral Water", "Fresh Lemon Wedge"],
      ingredientsAM: ["አምቦ ውሃ", "ሎሚ"],
      removals: [
        { name_en: "No Lemon Slice", name_am: "ሎሚ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "Room Temperature (No Ice)", name_am: "ቀዝቃዛ ያልሆነ", price_delta: 0, type: "removal" },
      ],
      addons: [],
    },
    {
      id: "drink-soft-2",
      section: "drinks",
      subCategory: "soft_drinks",
      nameEN: "Chilled Coca-Cola / Fanta / Sprite",
      nameAM: "ኮካ ኮላ / ፋንታ / ስፕራይት",
      descriptionEN: "Ice-cold bottled soda served with chilled glass and fresh citrus slice.",
      descriptionAM: "ቀዝቃዛ ለስላሳ መጠጥ ከሎሚ ጋር።",
      price: 50,
      icon: "🥤",
      isAvailable: true,
      ingredientsEN: ["Chilled Soda", "Ice Glass", "Lemon Wedge"],
      ingredientsAM: ["ለስላሳ መጠጥ", "በረዶ", "ሎሚ"],
      removals: [
        { name_en: "No Ice in Glass", name_am: "በረዶ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Lemon Wedge", name_am: "ሎሚ የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [],
    },

    // --- DRINKS: COCKTAILS & BAR ---
    {
      id: "drink-bar-1",
      section: "drinks",
      subCategory: "cocktails",
      nameEN: "Highland Tej Honey Wine Cocktail",
      nameAM: "የማር ጠጅ ኮክቴል",
      descriptionEN: "Traditional golden fermented honey wine mixed with sparkling water, citrus and rosemary.",
      descriptionAM: "የተመረጠ ንጹህ ጠጅ ከሎሚ፣ ሮዝመሪ እና ከአምቦ ውሃ ጋር።",
      price: 180,
      icon: "🍹",
      isAvailable: true,
      ingredientsEN: ["Authentic Honey Tej", "Sparkling Water", "Fresh Rosemary", "Lemon"],
      ingredientsAM: ["ጠጅ", "አምቦ ውሃ", "ሮዝመሪ", "ሎሚ"],
      removals: [
        { name_en: "No Rosemary Garnish", name_am: "ሮዝመሪ የሌለው", price_delta: 0, type: "removal" },
        { name_en: "No Ice", name_am: "በረዶ የሌለው", price_delta: 0, type: "removal" },
      ],
      addons: [],
    },
    {
      id: "drink-bar-2",
      section: "drinks",
      subCategory: "cocktails",
      nameEN: "Addis Mojito Spritzer",
      nameAM: "አዲስ ሞሂቶ ስፕሪትዘር",
      descriptionEN: "Crisp cocktail of white rum, crushed fresh garden mint, raw cane sugar and bubbly soda.",
      descriptionAM: "ሞሂቶ ከትኩስ ናና፣ ስኳር፣ ሎሚ እና ከሶዳ ጋር።",
      price: 220,
      icon: "🍸",
      isAvailable: true,
      ingredientsEN: ["Rum/Spirits", "Fresh Crushed Mint", "Lime Juice", "Cane Sugar", "Soda Water"],
      ingredientsAM: ["አልኮል", "ናና", "ሎሚ", "ስኳር", "ሶዳ"],
      removals: [
        { name_en: "No Sugar / Less Sweet", name_am: "ስኳር የሌለው", price_delta: 0, type: "removal" },
        { name_en: "Light Ice", name_am: "ቀለል ያለ በረዶ", price_delta: 0, type: "removal" },
      ],
      addons: [],
    },
  ];

  const handleOpenCustomize = (item: any) => {
    setSelectedItem(item);
    setIsCustomizeOpen(true);
  };

  const handleConfirmCustomization = (customizedItem: any) => {
    setTrayItems((prev) => [
      ...prev,
      {
        ...customizedItem,
        id: `tray-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        quantity: 1,
      },
    ]);
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

  const handleGoToPayment = () => {
    window.location.href = "/checkout";
  };

  // Filter items based on active section and subcategory
  const currentSectionItems = menuCatalog.filter((item) => item.section === activeSection);
  const displayedItems =
    activeSubCategory === "all" || activeSubCategory === "all_food" || activeSubCategory === "all_drinks"
      ? currentSectionItems
      : currentSectionItems.filter((item) => item.subCategory === activeSubCategory);

  if (isError) return <QRErrorCard />;
  if (!resolved) return <div className="p-6 text-center text-xs text-buna">Loading menu...</div>;

  return (
    <div className="min-h-screen bg-[#fff8f5] text-buna font-sans relative pb-28">
      <OfflineBanner lang={lang} />

      {/* =================================================================== */}
      {/* STICKY TOP HEADER WITH CART ICON (Always visible on every page)     */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-40 bg-[#fff8f5]/95 backdrop-blur-md border-b border-[#ebdcd3]/70 px-4 py-3 flex items-center justify-between shadow-sm">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setActiveSection("home");
              setActiveSubCategory("all");
            }}
            className="flex items-center space-x-2 text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              ☕
            </div>
            <div>
              <span className="font-black text-sm tracking-wider text-buna block leading-none">
                MENUFLOW
              </span>
              <span className="text-[10px] text-buna-mocha font-bold block mt-0.5">
                Table {resolved.label}
              </span>
            </div>
          </button>
        </div>

        {/* Right Controls: Language Toggle & CART ICON */}
        <div className="flex items-center space-x-2.5">
          {/* Language Switcher Pill */}
          <div className="inline-flex items-center bg-[#ebdcd3]/70 rounded-full p-0.5 border border-[#ebdcd3]">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all ${
                lang === "en" ? "bg-primary text-white shadow-sm" : "text-buna-mocha"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("am")}
              className={`px-2.5 py-1 rounded-full text-[10px] font-black gees-text transition-all ${
                lang === "am" ? "bg-primary text-white shadow-sm" : "text-buna-mocha"
              }`}
            >
              አማ
            </button>
          </div>

          {/* Waiter Assistance Bell Button */}
          <button
            type="button"
            onClick={() => setIsServiceModalOpen(true)}
            className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-[#ebdcd3] shadow-sm hover:bg-[#faf2ee] active:scale-95 transition-all text-buna"
            aria-label="Call Waiter, Request Water or Bill"
            title="Need assistance? Call Waiter, Water, Bill"
          >
            <span className="text-xl">🛎️</span>
          </button>

          {/* View Table Bill & Settle Button */}
          <Link
            href={`/t/${params.token}/bill`}
            className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-[#ebdcd3] shadow-sm hover:bg-[#faf2ee] active:scale-95 transition-all text-buna"
            aria-label="View Table Digital Bill & Open Tab"
            title="View Table Bill & Digital Settle"
          >
            <span className="text-xl">🧾</span>
          </Link>

          {/* Top Cart Icon Button - As Requested by User */}
          <button
            type="button"
            onClick={() => setIsTrayDrawerOpen(true)}
            className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-[#ebdcd3] shadow-sm hover:bg-[#faf2ee] active:scale-95 transition-all text-buna"
            aria-label="View Active Tray and Proceed to Payment"
          >
            <span className="text-xl">🛒</span>
            {totalItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-md animate-bounce">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-5">
        {/* =================================================================== */}
        {/* VIEW 1: INITIAL TWO CARDS ("FOOD" AND "DRINKS")                     */}
        {/* =================================================================== */}
        {activeSection === "home" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Welcome & Instruction Banner */}
            <div className="text-center space-y-1 py-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-[#faf2ee] px-3 py-1 rounded-full border border-[#ebdcd3]">
                📍 Seated at Table {resolved.label}
              </span>
              <h1 className="text-2xl font-black text-buna tracking-tight pt-1">
                {lang === "am" ? "ምን ማዘዝ ይፈልጋሉ?" : "What are you having today?"}
              </h1>
              <p className="text-xs text-buna-mocha max-w-xs mx-auto">
                {lang === "am"
                  ? "ከታች ካሉት ሁለት አማራጮች አንዱን ይምረጡ። ምግቦችንና መጠጦችን እንደፍላጎትዎ ማስተካከል ይችላሉ።"
                  : "Tap Food or Drinks to explore categories and customize your order to your exact taste."}
              </p>
            </div>

            {/* TWO PRIMARY MAIN CARDS (FOOD & DRINKS) */}
            <div className="space-y-4 pt-1">
              {/* CARD 1: FOOD */}
              <div
                onClick={() => {
                  setActiveSection("food");
                  setActiveSubCategory("all_food");
                }}
                className="group relative bg-white rounded-3xl border-2 border-[#ebdcd3] shadow-md hover:shadow-xl hover:border-primary transition-all duration-200 overflow-hidden cursor-pointer active:scale-[0.98]"
              >
                {/* Visual Banner Header */}
                <div className="h-44 bg-gradient-to-br from-[#9d3e0f] via-[#bd5627] to-[#732907] relative flex items-center justify-center overflow-hidden p-4">
                  {/* Subtle Background Glow Elements */}
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl" />
                  <div className="relative text-center text-white space-y-1">
                    <span className="text-5xl block transform group-hover:scale-110 transition-transform">
                      🍔
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#ffd5c4] block">
                      KITCHEN & GRILL
                    </span>
                  </div>
                </div>

                {/* Card Content & Categories Preview */}
                <div className="p-5 space-y-3 text-left">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-xl font-black text-buna">
                      {lang === "am" ? "የምግብ ዝርዝር (Food)" : "Food Menu"}
                    </h2>
                    <span className="text-xs font-black text-primary">Browse →</span>
                  </div>

                  <p className="text-xs text-buna-mocha leading-relaxed">
                    {lang === "am"
                      ? "ፈጣን ምግቦች፣ በርገር፣ የባህል ምግቦች (ጥብስ፣ ዶሮ ወጥ)፣ ቁርስ፣ ምሳና እራት፣ እንዲሁም ጣፋጮች።"
                      : "Burgers, sizzling clay pot tibs, traditional dishes, breakfast, lunch, dinner & desserts."}
                  </p>

                  {/* Subcategories Pills Preview */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-bold bg-[#faf2ee] text-buna px-2.5 py-1 rounded-full border border-[#ebdcd3]">
                      🍔 Fast Food & Burgers
                    </span>
                    <span className="text-[10px] font-bold bg-[#faf2ee] text-buna px-2.5 py-1 rounded-full border border-[#ebdcd3]">
                      🥩 Traditional Meals
                    </span>
                    <span className="text-[10px] font-bold bg-[#faf2ee] text-buna px-2.5 py-1 rounded-full border border-[#ebdcd3]">
                      🍳 Breakfast
                    </span>
                    <span className="text-[10px] font-bold bg-[#faf2ee] text-buna px-2.5 py-1 rounded-full border border-[#ebdcd3]">
                      🍗 Lunch & Dinner
                    </span>
                    <span className="text-[10px] font-bold bg-[#faf2ee] text-buna px-2.5 py-1 rounded-full border border-[#ebdcd3]">
                      🍰 Desserts
                    </span>
                  </div>

                  {/* Action CTA Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      className="w-full py-3 bg-primary text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-md group-hover:bg-primary-container transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Explore Food Menu</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 2: DRINKS */}
              <div
                onClick={() => {
                  setActiveSection("drinks");
                  setActiveSubCategory("all_drinks");
                }}
                className="group relative bg-white rounded-3xl border-2 border-[#ebdcd3] shadow-md hover:shadow-xl hover:border-primary transition-all duration-200 overflow-hidden cursor-pointer active:scale-[0.98]"
              >
                {/* Visual Banner Header */}
                <div className="h-44 bg-gradient-to-br from-[#2b1810] via-[#4a2817] to-[#170a04] relative flex items-center justify-center overflow-hidden p-4">
                  <div className="absolute -left-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-xl" />
                  <div className="relative text-center text-white space-y-1">
                    <span className="text-5xl block transform group-hover:scale-110 transition-transform">
                      🍹
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#ffd5c4] block">
                      ROASTERY & BEVERAGES
                    </span>
                  </div>
                </div>

                {/* Card Content & Categories Preview */}
                <div className="p-5 space-y-3 text-left">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-xl font-black text-buna">
                      {lang === "am" ? "የመጠጦች ዝርዝር (Drinks)" : "Drinks & Beverages"}
                    </h2>
                    <span className="text-xs font-black text-primary">Browse →</span>
                  </div>

                  <p className="text-xs text-buna-mocha leading-relaxed">
                    {lang === "am"
                      ? "ትኩስ የጀበና ቡና፣ ቀዝቃዛ አይስድ ኮፊ፣ ትኩስ የፍራፍሬ ጭማቂዎች (ስፕሪስ)፣ ለስላሳ መጠጦች እና ኮክቴል።"
                      : "Clay-pot jebena buna, specialty coffee, iced macchiatos, fresh fruit juices, sodas & cocktails."}
                  </p>

                  {/* Subcategories Pills Preview */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-bold bg-[#faf2ee] text-buna px-2.5 py-1 rounded-full border border-[#ebdcd3]">
                      ☕ Hot Buna & Coffee
                    </span>
                    <span className="text-[10px] font-bold bg-[#faf2ee] text-buna px-2.5 py-1 rounded-full border border-[#ebdcd3]">
                      🧊 Cold & Iced Drinks
                    </span>
                    <span className="text-[10px] font-bold bg-[#faf2ee] text-buna px-2.5 py-1 rounded-full border border-[#ebdcd3]">
                      🥑 Fresh Juices
                    </span>
                    <span className="text-[10px] font-bold bg-[#faf2ee] text-buna px-2.5 py-1 rounded-full border border-[#ebdcd3]">
                      🥤 Soft Drinks
                    </span>
                    <span className="text-[10px] font-bold bg-[#faf2ee] text-buna px-2.5 py-1 rounded-full border border-[#ebdcd3]">
                      🍸 Cocktails & Bar
                    </span>
                  </div>

                    {/* Action CTA Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        className="w-full py-3 bg-[#381a10] text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-md group-hover:bg-primary transition-all flex items-center justify-center space-x-2"
                      >
                        <span>Explore Drinks Menu</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>

              {/* CARD 3: OFF-MENU CHEF SPECIAL REQUEST (Phase 2B) */}
              <div
                onClick={() => setIsOffMenuOpen(true)}
                className="bg-gradient-to-r from-[#241a13] to-[#3a2216] border-2 border-[#f59e0b]/40 rounded-3xl p-4 shadow-md text-white cursor-pointer hover:border-[#f59e0b] transition-all flex items-center justify-between active:scale-[0.98]"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-11 h-11 rounded-2xl bg-[#f59e0b]/20 flex items-center justify-center text-2xl shrink-0 border border-[#f59e0b]/30">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#fef08a] uppercase tracking-wide">
                      {lang === "am" ? "የልዩ ትዕዛዝ ጥያቄ (Off-Menu)" : "Request Off-Menu Dish or Drink"}
                    </h3>
                    <p className="text-[11px] text-[#d4d4d4] leading-snug mt-0.5">
                      {lang === "am"
                        ? "በሜኑ ውስጥ የሌለ ነገር ይፈልጋሉ? በጽሁፍ ወይም በድምጽ ያዝዙ"
                        : "Craving something custom? Type or record a spoken voice note for the chef."}
                    </p>
                  </div>
                </div>
                <span className="text-base font-black text-[#fef08a] pl-2">→</span>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: CATEGORY BROWSER (FOOD OR DRINKS VIEW)                      */}
        {/* =================================================================== */}
        {(activeSection === "food" || activeSection === "drinks") && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Navigation Bar: Back Button & Section Switcher */}
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-[#ebdcd3] shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setActiveSection("home");
                  setActiveSubCategory("all");
                }}
                className="flex items-center space-x-1.5 text-xs font-black text-buna hover:text-primary transition-colors"
              >
                <span>←</span>
                <span>{lang === "am" ? "ወደ ዋናው ማውጫ" : "Back to Main Menu"}</span>
              </button>

              {/* Quick Switch to the other category */}
              {activeSection === "food" ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection("drinks");
                    setActiveSubCategory("all_drinks");
                  }}
                  className="text-xs font-black text-primary bg-[#faf2ee] px-3 py-1.5 rounded-xl border border-[#ebdcd3] hover:bg-[#ebdcd3] transition-colors flex items-center space-x-1"
                >
                  <span>🍹 Switch to Drinks</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection("food");
                    setActiveSubCategory("all_food");
                  }}
                  className="text-xs font-black text-primary bg-[#faf2ee] px-3 py-1.5 rounded-xl border border-[#ebdcd3] hover:bg-[#ebdcd3] transition-colors flex items-center space-x-1"
                >
                  <span>🍔 Switch to Foods</span>
                  <span>→</span>
                </button>
              )}
            </div>

            {/* Current Section Title */}
            <div className="text-left px-1">
              <h2 className="text-xl font-black text-buna flex items-center space-x-2">
                <span>{activeSection === "food" ? "🍔 Food Menu" : "🍹 Drinks & Beverages"}</span>
              </h2>
              <p className="text-xs text-buna-mocha">
                {activeSection === "food"
                  ? "Tap any dish to customize ingredients (remove onions, ketchup, add extras)."
                  : "Tap any beverage to customize ice, sweetness, milk choice, and add-ons."}
              </p>
            </div>

            {/* Subcategories Horizontal Scroll Filter Bar */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 no-scrollbar">
              {(activeSection === "food" ? foodCategories : drinksCategories).map((cat) => {
                const isActive = activeSubCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveSubCategory(cat.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                      isActive
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-buna-mocha border-[#ebdcd3] hover:text-buna hover:border-buna/30"
                    }`}
                  >
                    {lang === "am" ? cat.name_am : cat.name_en}
                  </button>
                );
              })}
            </div>

            {/* Dish & Beverage Cards Grid */}
            <div className="space-y-3 pt-1">
              {displayedItems.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#ebdcd3] text-buna-mocha text-xs font-bold">
                  No items available under this category.
                </div>
              ) : (
                displayedItems.map((item) => (
                  <CompactDishCard
                    key={item.id}
                    id={item.id}
                    nameEN={item.nameEN}
                    nameAM={item.nameAM}
                    descriptionEN={item.descriptionEN}
                    descriptionAM={item.descriptionAM}
                    price={item.price}
                    isAvailable={item.isAvailable}
                    icon={item.icon}
                    ingredientsEN={item.ingredientsEN}
                    ingredientsAM={item.ingredientsAM}
                    removals={item.removals}
                    addons={item.addons}
                    lang={lang}
                    onAddToCart={handleOpenCustomize}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Slide-Up Customization Drawer (Removals: No Onions, No Ketchup, Add-ons) */}
      <CustomizeSheet
        isOpen={isCustomizeOpen}
        item={selectedItem}
        lang={lang}
        onClose={() => setIsCustomizeOpen(false)}
        onConfirm={handleConfirmCustomization}
      />

      {/* Bottom Floating Active Tray Capsule */}
      <ActiveTrayDock
        itemCount={totalItemCount}
        totalPriceETB={totalPriceETB}
        onOpenTray={() => setIsTrayDrawerOpen(true)}
        onCheckout={handleGoToPayment}
      />

      {/* Full Active Tray Review Drawer */}
      <ActiveTrayDrawer
        isOpen={isTrayDrawerOpen}
        items={trayItems}
        totalPriceETB={totalPriceETB}
        lang={lang}
        onClose={() => setIsTrayDrawerOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onCheckout={handleGoToPayment}
      />

      {/* Table Service Assistance Modal */}
      <ServiceRequestModal
        isOpen={isServiceModalOpen}
        tableLabel={resolved.label}
        onClose={() => setIsServiceModalOpen(false)}
      />

      {/* Off-Menu Custom Request Modal per Phase 2B */}
      <OffMenuRequestModal
        isOpen={isOffMenuOpen}
        lang={lang}
        onClose={() => setIsOffMenuOpen(false)}
        onAddOffMenu={(customItem) => {
          setTrayItems((prev) => [...prev, customItem]);
          setIsTrayDrawerOpen(true);
        }}
      />
    </div>
  );
}
