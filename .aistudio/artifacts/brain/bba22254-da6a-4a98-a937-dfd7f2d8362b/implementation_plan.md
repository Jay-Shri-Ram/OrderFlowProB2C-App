# OrderFlow Pro — Cloud POS & Order Engine (Full Database Persistence)

A high-performance, full-stack POS and order management engine modeled after OrderFlow Pro, featuring complete database persistence for all business data (orders, customers, products, company profile, and company logo), responsive mobile and desktop layouts, kitchen demand aggregation, and invoice printing.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Database Persistence Requirement (Confirmed by User)**:
> All application data must be comprehensively saved in the database:
> - **Orders Data**: Every order created, status change (`Pending`, `In Progress`, `Complete`, `Cancelled`), line item, discount, tax, payment record, and soft-deleted/recycled status.
> - **Customer Data**: Full CRM records including customer name, shop name, contact number, delivery area, street address, order statistics, and customer notes.
> - **Product Catalog & Inventory**: Products, item categories, multi-unit variations and conversion ratios, selling rates, purchase costs, inventory stock levels, and active status.
> - **Company Profile & Branding**: Company name, phone, email, physical address, tax registration (GSTIN / VAT ID), currency symbol, default tax rate, custom invoice footer/terms, **and company logo** (with live image upload, preview, and persistence).
> - **Operational & Security Entities**: Discrepancy exceptions, system audit logs, and manager security PIN.

- **Confirmed Decision 1**: Express server backend (`server.ts`) will maintain an atomic database storage layer (`/data/database.json`) with automated auto-save, REST CRUD endpoints for every resource, file backup/restore capabilities, and instant API responses.
- **Confirmed Decision 2**: Company logo will support direct client file upload (with base64 conversion and persistent storage in the company settings record), appearing dynamically across the top brand navigation, A4 tax invoices, and thermal receipt slips.
- **Confirmed Decision 3**: Responsive layout contract: desktop viewports ($\ge 1024$px) feature a collapsible sidebar with live metrics and store status; mobile viewports ($< 1024$px) utilize an ergonomic bottom tab bar (`Dashboard`, `POS`, `Orders`, `Customers`, `More`) with $44\text{px}+$ touch hitboxes and sheet drawers.

---

## 1. Overview & Core Concept

- **What It Does**: OrderFlow Pro is an all-in-one Point-of-Sale (POS) and order lifecycle management platform. It allows single-store and multi-outlet merchants to process sales, manage customer balances, aggregate kitchen and warehouse dispatch requirements, log fulfillment exceptions, and print thermal/A4 invoices with UPI QR payment codes.
- **Target Audience & Persona**: Retail cashiers, store owners, delivery managers, kitchen expediters, and warehouse packagers.
- **Key Value**: Guarantees zero data loss with full database persistence across server restarts and device switches, paired with instant offline resilience and high-speed order entry.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **POS Rapid Terminal**:
   - Cashier selects or quickly adds a customer (with auto-filled phone, area, and address).
   - Selects items from category tabs or searches by name/code; selects pack size / unit (e.g., kg, box, pack).
   - Dynamic cart calculates subtotal, discounts, tax rates, and delivery charges in real time.
   - Payment method selection (Cash, UPI QR, Card, Pay Later).
   - "Save & Print" commits the transaction to the database and launches receipt modal.
2. **Order Management & Bulk Processing**:
   - Filter orders by status, date range, area, or customer.
   - Check multiple rows for floating batch actions: bulk status update, batch print, or move to Recycle Bin.
   - Slide-over order inspector with line-item breakdown, edit, and duplicate features.
3. **Company Profile & Logo Customization**:
   - In Settings, store owner updates company name, contact info, tax registration, and uploads their company logo.
   - Logo renders instantly on the POS header, desktop sidebar, thermal receipts, and formal A4 invoices.
4. **Kitchen & Warehouse Demand Aggregation**:
   - Aggregates all pending/processing orders into total production quantities by product and unit.
   - "Who Ordered This" drawer displays which customer/shop requested each line item.
   - Export to Excel (.xlsx) and CSV with one click.
5. **Customer CRM & Product Catalog**:
   - Searchable, sortable tables with full CRUD modals.
   - Bulk area assignment, Excel customer import/export with downloadable template.
   - Multi-unit product management with price tiers and inventory stock counters.

### Visual Identity & Theme
- **Color Palettes**: 8 switchable color themes (Indigo, Emerald, Ocean, Rose, Amber, Violet, Teal, Slate) powered by CSS variables (`--acc-rgb`, `--acc2-rgb`).
- **Dark & Light Mode**: Seamless 1-click theme toggle with persistent preference.
- **Typography & Precision**:
  - Primary UI: `Plus Jakarta Sans` / `Inter` system sans.
  - Telemetry, Currency & Order IDs: Strict monospace tabular figures (`JetBrains Mono`, `tabular-nums`).
  - Zero-Pill Discipline: Unboxed metadata with middle dot (`·`) dividers.

---

## 3. Database Persistence & Architecture Strategy

### Backend REST API Endpoints (`server.ts`)
- **Orders**:
  - `GET /api/orders` (list all orders with search & status filters)
  - `POST /api/orders` (create new order, increments sequence ID)
  - `PUT /api/orders/:id` (update order details, status, or recycle flag)
  - `DELETE /api/orders/:id` (delete or purge from recycle bin)
- **Customers**:
  - `GET /api/customers` (list all customers)
  - `POST /api/customers` (add new customer)
  - `PUT /api/customers/:id` (update customer profile)
  - `DELETE /api/customers/:id` (delete customer)
  - `POST /api/customers/bulk-area` (batch assign delivery area)
- **Products**:
  - `GET /api/products` (list catalog items, categories, and units)
  - `POST /api/products` (create new product with multi-unit tiers)
  - `PUT /api/products/:id` (update rate, stock, or units)
  - `DELETE /api/products/:id` (delete product)
- **Settings & Company Profile**:
  - `GET /api/settings` (fetch company info, logo, tax rules, and security PIN)
  - `POST /api/settings` (persist company profile, contact details, and uploaded logo)
- **Exceptions**:
  - `GET /api/exceptions` (fetch logged order discrepancies)
  - `POST /api/exceptions` (log new exception)
  - `PUT /api/exceptions/:id` (resolve / approve exception)
- **Backup & Restore**:
  - `GET /api/database/backup` (export full database as JSON)
  - `POST /api/database/restore` (import and replace database state)
  - `POST /api/database/reset-demo` (reseed default sample store)

### Database Storage Model (`/data/database.json`)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OrderFlow Pro Database                          │
│                                                                        │
│  ┌───────────────────────┐  ┌──────────────────────────────────────┐   │
│  │ Company & Branding    │  │ Orders Collection                    │   │
│  │ • Store Name & Email  │  │ • Order No & Sequence ID             │   │
│  │ • Phone & Address     │  │ • Customer ID & Area                 │   │
│  │ • Tax ID (GST/VAT)    │  │ • Line Items (Units, Rates, Qty)     │   │
│  │ • Base64 Company Logo │  │ • Subtotal, Tax, Discount, Total     │   │
│  │ • Currency & Tax Rate │  │ • Status (Pending, Complete, etc.)   │   │
│  │ • Admin PIN & Palette │  │ • Deleted / Recycle Bin Flag         │   │
│  └───────────────────────┘  └──────────────────────────────────────┘   │
│  ┌───────────────────────┐  ┌──────────────────────────────────────┐   │
│  │ Customer CRM Store    │  │ Product & Inventory Catalog          │   │
│  │ • Name & Shop Name    │  │ • Name, Category, Base Unit          │   │
│  │ • Phone & Area        │  │ • Multi-Unit Conversion Tiers        │   │
│  │ • Address & Notes     │  │ • Selling Rate & Stock Count         │   │
│  │ • Total Spend & Count │  │ • Active Status                      │   │
│  └───────────────────────┘  └──────────────────────────────────────┘   │
│  ┌───────────────────────┐  ┌──────────────────────────────────────┐   │
│  │ Exceptions Ledger     │  │ Categories & Units Lookup            │   │
│  │ • Order ID & Issue    │  │ • Product Categories                 │   │
│  │ • Discrepancy Status  │  │ • Unit Definitions (kg, box, pcs)    │   │
│  └───────────────────────┘  └──────────────────────────────────────┘   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Atomic JSON File Sync
                                   ▼
                        [/data/database.json]
```

---

## 4. Execution Stages

1. **Backend Database Engine (`server.ts` & Seed Script)**:
   - Create Express server mounted with Vite middleware for dev execution (`tsx server.ts`).
   - Implement file-backed atomic database storage at `/data/database.json`.
   - Seed rich, production-grade initial dataset: 12 orders across statuses, 8 customers with delivery areas, 16 multi-unit products across categories (Groceries, Dairy, Bakery, Beverages), initial company branding & logo placeholder, and exceptions.
   - Expose complete REST endpoints for orders, customers, products, company settings (with logo), and exceptions.
2. **Frontend Database Client & State Layer**:
   - Construct typed API service layer with automated retry and optimistic UI updates.
   - Synchronize live state across all components whenever an entity is created, edited, or deleted.
3. **Company Profile & Logo Manager**:
   - Build company profile settings editor with live file upload for store logo.
   - Render the custom logo across top navigation, sidebar, printable thermal slips, and A4 invoice formats.
4. **All Functional Views**:
   - **Dashboard**: Revenue, order count, top products, area distribution, and recent orders.
   - **POS Terminal**: Live sequence ID, customer selector, category pills, product grid with unit dropdowns, cart calculator, payment method selector, and invoice modal.
   - **Order Engine**: Search, status tabs, date filters, bulk status/print/recycle actions, and order details drawer.
   - **Kitchen Demand**: Grouped production totals by product and unit, "Who Ordered" customer breakdown, and Excel/CSV export.
   - **Customer CRM**: Table, modal CRUD, area reassignment, and Excel import/export.
   - **Product Catalog**: Add/edit items with multi-unit rates, category manager, and stock adjustment.
   - **Exceptions Ledger**: Discrepancy tracking, approval, and resolution.
   - **Invoice & Thermal Printing**: 80mm/58mm thermal receipt and A4 tax invoice with dynamic UPI QR code and WhatsApp share.
5. **Mobile & Desktop Responsive Polish**:
   - Verify desktop full-width sidebar view ($\ge 1024$px) and compact mobile bottom tab bar ($< 1024$px).
   - Ensure all touch targets $\ge 44$px and sticky elements $\le 15\%$ mobile height.
   - Run `compile_applet` to verify clean build and type safety.
