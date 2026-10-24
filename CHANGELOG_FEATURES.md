# OrderFlow Pro - Features & Architectural Updates

This document outlines all feature enhancements, bug fixes, UI adjustments, and architecture transitions implemented in OrderFlow Pro.

---

## 1. Dashboard "Today's Orders" Date Filter
- **What was changed**:
  - Added an interactive date picker (`<input type="date" id="dashOrderDate">`) and reset button inside the "Today's Orders" dashboard KPI card.
  - Users can select any custom date to inspect orders placed on that specific day, or click the reset button to return to today's date.
  - The KPI card header dynamically updates its label: `"Today's Orders"` when today is active, or `"Orders (YYYY-MM-DD)"` when filtering by a specific historical date.
  - The "Recent Orders" list and statistics dynamically reflect the selected date.

---

## 2. Customer Dropdown & Line Items Stacking Fix
- **What was changed**:
  - Reorganized the New Order view (`#view-order`) DOM hierarchy so the **Line Items** card is placed cleanly *above* the **Select Customer** card.
  - Positioned the Line Items card with `relative z-20` and the Customer card with `relative z-10`.
  - Added an outside-click listener (`document.addEventListener('click', ...)`) that automatically dismisses the `#custDrop` dropdown whenever a user clicks outside or focuses on cart items.
  - Line items, quantity inputs, unit selectors, and total calculations remain completely visible and interactive without being obscured by the customer dropdown.

---

## 3. Category Select Dropdown & Newest-to-Oldest Line Items
- **What was changed**:
  - Replaced the horizontal button-chip category row with an accessible `<select id="catSelect">` dropdown with clean styling and reset button.
  - Selecting any category instantly filters product suggestions and locks the order view to that category.
  - When products or custom items are added to the order cart (`S.cart`), they are inserted at the beginning using `unshift` instead of `push`.
  - Rendered cart rows are sorted with the newest added item on top and oldest at the bottom.

---

## 4. Order History Filtered Export (Excel & PDF)
- **What was changed**:
  - Added two dedicated export action buttons in the Order History toolbar:
    - **Excel (`.xlsx`)**: Generates a two-sheet workbook (`Orders Summary` and `Order Line Items`) containing precisely the filtered subset of orders.
    - **PDF (`.pdf`)**: Generates an A4 landscape report table with order IDs, dates, customer/shop info, phone numbers, quantities, status, and grand totals, including aggregated summary footers.
  - Both export methods query the active filter pipeline (`Orders.filtered()`), ensuring date range, status, and keyword search filters are honored identically.

---

## 5. PDF Number Formatting & Encoding Fix
- **What was changed**:
  - Standard fonts in `jsPDF` (Helvetica and Courier) only support WinAnsi / Latin-1 encoding. Embedding the raw Unicode Indian Rupee symbol (`₹` / `\u20B9`) resulted in corrupted character sequences like `â‚¹` and mangled numbers.
  - Created standardized PDF helper functions:
    - `pdfMoney(amount)`: Formats amounts using clean ASCII `Rs. ` (e.g., `Rs. 1,450.00`).
    - `pdfNum(val, dec)`: Ensures numbers are parsed cleanly with standard grouping.
  - Updated all PDF generator routines (A4 Invoices, Thermal Receipts, Demand Summary, Dispatch Sheets, Filtered Orders Report) to use `pdfMoney()`. All numbers and currency amounts now render legibly.

---

## 6. Demand Section: Location & Customer Filtering + "Order" Action
- **What was changed**:
  - Added a **Location / Area** dropdown filter (`#demandArea`) populated with distinct customer and order areas.
  - Added a **Customer / Shop** search input (`#demandCust`).
  - Updated `Demand.agg()` aggregation logic to filter open demand (Pending + In Process) by both area and customer.
  - Added a header **"Order" button** (`Demand.orderFiltered()`):
    - Reads the active filters in Demand.
    - Collects all filtered items with their open demand quantities and default rates.
    - Populates them directly into the Order cart (`S.cart`).
    - Automatically links the matching customer if a customer filter was typed.
    - Navigates immediately to the Order screen with a confirmation notification.
  - Added individual row **"Order"** buttons alongside the "Who" customer drill-down button for single-item ordering.
  - Added `Demand.openOrder(oid)` to open the order details directly from the "Who Ordered" modal.

---

## 7. Product Import Fix & Excel Import Template
- **What was changed**:
  - **Fixed Import Validator**: Previously, `Import.products` strictly rejected items if their category or unit did not match pre-seeded values in `S.categories` or `S.units`, forcing records into `Exceptions`.
  - **Auto-Provisioning**: The importer now auto-detects and creates missing categories and units on the fly, dynamically saving them to the database.
  - **Flexible Column Headers**: Supports case-insensitive and alternative headers (e.g., `Product Name`, `Product`, `Name`, `Rate`, `Price`, `Stock`, `Qty`, `Unit`, `Category`).
  - **Excel Template Button**: Added a **Template** button (`Export.productTemplate()`) in the Products section that generates `product-import-template.xlsx` with sample rows, proper data types, and column headers.

---

## 8. Single-User Architecture & Data Isolation Model
- **What was changed**:
  - **Per-User File Storage**: Transitioned backend persistence (`server.ts`) to store data in `/data/users/<sanitized_email>.json` keyed by user identity.
  - **Single-User Scope**:
    - The client passes the active user email via the `x-user-email` HTTP header and `?user=` query parameter on `/api/sync` and `/api/database`.
    - Only the logged-in user's data is loaded upon sign-in or page load.
    - Local browser storage (IndexedDB) is cleared and re-hydrated from that user's private database snapshot when switching accounts.
    - Logging out purges local tables to ensure privacy between different users on shared devices.
  - **Single-User UI & Settings**:
    - Company details (name, shop address, phone, GSTIN, UPI ID, invoice logo) are saved and persisted directly with the user's isolated settings record.

---

## 9. Bug Fixes & Stability
- **What was changed**:
  - **`UI.closeModal()` Null-Safety**: Fixed `TypeError: Cannot read properties of undefined (reading 'closest')`. `UI.closeModal(el)` now gracefully detects when `el` is undefined and defaults to removing the topmost modal backdrop (`.mask:last-child` / `.mask`), allowing programmatic closures like `Demand.openOrder(oid)`.
  - **Router Delegation & Compatibility**: Fixed `ReferenceError: App is not defined` when triggering `Demand.orderFiltered()` or individual demand item `Demand.orderItem()`. Replaced direct references with `Nav.go('order')` and installed a global fallback bridge (`window.App = { go: (id) => Nav.go(id) }`).

