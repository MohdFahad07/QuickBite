// ==========================================
// QuickBite - Admin Dashboard Logic (Master Version)
// Developer: Mohd Fahad
// ==========================================

let activeOrderFilter = 'all';
let orderSearchQuery = '';
let menuSearchQuery = '';
let menuCategoryFilter = 'all';

let adminOrdersPage = 1;
let adminOrdersPerPage = 6;
let adminMenuPage = 1;
let adminMenuPerPage = 8;

function changeAdminOrdersPage(p) {
  adminOrdersPage = p;
  renderOrdersTab();
}

function changeAdminOrdersPerPage(sz) {
  adminOrdersPerPage = parseInt(sz) || 6;
  adminOrdersPage = 1;
  renderOrdersTab();
}

function changeAdminMenuPage(p) {
  adminMenuPage = p;
  renderMenuTab();
}

function changeAdminMenuPerPage(sz) {
  adminMenuPerPage = parseInt(sz) || 8;
  adminMenuPage = 1;
  renderMenuTab();
}

function checkAdminAccessGuard() {
  const user = window.API ? window.API.getUser() : null;
  const adminSection = document.querySelector('.admin-section');

  if (!user || user.role !== 'admin') {
    if (adminSection) {
      adminSection.innerHTML = `
        <div class="container">
          <div class="admin-access-locked">
            <div class="lock-icon-box">
              <i class="fas fa-lock"></i>
            </div>
            <h2>Admin Access Required</h2>
            <p>You must log in with <strong>Administrator Credentials</strong> to access the QuickBite Management Dashboard.</p>
            <p style="font-size:14px;color:#cbd5e1;background:rgba(255,107,53,0.12);padding:12px 20px;border-radius:12px;border:1px dashed rgba(255,107,53,0.4);display:inline-block;margin:14px 0 20px;">🔑 Master Admin ID: <strong style="color:var(--primary);">admin123</strong> &nbsp;|&nbsp; Password: <strong style="color:var(--primary);">admin@123</strong></p>
            <br>
            <button class="btn-primary-admin-login" onclick="openAuthModal('login')">
              <i class="fas fa-right-to-bracket"></i> Login to Admin Panel
            </button>
          </div>
        </div>
      `;
    }
    return false;
  }
  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAdminAccessGuard()) return;

  renderStats();
  renderOrdersTab();

  // Modal overlay click listeners
  const itemModal = document.getElementById('itemModal');
  const promoModal = document.getElementById('promoModal');
  const adminOrderModal = document.getElementById('adminOrderModal');

  if (itemModal) {
    itemModal.addEventListener('click', function(e) {
      if (e.target === this) closeItemModal();
    });
  }
  if (promoModal) {
    promoModal.addEventListener('click', function(e) {
      if (e.target === this) closePromoModal();
    });
  }
  if (adminOrderModal) {
    adminOrderModal.addEventListener('click', function(e) {
      if (e.target === this) closeAdminOrderModal();
    });
  }
});

window.addEventListener('authStateChanged', () => {
  const user = window.API ? window.API.getUser() : null;
  if (user && user.role === 'admin') {
    location.reload();
  } else {
    checkAdminAccessGuard();
  }
});

// Helper for FSSAI Diet Tag SVGs
function getDietSVG(isVeg) {
  if (isVeg) {
    return `
      <span class="diet-tag-svg veg" title="Vegetarian">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="3" stroke="#22c55e" stroke-width="2.5" fill="none"/>
          <circle cx="12" cy="12" r="6" fill="#22c55e"/>
        </svg>
        <span>Veg</span>
      </span>
    `;
  } else {
    return `
      <span class="diet-tag-svg non-veg" title="Non-Vegetarian">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="3" stroke="#ef4444" stroke-width="2.5" fill="none"/>
          <polygon points="12,5 19,18 5,18" fill="#ef4444"/>
        </svg>
        <span>Non-Veg</span>
      </span>
    `;
  }
}

// ---- Render KPI Stats (from live API) ----
async function renderStats() {
  let statsData = { totalOrders: 0, totalRevenue: 0, totalMenu: 0, outOfStock: 0 };
  if (window.API) {
    try {
      statsData = await window.API.getStats();
    } catch (e) {
      console.warn('Stats API failed, falling back to local:', e.message);
      const orders = getOrders();
      statsData = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((s, o) => s + (o.total || 0), 0),
        totalMenu: MENU_ITEMS.length,
        outOfStock: MENU_ITEMS.filter(i => i.outOfStock).length
      };
    }
  }

  const { totalOrders, totalRevenue, totalMenu } = statsData;
  const activeOrders = getOrders().filter(o => o.status !== 'Delivered').length;
  const promos = getStoredPromos();

  const stats = [
    {
      svgIcon: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      `,
      label: 'Total Orders',
      value: totalOrders,
      subtext: `${activeOrders} Active Deliveries`,
      color: 'rgba(255, 107, 53, 0.15)',
      iconColor: '#ff6b35'
    },
    {
      svgIcon: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      `,
      label: 'Total Revenue',
      value: `₹${Number(totalRevenue).toLocaleString('en-IN')}`,
      subtext: totalOrders ? `Avg ₹${Math.round(totalRevenue / totalOrders)} / order` : '₹0 average',
      color: 'rgba(34, 197, 94, 0.15)',
      iconColor: '#22c55e'
    },
    {
      svgIcon: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          <line x1="6" y1="1" x2="6" y2="4"></line>
          <line x1="10" y1="1" x2="10" y2="4"></line>
          <line x1="14" y1="1" x2="14" y2="4"></line>
        </svg>
      `,
      label: 'Menu Items',
      value: totalMenu || MENU_ITEMS.length,
      subtext: `${MENU_ITEMS.filter(i => i.isVeg || i.veg).length} Veg | ${MENU_ITEMS.filter(i => !i.isVeg && !i.veg).length} Non-Veg`,
      color: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#3b82f6'
    },
    {
      svgIcon: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="15" x2="15.01" y2="15"></line>
          <line x1="15" y1="9" x2="9" y2="15"></line>
        </svg>
      `,
      label: 'Active Promo Codes',
      value: Object.keys(promos).length,
      subtext: 'Max discount 50% OFF',
      color: 'rgba(245, 158, 11, 0.15)',
      iconColor: '#f59e0b'
    }
  ];

  const grid = document.getElementById('statsGrid');
  if (grid) {
    grid.innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:${s.color};color:${s.iconColor};">${s.svgIcon}</div>
          <span class="stat-growth-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            Live Sync
          </span>
        </div>
        <div class="stat-card-value">${s.value}</div>
        <div class="stat-card-label">${s.label}</div>
        <div class="stat-card-subtext">${s.subtext}</div>
      </div>
    `).join('');
  }
}

// ---- Switch Tabs ----
function switchTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById(`tab-${tab}`);
  if (panel) panel.style.display = 'block';

  if (tab === 'orders') renderOrdersTab();
  if (tab === 'menu') renderMenuTab();
  if (tab === 'categories') renderCategoriesTab();
  if (tab === 'promos') renderPromosTab();
  if (tab === 'users') renderUsersTab();
  if (tab === 'revenue') renderRevenueTab();
}

// ==========================================
// TAB 1: ORDERS MANAGEMENT (API-powered)
// ==========================================
let _cachedAdminOrders = [];

async function renderOrdersTab() {
  const panel = document.getElementById('tab-orders');
  if (!panel) return;

  // Show loading
  panel.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i><br><br>Loading orders from database...</div>';

  let orders = [];
  if (window.API) {
    try {
      orders = await window.API.getOrders();
      _cachedAdminOrders = orders;
    } catch (e) {
      console.warn('API getOrders failed:', e.message);
      orders = _cachedAdminOrders.length > 0 ? _cachedAdminOrders : getOrders();
    }
  } else {
    orders = getOrders();
    _cachedAdminOrders = orders;
  }

  if (orders.length === 0) {
    panel.innerHTML = `
      <div class="admin-empty-state">
        <div class="empty-icon-ring">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>
        <h3>No Customer Orders Yet</h3>
        <p>No food orders have been placed yet. Customers can place orders from the menu!</p>
      </div>
    `;
    return;
  }

  // Fix field names: normalize customerName
  orders = orders.map(o => ({
    ...o,
    name: o.customerName || o.customer_name || o.name || 'Customer'
  }));

  // Filter & Search
  let filteredOrders = orders;
  if (activeOrderFilter !== 'all') {
    filteredOrders = orders.filter(o => (o.status || 'Confirmed').toLowerCase().replace(/\s+/g, '-') === activeOrderFilter);
  }

  if (orderSearchQuery.trim()) {
    const q = orderSearchQuery.toLowerCase().trim();
    filteredOrders = filteredOrders.filter(o =>
      (o.id || '').toLowerCase().includes(q) ||
      (o.name || '').toLowerCase().includes(q) ||
      (o.phone || '').toLowerCase().includes(q) ||
      (o.address || '').toLowerCase().includes(q)
    );
  }

  // Pagination
  const totalOrdersCount = filteredOrders.length;
  const totalPages = Math.ceil(totalOrdersCount / adminOrdersPerPage) || 1;
  if (adminOrdersPage > totalPages) adminOrdersPage = totalPages;

  const startIdx = (adminOrdersPage - 1) * adminOrdersPerPage;
  const endIdx = Math.min(startIdx + adminOrdersPerPage, totalOrdersCount);
  const pageOrders = filteredOrders.slice(startIdx, endIdx);

  let pagBarHtml = '';
  if (totalOrdersCount > adminOrdersPerPage || adminOrdersPerPage >= 999) {
    let pageBtns = '';
    for (let p = 1; p <= totalPages; p++) {
      pageBtns += `<button class="page-btn ${p === adminOrdersPage ? 'active' : ''}" onclick="changeAdminOrdersPage(${p})">${p}</button>`;
    }
    pagBarHtml = `
      <div class="pagination-bar" style="margin-top:16px;">
        <div class="pagination-info">
          Showing <strong>${totalOrdersCount > 0 ? startIdx + 1 : 0}–${endIdx}</strong> of <strong>${totalOrdersCount}</strong> orders
        </div>
        <div class="pagination-controls">
          <button class="page-btn" ${adminOrdersPage === 1 ? 'disabled' : ''} onclick="changeAdminOrdersPage(${adminOrdersPage - 1})">
            <i class="fas fa-chevron-left"></i> Prev
          </button>
          ${pageBtns}
          <button class="page-btn" ${adminOrdersPage === totalPages ? 'disabled' : ''} onclick="changeAdminOrdersPage(${adminOrdersPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="page-size-wrapper">
          <span>Rows:</span>
          <select class="page-size-select" onchange="changeAdminOrdersPerPage(this.value)">
            <option value="6" ${adminOrdersPerPage === 6 ? 'selected' : ''}>6</option>
            <option value="12" ${adminOrdersPerPage === 12 ? 'selected' : ''}>12</option>
            <option value="999" ${adminOrdersPerPage === 999 ? 'selected' : ''}>All</option>
          </select>
        </div>
      </div>
    `;
  }

  panel.innerHTML = `
    <div class="table-card">
      <div class="table-card-header">
        <div class="table-header-top-row">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            Customer Orders (${filteredOrders.length} of ${orders.length})
          </h3>
          
          <div class="header-actions">
            <button class="btn-secondary-sm" onclick="exportOrdersJSON()" title="Export Orders Data">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export
            </button>
          </div>
        </div>

        <div class="table-header-bottom-row">
          <div class="filter-pills-row">
            <button class="filter-pill ${activeOrderFilter === 'all' ? 'active' : ''}" onclick="setOrderFilter('all')">All (${orders.length})</button>
            <button class="filter-pill ${activeOrderFilter === 'confirmed' ? 'active' : ''}" onclick="setOrderFilter('confirmed')">Confirmed</button>
            <button class="filter-pill ${activeOrderFilter === 'preparing' ? 'active' : ''}" onclick="setOrderFilter('preparing')">Preparing</button>
            <button class="filter-pill ${activeOrderFilter === 'out-for-delivery' ? 'active' : ''}" onclick="setOrderFilter('out-for-delivery')">Out for Delivery</button>
            <button class="filter-pill ${activeOrderFilter === 'delivered' ? 'active' : ''}" onclick="setOrderFilter('delivered')">Delivered</button>
          </div>

          <div class="admin-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Search ID, name, phone..." value="${escapeHtml(orderSearchQuery)}" oninput="handleOrderSearch(this.value)"/>
          </div>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Ordered Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status Updater</th>
              <th>Date &amp; Time</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pageOrders.map(order => {
              const date = new Date(order.createdAt || order.created_at || order.timestamp || Date.now());
              const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
              const statusKey = (order.status || 'Confirmed').toLowerCase().replace(/\s+/g, '-');

              const payBadge = order.paymentMethod === 'cod' ? '<span class="pay-badge cod"><i class="fas fa-money-bill"></i> COD</span>'
                : order.paymentMethod === 'upi' ? '<span class="pay-badge upi"><i class="fas fa-mobile-screen"></i> UPI</span>'
                : '<span class="pay-badge card"><i class="fas fa-credit-card"></i> Card</span>';

              return `
                <tr>
                  <td>
                    <span class="table-id-tag">#${order.id}</span>
                  </td>
                  <td>
                    <div class="cust-name-cell">${escapeHtml(order.name || 'Customer')}</div>
                    <div class="cust-sub-cell"><i class="fas fa-phone"></i> ${escapeHtml(order.phone || 'N/A')}</div>
                    <div class="cust-sub-cell" title="${escapeHtml(order.address || '')}">
                      <i class="fas fa-location-dot"></i> ${escapeHtml((order.address || '').substring(0, 22))}...
                    </div>
                  </td>
                  <td>
                    <div class="table-items-list">
                      ${(order.items || []).map(i => `
                        <span class="table-item-pill">
                          ${i.image ? `<img src="${i.image}" class="table-item-thumb" alt="${escapeHtml(i.name)}"/>` : ''}
                          ${escapeHtml(i.name)} ×${i.quantity}
                        </span>
                      `).join('')}
                    </div>
                  </td>
                  <td>
                    <div class="table-price-val">₹${order.total}</div>
                  </td>
                  <td>${payBadge}</td>
                  <td>
                    <select class="status-select status-select-${statusKey}" onchange="updateOrderStatus('${order.id}', this.value)">
                      <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                      <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                      <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                      <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                  </td>
                  <td><span class="table-date-cell">${dateStr}</span></td>
                  <td style="text-align:right;">
                    <div class="action-btn-group">
                      <button class="btn-table-action action-view" onclick="openAdminOrderModal('${order.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn-table-action action-delete" onclick="deleteOrder('${order.id}')" title="Delete Order">
                        <i class="fas fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${pagBarHtml}
    </div>
  `;
}

function setOrderFilter(filter) {
  activeOrderFilter = filter;
  adminOrdersPage = 1;
  renderOrdersTab();
}

function handleOrderSearch(query) {
  orderSearchQuery = query;
  adminOrdersPage = 1;
  renderOrdersTab();
}

async function updateOrderStatus(orderId, newStatus) {
  if (!orderId) return;
  try {
    if (window.API) {
      await window.API.updateOrderStatus(orderId, newStatus);
    }
    showToast(`Order #${orderId} → ${newStatus}`);
    renderStats();
    renderOrdersTab();
  } catch (e) {
    showToast('❌ Failed to update status: ' + e.message);
  }
}

async function deleteOrder(orderId) {
  if (!orderId) return;
  if (!confirm(`Delete Order #${orderId}? This cannot be undone.`)) return;
  try {
    if (window.API) {
      await window.API.deleteOrder(orderId);
    }
    // Also remove from localStorage cache
    const local = getOrders().filter(o => o.id !== orderId);
    localStorage.setItem('quickbite_orders', JSON.stringify(local));
    showToast(`Order #${orderId} deleted`);
    renderStats();
    renderOrdersTab();
  } catch (e) {
    showToast('❌ Failed to delete order: ' + e.message);
  }
}

function clearAllOrders() {
  showToast('⚠️ Use the database admin tools to clear all orders.');
}

function openAdminOrderModal(orderId) {
  // Search in cached API orders first, then localStorage
  let order = _cachedAdminOrders.find(o => o.id == orderId);
  if (!order) {
    const local = getOrders();
    order = local.find(o => o.id == orderId);
  }
  if (!order) return;

  // Normalize field names
  order = { ...order, name: order.customerName || order.customer_name || order.name || 'Customer' };

  const modal = document.getElementById('adminOrderModal');
  const modalTitle = document.getElementById('modalOrderId');
  const modalBody = document.getElementById('adminOrderModalBody');

  if (modalTitle) modalTitle.textContent = `#${order.id}`;

  const rawDate = order.createdAt || order.created_at || order.timestamp;
  const date = rawDate ? new Date(rawDate) : new Date();
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const payLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery'
    : order.paymentMethod === 'upi' ? 'UPI Online'
    : order.paymentMethod === 'card' ? 'Credit / Debit Card'
    : order.paymentMethod || 'Cash on Delivery';

  if (modalBody) {
    modalBody.innerHTML = `
      <div class="order-detail-meta-grid">
        <div class="meta-item"><span class="lbl">Customer:</span> <strong>${escapeHtml(order.name || 'N/A')}</strong></div>
        <div class="meta-item"><span class="lbl">Phone:</span> <strong>${escapeHtml(order.phone || 'N/A')}</strong></div>
        <div class="meta-item" style="grid-column: span 2;"><span class="lbl">Delivery Address:</span> <strong>${escapeHtml(order.address || 'N/A')}</strong></div>
        <div class="meta-item"><span class="lbl">Payment Method:</span> <strong>${escapeHtml(payLabel)}</strong></div>
        <div class="meta-item"><span class="lbl">Order Date:</span> <strong>${dateStr}</strong></div>
      </div>

      <h4 style="color:white;margin:16px 0 10px;font-size:15px;"><i class="fas fa-basket-shopping"></i> Itemized Breakdown</h4>
      <div class="order-detail-items">
        ${(order.items || []).map(i => `
          <div class="order-detail-item-row">
            <div style="display:flex;align-items:center;gap:10px;">
              ${i.image ? `<img src="${i.image}" class="table-item-thumb" style="width:32px;height:32px;"/>` : ''}
              <div>
                <div style="color:white;font-weight:600;font-size:13.5px;">${escapeHtml(i.name)}</div>
                <div style="color:var(--text-muted);font-size:11.5px;">₹${i.price} × ${i.quantity}</div>
              </div>
            </div>
            <div style="color:var(--primary);font-weight:700;">₹${(i.price || 0) * (i.quantity || 1)}</div>
          </div>
        `).join('')}
      </div>

      <div class="order-detail-total-row">
        <span>Grand Total Amount</span>
        <span style="font-size:20px;font-weight:800;color:var(--primary);">₹${order.total}</span>
      </div>

      <div class="modal-submit-row">
        <a href="tel:${order.phone}" class="btn-secondary" style="text-decoration:none;"><i class="fas fa-phone"></i> Call Customer</a>
        <button type="button" class="btn-primary" onclick="closeAdminOrderModal()"><i class="fas fa-check"></i> Done</button>
      </div>
    `;
  }

  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeAdminOrderModal() {
  const modal = document.getElementById('adminOrderModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

async function exportOrdersJSON() {
  let orders = _cachedAdminOrders;
  if (orders.length === 0) {
    try { orders = await window.API.getOrders(); } catch (e) { orders = getOrders(); }
  }
  if (orders.length === 0) {
    showToast('No orders available to export');
    return;
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `quickbite_orders_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('✅ Exported orders JSON');
}

// ==========================================
// TAB 2: MENU MANAGEMENT (CRUD)
// ==========================================
function renderMenuTab() {
  const panel = document.getElementById('tab-menu');
  if (!panel) return;

  let filteredItems = MENU_ITEMS;
  if (menuCategoryFilter !== 'all') {
    filteredItems = filteredItems.filter(i => i.category === menuCategoryFilter);
  }
  if (menuSearchQuery.trim()) {
    const q = menuSearchQuery.toLowerCase().trim();
    filteredItems = filteredItems.filter(i => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
  }

  // Pagination calculation for Admin Menu Inventory
  const totalMenuCount = filteredItems.length;
  const totalPages = Math.ceil(totalMenuCount / adminMenuPerPage) || 1;
  if (adminMenuPage > totalPages) adminMenuPage = totalPages;

  const startIdx = (adminMenuPage - 1) * adminMenuPerPage;
  const endIdx = Math.min(startIdx + adminMenuPerPage, totalMenuCount);
  const pageMenuItems = filteredItems.slice(startIdx, endIdx);

  let pagBarHtml = '';
  if (totalMenuCount > adminMenuPerPage || adminMenuPerPage >= 999) {
    let pageBtns = '';
    for (let p = 1; p <= totalPages; p++) {
      pageBtns += `<button class="page-btn ${p === adminMenuPage ? 'active' : ''}" onclick="changeAdminMenuPage(${p})">${p}</button>`;
    }
    pagBarHtml = `
      <div class="pagination-bar" style="margin-top:16px;">
        <div class="pagination-info">
          Showing <strong>${totalMenuCount > 0 ? startIdx + 1 : 0}–${endIdx}</strong> of <strong>${totalMenuCount}</strong> items
        </div>
        <div class="pagination-controls">
          <button class="page-btn" ${adminMenuPage === 1 ? 'disabled' : ''} onclick="changeAdminMenuPage(${adminMenuPage - 1})">
            <i class="fas fa-chevron-left"></i> Prev
          </button>
          ${pageBtns}
          <button class="page-btn" ${adminMenuPage === totalPages ? 'disabled' : ''} onclick="changeAdminMenuPage(${adminMenuPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="page-size-wrapper">
          <span>Rows:</span>
          <select class="page-size-select" onchange="changeAdminMenuPerPage(this.value)">
            <option value="8" ${adminMenuPerPage === 8 ? 'selected' : ''}>8</option>
            <option value="16" ${adminMenuPerPage === 16 ? 'selected' : ''}>16</option>
            <option value="999" ${adminMenuPerPage === 999 ? 'selected' : ''}>All</option>
          </select>
        </div>
      </div>
    `;
  }

  panel.innerHTML = `
    <div class="table-card">
      <div class="table-card-header">
        <div class="table-header-top-row">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            </svg>
            Menu Inventory (${filteredItems.length} of ${MENU_ITEMS.length})
          </h3>
          <div class="header-actions">
            <button class="btn-primary-sm" onclick="openAddModal()"><i class="fas fa-plus"></i> Add Item</button>
            <button class="btn-secondary-sm" onclick="resetDefaultMenu()"><i class="fas fa-rotate"></i> Restore</button>
          </div>
        </div>

        <div class="table-header-bottom-row">
          <div class="filter-pills-row">
            ${CATEGORIES.map(c => `
              <button class="filter-pill ${menuCategoryFilter === c.id ? 'active' : ''}" onclick="setMenuCategoryFilter('${c.id}')">${c.name}</button>
            `).join('')}
          </div>

          <div class="admin-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Search menu item..." value="${escapeHtml(menuSearchQuery)}" oninput="handleMenuSearch(this.value)"/>
          </div>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Diet Tag</th>
              <th>Price</th>
              <th>Rating</th>
              <th>Stock Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pageMenuItems.map(item => {
              const catObj = CATEGORIES.find(c => c.id === item.category);
              const dietBadge = getDietSVG(item.isVeg);
              const isOut = item.outOfStock;

              return `
                <tr>
                  <td>
                    <div class="menu-item-cell">
                      <img src="${item.image}" alt="${escapeHtml(item.name)}" class="menu-item-img" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';"/>
                      <div>
                        <div class="menu-item-title">${escapeHtml(item.name)}</div>
                        <div class="menu-item-desc">${item.description ? escapeHtml(item.description.substring(0, 35)) + '...' : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="cat-badge-pill" style="color:${catObj?.color || '#ff6b35'};">${catObj?.name || item.category}</span></td>
                  <td>${dietBadge}</td>
                  <td><strong style="color:var(--primary);font-size:15px;">₹${item.price}</strong></td>
                  <td><span class="rating-pill"><i class="fas fa-star" style="color:#f59e0b;"></i> ${item.rating}</span></td>
                  <td>
                    <button class="stock-toggle-btn ${isOut ? 'out-of-stock' : 'in-stock'}" onclick="toggleItemStock(${item.id})">
                      <span class="stock-dot"></span>
                      ${isOut ? 'Out of Stock' : 'In Stock'}
                    </button>
                  </td>
                  <td style="text-align:right;">
                    <div class="action-btn-group">
                      <button class="btn-table-action action-edit" onclick="openEditModal(${item.id})" title="Edit Item">
                        <i class="fas fa-pen"></i>
                      </button>
                      <button class="btn-table-action action-delete" onclick="deleteMenuItem(${item.id})" title="Delete Item">
                        <i class="fas fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${pagBarHtml}
    </div>
  `;
}

function setMenuCategoryFilter(cat) {
  menuCategoryFilter = cat;
  adminMenuPage = 1;
  renderMenuTab();
}

function handleMenuSearch(q) {
  menuSearchQuery = q;
  adminMenuPage = 1;
  renderMenuTab();
}

function setDietFormValue(val) {
  document.getElementById('itemDiet').value = val;
}

function updateImagePreview(url) {
  const img = document.getElementById('imgPreview');
  const placeholder = document.getElementById('imgPreviewPlaceholder');
  if (!img || !placeholder) return;

  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    img.src = url;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.style.display = 'none';
    placeholder.style.display = 'inline-flex';
  }
}

function openAddModal() {
  document.getElementById('itemForm').reset();
  document.getElementById('itemId').value = '';
  setDietFormValue('veg');
  document.getElementById('dietRadioVeg').checked = true;
  updateImagePreview('');
  document.getElementById('itemModalTitle').textContent = 'Add New Menu Item';
  document.getElementById('itemModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openEditModal(itemId) {
  const item = MENU_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('itemId').value = item.id;
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemPrice').value = item.price;
  document.getElementById('itemCategory').value = item.category;

  const isVeg = !!item.isVeg;
  setDietFormValue(isVeg ? 'veg' : 'non-veg');
  if (isVeg) {
    document.getElementById('dietRadioVeg').checked = true;
  } else {
    document.getElementById('dietRadioNonVeg').checked = true;
  }

  document.getElementById('itemImage').value = item.image;
  updateImagePreview(item.image);

  document.getElementById('itemDesc').value = item.description || '';

  document.getElementById('itemModalTitle').textContent = `Edit Menu Item (${item.name})`;
  document.getElementById('itemModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeItemModal() {
  const modal = document.getElementById('itemModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

async function saveMenuItem(e) {
  e.preventDefault();

  const id = document.getElementById('itemId').value;
  const name = document.getElementById('itemName').value.trim();
  const price = parseFloat(document.getElementById('itemPrice').value);
  const category = document.getElementById('itemCategory').value;
  const isVeg = document.getElementById('itemDiet').value === 'veg';
  const image = document.getElementById('itemImage').value.trim();
  const description = document.getElementById('itemDesc').value.trim();

  if (!name || !price || !image) {
    showToast('Please fill all required fields');
    return;
  }

  const payload = {
    name, price, category, isVeg, image, description,
    isPopular: true, featured: false
  };

  if (window.API) {
    try {
      if (id) {
        await window.API.updateMenuItem(id, payload);
        showToast(`Menu item "${name}" updated in MySQL Database`);
      } else {
        await window.API.createMenuItem(payload);
        showToast(`New menu item "${name}" created in MySQL Database`);
      }
      if (typeof loadMenuFromDB === 'function') await loadMenuFromDB();
    } catch(err) {
      console.warn('DB update failed, using local state:', err.message);
      if (id) {
        const idx = MENU_ITEMS.findIndex(i => i.id == id);
        if (idx !== -1) MENU_ITEMS[idx] = { ...MENU_ITEMS[idx], name, price, category, isVeg, image, description };
      } else {
        const newId = MENU_ITEMS.length ? Math.max(...MENU_ITEMS.map(i => i.id)) + 1 : 1;
        MENU_ITEMS.unshift({ id: newId, name, price, category, isVeg, image, description, rating: 4.8, reviews: 10 });
      }
    }
  } else {
    if (id) {
      const idx = MENU_ITEMS.findIndex(i => i.id == id);
      if (idx !== -1) MENU_ITEMS[idx] = { ...MENU_ITEMS[idx], name, price, category, isVeg, image, description };
    } else {
      const newId = MENU_ITEMS.length ? Math.max(...MENU_ITEMS.map(i => i.id)) + 1 : 1;
      MENU_ITEMS.unshift({ id: newId, name, price, category, isVeg, image, description, rating: 4.8, reviews: 10 });
    }
  }

  closeItemModal();
  renderStats();
  renderMenuTab();
}

async function toggleItemStock(itemId) {
  const item = MENU_ITEMS.find(i => i.id == itemId);
  if (item) {
    item.outOfStock = !item.outOfStock;
    if (window.API) {
      try {
        await window.API.toggleStock(itemId, item.outOfStock);
      } catch(e) { console.warn(e.message); }
    }
    showToast(`"${item.name}" is now ${item.outOfStock ? 'Out of Stock' : 'In Stock'}`);
    renderMenuTab();
  }
}

async function deleteMenuItem(itemId) {
  const idx = MENU_ITEMS.findIndex(i => i.id == itemId);
  if (idx === -1) return;
  const name = MENU_ITEMS[idx].name;

  if (confirm(`Delete "${name}" from menu?`)) {
    if (window.API) {
      try {
        await window.API.deleteMenuItem(itemId);
      } catch(e) { console.warn(e.message); }
    }
    MENU_ITEMS.splice(idx, 1);
    showToast(`"${name}" removed from menu`);
    renderStats();
    renderMenuTab();
  }
}

function resetDefaultMenu() {
  if (confirm('Restore original default menu items?')) {
    location.reload();
  }
}

// ==========================================
// TAB 3: PROMO CODES MANAGEMENT
// ==========================================
function getStoredPromos() {
  return JSON.parse(localStorage.getItem('quickbite_promos')) || {
    'QUICKBITE50': { pct: 50, active: true },
    'FAHAD20':     { pct: 20, active: true },
    'NEWUSER':     { pct: 15, active: true },
    'SAVE10':      { pct: 10, active: true }
  };
}

function renderPromosTab() {
  const panel = document.getElementById('tab-promos');
  if (!panel) return;

  const promos = getStoredPromos();
  const keys = Object.keys(promos);

  panel.innerHTML = `
    <div class="table-card">
      <div class="table-card-header">
        <div class="table-title-group">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"></path>
            </svg>
            Active Discount Promo Codes (${keys.length})
          </h3>
        </div>
        <div class="header-actions">
          <button class="btn-primary-sm" onclick="openPromoModal()"><i class="fas fa-plus"></i> Create Promo Code</button>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Promo Code</th>
              <th>Discount Value</th>
              <th>Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${keys.map(code => {
              const p = promos[code];
              const isActive = p.active !== false;

              return `
                <tr>
                  <td>
                    <span class="promo-code-pill"><i class="fas fa-tag"></i> ${code}</span>
                  </td>
                  <td>
                    <strong style="color:#22c55e;font-size:16px;">${p.pct}% OFF</strong>
                  </td>
                  <td>
                    <button class="stock-toggle-btn ${isActive ? 'in-stock' : 'out-of-stock'}" onclick="togglePromoActive('${code}')">
                      <span class="stock-dot"></span>
                      ${isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td style="text-align:right;">
                    <div class="action-btn-group">
                      <button class="btn-table-action action-copy" onclick="copyPromoCode('${code}')" title="Copy Promo Code">
                        <i class="fas fa-copy"></i>
                      </button>
                      <button class="btn-table-action action-edit" onclick="openEditPromoModal('${code}')" title="Edit Promo Code">
                        <i class="fas fa-pen"></i>
                      </button>
                      <button class="btn-table-action action-delete" onclick="deletePromoCode('${code}')" title="Delete Promo">
                        <i class="fas fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openPromoModal(codeToEdit) {
  document.getElementById('promoForm').reset();
  if (codeToEdit) {
    const promos = getStoredPromos();
    const p = promos[codeToEdit];
    if (p) {
      document.getElementById('promoOriginalCode').value = codeToEdit;
      document.getElementById('promoCodeStr').value = codeToEdit;
      document.getElementById('promoDiscount').value = p.pct;
      const titleEl = document.getElementById('promoModalTitle');
      if (titleEl) titleEl.textContent = `Edit Promo Code (${codeToEdit})`;
    }
  } else {
    document.getElementById('promoOriginalCode').value = '';
    const titleEl = document.getElementById('promoModalTitle');
    if (titleEl) titleEl.textContent = 'Create New Promo Code';
  }
  document.getElementById('promoModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openEditPromoModal(code) {
  openPromoModal(code);
}

function copyPromoCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast(`Promo code "${code}" copied!`);
  }).catch(() => {
    showToast(`Promo code: ${code}`);
  });
}

function closePromoModal() {
  const modal = document.getElementById('promoModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function savePromoCode(e) {
  e.preventDefault();
  const origCode = document.getElementById('promoOriginalCode').value;
  const newCode = document.getElementById('promoCodeStr').value.trim().toUpperCase();
  const pct = parseInt(document.getElementById('promoDiscount').value);

  if (!newCode || isNaN(pct) || pct <= 0 || pct > 100) {
    showToast('Please enter a valid code & discount percentage (1-100)');
    return;
  }

  const promos = getStoredPromos();

  if (origCode && origCode !== newCode) {
    delete promos[origCode];
  }

  promos[newCode] = { pct, active: promos[origCode]?.active !== false };
  localStorage.setItem('quickbite_promos', JSON.stringify(promos));

  showToast(origCode ? `Promo Code "${newCode}" updated` : `Promo Code "${newCode}" (${pct}% OFF) created`);
  closePromoModal();
  renderStats();
  renderPromosTab();
}

function togglePromoActive(code) {
  const promos = getStoredPromos();
  if (promos[code]) {
    promos[code].active = !promos[code].active;
    localStorage.setItem('quickbite_promos', JSON.stringify(promos));
    showToast(`Promo "${code}" is now ${promos[code].active ? 'Active' : 'Disabled'}`);
    renderPromosTab();
  }
}

function deletePromoCode(code) {
  const promos = getStoredPromos();
  if (confirm(`Delete Promo Code "${code}"?`)) {
    delete promos[code];
    localStorage.setItem('quickbite_promos', JSON.stringify(promos));
    showToast(`Promo "${code}" deleted`);
    renderStats();
    renderPromosTab();
  }
}

// ==========================================
// TAB 4: REVENUE ANALYTICS
// ==========================================
function renderRevenueTab() {
  const panel = document.getElementById('tab-revenue');
  if (!panel) return;

  const orders = (_cachedAdminOrders && _cachedAdminOrders.length > 0) ? _cachedAdminOrders : getOrders();
  let catRevenue = {};
  let totalSalesVal = 0;

  // Filter out 'all' pseudo category
  const realCats = CATEGORIES.filter(c => c.id !== 'all');
  realCats.forEach(c => catRevenue[c.id] = 0);

  if (orders.length > 0) {
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const cat = realCats.find(c => c.id === item.category);
        if (cat) {
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          catRevenue[cat.id] = (catRevenue[cat.id] || 0) + itemTotal;
          totalSalesVal += itemTotal;
        }
      });
    });
  } else {
    realCats.forEach(c => {
      const items = MENU_ITEMS.filter(i => i.category === c.id);
      const est = items.reduce((s, i) => s + i.price, 0);
      catRevenue[c.id] = est;
      totalSalesVal += est;
    });
  }

  const maxVal = Math.max(...Object.values(catRevenue), 1);
  const sourceNote = orders.length > 0
    ? 'Based on actual customer completed orders'
    : 'Based on menu pricing estimates (Seed demo orders for live tracking)';

  // Find top category
  let topCatObj = realCats[0];
  let topCatSales = 0;
  realCats.forEach(c => {
    if ((catRevenue[c.id] || 0) > topCatSales) {
      topCatSales = catRevenue[c.id];
      topCatObj = c;
    }
  });

  panel.innerHTML = `
    <!-- Top Executive Metric Chips -->
    <div class="revenue-kpi-grid">
      <div class="revenue-kpi-card">
        <div class="kpi-icon-box" style="background:rgba(255,107,53,0.15);color:#ff6b35;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="kpi-val">₹${totalSalesVal.toLocaleString('en-IN')}</div>
        <div class="kpi-lbl">Total Gross Revenue</div>
      </div>

      <div class="revenue-kpi-card">
        <div class="kpi-icon-box" style="background:rgba(34,197,94,0.15);color:#22c55e;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        </div>
        <div class="kpi-val">${topCatObj ? topCatObj.name : 'N/A'}</div>
        <div class="kpi-lbl">Top Selling Category</div>
      </div>

      <div class="revenue-kpi-card">
        <div class="kpi-icon-box" style="background:rgba(59,130,246,0.15);color:#3b82f6;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <div class="kpi-val">${orders.length} Orders</div>
        <div class="kpi-lbl">Total Orders Processed</div>
      </div>
    </div>

    <!-- Category Sales Breakdown Progress Bars -->
    <div class="table-card" style="margin-bottom:24px;">
      <div class="table-card-header">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          Revenue Sales Breakdown by Category
        </h3>
        <span class="source-note-tag"><i class="fas fa-circle-info"></i> ${sourceNote}</span>
      </div>

      <div style="padding:24px;">
        ${realCats.map(cat => {
          const val = catRevenue[cat.id] || 0;
          const pct = totalSalesVal > 0 ? Math.round((val / totalSalesVal) * 100) : 0;
          const fillWidth = Math.max(0, Math.round((val / maxVal) * 100));

          return `
            <div class="revenue-bar-row">
              <div class="revenue-bar-label">
                <span class="cat-dot" style="background:${cat.color};"></span>
                <strong>${cat.name}</strong>
              </div>

              <div class="revenue-bar-track">
                <div class="revenue-bar-fill" style="width:${fillWidth}%; background: linear-gradient(90deg, ${cat.color}, var(--primary));"></div>
              </div>

              <div class="revenue-bar-amount">
                <strong style="color:white;">₹${val.toLocaleString('en-IN')}</strong>
                <span class="revenue-pct-badge">${pct}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Category Performance Cards Grid -->
    <div class="table-card-header" style="margin-bottom:14px;background:none;padding:0;">
      <h3 style="font-size:18px;color:white;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-layer-group" style="color:var(--primary);"></i> Category Performance Grid
      </h3>
    </div>

    <div class="category-stats-grid">
      ${realCats.map(cat => {
        const items = MENU_ITEMS.filter(i => i.category === cat.id);
        const sales = catRevenue[cat.id] || 0;
        const avg = items.length ? Math.round(items.reduce((s,i) => s+i.price, 0) / items.length) : 0;

        return `
          <div class="cat-stat-card" style="border-top:3px solid ${cat.color};">
            <div class="cat-card-top">
              <div class="cat-thumb-wrap">
                <img src="${cat.image}" alt="${cat.name}" class="cat-thumb-photo" loading="lazy"/>
              </div>
              <span class="cat-count-pill">${items.length} Items</span>
            </div>
            <div class="cat-stat-name">${cat.name}</div>
            <div class="cat-stat-sales">Sales: <strong style="color:var(--primary);">₹${sales.toLocaleString('en-IN')}</strong></div>
            <div class="cat-stat-price">Avg ₹${avg} / item</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==========================================
// DYNAMIC CATEGORIES MANAGEMENT TAB
// ==========================================
async function renderCategoriesTab() {
  const panel = document.getElementById('tab-categories');
  if (!panel) return;

  panel.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i><br><br>Loading categories...</div>';

  let categories = [];
  try {
    if (window.API) {
      categories = await window.API.getCategories();
    }
  } catch (e) {
    categories = typeof CATEGORIES !== 'undefined' ? CATEGORIES : [];
  }

  panel.innerHTML = `
    <div class="table-card">
      <div class="table-card-header">
        <div>
          <h3><i class="fas fa-folder-tree" style="color:var(--primary);"></i> Dynamic Food Categories</h3>
          <p style="font-size:13px;color:#94a3b8;margin-top:2px;">Manage food categories live across the menu and home pages.</p>
        </div>
        <button class="btn-primary-sm" onclick="promptAddCategory()">
          <i class="fas fa-plus"></i> Add New Category
        </button>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Icon / Image</th>
              <th>Category ID</th>
              <th>Category Name</th>
              <th>Theme Color</th>
              <th>Items Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${categories.map(cat => {
              const itemCount = typeof MENU_ITEMS !== 'undefined' ? MENU_ITEMS.filter(i => i.category === cat.id).length : 0;
              return `
                <tr>
                  <td>
                    <img src="${cat.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=100&q=80'}" style="width:40px;height:40px;border-radius:10px;object-fit:cover;border:1px solid rgba(255,255,255,0.1);" />
                  </td>
                  <td><code style="color:var(--primary);background:rgba(255,107,53,0.1);padding:3px 8px;border-radius:6px;">${cat.id}</code></td>
                  <td><strong>${escapeHtml(cat.name)}</strong></td>
                  <td><span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${cat.color};vertical-align:middle;margin-right:6px;"></span> ${cat.color}</td>
                  <td><span class="badge-count">${itemCount} items</span></td>
                  <td>
                    ${cat.id === 'all' ? '<span style="color:#64748b;font-size:12px;">System Default</span>' : `
                      <button class="btn-danger-sm" onclick="deleteAdminCategory('${cat.id}')" title="Delete Category">
                        <i class="fas fa-trash-can"></i>
                      </button>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function promptAddCategory() {
  const catName = prompt('Enter New Category Name (e.g., Momos & Dumplings):');
  if (!catName || !catName.trim()) return;

  const catId = catName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const catColor = prompt('Enter Accent Hex Color:', '#ff6b35') || '#ff6b35';
  const catImage = prompt('Enter Category Image URL (optional):', 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=400&q=80');

  try {
    if (window.API) {
      await window.API.saveCategory({
        id: catId,
        name: catName.trim(),
        color: catColor,
        bg: `rgba(255,107,53,0.12)`,
        image: catImage
      });
      if (typeof showToast === 'function') showToast(`Category "${catName}" created!`, 'success');
      renderCategoriesTab();
    }
  } catch (e) {
    alert('Error saving category: ' + e.message);
  }
}

async function deleteAdminCategory(id) {
  if (!confirm(`Are you sure you want to delete category "${id}"?`)) return;
  try {
    if (window.API) {
      await window.API.deleteCategory(id);
      if (typeof showToast === 'function') showToast(`Category "${id}" deleted!`, 'info');
      renderCategoriesTab();
    }
  } catch (e) {
    alert('Error deleting category: ' + e.message);
  }
}

// ==========================================
// CUSTOMER ACCOUNTS MANAGEMENT TAB
// ==========================================
async function renderUsersTab() {
  const panel = document.getElementById('tab-users');
  if (!panel) return;

  panel.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;"><i class="fas fa-spinner fa-spin" style="font-size:24px;"></i><br><br>Loading customer accounts...</div>';

  let users = [];
  try {
    if (window.API) {
      users = await window.API.getUsers();
    }
  } catch (e) {
    console.warn('getUsers API failed:', e.message);
  }

  panel.innerHTML = `
    <div class="table-card">
      <div class="table-card-header">
        <div>
          <h3><i class="fas fa-users-gear" style="color:var(--primary);"></i> Customer Accounts Registry</h3>
          <p style="font-size:13px;color:#94a3b8;margin-top:2px;">Registered users and administrator accounts in MySQL database.</p>
        </div>
        <span class="badge-count">${users.length} Total Users</span>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Email Address</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>#${u.id}</td>
                <td><strong>${escapeHtml(u.name)}</strong></td>
                <td><i class="fas fa-envelope" style="color:#64748b;font-size:12px;margin-right:4px;"></i> ${escapeHtml(u.email)}</td>
                <td>${u.phone ? escapeHtml(u.phone) : '<span style="color:#64748b;">Not provided</span>'}</td>
                <td>
                  <span class="badge ${u.role === 'admin' ? 'status-delivered' : 'status-confirmed'}">
                    <i class="fas ${u.role === 'admin' ? 'fa-shield-halved' : 'fa-user'}"></i> ${u.role.toUpperCase()}
                  </span>
                </td>
                <td>${u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : 'N/A'}</td>
                <td>
                  ${u.role === 'admin' ? '<span style="color:#64748b;font-size:12px;">Active Admin</span>' : `
                    <button class="btn-danger-sm" onclick="deleteAdminUser(${u.id}, '${escapeHtml(u.email)}')" title="Delete User Account">
                      <i class="fas fa-user-xmark"></i>
                    </button>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function deleteAdminUser(id, email) {
  if (!confirm(`Are you sure you want to delete user account (${email})?`)) return;
  try {
    if (window.API) {
      await window.API.deleteUser(id);
      if (typeof showToast === 'function') showToast(`User account deleted!`, 'info');
      renderUsersTab();
    }
  } catch (e) {
    alert('Error deleting user: ' + e.message);
  }
}
