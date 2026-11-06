"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CreateTableModal from "@/components/admin/CreateTableModal";
import QRPrintSheet from "@/components/admin/QRPrintSheet";

interface TableEntity {
  id: string;
  table_number: string;
  type: string;
  qr_token?: string;
  assigned_waiter?: string;
  created_at: string;
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [tokenVersion, setTokenVersion] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  useEffect(() => {
    setTables([
      { id: "01J8TBL1", table_number: "01", type: "table", assigned_waiter: "Abebe Tadesse (Zone A)", qr_token: "eyJyaWQiOiIwMUo4UkVTVDEwMCIsInR5cGUiOiJ0YWJsZSIsInRhcmdldF9pZCI6IjAxSjhUQUJMRTEwMCIsImxhYmVsIjoiMDEiLCJ2IjoxfQ==.sig", created_at: "2026-09-22" },
      { id: "01J8TBL2", table_number: "02", type: "table", assigned_waiter: "Abebe Tadesse (Zone A)", qr_token: "eyJyaWQiOiIwMUo4UkVTVDEwMCIsInR5cGUiOiJ0YWJsZSIsInRhcmdldF9pZCI6IjAxSjhUQUJMRTIwMCIsImxhYmVsIjoiMDIiLCJ2IjoxfQ==.sig", created_at: "2026-09-22" },
      { id: "01J8TBL3", table_number: "03", type: "table", assigned_waiter: "Abebe Tadesse (Zone A)", qr_token: "eyJyaWQiOiIwMUo4UkVTVDEwMCIsInR5cGUiOiJ0YWJsZSIsInRhcmdldF9pZCI6IjAxSjhUQUJMRTMwMCIsImxhYmVsIjoiMDMiLCJ2IjoxfQ==.sig", created_at: "2026-09-22" },
      { id: "01J8TBL4", table_number: "04", type: "table", assigned_waiter: "Abebe Tadesse (Zone A)", qr_token: "eyJyaWQiOiIwMUo4UkVTVDEwMCIsInR5cGUiOiJ0YWJsZSIsInRhcmdldF9pZCI6IjAxSjhUQUJMRTQwMCIsImxhYmVsIjoiMDQiLCJ2IjoxfQ==.sig", created_at: "2026-09-22" },
      { id: "01J8TBL5", table_number: "05", type: "table", assigned_waiter: "Tigist Haile (Zone B)", qr_token: "eyJyaWQiOiIwMUo4UkVTVDEwMCIsInR5cGUiOiJ0YWJsZSIsInRhcmdldF9pZCI6IjAxSjhUQUJMRTUwMCIsImxhYmVsIjoiMDUiLCJ2IjoxfQ==.sig", created_at: "2026-09-22" },
      { id: "01J8TBL6", table_number: "P01", type: "pickup", assigned_waiter: "Dawit Kebede (Counter)", qr_token: "eyJyaWQiOiIwMUo4UkVTVDEwMCIsInR5cGUiOiJwaWNrdXAiLCJ0YXJnZXRfaWQiOiIwMUo4UElDS1VQMTAwIiwibGFiZWwiOiJQMDEiLCJ2IjoxfQ==.sig", created_at: "2026-09-22" },
      { id: "01J8TBL7", table_number: "P02", type: "pickup", assigned_waiter: "Dawit Kebede (Counter)", qr_token: "eyJyaWQiOiIwMUo4UkVTVDEwMCIsInR5cGUiOiJwaWNrdXAiLCJ0YXJnZXRfaWQiOiIwMUo4UElDS1VQMjAwIiwibGFiZWwiOiJQMDIiLCJ2IjoxfQ==.sig", created_at: "2026-09-22" },
    ]);
  }, []);

  const handleCreateTable = (tableNumber: string, type: string) => {
    const newTbl: TableEntity = {
      id: `01J8TBL${Date.now()}`,
      table_number: tableNumber,
      type: type,
      qr_token: `eyJyaWQiOiIwMUo4UkVTVDEwMCIsInR5cGUiOiI${type}\",\"target_id\":\"01J8${Date.now()}\",\"label\":\"${tableNumber}\",\"v\":${tokenVersion}}.sig`,
      created_at: new Date().toISOString(),
    };
    setTables([...tables, newTbl]);
  };

  const handleRegenerateTokens = () => {
    if (confirm("Are you sure you want to regenerate all QR tokens? All currently printed physical QR codes will be immediately revoked!")) {
      const newVer = tokenVersion + 1;
      setTokenVersion(newVer);
      setTables(
        tables.map((t) => ({
          ...t,
          qr_token: `eyJyaWQiOiIwMUo4UkVTVDEwMCIsInR5cGUiOiI${t.type}\",\"target_id\":\"${t.id}\",\"label\":\"${t.table_number}\",\"v\":${newVer}}.sig`,
        }))
      );
      alert(`Token version updated to v${newVer}. All old physical QR prints have been revoked.`);
    }
  };

  const dineInCount = tables.filter((t) => t.type === "table").length;
  const pickupCount = tables.filter((t) => t.type === "pickup").length;

  return (
    <div className="p-5 md:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ebdcd3]/70">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/admin" className="text-xs font-bold text-primary hover:underline">
              ← Dashboard
            </Link>
            <span className="text-xs text-[#ebdcd3]">•</span>
            <span className="text-xs text-buna-mocha font-semibold">Floor Management</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-buna mt-1">
            Tables & QR Tokens
          </h1>
          <p className="text-xs text-buna-mocha font-medium mt-0.5">
            Configure dining tables, takeaway pickup counters, and print tamper-proof HMAC signed QR codes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRegenerateTokens}
            className="px-3.5 py-2 border border-[#DC2626]/40 text-[#DC2626] rounded-xl text-xs font-bold hover:bg-[#DC2626]/5 transition-colors"
          >
            Revoke All & Bump v{tokenVersion + 1}
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="px-4 py-2 border border-[#ebdcd3] bg-white text-buna rounded-xl text-xs font-bold shadow-sm hover:bg-[#faf2ee] transition-colors flex items-center space-x-1.5"
          >
            <svg className="w-4 h-4 text-buna-mocha" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print QR Sheet</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primary-container transition-colors flex items-center space-x-1"
          >
            <span>+ Add Table / Pickup</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-5 border border-[#ebdcd3] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-buna-mocha">Total Service Points</span>
            <p className="text-2xl font-black text-buna mt-1">{tables.length} Active</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            📍
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#ebdcd3] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-buna-mocha">Floor Breakdown</span>
            <p className="text-2xl font-black text-buna mt-1">{dineInCount} Tables • {pickupCount} Pickup</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#006a3b]/10 text-[#006a3b] flex items-center justify-center font-bold text-lg">
            🍽️
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#ebdcd3] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-buna-mocha">Token Security</span>
            <p className="text-2xl font-black text-buna mt-1">Version v{tokenVersion} (HMAC-SHA256)</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gold/10 text-gold-text flex items-center justify-center font-bold text-lg">
            🛡️
          </div>
        </div>
      </div>

      {/* View Switcher & Cards Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-buna">Registered QR Service Points</h2>
          <div className="flex items-center space-x-2 bg-white border border-[#ebdcd3] rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === "cards" ? "bg-primary text-white" : "text-buna-mocha hover:text-buna"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === "table" ? "bg-primary text-white" : "text-buna-mocha hover:text-buna"
              }`}
            >
              Table List
            </button>
          </div>
        </div>

        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((tbl) => (
              <div
                key={tbl.id}
                className="bg-white rounded-3xl p-5 border border-[#ebdcd3] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        tbl.type === "pickup"
                          ? "bg-gold/10 text-gold-text"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {tbl.type === "pickup" ? "Takeaway Pickup" : "Dine-In Table"}
                    </span>
                    <span className="text-[10px] font-bold text-[#2D7A4D] bg-[#2D7A4D]/10 px-2 py-0.5 rounded-full">
                      v{tokenVersion} Active
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-buna">
                      {tbl.type === "pickup" ? `Pickup #${tbl.table_number}` : `Table ${tbl.table_number}`}
                    </h3>
                    <p className="text-[11px] text-buna-mocha font-mono truncate mt-0.5">
                      ID: {tbl.id}
                    </p>

                    {/* Assigned Waiter Dropdown (Phase 2C) */}
                    <div className="pt-2">
                      <label className="text-[10px] font-black text-buna-mocha uppercase tracking-wider block mb-1">
                        👤 Assigned Waiter:
                      </label>
                      <select
                        value={tbl.assigned_waiter || "Unassigned"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTables(tables.map((t) => (t.id === tbl.id ? { ...t, assigned_waiter: val } : t)));
                        }}
                        className="w-full text-xs font-bold bg-[#faf2ee] border border-[#ebdcd3] text-buna rounded-xl p-2 focus:outline-primary cursor-pointer"
                      >
                        <option value="Abebe Tadesse (Zone A)">Abebe Tadesse (Zone A)</option>
                        <option value="Tigist Haile (Zone B)">Tigist Haile (Zone B)</option>
                        <option value="Dawit Kebede (Counter)">Dawit Kebede (Counter)</option>
                        <option value="Unassigned">Unassigned (Floating)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Simulated Mini QR Code */}
                <div className="p-3 bg-[#faf5f0] rounded-2xl border border-[#ebdcd3]/70 flex items-center justify-between">
                  <div className="w-12 h-12 bg-white rounded-xl border border-[#ebdcd3] p-1 flex items-center justify-center text-xs font-black text-buna shrink-0">
                    QR
                  </div>
                  <div className="pl-3 min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-buna block">Signed HMAC Token</span>
                    <span className="text-[9px] font-mono text-buna-mocha block truncate max-w-full">
                      {tbl.qr_token}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/t/demo_token/menu`}
                    className="flex-1 py-2 text-center rounded-xl bg-[#faf2ee] hover:bg-[#ebdcd3]/50 text-buna text-xs font-bold transition-colors"
                  >
                    Simulate Scan →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-[#ebdcd3] overflow-hidden">
            <table className="w-full text-left text-sm text-buna">
              <thead className="text-xs uppercase text-buna-mocha border-b border-[#ebdcd3] bg-[#faf5f0]">
                <tr>
                  <th className="p-4">Label</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">HMAC Token Payload</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebdcd3]/50">
                {tables.map((tbl) => (
                  <tr key={tbl.id} className="hover:bg-[#faf5f0]/50 transition-colors">
                    <td className="p-4 font-bold text-primary">
                      {tbl.type === "pickup" ? `Pickup #${tbl.table_number}` : `Table ${tbl.table_number}`}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        tbl.type === "pickup" ? "bg-gold/10 text-gold-text" : "bg-primary/10 text-primary"
                      }`}>
                        {tbl.type === "pickup" ? "Takeaway" : "Dine-in"}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-buna-mocha truncate max-w-xs">
                      {tbl.qr_token}
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#2D7A4D]/10 text-[#2D7A4D]">
                        Active (v{tokenVersion})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateTableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateTable}
      />

      {isPrintOpen && (
        <QRPrintSheet
          tables={tables}
          restaurantName="MenuFlow Gourmet Lounge"
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
}
