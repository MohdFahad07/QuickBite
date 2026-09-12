// ==========================================
// QuickBite - Cart Page Logic
// Developer: Mohd Fahad
// ==========================================

let discount = 0;

document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();

  // Modal overlay close
  const orderModal = document.getElementById('orderModal');
  const successModal = document.getElementById('successModal');

  if (orderModal) {
    orderModal.addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
  }
  if (successModal) {
    successModal.addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('open');
    });
  }
});

// ---- Totals helper ----
function getDelivery(subtotal) {
  return subtotal >= 500 ? 0 : 40;
}

function getDiscountedTotal() {
  const subtotal = getCartTotal();
  const delivery = getDelivery(subtotal);
  const discountAmt = Math.round(subtotal * discount);
  return Math.max(0, subtotal + delivery - discountAmt);
}

// ---- Render Cart Page ----
function renderCartPage() {
  const cart = getCart();
  const layout = document.getElementById('cartLayout');
  if (!layout) return;

  if (cart.length === 0) {
    layout.classList.add('is-empty');
    layout.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon-ring">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <h3>Your Cart is Empty!</h3>
        <p>Explore our gourmet menu to add tasty pizzas, burgers, biryanis &amp; more.</p>
        <div class="empty-state-pills">
          <span class="empty-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            30-Min Delivery
          </span>
          <span class="empty-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            Best Discounts
          </span>
          <span class="empty-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            100% Hygiene
          </span>
        </div>
        <a href="menu.html" class="btn-primary empty-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
          Explore Menu
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>
      </div>
    `;
    return;
  }

  layout.classList.remove('is-empty');
  const subtotal = getCartTotal();
  const delivery = getDelivery(subtotal);
  const discountAmt = Math.round(subtotal * discount);
  const total = Math.max(0, subtotal + delivery - discountAmt);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  layout.innerHTML = `
    <div class="cart-items-panel">
      <div class="cart-items-header">
        <h2><i class="fas fa-bag-shopping"></i> Shopping Cart <span class="cart-count-badge">(${cart.length} ${cart.length === 1 ? 'item' : 'items'})</span></h2>
        <button onclick="clearCartAndRefresh()" class="btn-clear-all">
          <i class="fas fa-trash-alt"></i> Clear All
        </button>
      </div>

      ${cart.map(item => {
        const catColor = CATEGORIES.find(c => c.id === item.category)?.color || '#ff6b35';
        const catName  = CATEGORIES.find(c => c.id === item.category)?.name  || item.category;

        return `
          <div class="cart-item" id="cart-item-${item.id}">
            <!-- Real Food Photo Thumbnail -->
            <div class="cart-item-thumb-wrap">
              <img
                src="${item.image}"
                alt="${item.name}"
                class="cart-item-thumb"
                loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
              />
              <div class="cart-item-fallback" style="display:none;">${getCategoryIcon(item.category)}</div>
            </div>

            <div class="cart-item-info">
              <div class="cart-item-cat" style="color:${catColor};">
                <span class="cat-dot" style="background:${catColor};"></span> ${catName}
              </div>
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">
                ₹${item.price * item.quantity}
                <span class="price-breakdown">₹${item.price} × ${item.quantity}</span>
              </div>
            </div>

            <div class="cart-item-controls">
              <div class="qty-control">
                <button class="qty-btn ${item.quantity === 1 ? 'qty-remove' : ''}" onclick="changeQty(${item.id}, -1)" title="${item.quantity === 1 ? 'Remove item' : 'Decrease'}">
                  <i class="${item.quantity === 1 ? 'fas fa-trash-can' : 'fas fa-minus'}"></i>
                </button>
                <span class="qty-num">${item.quantity}</span>
                <button class="qty-btn" onclick="changeQty(${item.id}, 1)" title="Increase">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}

      <div class="cart-actions-row">
        <a href="menu.html" class="btn-continue-shop">
          <i class="fas fa-arrow-left"></i> Continue Shopping
        </a>
      </div>
    </div>

    <!-- Order Summary Sidebar -->
    <div class="order-summary">
      <h2>Order Summary</h2>

      <!-- Promo Code Box in Sidebar -->
      <div class="cart-promo-box">
        <label><i class="fas fa-ticket"></i> Have a Promo Code?</label>
        <div class="promo-input-row">
          <input type="text" id="sidebarPromoCode" placeholder="e.g. QUICKBITE50" value="${discount > 0 ? (discount === 0.5 ? 'QUICKBITE50' : discount === 0.2 ? 'FAHAD20' : 'NEWUSER') : ''}"/>
          <button type="button" onclick="applySidebarPromo()" class="btn-apply-promo">Apply</button>
        </div>
        <div id="sidebarPromoMsg" class="sidebar-promo-msg ${discount > 0 ? 'success' : ''}">
          ${discount > 0 ? `✓ Code applied! (${Math.round(discount * 100)}% OFF)` : ''}
        </div>
      </div>

      <div class="summary-divider"></div>

      <div class="summary-row">
        <span>Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})</span>
        <span>₹${subtotal}</span>
      </div>
      <div class="summary-row">
        <span>Delivery Fee</span>
        <span>${delivery === 0
          ? '<span class="free-badge"><i class="fas fa-bolt"></i> FREE</span>'
          : '₹' + delivery}
        </span>
      </div>

      ${discountAmt > 0 ? `
        <div class="summary-row discount-row">
          <span>🎟️ Promo Discount (${Math.round(discount * 100)}%)</span>
          <span>−₹${discountAmt}</span>
        </div>
      ` : ''}

      ${subtotal < 500 && delivery > 0 ? `
        <div class="free-delivery-note">
          🚚 Add <strong>₹${500 - subtotal}</strong> more for <strong>FREE Delivery!</strong>
        </div>
      ` : ''}

      <div class="summary-divider"></div>
      <div class="summary-row total">
        <span>Total Payable</span>
        <span>₹${total}</span>
      </div>

      <button class="btn-checkout" onclick="openCheckout()">
        <i class="fas fa-lock"></i> Proceed to Checkout
      </button>

      <div class="secure-badge">
        <i class="fas fa-shield-halved"></i> 100% Safe &amp; Secure Checkout
      </div>
    </div>
  `;
}

async function applySidebarPromo() {
  const input = document.getElementById('sidebarPromoCode');
  const code = input ? input.value.trim().toUpperCase() : '';
  const msg = document.getElementById('sidebarPromoMsg');
  if (!msg) return;

  if (!code) {
    discount = 0;
    msg.className = 'sidebar-promo-msg error';
    msg.textContent = 'Please enter a coupon code';
    renderCartPage();
    return;
  }

  let validPromo = null;
  if (window.API) {
    try {
      const res = await window.API.validatePromo(code);
      if (res && res.discount_pct) {
        validPromo = { pct: res.discount_pct };
      }
    } catch (e) {
      console.warn('API promo check failed, fallback to local promos:', e.message);
    }
  }

  if (!validPromo) {
    const localPromos = {
      'WELCOME20': { pct: 20 },
      'QUICK50': { pct: 50 },
      'QUICKBITE50': { pct: 50 },
      'FAHAD20': { pct: 20 },
      'NEWUSER': { pct: 15 },
      'FESTIVE100': { pct: 15 }
    };
    validPromo = localPromos[code];
  }

  if (validPromo && validPromo.pct) {
    discount = validPromo.pct / 100;
    msg.className = 'sidebar-promo-msg success';
    msg.textContent = `🎉 ${code} Applied! ${validPromo.pct}% OFF`;
  } else {
    discount = 0;
    msg.className = 'sidebar-promo-msg error';
    msg.textContent = '❌ Invalid or expired promo code';
  }

  renderCartPage();
}

function changeQty(itemId, delta) {
  updateQuantity(itemId, delta);
  renderCartPage();
}

function deleteItem(itemId) {
  removeFromCart(itemId);
  showToast('🗑️ Item removed from cart');
  renderCartPage();
}

function clearCartAndRefresh() {
  if (getCart().length === 0) return;
  if (confirm('Remove all items from your cart?')) {
    clearCart();
    showToast('🗑️ Cart cleared');
    renderCartPage();
  }
}

// ---- Checkout Modal ----
function openCheckout() {
  const subtotal = getCartTotal();
  const total = getDiscountedTotal();
  const savings = Math.round(subtotal * discount);

  const modalTotal = document.getElementById('modalTotal');
  if (modalTotal) modalTotal.textContent = `₹${total}`;

  const tagRow = document.getElementById('modalDiscountTagRow');
  if (tagRow) {
    if (discount > 0 && savings > 0) {
      const pct = Math.round(discount * 100);
      tagRow.style.display = 'flex';
      tagRow.innerHTML = `
        <div class="modal-discount-pill">
          <span class="ticket-icon-box"><i class="fas fa-ticket"></i></span>
          <span class="discount-title">Coupon Applied</span>
          <span class="discount-pct-badge">${pct}% OFF</span>
        </div>
        <div class="modal-discount-savings">
          <i class="fas fa-circle-check"></i> Saved ₹${savings}
        </div>
      `;
    } else {
      tagRow.style.display = 'none';
      tagRow.innerHTML = '';
    }
  }

  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}


// ---- Submit Order ----
async function submitOrder(e) {
  e.preventDefault();

  const name    = document.getElementById('custName')?.value.trim();
  const phone   = document.getElementById('custPhone')?.value.trim();
  const address = document.getElementById('custAddress')?.value.trim();
  const pay     = document.getElementById('payMethod')?.value;
  const submitBtn = e.target.querySelector('[type="submit"]');

  // Validation
  if (!name || !phone || !address) {
    showToast('❌ Please fill all required fields');
    return;
  }
  if (!/^[\d\s\+\-]{7,15}$/.test(phone)) {
    showToast('❌ Please enter a valid phone number');
    return;
  }
  if (getCart().length === 0) {
    showToast('❌ Your cart is empty!');
    return;
  }

  // Show loading state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
  }

  try {
    const subtotal = getCartTotal();
    const delivery = subtotal >= 500 ? 0 : 40;
    const discountAmt = Math.round(subtotal * discount);
    const finalTotal = Math.max(0, subtotal + delivery - discountAmt);

    const order = await saveOrderAsync({
      name, phone, address,
      paymentMethod: pay,
      discount: discount,
      total: finalTotal
    });

    // Close order modal, show success
    closeModal();
    document.getElementById('orderForm').reset();

    const successMsg = document.getElementById('successMsg');
    if (successMsg) successMsg.textContent = `Order #${order.id} confirmed for ${name}!`;
    const successModal = document.getElementById('successModal');
    if (successModal) successModal.classList.add('open');

    discount = 0;
    renderCartPage();
  } catch (err) {
    showToast('❌ Failed to place order. Please try again.');
    console.error('Order placement error:', err);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-circle-check"></i> Confirm &amp; Place Order';
    }
  }
}
