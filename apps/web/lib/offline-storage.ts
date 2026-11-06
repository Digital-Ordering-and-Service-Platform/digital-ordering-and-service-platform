"use client";

const MENU_CACHE_KEY = "menuflow_client_menu_cache";
const TRAY_CACHE_KEY = "menuflow_client_tray_cache";

export interface TrayItem {
  id: string;
  item_id: string;
  name_en: string;
  name_am: string;
  final_price: number;
  quantity: number;
  is_available?: boolean;
  selected_addons?: Record<string, boolean>;
  selected_removals?: Record<string, boolean>;
  selected_variant?: string;
  special_instructions?: string;
}

// Save menu catalog into local storage for offline browsing per FR-3 & NFR-2
export function saveMenuCatalogLocal(restaurantID: string, catalogData: any): void {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      restaurantID,
      catalog: catalogData,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${MENU_CACHE_KEY}_${restaurantID}`, JSON.stringify(payload));
  } catch (err) {
    console.warn("offline-storage: failed to save menu catalog to localStorage", err);
  }
}

// Get cached menu catalog when offline per NFR-2
export function getMenuCatalogLocal(restaurantID: string): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${MENU_CACHE_KEY}_${restaurantID}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.catalog || null;
  } catch (err) {
    console.warn("offline-storage: failed to read menu catalog from localStorage", err);
    return null;
  }
}

// Save active draft tray items locally for session resumption ("save-my-tray") per UX-DR8
export function saveActiveTrayLocal(sessionToken: string, items: TrayItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${TRAY_CACHE_KEY}_${sessionToken}`, JSON.stringify(items));
    localStorage.setItem(`${TRAY_CACHE_KEY}_latest`, JSON.stringify(items));
  } catch (err) {
    console.warn("offline-storage: failed to save draft tray to localStorage", err);
  }
}

// Load active draft tray items from local storage
export function loadActiveTrayLocal(sessionToken?: string): TrayItem[] {
  if (typeof window === "undefined") return [];
  try {
    if (sessionToken) {
      const raw = localStorage.getItem(`${TRAY_CACHE_KEY}_${sessionToken}`);
      if (raw) return JSON.parse(raw) as TrayItem[];
    }
    const latestRaw = localStorage.getItem(`${TRAY_CACHE_KEY}_latest`);
    if (latestRaw) return JSON.parse(latestRaw) as TrayItem[];
    return [];
  } catch (err) {
    console.warn("offline-storage: failed to load draft tray from localStorage", err);
    return [];
  }
}
