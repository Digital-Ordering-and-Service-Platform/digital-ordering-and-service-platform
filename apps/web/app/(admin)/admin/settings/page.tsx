"use client";

import { useState } from "react";
import Link from "next/link";

interface RestaurantSettings {
  restaurant_name: string;
  establishment_mode: "table_service" | "counter_pickup";
  service_charge_pct: number;
  vat_pct: number;
  cash_fallback_enabled: boolean;
  pickup_alarm_enabled: boolean;
  telebirr_enabled: boolean;
  chapa_enabled: boolean;
  cbe_enabled: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings>({
    restaurant_name: "Habesha Gourmet Cafe & Lounge",
    establishment_mode: "table_service",
    service_charge_pct: 10.0,
    vat_pct: 15.0,
    cash_fallback_enabled: true,
    pickup_alarm_enabled: false,
    telebirr_enabled: true,
    chapa_enabled: true,
    cbe_enabled: true,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="p-5 md:p-8 space-y-7 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ebdcd3]/70">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/admin" className="text-xs font-bold text-primary hover:underline">
              ← Dashboard
            </Link>
            <span className="text-xs text-[#ebdcd3]">•</span>
            <span className="text-xs text-buna-mocha font-semibold">Store Configuration</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-buna mt-1">
            Establishment Settings
          </h1>
          <p className="text-xs text-buna-mocha font-medium mt-0.5">
            Configure restaurant service flow, local tax rules, and mobile payment gateways.
          </p>
        </div>

        {saveSuccess && (
          <span className="px-4 py-2 bg-[#2D7A4D]/15 text-[#2D7A4D] font-bold text-xs rounded-xl flex items-center space-x-1.5 animate-fadeIn">
            <span>✓</span>
            <span>Settings saved successfully!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Restaurant Identity */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm space-y-4">
          <div className="border-b border-[#ebdcd3]/60 pb-3">
            <h2 className="text-lg font-bold text-buna">Restaurant Profile</h2>
            <p className="text-xs text-buna-mocha">Displayed on customer QR menus and digital invoices</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-buna uppercase tracking-wider mb-1.5">
                Restaurant Name
              </label>
              <input
                type="text"
                value={settings.restaurant_name}
                onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                className="w-full text-sm font-semibold text-buna bg-[#faf5f0] border border-[#ebdcd3] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-buna uppercase tracking-wider mb-1.5">
                Default Currency
              </label>
              <input
                type="text"
                disabled
                value="ETB (Ethiopian Birr / ብር)"
                className="w-full text-sm font-semibold text-buna-mocha bg-[#ebdcd3]/30 border border-[#ebdcd3] rounded-xl px-3.5 py-2.5 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Operational Mode Tile Selectors */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm space-y-4">
          <div className="border-b border-[#ebdcd3]/60 pb-3">
            <h2 className="text-lg font-bold text-buna">Service Operating Mode</h2>
            <p className="text-xs text-buna-mocha">Switches dispatch behavior between runner staff and customer pickup</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setSettings({ ...settings, establishment_mode: "table_service" })}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.establishment_mode === "table_service"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-[#ebdcd3] hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">🍽️</span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    settings.establishment_mode === "table_service"
                      ? "border-primary bg-primary"
                      : "border-[#ebdcd3]"
                  }`}
                >
                  {settings.establishment_mode === "table_service" && (
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </span>
              </div>
              <h3 className="text-sm font-bold text-buna">Full Table Service</h3>
              <p className="text-xs text-buna-mocha mt-1">
                Kitchen marks "Ready" → alerts floor waiters with table number → runner delivers dish.
              </p>
            </div>

            <div
              onClick={() => setSettings({ ...settings, establishment_mode: "counter_pickup" })}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.establishment_mode === "counter_pickup"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-[#ebdcd3] hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">🥡</span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    settings.establishment_mode === "counter_pickup"
                      ? "border-primary bg-primary"
                      : "border-[#ebdcd3]"
                  }`}
                >
                  {settings.establishment_mode === "counter_pickup" && (
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </span>
              </div>
              <h3 className="text-sm font-bold text-buna">Counter Pickup / Fast Casual</h3>
              <p className="text-xs text-buna-mocha mt-1">
                Kitchen bumps ticket → sends buzz notification to customer phone for counter pickup.
              </p>
            </div>
          </div>
        </div>

        {/* Taxes & Charges */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm space-y-4">
          <div className="border-b border-[#ebdcd3]/60 pb-3">
            <h2 className="text-lg font-bold text-buna">Taxes & Service Surcharges</h2>
            <p className="text-xs text-buna-mocha">Automatically computed on guest carts during invoice calculation</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-buna uppercase tracking-wider mb-1.5">
                Service Charge (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.service_charge_pct}
                onChange={(e) => setSettings({ ...settings, service_charge_pct: parseFloat(e.target.value) || 0 })}
                className="w-full text-sm font-semibold text-buna bg-[#faf5f0] border border-[#ebdcd3] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-[11px] text-buna-mocha mt-1 block">Default standard for Ethiopian dining: 10%</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-buna uppercase tracking-wider mb-1.5">
                Value Added Tax (VAT %)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.vat_pct}
                onChange={(e) => setSettings({ ...settings, vat_pct: parseFloat(e.target.value) || 0 })}
                className="w-full text-sm font-semibold text-buna bg-[#faf5f0] border border-[#ebdcd3] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-[11px] text-buna-mocha mt-1 block">Standard Ethiopian statutory VAT: 15%</span>
            </div>
          </div>
        </div>

        {/* Payment Rails */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ebdcd3] shadow-sm space-y-4">
          <div className="border-b border-[#ebdcd3]/60 pb-3">
            <h2 className="text-lg font-bold text-buna">Payment Gateways & Fallbacks</h2>
            <p className="text-xs text-buna-mocha">Toggle active checkout options shown on customer mobile PWAs</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#faf5f0] border border-[#ebdcd3]/70">
              <div className="flex items-center space-x-3">
                <span className="text-xl">💵</span>
                <div>
                  <span className="text-sm font-bold text-buna block">Cash at Counter Fallback</span>
                  <span className="text-xs text-buna-mocha">
                    Allows guests without mobile money to order and pay physical cash to cashier
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.cash_fallback_enabled}
                onChange={(e) => setSettings({ ...settings, cash_fallback_enabled: e.target.checked })}
                className="w-5 h-5 text-primary rounded-lg focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#faf5f0] border border-[#ebdcd3]/70">
              <div className="flex items-center space-x-3">
                <span className="text-xl">📲</span>
                <div>
                  <span className="text-sm font-bold text-buna block">Telebirr (ቴሌብር) Integration</span>
                  <span className="text-xs text-buna-mocha">Direct mobile wallet checkout & USSD push</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.telebirr_enabled}
                onChange={(e) => setSettings({ ...settings, telebirr_enabled: e.target.checked })}
                className="w-5 h-5 text-primary rounded-lg focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#faf5f0] border border-[#ebdcd3]/70">
              <div className="flex items-center space-x-3">
                <span className="text-xl">💳</span>
                <div>
                  <span className="text-sm font-bold text-buna block">Chapa Payment Gateway</span>
                  <span className="text-xs text-buna-mocha">Debit cards, mobile banking, and digital wallet checkout</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.chapa_enabled}
                onChange={(e) => setSettings({ ...settings, chapa_enabled: e.target.checked })}
                className="w-5 h-5 text-primary rounded-lg focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-7 py-3 bg-primary hover:bg-primary-container text-white font-extrabold text-sm rounded-2xl shadow-md transition-all transform hover:scale-105 active:scale-95"
          >
            Save Restaurant Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
