// ==========================================
// QuickBite - Orders Page Logic (Redesign 5.5)
// Developer: Mohd Fahad
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  renderOrders();

  // Invoice modal overlay click to close
  const invoiceModal = document.getElementById('invoiceModal');
  if (invoiceModal) {
    invoiceModal.addEventListener('click', function(e) {
      if (e.target === this) closeInvoiceModal();
    });
  }
});

let currentOrderPage = 1;
let ordersPerPage = 5;

function changeOrderPage(newPage) {
  currentOrderPage = newPage;
  renderOrders();
  const container = document.getElementById('ordersContainer');
  if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function changeOrderPageSize(newSize) {
  ordersPerPage = parseInt(newSize) || 5;
  currentOrderPage = 1;
  renderOrders();
}

let currentFetchedOrders = [];

async function renderOrders() {
  const container = document.getElementById('ordersContainer');
  if (!container) return;

  let orders = [];
  if (window.API) {
    try {
      orders = await window.API.getOrders();
    } catch (e) {
      console.warn('API getOrders failed, fallback to local:', e.message);
      orders = getOrders();
    }
  } else {
    orders = getOrders();
  }

  currentFetchedOrders = orders;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="orders-empty-card">
        <div class="empty-icon-box"><i class="fas fa-receipt"></i></div>
        <h3>No Orders Found!</h3>
        <p>You haven't placed any food orders yet. Explore our delicious menu and satisfy your cravings!</p>
        <a href="menu.html" class="btn-primary"><i class="fas fa-utensils"></i> Explore Menu</a>
      </div>
    `;
    return;
  }

  // Calculate stats
  const totalOrders = orders.length;
  const activeCount = orders.filter(o => o.status !== 'Delivered').length;
  const totalSpent  = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Build Top Bar Stats + Controls
  const statsHTML = `
    <div class="orders-stats-hub">
      <div class="orders-stats-group">
        <div class="stat-chip">
          <i class="fas fa-bag-shopping"></i>
          <span>Total Orders: <strong>${totalOrders}</strong></span>
        </div>
        ${activeCount > 0 ? `
          <div class="stat-chip active-stat">
            <span class="active-pulse-dot"></span>
            <span>Active Deliveries: <strong>${activeCount}</strong></span>
          </div>
        ` : ''}
        <div class="stat-chip spent-stat">
          <i class="fas fa-indian-rupee-sign"></i>
          <span>Total Spent: <strong>₹${totalSpent}</strong></span>
        </div>
      </div>
      <button onclick="clearOrdersAndRefresh()" class="btn-clear-history">
        <i class="fas fa-trash-can"></i> Clear History
      </button>
    </div>
  `;

  // Pagination calculation
  const totalPages = Math.ceil(totalOrders / ordersPerPage) || 1;
  if (currentOrderPage > totalPages) currentOrderPage = totalPages;

  const startIdx = (currentOrderPage - 1) * ordersPerPage;
  const endIdx = Math.min(startIdx + ordersPerPage, totalOrders);
  const paginatedOrders = orders.slice(startIdx, endIdx);

  // Build order cards
  const cardsHTML = paginatedOrders.map((order) => {
    const rawDate    = order.createdAt || order.created_at || order.timestamp;
    const date       = rawDate ? new Date(rawDate) : new Date();
    const dateStr    = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr    = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const custName   = order.customerName || order.customer_name || order.name || 'Customer';

    const steps      = [
      { key: 'Confirmed',        label: 'Confirmed',        eta: 'Just now', icon: 'fa-circle-check' },
      { key: 'Preparing',        label: 'Preparing',        eta: '~10 mins', icon: 'fa-fire-burner' },
      { key: 'Out for Delivery', label: 'Out for Delivery', eta: '~20 mins', icon: 'fa-truck-fast' },
      { key: 'Delivered',        label: 'Delivered',        eta: '~30 mins', icon: 'fa-house-circle-check' }
    ];

    const statusMap  = { 'Confirmed': 0, 'Preparing': 1, 'Out for Delivery': 2, 'Delivered': 3 };
    const currentStep = statusMap[order.status] ?? 0;
    const statusKey   = (order.status || 'Confirmed').toLowerCase().replace(/\s+/g, '-');

    const addressDisplay = order.address
      ? (order.address.length > 38 ? order.address.substring(0, 38) + '...' : order.address)
      : 'Address specified';

    const payLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery'
      : order.paymentMethod === 'upi' ? 'UPI Online'
      : order.paymentMethod === 'card' ? 'Credit / Debit Card'
      : order.paymentMethod || 'Cash on Delivery';

    return `
      <div class="order-card" id="order-card-${order.id}">
        <!-- Header -->
        <div class="order-header">
          <div class="order-id-wrap">
            <span class="order-id-icon"><i class="fas fa-hashtag"></i></span>
            <div class="order-id-text">
              <span class="order-id-label">Order ID</span>
              <span class="order-id-val">#${order.id}</span>
            </div>
            <button class="btn-copy-id" onclick="copyOrderId('${order.id}')" title="Copy Order ID">
              <i class="fas fa-copy"></i>
            </button>
          </div>

          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <span style="font-size:12.5px;color:#94a3b8;"><i class="fas fa-calendar-day" style="color:var(--primary);margin-right:4px;"></i> ${dateStr} at ${timeStr}</span>
            <span class="order-status-badge status-${statusKey}">
              <span class="status-pulse-dot"></span> ${order.status || 'Confirmed'}
            </span>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="order-meta-grid">
          <div class="meta-item">
            <i class="fas fa-user"></i>
            <span>${escapeHtml(custName)}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-phone"></i>
            <span>${escapeHtml(order.phone || 'N/A')}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-location-dot"></i>
            <span title="${escapeHtml(order.address || '')}">${escapeHtml(addressDisplay)}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-wallet"></i>
            <span>${escapeHtml(payLabel)}</span>
          </div>
        </div>

        <!-- Stepper Progress Tracker -->
        <div class="order-stepper-box">
          <div class="stepper-track">
            ${steps.map((step, i) => {
              const isDone = i <= currentStep;
              const isActive = i === currentStep;
              return `
                ${i > 0 ? `<div class="stepper-line ${i <= currentStep ? 'is-done' : ''}"></div>` : ''}
                <div class="stepper-step ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''}">
                  <div class="stepper-icon-circle">
                    <i class="fas ${step.icon}"></i>
                  </div>
                  <span class="stepper-label">${step.label}</span>
                  <span class="stepper-eta">${step.eta}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Ordered Items Section -->
        <div class="order-items-section">
          <div class="items-header-title">
            <i class="fas fa-utensils"></i> Ordered Items (${(order.items || []).length})
          </div>
          <div class="order-items-grid">
            ${(order.items || []).map(item => `
              <div class="order-item-pill">
                ${item.image ? `
                  <img
                    src="${item.image}"
                    alt="${escapeHtml(item.name)}"
                    class="item-pill-thumb"
                    loading="lazy"
                    onerror="this.style.display='none';"
                  />
                ` : `<span class="item-pill-fallback"><i class="fas fa-burger"></i></span>`}
                <span class="item-pill-name">${escapeHtml(item.name)}</span>
                <span class="item-pill-qty">×${item.quantity}</span>
                <span class="item-pill-price">₹${(item.price || 0) * (item.quantity || 1)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Footer Actions Bar -->
        <div class="order-footer">
          <div class="order-price-group">
            <div class="order-total-lbl">Total Paid:</div>
            <div class="order-total-val">₹${order.total}</div>
            ${order.deliveryFee === 0 || order.delivery === 0 || !order.deliveryFee ? `
              <span class="free-delivery-tag">
                <i class="fas fa-bolt"></i> FREE Delivery
              </span>
            ` : ''}
          </div>

          <div class="order-actions-group">
            <button class="btn-simulate-step" onclick="simulateNextStatus('${order.id}')" title="Simulate next status stage">
              <i class="fas fa-forward-step"></i> Track Progress
            </button>
            <button class="btn-view-invoice" onclick="openInvoiceModal('${order.id}')" title="View printable receipt">
              <i class="fas fa-file-invoice"></i> Receipt
            </button>
            <button class="btn-reorder" onclick="reorderById('${order.id}')" title="Add items to cart again">
              <i class="fas fa-rotate-right"></i> Reorder
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Pagination Controls Bar HTML
  let pagBarHtml = '';
  if (totalOrders > ordersPerPage || ordersPerPage >= 999) {
    let pageBtns = '';
    for (let p = 1; p <= totalPages; p++) {
      pageBtns += `<button class="page-btn ${p === currentOrderPage ? 'active' : ''}" onclick="changeOrderPage(${p})">${p}</button>`;
    }
    pagBarHtml = `
      <div class="pagination-bar" id="ordersPagination">
        <div class="pagination-info">
          Showing <strong>${totalOrders > 0 ? startIdx + 1 : 0}–${endIdx}</strong> of <strong>${totalOrders}</strong> orders
        </div>
        <div class="pagination-controls">
          <button class="page-btn" ${currentOrderPage === 1 ? 'disabled' : ''} onclick="changeOrderPage(${currentOrderPage - 1})">
            <i class="fas fa-chevron-left"></i> Prev
          </button>
          ${pageBtns}
          <button class="page-btn" ${currentOrderPage === totalPages ? 'disabled' : ''} onclick="changeOrderPage(${currentOrderPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="page-size-wrapper">
          <span>Orders per page:</span>
          <select class="page-size-select" onchange="changeOrderPageSize(this.value)">
            <option value="5" ${ordersPerPage === 5 ? 'selected' : ''}>5</option>
            <option value="10" ${ordersPerPage === 10 ? 'selected' : ''}>10</option>
            <option value="999" ${ordersPerPage === 999 ? 'selected' : ''}>All</option>
          </select>
        </div>
      </div>
    `;
  }

  container.innerHTML = statsHTML + cardsHTML + pagBarHtml;
}

// ---- Copy Order ID Helper ----
function copyOrderId(orderId) {
  navigator.clipboard.writeText(`#${orderId}`).then(() => {
    showToast(`📋 Order ID #${orderId} copied!`);
  }).catch(() => {
    showToast(`📋 Order ID: #${orderId}`);
  });
}

// ---- Helper to find order by ID ----
function findOrderById(orderId) {
  if (currentFetchedOrders && currentFetchedOrders.length > 0) {
    const found = currentFetchedOrders.find(o => o.id == orderId);
    if (found) return found;
  }
  const localOrders = getOrders();
  return localOrders.find(o => o.id == orderId);
}

// ---- Simulate Live Order Progress ----
async function simulateNextStatus(orderId) {
  const order = findOrderById(orderId);
  if (!order) return;

  const sequence = ['Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
  const currentIndex = sequence.indexOf(order.status || 'Confirmed');
  const nextIndex = (currentIndex + 1) % sequence.length;
  const newStatus = sequence[nextIndex];
  order.status = newStatus;

  if (window.API) {
    try {
      await window.API.updateOrderStatus(orderId, newStatus);
    } catch(e) {
      console.warn('API status update failed, local fallback used:', e.message);
    }
  }

  // Also update local storage
  const localOrders = getOrders();
  const locIdx = localOrders.findIndex(o => o.id == orderId);
  if (locIdx !== -1) {
    localOrders[locIdx].status = newStatus;
    localStorage.setItem('quickbite_orders', JSON.stringify(localOrders));
  }

  showToast(`🚀 Order status updated: ${newStatus}`);
  renderOrders();
}

// ---- Invoice / Receipt Modal ----
function openInvoiceModal(orderId) {
  const order = findOrderById(orderId);
  if (!order) return;

  const rawDate = order.createdAt || order.created_at || order.timestamp;
  const date = rawDate ? new Date(rawDate) : new Date();
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const custName = order.customerName || order.customer_name || order.name || 'Valued Customer';

  const payLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery'
    : order.paymentMethod === 'upi' ? 'UPI Online'
    : order.paymentMethod === 'card' ? 'Credit / Debit Card'
    : order.paymentMethod || 'Cash on Delivery';

  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
  const delivery = order.deliveryFee !== undefined ? order.deliveryFee : (order.delivery !== undefined ? order.delivery : (subtotal >= 500 ? 0 : 40));
  const discountAmt = Math.max(0, subtotal + delivery - (order.total || 0));

  const body = document.getElementById('invoiceModalBody');
  if (body) {
    body.innerHTML = `
      <div class="printable-invoice" id="printableInvoice">
        <!-- Header Banner -->
        <div class="invoice-brand-banner">
          <div class="brand-info">
            <div class="brand-logo"><i class="fas fa-bolt"></i> Quick<span>Bite</span></div>
            <div class="brand-tagline">Official Food Order Receipt &amp; Invoice Statement</div>
          </div>
          <div class="invoice-id-badge">
            <span class="inv-id-lbl">ORDER ID</span>
            <strong class="inv-id-val">#${order.id}</strong>
          </div>
        </div>

        <!-- Structured Meta Grid with Clean Labels -->
        <div class="invoice-details-card">
          <div class="inv-meta-row">
            <div class="inv-meta-col">
              <div class="inv-detail-item">
                <span class="inv-lbl"><i class="fas fa-calendar-day"></i> Date:</span>
                <span class="inv-val">${dateStr}, ${timeStr}</span>
              </div>
              <div class="inv-detail-item">
                <span class="inv-lbl"><i class="fas fa-user"></i> Customer:</span>
                <span class="inv-val">${order.name || 'Valued Customer'}</span>
              </div>
              <div class="inv-detail-item">
                <span class="inv-lbl"><i class="fas fa-location-dot"></i> Address:</span>
                <span class="inv-val" title="${order.address || 'N/A'}">${order.address || 'N/A'}</span>
              </div>
            </div>
            <div class="inv-meta-col">
              <div class="inv-detail-item">
                <span class="inv-lbl"><i class="fas fa-circle-check"></i> Status:</span>
                <span class="inv-val inv-status-tag">${order.status || 'Confirmed'}</span>
              </div>
              <div class="inv-detail-item">
                <span class="inv-lbl"><i class="fas fa-phone"></i> Phone:</span>
                <span class="inv-val">${order.phone || 'N/A'}</span>
              </div>
              <div class="inv-detail-item">
                <span class="inv-lbl"><i class="fas fa-wallet"></i> Payment:</span>
                <span class="inv-val">${payLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="invoice-items-table">
          <thead>
            <tr>
              <th style="width:45%;">Item Name</th>
              <th style="text-align:center;width:15%;">Qty</th>
              <th style="text-align:right;width:20%;">Price</th>
              <th style="text-align:right;width:20%;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td class="item-name-td">${item.name}</td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:right;">₹${item.price}</td>
                <td style="text-align:right;font-weight:700;">₹${(item.price || 0) * (item.quantity || 1)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Summary Box -->
        <div class="invoice-summary-card">
          <div class="inv-sum-line">
            <span>Items Subtotal</span>
            <span>₹${subtotal}</span>
          </div>
          <div class="inv-sum-line">
            <span>Delivery Fee</span>
            <span>${delivery === 0 ? '<strong style="color:#22c55e;">FREE</strong>' : '₹' + delivery}</span>
          </div>
          ${discountAmt > 0 ? `
            <div class="inv-sum-line inv-discount-line">
              <span>Promo Code Discount</span>
              <span style="color:#22c55e;">−₹${discountAmt}</span>
            </div>
          ` : ''}
          <div class="inv-sum-line inv-total-line">
            <span>Total Amount Paid</span>
            <span class="inv-final-price">₹${order.total}</span>
          </div>
        </div>
      </div>
    `;
  }

  const modal = document.getElementById('invoiceModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeInvoiceModal() {
  const modal = document.getElementById('invoiceModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ---- Dedicated Print Function (1 Page Only, Zero Margin, Zero Offset) ----
function printInvoice() {
  const printableEl = document.getElementById('printableInvoice');
  if (!printableEl) return;

  const invoiceHTML = printableEl.outerHTML;

  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <title>Order Receipt - QuickBite</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Poppins', system-ui, sans-serif;
          background: #ffffff;
          color: #0f172a;
          padding: 16px;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .printable-invoice {
          max-width: 720px;
          margin: 0 auto;
        }
        .invoice-brand-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 16px;
        }
        .brand-logo { font-size: 22px; font-weight: 800; color: #0f172a; }
        .brand-logo i, .brand-logo span { color: #ff6b35; }
        .brand-tagline { font-size: 11.5px; color: #64748b; margin-top: 2px; }
        .invoice-id-badge { text-align: right; }
        .inv-id-lbl { font-size: 10px; letter-spacing: 0.8px; color: #64748b; font-weight: 600; }
        .inv-id-val { font-size: 18px; color: #ff6b35; font-weight: 800; display: block; }

        .invoice-details-card {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 16px;
        }
        .inv-meta-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
        }
        .inv-detail-item {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          font-size: 13px;
          margin-bottom: 6px;
          overflow: hidden;
        }
        .inv-lbl { color: #64748b; font-weight: 500; display: flex; align-items: center; gap: 5px; white-space: nowrap; min-width: 75px; flex-shrink: 0; }
        .inv-lbl i { color: #ff6b35; font-size: 12px; }
        .inv-val { color: #0f172a; font-weight: 600; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .inv-status-tag { color: #16a34a; font-weight: 700; }

        .invoice-items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 13.5px;
        }
        .invoice-items-table th, .invoice-items-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
        }
        .invoice-items-table th {
          background: #f1f5f9;
          color: #334155;
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
          border-bottom: 2px solid #cbd5e1;
        }
        .invoice-items-table td { color: #1e293b; }
        .item-name-td { font-weight: 600; color: #0f172a !important; }

        .invoice-summary-card {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 16px 20px;
        }
        .inv-sum-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 13.5px;
          color: #334155;
        }
        .inv-sum-line.inv-total-line {
          border-top: 2px solid #cbd5e1;
          padding-top: 10px;
          margin-top: 10px;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }
        .inv-final-price { color: #ff6b35; font-size: 22px; font-weight: 800; }

        @media print {
          body { padding: 0; }
          .printable-invoice { max-width: 100%; }
        }
      </style>
    </head>
    <body>
      ${invoiceHTML}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 350);
}

// Clear all order history
function clearOrdersAndRefresh() {
  if (!confirm('Are you sure you want to clear your order history?')) return;
  localStorage.removeItem('quickbite_orders');
  showToast('🗑️ Order history cleared');
  renderOrders();
}

// Reorder by ID reference
function reorderById(orderId) {
  const order = findOrderById(orderId);
  if (!order || !order.items || order.items.length === 0) {
    showToast('❌ Could not reorder — no items found');
    return;
  }
  order.items.forEach(item => {
    for (let i = 0; i < (item.quantity || 1); i++) {
      addToCart(item);
    }
  });
  showToast('🛒 Items added to cart!');
  setTimeout(() => window.location.href = 'cart.html', 800);
}
