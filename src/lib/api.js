/**
 * Frontend API client with automatic CSRF token management and cookie credentials.
 */

let cachedCsrfToken = null;

/**
 * Fetch a fresh CSRF token from the server.
 * @returns {Promise<string>}
 */
export async function getCsrfToken() {
  try {
    const res = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch CSRF token: ${res.status}`);
    }

    const data = await res.json();
    cachedCsrfToken = data.csrfToken;
    return cachedCsrfToken;
  } catch (error) {
    console.error('[HisabKhata API] Error retrieving CSRF token:', error);
    throw error;
  }
}

/**
 * Fetch wrapper that attaches CSRF tokens to state-changing requests.
 * @param {string} url 
 * @param {RequestInit} options 
 * @returns {Promise<Response>}
 */
export async function fetchWithCsrf(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...options.headers };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!cachedCsrfToken) {
      await getCsrfToken();
    }
    if (cachedCsrfToken) {
      headers['X-CSRF-Token'] = cachedCsrfToken;
    }
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  // If CSRF token is invalid or expired, refresh token once and retry
  if (res.status === 403 && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const errorJson = await res.clone().json().catch(() => ({}));
    if (errorJson.message && errorJson.message.toLowerCase().includes('csrf')) {
      console.warn('[HisabKhata API] CSRF token expired or invalid; refreshing...');
      const newToken = await getCsrfToken();
      headers['X-CSRF-Token'] = newToken;
      return fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });
    }
  }

  return res;
}

/**
 * Register a new user account.
 */
export async function apiRegister(fullName, email, password) {
  const res = await fetchWithCsrf('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  if (data.csrfToken) {
    cachedCsrfToken = data.csrfToken;
  }
  return data;
}

/**
 * Log in to an existing account.
 */
export async function apiLogin(email, password) {
  const res = await fetchWithCsrf('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }
  if (data.csrfToken) {
    cachedCsrfToken = data.csrfToken;
  }
  return data;
}

/**
 * Log out of current session.
 */
export async function apiLogout() {
  const res = await fetchWithCsrf('/api/auth/logout', {
    method: 'POST'
  });

  const data = await res.json().catch(() => ({}));
  cachedCsrfToken = null;
  return data;
}

/**
 * Retrieve current authenticated session identity.
 */
export async function apiGetMe() {
  const res = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include'
  });

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to verify session: ${res.status}`);
  }

  const data = await res.json();
  return data.user;
}

/**
 * Fetch products list with optional search, category, and status filtering.
 */
export async function apiGetProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.status) query.set('status', params.status);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);

  const queryString = query.toString();
  const url = `/api/products${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch products: ${res.status}`);
  }

  return res.json();
}

/**
 * Get product details by ID.
 */
export async function apiGetProduct(id) {
  const res = await fetch(`/api/products/${id}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch product: ${res.status}`);
  }

  return res.json();
}

/**
 * Create a new product.
 */
export async function apiCreateProduct(productData) {
  const res = await fetchWithCsrf('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create product');
  }
  return data;
}

/**
 * Update an existing product.
 */
export async function apiUpdateProduct(id, productData) {
  const res = await fetchWithCsrf(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(productData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update product');
  }
  return data;
}

/**
 * Archive or restore a product.
 */
export async function apiArchiveProduct(id, isArchived) {
  const res = await fetchWithCsrf(`/api/products/${id}/archive`, {
    method: 'PATCH',
    body: typeof isArchived === 'boolean' ? JSON.stringify({ isArchived }) : undefined
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update product archive status');
  }
  return data;
}

// ==========================================
// Phase 04B: Customer API Functions
// ==========================================

/**
 * Fetch customer list for current owner.
 */
export async function apiGetCustomers(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortDir) query.append('sortDir', params.sortDir);

  const qs = query.toString();
  const res = await fetch(`/api/customers${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load customers');
  }

  return res.json();
}

/**
 * Fetch single customer details (including NID and notes).
 */
export async function apiGetCustomer(id) {
  const res = await fetch(`/api/customers/${id}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Customer not found');
  }

  return res.json();
}

/**
 * Create a new customer profile.
 */
export async function apiCreateCustomer(customerData) {
  const res = await fetchWithCsrf('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customerData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create customer');
  }
  return data;
}

/**
 * Update an existing customer profile.
 */
export async function apiUpdateCustomer(id, customerData) {
  const res = await fetchWithCsrf(`/api/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(customerData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update customer');
  }
  return data;
}

/**
 * Archive or restore a customer.
 */
export async function apiArchiveCustomer(id, isArchived) {
  const res = await fetchWithCsrf(`/api/customers/${id}/archive`, {
    method: 'PATCH',
    body: typeof isArchived === 'boolean' ? JSON.stringify({ isArchived }) : undefined
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update customer archive status');
  }
  return data;
}

// ==========================================
// Phase 05: Sales API Functions
// ==========================================

/**
 * Fetch sales history for current owner.
 */
export async function apiGetSales(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.customerId) query.append('customerId', params.customerId);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortDir) query.append('sortDir', params.sortDir);

  const qs = query.toString();
  const res = await fetch(`/api/sales${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load sales history');
  }

  return res.json();
}

/**
 * Fetch single sale details with line item snapshots.
 */
export async function apiGetSale(id) {
  const res = await fetch(`/api/sales/${id}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Sale record not found');
  }

  return res.json();
}

/**
 * Record a new sale with transaction-safe atomic stock deduction.
 */
export async function apiCreateSale(saleData) {
  const res = await fetchWithCsrf('/api/sales', {
    method: 'POST',
    body: JSON.stringify(saleData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to record sale');
  }
  return data;
}

// ==========================================
// Phase 06: Dues & Payment Ledger API Functions
// ==========================================

/**
 * Collect payment against a sale's outstanding due balance.
 */
export async function apiCollectPayment(saleId, paymentData) {
  const res = await fetchWithCsrf(`/api/sales/${saleId}/payments`, {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to process due payment');
  }
  return data;
}

/**
 * Fetch payment ledger history for a specific sale.
 */
export async function apiGetSalePayments(saleId) {
  const res = await fetch(`/api/sales/${saleId}/payments`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load sale payments');
  }

  return res.json();
}

/**
 * Fetch list of customers with positive outstanding dues.
 */
export async function apiGetDuesList(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortDir) query.append('sortDir', params.sortDir);

  const qs = query.toString();
  const res = await fetch(`/api/dues${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load outstanding dues');
  }

  return res.json();
}

/**
 * Fetch due summary statement for a customer (unpaid sales, payment ledger, totals).
 */
export async function apiGetCustomerDues(customerId) {
  const res = await fetch(`/api/customers/${customerId}/dues`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load customer due details');
  }

  return res.json();
}

/**
 * Fetch complete payment ledger for a customer.
 */
export async function apiGetCustomerPayments(customerId) {
  const res = await fetch(`/api/customers/${customerId}/payments`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load customer payments');
  }

  return res.json();
}

/**
 * Fetch overall due & collections summary.
 */
export async function apiGetDueSummary(params = {}) {
  const query = new URLSearchParams();
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const qs = query.toString();
  const res = await fetch(`/api/dues/summary${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load financial summary');
  }

  return res.json();
}



