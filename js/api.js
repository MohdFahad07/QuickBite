/* ============================================================
   QuickBite API Bridge - MySQL Backend Client & Auth System
   ============================================================ */

const API_BASE = '/api';

const API = {
  // Token & User Store Helpers
  getToken() {
    return localStorage.getItem('quickbite_token');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('quickbite_user'));
    } catch (e) {
      return null;
    }
  },

  saveAuth(token, user) {
    if (token) localStorage.setItem('quickbite_token', token);
    if (user) localStorage.setItem('quickbite_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: user }));
  },

  logout() {
    localStorage.removeItem('quickbite_token');
    localStorage.removeItem('quickbite_user');
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: null }));
  },

  // Generic fetch wrapper
  async request(endpoint, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'API Request failed');
      }
      return resData;
    } catch (error) {
      console.warn(`[API Warning] Request to ${endpoint} failed:`, error.message);
      throw error;
    }
  },

  // Authentication API
  async sendOTP(signupData) {
    return await this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(signupData)
    });
  },

  async verifyOTPAndSignup(otpData) {
    const res = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(otpData)
    });
    if (res.token && res.user) {
      this.saveAuth(res.token, res.user);
    }
    return res;
  },

  async signup(signupData) {
    const res = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(signupData)
    });
    if (res.token && res.user) {
      this.saveAuth(res.token, res.user);
    }
    return res;
  },

  async login(loginData) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData)
    });
    if (res.token && res.user) {
      this.saveAuth(res.token, res.user);
    }
    return res;
  },

  async getMe() {
    const res = await this.request('/auth/me');
    if (res.user) {
      localStorage.setItem('quickbite_user', JSON.stringify(res.user));
    }
    return res.user;
  },

  async updateProfile(profileData) {
    const res = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (res.user) {
      localStorage.setItem('quickbite_user', JSON.stringify(res.user));
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: res.user }));
    }
    return res;
  },

  // Categories
  async getCategories() {
    const res = await this.request('/categories');
    return res.data;
  },

  async saveCategory(catData) {
    return await this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(catData)
    });
  },

  async deleteCategory(id) {
    return await this.request(`/categories/${id}`, {
      method: 'DELETE'
    });
  },

  // Users
  async getUsers() {
    const res = await this.request('/users');
    return res.data;
  },

  async deleteUser(id) {
    return await this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Menu Items
  async getMenu(category = 'all', search = '') {
    let query = `/menu?category=${encodeURIComponent(category)}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    const res = await this.request(query);
    return res.data;
  },

  async getMenuItem(id) {
    const res = await this.request(`/menu/${id}`);
    return res.data;
  },

  async createMenuItem(itemData) {
    const res = await this.request('/menu', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
    return res.data;
  },

  async updateMenuItem(id, itemData) {
    const res = await this.request(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
    return res.data;
  },

  async toggleStock(id, outOfStock) {
    const res = await this.request(`/menu/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ outOfStock })
    });
    return res.data;
  },

  async deleteMenuItem(id) {
    return await this.request(`/menu/${id}`, {
      method: 'DELETE'
    });
  },

  // Promo Codes
  async getPromos() {
    const res = await this.request('/promos');
    return res.data;
  },

  async validatePromo(code) {
    const res = await this.request('/promos/validate', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    return res.data;
  },

  async addPromo(code, discount_pct) {
    return await this.request('/promos', {
      method: 'POST',
      body: JSON.stringify({ code, discount_pct })
    });
  },

  async deletePromo(code) {
    return await this.request(`/promos/${code}`, {
      method: 'DELETE'
    });
  },

  // Orders
  async getOrders() {
    const res = await this.request('/orders');
    return res.data;
  },

  async createOrder(orderPayload) {
    const res = await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });
    return res.data;
  },

  async updateOrderStatus(id, status) {
    return await this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async deleteOrder(id) {
    return await this.request(`/orders/${id}`, {
      method: 'DELETE'
    });
  },

  // Admin Stats
  async getStats() {
    const res = await this.request('/stats');
    return res.data;
  }
};

window.API = API;
