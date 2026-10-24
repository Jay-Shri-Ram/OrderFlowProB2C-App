/**
 * OrderFlow Pro — Cloud POS & Order Engine
 * Full-Stack React Client with Database Persistence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api';
import type { DatabaseState, Order, Customer, Product, ExceptionItem, CompanySettings } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { OrdersView } from './components/OrdersView';
import { DemandView } from './components/DemandView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { ExceptionsView } from './components/ExceptionsView';
import { SettingsView } from './components/SettingsView';
import { InvoiceModal } from './components/InvoiceModal';
import { exportToExcel } from './lib/utils';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [database, setDatabase] = useState<DatabaseState | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<Order | null>(null);

  // Theme & Palette State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') !== 'light';
  });
  const [currentPalette, setCurrentPalette] = useState<string>('indigo');

  // Load database on mount
  const loadDatabaseState = useCallback(async () => {
    try {
      const data = await api.getDatabase();
      setDatabase(data);
      if (data.settings?.themePalette) {
        setCurrentPalette(data.settings.themePalette);
        document.documentElement.setAttribute('data-palette', data.settings.themePalette);
      }
    } catch (err) {
      console.error('Failed to load database state from API:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseState();
  }, [loadDatabaseState]);

  // Handle Dark Mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Handle Palette Switch
  const handleSelectPalette = (palette: string) => {
    setCurrentPalette(palette);
    document.documentElement.setAttribute('data-palette', palette);
    if (database) {
      api.saveSettings({ themePalette: palette }).catch(console.error);
    }
  };

  // Quick New Order trigger
  const handleNewOrder = () => {
    setCurrentView('pos');
    setMobileMenuOpen(false);
  };

  // ================= ORDERS HANDLERS =================
  const handleSaveOrder = async (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>,
    printReceipt: boolean
  ): Promise<Order> => {
    const created = await api.createOrder(orderData);
    await loadDatabaseState();
    if (printReceipt) {
      setInvoiceModalOrder(created);
    }
    return created;
  };

  const handleUpdateOrderStatus = async (id: string, status: Order['orderStatus']) => {
    await api.updateOrder(id, { orderStatus: status });
    await loadDatabaseState();
  };

  const handleBulkUpdateOrderStatus = async (ids: string[], status: Order['orderStatus']) => {
    await api.bulkUpdateOrderStatus(ids, status);
    await loadDatabaseState();
  };

  const handleDeleteOrder = async (id: string, permanent = false) => {
    await api.deleteOrder(id, permanent);
    await loadDatabaseState();
  };

  const handleRestoreOrder = async (id: string) => {
    await api.restoreOrder(id);
    await loadDatabaseState();
  };

  const handleBulkDeleteOrders = async (ids: string[]) => {
    await api.bulkDeleteOrders(ids);
    await loadDatabaseState();
  };

  const handleDuplicateOrder = (order: Order) => {
    setCurrentView('pos');
    // POS will receive prefilled focus
  };

  const handlePrintBatchInvoices = (batchOrders: Order[]) => {
    if (batchOrders.length > 0) {
      setInvoiceModalOrder(batchOrders[0]);
    }
  };

  // ================= CUSTOMER HANDLERS =================
  const handleCreateCustomer = async (cust: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalSpend'>) => {
    const created = await api.createCustomer(cust);
    await loadDatabaseState();
    return created;
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    const updated = await api.updateCustomer(id, updates);
    await loadDatabaseState();
    return updated;
  };

  const handleDeleteCustomer = async (id: string) => {
    await api.deleteCustomer(id);
    await loadDatabaseState();
  };

  const handleBulkUpdateCustomerArea = async (ids: string[], area: string) => {
    await api.bulkUpdateCustomerArea(ids, area);
    await loadDatabaseState();
  };

  const handleBulkDeleteCustomers = async (ids: string[]) => {
    await api.bulkDeleteCustomers(ids);
    await loadDatabaseState();
  };

  // ================= PRODUCT HANDLERS =================
  const handleCreateProduct = async (prod: Omit<Product, 'id'>) => {
    const created = await api.createProduct(prod);
    await loadDatabaseState();
    return created;
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = await api.updateProduct(id, updates);
    await loadDatabaseState();
    return updated;
  };

  const handleDeleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    await loadDatabaseState();
  };

  const handleAddCategory = async (cat: string) => {
    await api.addCategory(cat);
    await loadDatabaseState();
  };

  const handleDeleteCategory = async (name: string) => {
    await api.deleteCategory(name);
    await loadDatabaseState();
  };

  // ================= EXCEPTION HANDLERS =================
  const handleCreateException = async (exc: Omit<ExceptionItem, 'id' | 'createdAt'>) => {
    const created = await api.createException(exc);
    await loadDatabaseState();
    return created;
  };

  const handleUpdateException = async (id: string, updates: Partial<ExceptionItem>) => {
    const updated = await api.updateException(id, updates);
    await loadDatabaseState();
    return updated;
  };

  const handleDeleteException = async (id: string) => {
    await api.deleteException(id);
    await loadDatabaseState();
  };

  // ================= SETTINGS & DATABASE HANDLERS =================
  const handleSaveSettings = async (partialSettings: Partial<CompanySettings>) => {
    const res = await api.saveSettings(partialSettings);
    if (res.settings?.themePalette) {
      setCurrentPalette(res.settings.themePalette);
      document.documentElement.setAttribute('data-palette', res.settings.themePalette);
    }
    await loadDatabaseState();
  };

  const handleExportDatabase = () => {
    if (!database) return;
    const jsonStr = JSON.stringify(database, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OrderFlow_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreDatabase = async (newState: DatabaseState) => {
    await api.restoreDatabase(newState);
    await loadDatabaseState();
  };

  const handleResetDatabase = async () => {
    await api.resetDatabase();
    await loadDatabaseState();
  };

  if (loading || !database) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <div className="font-bold text-sm tracking-wide">Connecting to OrderFlow Pro Database...</div>
      </div>
    );
  }

  // Pre-calculate badge counts
  const pendingOrdersCount = database.orders.filter(o => !o.isDeleted && o.orderStatus === 'Pending').length;
  const unresolvedExceptionsCount = database.exceptions.filter(e => e.status === 'Unresolved').length;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        settings={database.settings}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        currentPalette={currentPalette}
        onSelectPalette={handleSelectPalette}
        onNewOrder={handleNewOrder}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Desktop Sidebar and Mobile Bottom Bar */}
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          settings={database.settings}
          counts={{
            pendingOrders: pendingOrdersCount,
            unresolvedExceptions: unresolvedExceptionsCount,
          }}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={setMobileMenuOpen}
        />

        {/* View Content Port */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          {currentView === 'dashboard' && (
            <DashboardView
              orders={database.orders}
              customers={database.customers}
              products={database.products}
              settings={database.settings}
              onNavigate={setCurrentView}
              onSelectOrder={(order) => setInvoiceModalOrder(order)}
              onQuickStatusChange={handleUpdateOrderStatus}
            />
          )}

          {currentView === 'pos' && (
            <PosView
              products={database.products}
              categories={database.categories}
              customers={database.customers}
              settings={database.settings}
              areas={database.areas}
              onSaveOrder={handleSaveOrder}
              onCreateCustomer={handleCreateCustomer}
            />
          )}

          {currentView === 'orders' && (
            <OrdersView
              orders={database.orders}
              settings={database.settings}
              areas={database.areas}
              onUpdateStatus={handleUpdateOrderStatus}
              onBulkUpdateStatus={handleBulkUpdateOrderStatus}
              onBulkDelete={handleBulkDeleteOrders}
              onDeleteOrder={handleDeleteOrder}
              onRestoreOrder={handleRestoreOrder}
              onDuplicateOrder={handleDuplicateOrder}
              onPrintInvoice={(order) => setInvoiceModalOrder(order)}
              onPrintBatchInvoices={handlePrintBatchInvoices}
            />
          )}

          {currentView === 'demand' && (
            <DemandView
              orders={database.orders}
              settings={database.settings}
            />
          )}

          {currentView === 'customers' && (
            <CustomersView
              customers={database.customers}
              settings={database.settings}
              areas={database.areas}
              onCreateCustomer={handleCreateCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onBulkUpdateArea={handleBulkUpdateCustomerArea}
              onBulkDelete={handleBulkDeleteCustomers}
            />
          )}

          {currentView === 'products' && (
            <ProductsView
              products={database.products}
              categories={database.categories}
              commonUnits={database.commonUnits}
              settings={database.settings}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {currentView === 'exceptions' && (
            <ExceptionsView
              exceptions={database.exceptions}
              orders={database.orders}
              settings={database.settings}
              onCreateException={handleCreateException}
              onUpdateException={handleUpdateException}
              onDeleteException={handleDeleteException}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={database.settings}
              onSaveSettings={handleSaveSettings}
              onExportDatabase={handleExportDatabase}
              onRestoreDatabase={handleRestoreDatabase}
              onResetDatabase={handleResetDatabase}
              currentPalette={currentPalette}
              onSelectPalette={handleSelectPalette}
              recordCounts={{
                orders: database.orders.length,
                customers: database.customers.length,
                products: database.products.length,
                exceptions: database.exceptions.length,
              }}
            />
          )}
        </main>
      </div>

      {/* Invoice & Receipt Modal */}
      <InvoiceModal
        order={invoiceModalOrder}
        settings={database.settings}
        onClose={() => setInvoiceModalOrder(null)}
      />
    </div>
  );
}
