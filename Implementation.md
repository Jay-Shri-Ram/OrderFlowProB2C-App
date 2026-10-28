# Implementation & Changelog Guidebook

## OrderFlow Pro — Single-User Enterprise POS & Demand Management

This document records the design decisions, architectural modifications, and UI/UX improvements implemented across **OrderFlow Pro**.

---

### Table of Contents
1. [Overview & Architectural Strategy](#1-overview--architectural-strategy)
2. [Requirement 1: Customer Selection Placement](#2-requirement-1-customer-selection-placement)
3. [Requirement 2: Line Items Clean Toolbar & Category-Dependent Dropdown](#3-requirement-2-line-items-clean-toolbar--category-dependent-dropdown)
4. [Requirement 3: "Add New Order" Post-Save Workflow](#4-requirement-3-add-new-order-post-save-workflow)
5. [Requirement 4: Bill Payment Type & Method in Order Summary](#5-requirement-4-bill-payment-type--method-in-order-summary)
6. [Requirement 5: Location Filter in Order History](#6-requirement-5-location-filter-in-order-history)
7. [Requirement 6: Removal of 'Order' Action from Demand](#7-requirement-6-removal-of-order-action-from-demand)
8. [Requirement 7: Reset Filter on Demand Page](#8-requirement-7-reset-filter-on-demand-page)
9. [Requirement 8: Demand Customer Breakdown: Processed Checkbox & Invoice Deletion with Bill Deduction](#9-requirement-8-demand-customer-breakdown-processed-checkbox--invoice-deletion-with-bill-deduction)
10. [Requirement 9: In-App Firebase Connection Guidebook](#10-requirement-9-in-app-firebase-connection-guidebook)
11. [Bug Fixes & Hardening Log](#11-bug-fixes--hardening-log)

---

### 1. Overview & Architectural Strategy
OrderFlow Pro operates on a **Local-First, High-Performance architecture**:
- **Client Storage**: Dexie IndexedDB maintains customer master, product catalog, inventory levels, order records, soft-deleted recycle bin, and audit trails locally for millisecond response times.
- **Single-User Data Isolation**: Transited from multi-tenant shared models to an owner-isolated single-user store model where each session syncs its own data without cross-tenant pollution.
- **Real-Time Cloud Synchronization**: Optional Google Firebase Cloud Firestore and Authentication integration syncs orders and catalog live across multiple devices and cash counters.

---

### 2. Requirement 1: Customer Selection Placement
- **Location**: `#view-order` (New Order POS Screen).
- **Change**: The customer selection card (`#custCard`, `#areaFilter`, and `#custSearch`) was moved to be positioned **directly above** the product selection and line items section.
- **UX & Hierarchy**:
  - Setting customer first establishes billing context (`shop`, `name`, `phone`, `area`, `address`).
  - Elevated z-index (`relative z-30` for customer card, with `z-50` for `#custDrop`) prevents the customer search dropdown from clipping behind line items or table headers.

---

### 3. Requirement 2: Line Items Clean Toolbar & Category-Dependent Dropdown
- **Location**: `#view-order` (Line Items Card).
- **Changes**:
  1. **Duplicate Reset Button Removed**: Removed the redundant text "Reset" button in the Line Items card header, leaving the category reset icon button (`<i class="fa-solid fa-rotate-left"></i>`) adjacent to the category dropdown.
  2. **Category-Dependent Dropdown**:
     - Selecting a category from `#catSelect` locks `S.catLock` and immediately restricts the product search autocomplete `#prodSearch` and its popover dropdown to items in that specific category.
     - Selecting "All Categories" or clicking the reset button unlocks the category and searches across the entire catalog.
     - Typing in `#prodSearch` remains fully functional, allowing search by item name or category code.
     - Resetting category no longer clears the customer selection.

---

### 4. Requirement 3: "Add New Order" Post-Save Workflow
- **Location**: `OrderUI.save()` modal.
- **Change**: When an order is saved, the confirmation dialog now features a prominent **"Add New Order"** button (`<button class="btn btn-accent"><i class="fa-solid fa-plus"></i> Add New Order</button>`) alongside the existing **Invoice**, **Share (WhatsApp)**, and **History** actions.
- **Workflow**:
  - Clicking **Add New Order** closes the modal, clears the current cart and customer, requests the next sequential order ID (`OrderUI.rollId()`), and keeps the user in the order entry view ready for the next customer.

---

### 5. Requirement 4: Bill Payment Type & Method in Order Summary
- **Location**: `#view-order` (Order Summary sidebar), `Invoice` engine (A4, Thermal, Text, PDF), and Order History.
- **Changes**:
  1. **Payment Type Selector (`#sumPayType`)**:
     - `Cash / Paid` (value: `cash`)
     - `Credit / Unpaid` (value: `credit`)
  2. **Payment Method Sub-options (`#sumPayMethod`)**:
     - Dynamically displayed whenever `Payment Type` is set to `Cash / Paid`.
     - Sub-options:
       - `Cash in Hand`
       - `UPI / QR Code`
       - `Bank Transfer / NEFT / IMPS`
       - `Cheque`
  3. **Order Storage & Invoicing**:
     - `paymentType` and `paymentMethod` are saved to the order object in IndexedDB and synchronized to the cloud.
     - Both A4 Tax Invoices, 80mm Thermal receipts, WhatsApp message text, and downloaded PDFs display the payment status (e.g., `Paid (UPI)` or `Credit / Unpaid`).
     - Order History table renders a color-coded payment badge under the total amount.

---

### 6. Requirement 5: Location Filter in Order History
- **Location**: `#view-orders` (Order History toolbar).
- **Changes**:
  - Added `#orderAreaFilter` dropdown in the toolbar alongside the search, status filter, and date range inputs.
  - Dynamically populated with all unique locations/areas extracted from customers (`S.customers`) and historical orders (`S.orders`).
  - Filtering orders by selected location immediately updates the orders table, total order count, and revenue summation.
  - Reset filters (`Orders.resetFilters()`) clears the location filter along with status, search, and dates.

---

### 7. Requirement 6: Removal of 'Order' Action from Demand
- **Location**: `#view-demand` (Demand View).
- **Changes**:
  1. Removed the top toolbar button `<button onclick="Demand.orderFiltered()">Order</button>`.
  2. Removed the individual row action button `<button onclick="Demand.orderItem(...)">Order</button>`.
  3. Demand summary now functions cleanly as an aggregated dispatch and fulfillment dashboard with the dedicated **Customers** breakdown modal.

---

### 8. Requirement 7: Reset Filter on Demand Page
- **Location**: `#view-demand` (Demand toolbar).
- **Change**: Added `<button class="btn btn-ghost btn-sm" onclick="Demand.resetFilters()"><i class="fa-solid fa-rotate-left mr-1"></i> Reset</button>`.
- **Behavior**:
  - Clears product search query (`#demandSearch`).
  - Clears category filter (`#demandCat`).
  - Clears area / location filter (`#demandArea`).
  - Clears customer filter (`#demandCust`).
  - Automatically re-aggregates and re-renders open demand across all pending and in-process orders.

---

### 9. Requirement 8: Demand Customer Breakdown: Processed Checkbox & Invoice Deletion with Bill Deduction
- **Location**: `Demand.who(productName)` modal.
- **Features**:
  1. **Processed Status Checkbox**:
     - Each customer ordering the item displays a checkbox with a status indicator (`Processed` / `Pending`).
     - Toggling the checkbox updates the line item's `processed` flag on that customer's order in Dexie IndexedDB and cloud sync.
     - Completed/processed rows display visual feedback (strikethrough styling and subtle emerald background).
  2. **Delete Line Item from Invoice**:
     - Added a **Delete** action button per customer item row.
     - Clicking prompt asks for user confirmation displaying the exact item quantity, unit, shop name, and monetary amount that will be deducted.
     - When confirmed:
       - The line item is removed from the customer's order.
       - Subtotal, tax, and grand total of the customer's invoice are automatically recalculated.
       - The updated order is saved to IndexedDB and pushed to the cloud.
       - An entry is logged into the Super Admin audit trail.
       - If other orders still contain the demand item, the modal is refreshed in-place; if no demand remains, the modal closes and confirms that all demand has been dispatched or resolved.

---

### 10. Requirement 9: In-App Firebase Connection Guidebook
- **Location**:
  - Super Admin Console (`#view-admin` &rarr; `Firebase Connection Guidebook` card).
  - Modal Guidebook (`Admin.firebaseGuide()` and `Admin.showFirebaseRules()`).
  - Quick access from **Settings &rarr; Cloud Sync**.
- **Guidebook Content**:
  1. **Step 1: Create Firebase Project**: Navigate to `console.firebase.google.com` and register a new project.
  2. **Step 2: Enable Auth**: Enable the **Email/Password** provider under Authentication &rarr; Sign-in method. Add authorized domain.
  3. **Step 3: Provision Firestore**: Create Cloud Firestore Database in Native mode.
  4. **Step 4: Get Web Config JSON**: Add Web App (`</>`) in Project Settings, copy the `firebaseConfig` object snippet.
  5. **Step 5: Connect & Authenticate**: Paste JSON into Settings &rarr; Cloud Sync, connect, and sign in.
  6. **Firestore Security Rules**: Includes copyable security rules tailored for authenticated single-user store management:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /tenants/{tenantId}/{document=**} {
           allow read, write: if request.auth != null;
         }
         match /{document=**} {
           allow read, write: if request.auth != null;
         }
       }
     }
     ```

---

### 11. Bug Fixes & Hardening Log
1. **Fixed `Orders.view` TypeError**:
   - In `Demand.openOrder(oid)`, `Orders.view(oid)` was called, but the method was named `Orders.detail(id)`.
   - Updated `Demand.openOrder(oid)` to look up order by `oid` and invoke `Orders.detail(order.id)`.
2. **Fixed Duplicate HTML Markup in `#view-demand`**:
   - Cleaned up duplicate table and section tags in the Demand HTML layout.
3. **Fixed Customer Dropdown Z-Index Clashing**:
   - Enhanced `#custDrop` to `z-50` and wrapped `#custCard` in `relative z-30` so customer suggestions always hover cleanly above the product line items section.
4. **Cleaned Category Unlock Logic**:
   - `OrderUI.unlock()` now resets category selection without wiping out the currently selected customer.
