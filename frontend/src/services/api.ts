const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data.data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getCurrentUser: () => request<any>('/auth/me'),

  // Dashboard
  getDashboardStats: () => request<any>('/dashboard/stats'),

  // Customers
  getCustomers: (params?: { page?: number; limit?: number; search?: string; status?: string; customerType?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.customerType) query.set('customerType', params.customerType);
    return request<any>(`/customers?${query.toString()}`);
  },

  getCustomerById: (id: string) => request<any>(`/customers/${id}`),

  createCustomer: (customerData: any) =>
    request<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    }),

  updateCustomer: (id: string, customerData: any) =>
    request<any>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    }),

  deleteCustomer: (id: string) =>
    request<any>(`/customers/${id}`, {
      method: 'DELETE',
    }),

  addCustomerNote: (id: string, note: string) =>
    request<any>(`/customers/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  // Products
  getProducts: (params?: { page?: number; limit?: number; search?: string; category?: string; lowStock?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.lowStock) query.set('lowStock', 'true');
    return request<any>(`/products?${query.toString()}`);
  },

  getProductById: (id: string) => request<any>(`/products/${id}`),

  createProduct: (productData: any) =>
    request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  updateProduct: (id: string, productData: any) =>
    request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),

  adjustStock: (id: string, data: { quantityChanged: number; movementType: 'IN' | 'OUT'; reason: string }) =>
    request<any>(`/products/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Inventory logs
  getStockLogs: (params?: { page?: number; limit?: number; search?: string; movementType?: string; productId?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.movementType) query.set('movementType', params.movementType);
    if (params?.productId) query.set('productId', params.productId);
    return request<any>(`/inventory/logs?${query.toString()}`);
  },

  // Challans
  getChallans: (params?: { page?: number; limit?: number; search?: string; status?: string; customerId?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.customerId) query.set('customerId', params.customerId);
    return request<any>(`/challans?${query.toString()}`);
  },

  getChallanById: (id: string) => request<any>(`/challans/${id}`),

  createChallan: (data: { customerId: string; status: 'DRAFT' | 'CONFIRMED'; items: { productId: string; quantity: number }[] }) =>
    request<any>('/challans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateChallanStatus: (id: string, status: 'CONFIRMED' | 'CANCELLED') =>
    request<any>(`/challans/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
