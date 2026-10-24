import type { DatabaseState, Order, Customer, Product, ExceptionItem, CompanySettings } from '../types';

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Database & Health
  async getStatus() {
    return this.request<{ status: string; store: string; counts: any }>('/status');
  }

  async getDatabase(): Promise<DatabaseState> {
    return this.request<DatabaseState>('/database');
  }

  async resetDatabase(): Promise<{ success: boolean; state: DatabaseState }> {
    return this.request<{ success: boolean; state: DatabaseState }>('/database/reset', {
      method: 'POST',
    });
  }

  async restoreDatabase(state: DatabaseState): Promise<{ success: boolean; state: DatabaseState }> {
    return this.request<{ success: boolean; state: DatabaseState }>('/database/restore', {
      method: 'POST',
      body: JSON.stringify(state),
    });
  }

  // Settings & Company Profile
  async getSettings(): Promise<CompanySettings> {
    return this.request<CompanySettings>('/settings');
  }

  async saveSettings(settings: Partial<CompanySettings>): Promise<{ success: boolean; settings: CompanySettings }> {
    return this.request<{ success: boolean; settings: CompanySettings }>('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  // Orders
  async getOrders(includeDeleted = false): Promise<Order[]> {
    return this.request<Order[]>(`/orders?deleted=${includeDeleted}`);
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async createOrder(order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    return this.request<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteOrder(id: string, permanent = false): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/orders/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  }

  async restoreOrder(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/orders/${id}/restore`, {
      method: 'POST',
    });
  }

  async bulkUpdateOrderStatus(ids: string[], status: Order['orderStatus']): Promise<{ success: boolean; modified: number }> {
    return this.request<{ success: boolean; modified: number }>('/orders/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    });
  }

  async bulkDeleteOrders(ids: string[]): Promise<{ success: boolean; deleted: number }> {
    return this.request<{ success: boolean; deleted: number }>('/orders/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('/customers');
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalSpend'>): Promise<Customer> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCustomer(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkUpdateCustomerArea(ids: string[], area: string): Promise<{ success: boolean; modified: number }> {
    return this.request<{ success: boolean; modified: number }>('/customers/bulk-area', {
      method: 'POST',
      body: JSON.stringify({ ids, area }),
    });
  }

  async bulkDeleteCustomers(ids: string[]): Promise<{ success: boolean; deleted: number }> {
    return this.request<{ success: boolean; deleted: number }>('/customers/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // Products
  async getProducts(): Promise<{ products: Product[]; categories: string[]; commonUnits: string[] }> {
    return this.request<{ products: Product[]; categories: string[]; commonUnits: string[] }>('/products');
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async addCategory(category: string): Promise<string[]> {
    return this.request<string[]>('/products/categories', {
      method: 'POST',
      body: JSON.stringify({ category }),
    });
  }

  async deleteCategory(name: string): Promise<string[]> {
    return this.request<string[]>(`/products/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  // Exceptions
  async getExceptions(): Promise<ExceptionItem[]> {
    return this.request<ExceptionItem[]>('/exceptions');
  }

  async createException(item: Omit<ExceptionItem, 'id' | 'createdAt'>): Promise<ExceptionItem> {
    return this.request<ExceptionItem>('/exceptions', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateException(id: string, updates: Partial<ExceptionItem>): Promise<ExceptionItem> {
    return this.request<ExceptionItem>(`/exceptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteException(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/exceptions/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
