"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "@/app/globals.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      exact: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Orders",
      href: "/admin/orders",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Tables",
      href: "/admin/tables",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm3 4h10M7 14h10" />
        </svg>
      ),
    },
    {
      label: "Menu Items",
      href: "/admin/menu",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      label: "Staff",
      href: "/admin/cashier",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  const isLinkActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#fff8f5] text-buna flex flex-col md:flex-row font-sans">
      {/* Mobile Top Navigation */}
      <div className="md:hidden bg-[#faf2ee] border-b border-[#ebdcd3] px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          {/* Jebena Logo */}
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.5 7.5c-.83 0-1.5.67-1.5 1.5v1.09C15.86 8.94 14.04 8 12 8c-3.87 0-7 3.13-7 7v1c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-1c0-.34-.04-.67-.1-1h.1c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5h-.5v-1c0-.83-.67-1.5-1.5-1.5zm-3.5 10.5H9c-1.1 0-2-.9-2-2v-1c0-2.76 2.24-5 5-5s5 2.24 5 5v1c0 1.1-.9 2-2 2zM12 2c-.55 0-1 .45-1 1v2.08C11.33 5.03 11.66 5 12 5s.67.03 1 .08V3c0-.55-.45-1-1-1z" />
            </svg>
          </div>
          <span className="font-extrabold tracking-wider text-base text-buna">MENUFLOW</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg border border-[#ebdcd3] text-buna hover:bg-[#ebdcd3]/40"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#faf2ee] border-b border-[#ebdcd3] px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isLinkActive(item.href, item.exact)
                  ? "bg-[#ebdcd3] text-buna font-semibold"
                  : "text-buna-mocha hover:text-buna hover:bg-[#ebdcd3]/50"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            href="/admin/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-buna-mocha hover:text-buna hover:bg-[#ebdcd3]/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </Link>
        </div>
      )}

      {/* Persistent Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 lg:w-64 flex-col justify-between border-r border-[#ebdcd3] bg-[#faf5f0] p-5 shrink-0 min-h-screen sticky top-0 h-screen">
        <div>
          {/* Logo / Brand */}
          <Link href="/admin" className="flex items-center space-x-3 px-2 py-3 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.5 7.5c-.83 0-1.5.67-1.5 1.5v1.09C15.86 8.94 14.04 8 12 8c-3.87 0-7 3.13-7 7v1c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-1c0-.34-.04-.67-.1-1h.1c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5h-.5v-1c0-.83-.67-1.5-1.5-1.5zm-3.5 10.5H9c-1.1 0-2-.9-2-2v-1c0-2.76 2.24-5 5-5s5 2.24 5 5v1c0 1.1-.9 2-2 2zM12 2c-.55 0-1 .45-1 1v2.08C11.33 5.03 11.66 5 12 5s.67.03 1 .08V3c0-.55-.45-1-1-1z" />
              </svg>
            </div>
            <div>
              <span className="font-black text-lg tracking-wider text-buna block leading-tight">MENUFLOW</span>
              <span className="text-[10px] text-buna-mocha uppercase tracking-widest font-semibold block">Manager Suite</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = isLinkActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                    active
                      ? "bg-[#ebdcd3] text-buna shadow-sm"
                      : "text-buna-mocha hover:text-buna hover:bg-[#ebdcd3]/40"
                  }`}
                >
                  <span className={active ? "text-primary" : "text-buna-mocha"}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Settings Link */}
        <div className="pt-4 border-t border-[#ebdcd3]/70">
          <Link
            href="/admin/settings"
            className={`flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              pathname.startsWith("/admin/settings")
                ? "bg-[#ebdcd3] text-buna shadow-sm"
                : "text-buna-mocha hover:text-buna hover:bg-[#ebdcd3]/40"
            }`}
          >
            <svg className="w-5 h-5 text-buna-mocha" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 min-w-0 bg-[#fff8f5] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
