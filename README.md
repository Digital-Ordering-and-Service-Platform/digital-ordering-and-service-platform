# MenuFlow (ሜኑ ፍሎው)

> **Customizable Digital Menu & Real-Time Ordering Platform for Ethiopian Restaurants & Cafes**  
> *One cohesive, self-contained application — easily customized and white-labeled per restaurant deployment.*

📖 **[Full Testing & Feature Walkthrough Guide](docs/testing/TESTING_GUIDE.md)** — Step-by-step instructions on running the app and accessing the existing screens.

---

## 🎨 UI Suite Improvements & Visual Showcase

All interfaces across MenuFlow have been elevated to an authentic Ethiopian hospitality standard—featuring warm linen surfaces (`#fff8f5`), terracotta accents (`#9d3e0f`), espresso charcoal text (`#33302d`), and bilingual Latin and Ge'ez (`Noto Sans Ethiopic`) typography.

### 1. 🖥️ Desktop Manager Command Center (`/admin`)
*Optimized for restaurant managers and owners on widescreen desktop displays (1080p / 1440p / 4K).*
- **Persistent Sidebar Navigation:** Terracotta steaming *Jebena* (Ethiopian clay pot) logo, direct routes to Dashboard, Orders, Tables, Menu Items, Cashier, and Settings.
- **Card 1 — Weekly Sales:** Prominent **Birr 24,500** KPI metric with smooth cubic spline SVG area chart, linear gradient fill, and rush day peak indicator badge.
- **Card 2 — Active Tables Floor Map:** Real-time visual floor grid with color-coded status badges:
  - 🟢 **Occupied (Green):** Active dining tables.
  - 🔴 **Bill Requested / Attention (Red):** Pulsing alert when guests request payment or waiter assistance.
  - ⚪ **Vacant (White):** Ready for seating.
  - Click any table to open current dining duration and bill total.
- **Card 3 — Menu Items Quick Stock Manager:** 1-tap stock availability toggles for items (*Shekla Tibs*, *Doro Wat*, *Gomen*, *Kitfo*) with live status pills (instantly 86's items on guest menus).
- **Card 4 — Staff Activity Analytics:** Vertical bar chart visualizing completed order throughput across shifts.

---

### 2. 📱 Mobile Phone Customer PWA (`/t/demo_token/menu`)
*Designed for single-handed thumb operation on mobile smartphones when guests scan table QR codes.*
- **Top Bar:** Steaming *Jebena* logo with **MENUFLOW**, Table 04 badge, and a slide-out drawer menu (`☰`) with options to call the waiter or request the bill.
- **Hero Dish Showcase Carousel:**
  - Sizzling clay pot photography of authentic Ethiopian dishes (*Shekla Tibs*, *Doro Wat*, *Royal Beyaynetu*) with carousel pagination dots (`● ○ ○`).
  - Large tactile terracotta **`ORDER NOW`** button triggering the customization drawer.
  - Bilingual typography: **`Shekla Tibs: Birr 450`**, **`Injera, savory lamb`**, and Ge'ez script **`ሽክላ ጥብስ`**.
- **Bottom Language Switcher Pill:** Floating capsule with **`[EN]`** active in a terracotta badge and **`አማ`** for Amharic.
- **Full Menu Browsing:** Sticky category chips (`All`, `Warm Mains`, `Ye'Tsom / የጾም`, `Buna & Drinks`), compact dish cards, and floating active tray dock.
- **Mobile Tray Checkout (`/checkout`):** Single-column itemized review with Ethiopian Tax Invoice (10% Service Surcharge, 15% VAT) and payment rails (**Telebirr**, **Chapa**, **CBE Direct**, **Cash at Table**).
- **Live Order Tracker (`/order/01J8ORD100`):** Animated status card (🍳 Preparing, 🔔 Ready, ✨ Delivered), estimated wait countdown timer, and 4-step vertical progress timeline.

---

### 3. 🍳 Chef Kitchen Display System (KDS) (`/kds`)
*Engineered for iPad/tablet landscape displays and wall-mounted touch monitors in hot commercial kitchens.*
- **High-Contrast Dark Mode (`#121110`):** Deep charcoal backdrop preventing kitchen glare.
- **Tablet Top Bar:** Back navigation (`←`), centered bold **`KDS`** title, and quick icons for alerts, kitchen settings, and audio chime.
- **Prominent Table Numbers on Every Card:**
  - **`ORDER #154 • TABLE 04`** (Doro Wat: 1, Tikil Gomen: 2, Ayib: 1)
  - **`ORDER #123 • TABLE 02`** (Shekla Tibs: 2, Beyaynetu: 3, Gomen: 1)
  - **`ORDER #160 • TABLE 05`** (Kitfo Special: 1, Jebena Buna: 2)
- **Visual Ticket Aging Engine:**
  - 🔵 **Fresh Ticket (`< 8 mins`):** Muted slate blue header banner (`#253248`).
  - 🟡 **Aging Warning (`8 – 15 mins`):** Glowing amber-gold border, orange **`Cooking`** status pill, and live digital clock (**`Timer 12:03`**).
  - 🔴 **Critical Ticket (`> 15 mins`):** Flashing red border prompting immediate kitchen expedited pass.
- **1-Tap Tactile `Bump` Button:** Large touch button to advance tickets from `Cooking` to `Ready` with a single tap, notifying the waiter runner handheld instantly.

---

### 4. 🏃 Waiter Runner Handheld (`/waiter`)
*Mobile handheld view for floor staff.*
- Priority queue of tickets marked "Ready" by the kitchen.
- Large table number badges, elapsed ready time, dish checklist, and 1-tap **`[ MARK DELIVERED ]`** dismiss button.

---

### 5. 💵 Cashier Counter Register (`/admin/cashier`)
*Cashier till and settlement register.*
- Till balance cards (Pending Cash to Collect vs. Settled Till Total).
- Filter tabs: *All Orders*, *Pending Cash*, and *Settled*.
- 1-tap **`[ ✓ Mark Cash Paid ]`** button for instant cash settlement.

---

### 6. 🌐 Hospitality Suite Hub (`/`)
*Developer and operator launchpad.*
- Live system status pill (`● System Live • v2.0`).
- Featured gradient banner launching directly into the **Desktop Command Center**.
- Multi-device surface cards showcasing Customer PWA, KDS, Waiter, and Backoffice tools.

---

## 🔍 How to View and Test Each UI Surface

### Step 1: Start the Local Development Server
Start the existing Next.js application from its monorepo location:
```bash
cd apps/web
npm run dev
```
The application runs at **`http://localhost:3000`**.

---

### Step 2: Open Screens in Your Browser

| Screen | URL | Recommended Viewport | What to Notice |
|---|---|---|---|
| **Platform Hub** | [`http://localhost:3000`](http://localhost:3000) | Desktop / Laptop | Hero showcase banner, status indicator, direct links to all surfaces |
| **Desktop Dashboard** | [`http://localhost:3000/admin`](http://localhost:3000/admin) | Desktop Widescreen | Persistent sidebar, Weekly Sales spline chart (Birr 24,500), Active Tables floor grid, 1-tap stock switches |
| **Customer PWA (Dine-in)** | [`http://localhost:3000/t/demo_token/menu`](http://localhost:3000/t/demo_token/menu) | Mobile Device / `F12 Mobile Toolbar` | Sizzling clay pot hero carousel, `ORDER NOW` button, `EN / አማ` pill, Table 04 drawer |
| **Customer PWA (Takeaway)** | [`http://localhost:3000/p/demo_token/menu`](http://localhost:3000/p/demo_token/menu) | Mobile Device / `F12 Mobile Toolbar` | Thermal pack options, Pickup #P04 badge, takeaway categories |
| **Tray Checkout** | [`http://localhost:3000/checkout`](http://localhost:3000/checkout) | Mobile Device | 10% Service + 15% VAT invoice breakdown, Telebirr/Chapa/Cash selection |
| **Live Order Tracker** | [`http://localhost:3000/order/01J8ORD100`](http://localhost:3000/order/01J8ORD100) | Mobile Device | Estimated wait time countdown, 4-step progress timeline, Call Waiter button |
| **Chef KDS** | [`http://localhost:3000/kds`](http://localhost:3000/kds) | Tablet Landscape / Monitor | Deep dark mode (`#121110`), **Table numbers on header**, glowing amber border on ORDER #123, live running timer (`Timer 12:03`), tactile `Bump` button |
| **Waiter Runner** | [`http://localhost:3000/waiter`](http://localhost:3000/waiter) | Mobile Device | Ready order cards with table badges, 1-tap Mark Delivered button |
| **Cashier Register** | [`http://localhost:3000/admin/cashier`](http://localhost:3000/admin/cashier) | Desktop / Tablet | Unpaid cash order cards, till total, Mark Cash Paid button |
| **Sales Analytics** | [`http://localhost:3000/admin/orders`](http://localhost:3000/admin/orders) | Desktop Widescreen | Revenue KPI cards, Best-sellers ranking, payment rail reconciliation |
| **Tables & QR Generator** | [`http://localhost:3000/admin/tables`](http://localhost:3000/admin/tables) | Desktop Widescreen | Table cards, token version bump, printable QR sheet modal |
| **Establishment Settings** | [`http://localhost:3000/admin/settings`](http://localhost:3000/admin/settings) | Desktop Widescreen | Table Service vs Counter Pickup mode tiles, tax sliders, payment toggles |

> **💡 Mobile Testing Tip:** In Google Chrome, press `F12` (or right-click → Inspect), click the **Toggle device toolbar** icon (`Ctrl+Shift+M` / `Cmd+Shift+M`), and select **iPhone 14 Pro** or **iPad Air** to test mobile and tablet layouts.

---

## 🎯 Architecture: Single Customizable App

MenuFlow is **ONE deployable application** that runs independently for a specific restaurant or cafe:

1. **Brand & Operations Config (`restaurant.config.json`):** Set restaurant name, logo, address, operating mode (full table service vs. fast-casual pickup counter), tax rates (10% Service, 15% VAT), and payment provider keys.
2. **Design Tokens (`theme.json`):** Set brand primary color, accent color, background surface, and typography.

---

## 🚀 Backend & Database Setup

### Launch PostgreSQL, Redis, and RabbitMQ

The example values are for isolated local development only. Copy the template
to an ignored root `.env` and replace the credentials before using shared
environments. The existing PostgreSQL and Redis named volumes are preserved.

```bash
docker compose --env-file services/backend/.env.example up -d
```

Apply the reviewed Atlas migration separately before starting the API; the
process never runs migrations automatically. See
[`docs/architecture/infrastructure.md`](docs/architecture/infrastructure.md)
for configuration, health checks, event delivery, and media storage details.

### Start the Go API

Load the local environment into the shell, then start the API:

```bash
set -a
. services/backend/.env.example
set +a
cd services/backend
go run ./cmd/api
```
The API listens at `http://localhost:8080`; `/healthz` is process liveness and
`/readyz` reports PostgreSQL and optional Redis status.

To start the worker process in another terminal:
```bash
cd services/backend
go run ./cmd/worker
```

Backend build, test, and vet commands:
```bash
cd services/backend
go test ./...
go vet ./...
go build ./cmd/api ./cmd/worker
```
