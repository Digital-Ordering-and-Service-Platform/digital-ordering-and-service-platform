# MenuFlow — Digital Menu & Ordering Platform

**Architecture Model:** Single Deployable Restaurant Application with Central Customization Layer (Not Multi-Tenant SaaS)  
**Target Market:** Ethiopia (Restaurants, Cafes, Lounges, and Fast-Casual Diners)  
**Version:** 2.0 (Customizable Single-App Edition)  
**Date:** October 2026  

---

## 1. Executive Summary

MenuFlow is a standalone, easily customizable digital menu and real-time ordering application engineered for Ethiopian restaurants and cafes. 

Instead of an overcomplicated multi-tenant SaaS platform with cross-tenant billing, multi-organization routing, and shared databases, MenuFlow is built as **ONE cohesive, self-contained application** that is effortlessly deployed, white-labeled, and customized to the exact needs of each restaurant client in under an hour.

A restaurant guest scans a table QR code, browses an appetizing, bilingual digital menu on their phone (web PWA — no app install), customizes their order, and pays directly using local payment options (**Telebirr**, **Chapa**, **CBE Birr**, or **Cash at Counter**). Orders route instantly over native WebSockets to the **Kitchen Display System (KDS)** and notify floor waiters or the customer when ready.

### Core Value Proposition
- **Rapid Client Deployment:** Deploy a new branded instance for any restaurant in minutes by updating a single configuration file (`restaurant.config.json` / `theme.json`) or modifying settings in the Admin panel.
- **Tailored Restaurant Operations:** Seamlessly switch between **Full Table Service** (waiter alerts & table runners) and **Self-Service / Fast-Casual** (pickup counter notifications & display board) via a single toggle.
- **Appetizing & Refreshing UX:** High-definition food photography, tactile micro-interactions, warm terracotta and amber accents, cream foundations, and clean bilingual Ethiopic (`Noto Sans Ethiopic`) and Latin (`Plus Jakarta Sans`) typography.
- **Built-in Ethiopian Payment Rails:** Native support for Telebirr, CBE Birr, Chapa, and Cash with automated idempotency and settlement tracking.

---

## 2. User Roles

1. **Customer (Guest):** Anonymous or lightweight phone verification; scans table QR, browses categories, customizes dishes (doneness, add-ons, notes), pays via local mobile money, tracks order preparation in real time.
2. **Kitchen Staff / Chef:** Views live order cards on an iPad/TV monitor (KDS) in high-contrast dark mode; bumps order status: `Received → Preparing → Ready`.
3. **Waiter / Runner (Table Service Mode):** Mobile handheld view; receives instant audio/visual alerts when kitchen marks dishes "Ready"; navigates to table number and taps `Mark Delivered`.
4. **Cashier:** Settle bills, confirm manual cash payments, review itemized receipts, and verify provider transaction references.
5. **Restaurant Manager / Owner:** Manages menu items, categories, pricing, daily stock availability, table QR codes, tax/service percentages, and daily sales reports.

---

## 3. White-Label & Customization Architecture

MenuFlow is architected for zero-friction customization without touching core component logic. Every restaurant deployment is powered by a central configuration and design-token model:

### 3.1 Configuration Schema (`restaurant.config.json`)
```json
{
  "restaurant": {
    "id": "rest_bole_01",
    "name": "Bole Roast & Kitchen",
    "legal_name": "Bole Roast Hospitality PLC",
    "tagline": "Authentic Clay Pot & Roastery",
    "logo_url": "/images/logo.png",
    "cover_image": "/images/shekla_tibs.png",
    "currency": "ETB",
    "locales": ["en", "am"],
    "default_locale": "en",
    "phone": "+251911234567",
    "address": "Bole Medhanialem, Addis Ababa, Ethiopia"
  },
  "operations": {
    "service_mode": "table_service", // "table_service" | "counter_pickup"
    "service_charge_percent": 10.0,
    "vat_percent": 15.0,
    "allow_cash_fallback": true,
    "require_customer_phone": false,
    "prep_time_threshold_amber_mins": 8,
    "prep_time_threshold_red_mins": 15
  },
  "payments": {
    "chapa": {
      "enabled": true,
      "public_key": "CHAPUBK_TEST-xxx"
    },
    "telebirr": {
      "enabled": true,
      "merchant_id": "TB_BOLE_01"
    },
    "cbe_birr": {
      "enabled": true,
      "merchant_code": "CBE_98213"
    },
    "cash": {
      "enabled": true
    }
  }
}
```

### 3.2 Design Tokens (`theme.json` & CSS Variables)
```json
{
  "tokens": {
    "colors": {
      "brand_primary": "#C85A32",
      "brand_primary_hover": "#A94523",
      "brand_accent": "#E89F4C",
      "surface_base": "#FDFBF7",
      "surface_card": "#FFFFFF",
      "surface_elevated": "#F4EFEA",
      "text_primary": "#1E1A17",
      "text_secondary": "#6A635B",
      "border_subtle": "#EAE3DA",
      "border_medium": "#D8CFC3",
      "status_success": "#2D7A4D",
      "status_warning": "#D97706",
      "status_danger": "#DC2626"
    },
    "radii": {
      "sm": "6px",
      "md": "12px",
      "lg": "18px",
      "full": "9999px"
    }
  }
}
```

---

## 4. Surfaces & Layout Specification

### 4.1 Customer Mobile PWA (`/t/[token]/menu` & `/p/[token]/menu`)
- **Viewport:** Mobile-first, single-handed thumb zone.
- **Header:** Restaurant branding, table badge pill (`Table 12` / `ጠረጴዛ 12`), live search, and 1-tap `EN | አማ` toggle.
- **Filter Chips:** Sticky horizontal pill bar (`All Items`, `Warm Mains`, `Vegetarian / ጾም`, `Coffee & Buna`).
- **Dish Cards:** Large, mouth-watering imagery; bold titles; preparation time badges; price in ETB; 1-tap "+ Add".
- **Customization Sheet:** Bottom slide-up drawer for cooking styles (e.g. Leb-leb vs Tibs Firfir), add-ons (extra injera, cheese), and allergy instructions.
- **Sticky Tray Pill:** Floating animated capsule displaying item count, subtotal, and checkout trigger.
- **Checkout View:** Itemized summary, 10% Service Charge, 15% VAT, and Ethiopian payment rail selection tiles.
- **Live Order Progress Tracker:** Real-time animated timeline: `Paid → Kitchen Accepted → Preparing → Ready for Table/Pickup`.

### 4.2 Kitchen Display System (KDS) (`/kds`)
- **Viewport:** Landscape mode for kitchen tablets (iPad, Galaxy Tab) and wall-mounted monitors.
- **Visual Theme:** Native High-Contrast Dark Mode (`#121110` background) for dim kitchen environments.
- **Card Queue:** Table number banner, item list with modifiers, allergy warnings highlighted in red.
- **Aging Engine:** Cards update borders and timer badges:
  - Neutral / Green: `< 8 minutes`
  - Amber warning: `8 – 15 minutes`
  - Flashing Red + audible ping: `> 15 minutes` (critical late ticket)
- **Status Controls:** Single tap moves ticket: `Accept → Mark Preparing → Mark Ready`.

### 4.3 Waiter Runner View (`/waiter`)
- **Viewport:** Handheld mobile device for floor staff on the move.
- **Prioritized Queue:** Clear list of orders marked "Ready" by the kitchen.
- **Visuals:** Prominent table number badge, elapsed wait time, and dish checklist.
- **Actions:** Large 54px `[ MARK DELIVERED ✔ ]` button to dismiss the ticket.
- **Service Calls:** Real-time bell notification when a guest presses "Call Waiter" from their table.

### 4.4 Desktop Admin & Cashier (`/admin/*`)
- **Viewport:** Modern responsive split-panel desktop layout.
- **Menu Manager (`/admin/menu`):** Instant stock toggles (`In Stock / Out of Stock`), price updates, modifier management, dish photos.
- **Tables & QR Generator (`/admin/tables`):** Grid of restaurant tables with real-time status and 1-click printable QR code sheets.
- **Cashier Register (`/admin/cashier`):** Pending cash orders, receipt printing, and payment verification.
- **Sales Analytics (`/admin/orders`):** Gross revenue, top selling dishes, peak rush hours, and provider reconciliation (Telebirr vs Chapa vs Cash).
- **Restaurant Settings (`/admin/settings`):** Operational toggles (waiter mode vs self-service), tax percentages, and theme customizations.

---

## 5. Technical Stack

- **Backend:** Go (REST API + native WebSockets). Concurrency model handles live order events and webhook updates with sub-10ms response times.
- **Frontend:** Next.js 14 (App Router, TypeScript, Tailwind CSS). Responsive PWA with offline tray caching and bilingual Ethiopic font integration.
- **Database:** PostgreSQL 16 for structured relational data (menus, tables, orders, staff accounts, reconciliation logs).
- **Cache & Real-time Queue:** Redis 7.2 for live order tickets, active WebSocket session tracking, and distributed locks.
- **Payment Abstraction:** Go `PaymentProvider` interface handling Telebirr, Chapa, CBE Birr, and Cash with replay-safe idempotent webhooks.

---

## 6. Complete Production Prompt (For AI Coding Agents)

```
You are building "MenuFlow," a high-performance, easily customizable digital menu and real-time ordering application for Ethiopian restaurants and cafes. 

DO NOT build a multi-tenant SaaS platform. Build ONE cohesive, deployable application that is easily customized and white-labeled per restaurant deployment via a central config and theme layer (restaurant.config.json and theme.json).

DESIGN & AESTHETIC DIRECTION:
The UI must feel refreshing, warm, tactile, and deeply appetizing — never like a generic admin database.
- Palette: Warm linen cream background (#FDFBF7), card surfaces (#FFFFFF), deep charcoal text (#1E1A17), warm terracotta primary buttons (#C85A32), and amber gold accents (#E89F4C). Do NOT use cold corporate blue.
- Imagery: Large, high-resolution food photography front and center.
- Typography: Clean bilingual type hierarchy using 'Plus Jakarta Sans' for Latin and 'Noto Sans Ethiopic' for Amharic with proper line-height protection.
- Micro-Interactions: Smooth slide-up bottom sheets, spring-bounce cart counter, and real-time status transitions.
- Multi-Surface:
  1. Customer Mobile PWA: Mobile-first thumb zone, sticky category chips, dish customization sheet, checkout with 10% Service Charge and 15% VAT, and animated order tracking.
  2. Kitchen Display System (KDS): Tablet/TV landscape layout in native high-contrast dark mode (#121110) with visual aging (<8m green, 8-15m amber, >15m pulsing red).
  3. Waiter Runner View: Handheld mobile interface with ready dish alerts and a 1-tap "Mark Delivered" button.
  4. Desktop Admin & Cashier: Split-panel layout with menu stock toggles, printable signed table QR codes, cash settlement register, and sales reconciliation.

TECH STACK:
- Backend: Go REST API service with native WebSockets for real-time ticket streaming. Use PostgreSQL 16 for relational storage and Redis 7.2 for session queues.
- Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide icons.
- Payments: PaymentProvider interface supporting Telebirr, Chapa, CBE Birr, and Cash. Webhooks must be idempotent.
- Customization: Driven by restaurant.config.json and theme.json so re-branding for any Ethiopian restaurant requires only config changes.
```