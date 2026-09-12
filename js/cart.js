// ==========================================
// QuickBite - Cart Manager (localStorage)
// Developer: Mohd Fahad
// ==========================================

const CART_KEY = 'quickbite_cart';
const ORDERS_KEY = 'quickbite_orders';

// ---- Cart CRUD ----
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(c => c.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
  showToast(`${item.name} added to cart`);
}

function removeFromCart(itemId) {
  const cart = getCart().filter(c => c.id !== itemId);
  saveCart(cart);
}

function updateQuantity(itemId, delta) {
  const cart = getCart();
  const idx = cart.findIndex(c => c.id === itemId);
  if (idx === -1) return;
  cart[idx].quantity += delta;
  if (cart[idx].quantity <= 0) {
    cart.splice(idx, 1);
  }
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ---- Badge Update ----
function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('#cartBadge, #cartBadgeTop').forEach(el => {
    if (el) el.textContent = count;
  });
}

// ---- Toast ----
function showToast(msg) {
  let toast = document.getElementById('qb-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'qb-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ---- Orders ----
async function saveOrderAsync(orderData) {
  const cartItems = getCart();
  const subtotal = getCartTotal();
  const delivery = subtotal >= 500 ? 0 : 40;
  const finalTotal = orderData.total || (subtotal + delivery);

  const payload = {
    customerName: orderData.name,
    phone: orderData.phone,
    address: orderData.address,
    paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
    items: cartItems,
    subtotal: subtotal,
    deliveryFee: delivery,
    discountAmount: Math.round(subtotal * (orderData.discount || 0)),
    total: finalTotal
  };

  let createdOrder = null;
  if (window.API) {
    try {
      createdOrder = await window.API.createOrder(payload);
    } catch (e) {
      console.warn('API order placement failed, falling back to local:', e.message);
    }
  }

  if (!createdOrder) {
    createdOrder = {
      id: 'QB' + Date.now(),
      customerName: orderData.name,
      phone: orderData.phone,
      address: orderData.address,
      paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
      items: cartItems,
      subtotal: subtotal,
      deliveryFee: delivery,
      discountAmount: 0,
      total: finalTotal,
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    };
  }

  // Sync to local storage for instant offline availability
  const orders = getOrders();
  orders.unshift(createdOrder);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  clearCart();
  return createdOrder;
}

function saveOrder(orderData) {
  const cartItems = getCart();
  const subtotal = getCartTotal();
  const delivery = subtotal >= 500 ? 0 : 40;
  const finalTotal = orderData.total || (subtotal + delivery);

  const payload = {
    customerName: orderData.name,
    phone: orderData.phone,
    address: orderData.address,
    paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
    items: cartItems,
    subtotal: subtotal,
    deliveryFee: delivery,
    discountAmount: Math.round(subtotal * (orderData.discount || 0)),
    total: finalTotal
  };

  const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  const localOrder = {
    id: orderId,
    customerName: orderData.name,
    phone: orderData.phone,
    address: orderData.address,
    paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
    items: cartItems,
    subtotal: subtotal,
    deliveryFee: delivery,
    total: finalTotal,
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  if (window.API) {
    window.API.createOrder(payload).then(res => {
      console.log('✅ Order synced to MySQL database:', res);
    }).catch(err => {
      console.warn('⚠️ Order saved locally, DB sync pending:', err.message);
    });
  }

  const orders = getOrders();
  orders.unshift(localOrder);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  clearCart();
  return localOrder;
}

function getOrders() {
  return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
}


// ---- Navbar scroll ----
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }
});

// ---- Hamburger + Mobile Nav ----
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  // Footer year 2024
  document.querySelectorAll('.footer-year').forEach(el => {
    el.textContent = '2024';
  });

  // Hero location search — press Enter to go to menu
  const locInput = document.getElementById('locationInput');
  if (locInput) {
    locInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') window.location.href = 'menu.html';
    });
  }

  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('open');
    });
    // Close nav when any link inside is clicked (mobile UX)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createFoodCard(item) {
  const catColor = CATEGORIES.find(c => c.id === item.category)?.color || '#ff6b35';
  const catName  = CATEGORIES.find(c => c.id === item.category)?.name  || item.category;

  const origPrice = item.originalPrice || item.original_price || Math.round(item.price * 1.25);
  const discount = Math.max(5, Math.round(((origPrice - item.price) / origPrice) * 100));
  const isVegItem = item.veg !== undefined ? Boolean(item.veg) : Boolean(item.isVeg);
  const isSpicyItem = item.spicy !== undefined ? Boolean(item.spicy) : Boolean(item.isSpicy);
  const itemDesc = item.desc || item.description || '';
  const prepTime = item.time || '20-25 min';
  const isOut = Boolean(item.outOfStock || item.out_of_stock);

  return `
    <div class="food-card ${isOut ? 'out-of-stock-card' : ''}" data-id="${item.id}">
      <div class="food-card-img-wrap">
        <img
          src="${item.image}"
          alt="${escapeHtml(item.name)}"
          class="food-card-img"
          loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
        />
        <div class="food-card-icon-fallback" style="display:none;">${getCategoryIcon(item.category)}</div>
        <div class="food-card-img-overlay"></div>

        <!-- Top badges -->
        <div class="food-card-badges">
          ${discount > 0 ? `<span class="food-card-discount">-${discount}%</span>` : ''}
          ${isVegItem
            ? '<span class="food-card-veg-dot veg" title="Vegetarian"></span>'
            : '<span class="food-card-veg-dot nonveg" title="Non-vegetarian"></span>'
          }
        </div>

        <!-- Category chip -->
        <div class="food-card-cat-chip" style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}44;">
          ${catName}
        </div>

        <!-- Spicy badge -->
        ${isSpicyItem ? '<div class="food-card-spicy"><i class="fas fa-pepper-hot"></i> Spicy</div>' : ''}
      </div>

      <div class="food-card-body">
        <h3 class="food-card-name">${escapeHtml(item.name)}</h3>
        <p class="food-card-desc">${escapeHtml(itemDesc)}</p>

        <div class="food-card-meta">
          <span class="food-card-rating">⭐ ${item.rating || 4.8} <span class="food-card-reviews">(${item.reviews || 10})</span></span>
          <span class="food-card-time"><i class="fas fa-clock"></i> ${prepTime}</span>
        </div>

        <div class="food-card-footer">
          <div class="food-card-price-wrap">
            <span class="food-card-price">₹${item.price}</span>
            <span class="food-card-original">₹${origPrice}</span>
          </div>
          ${isOut ? `
            <button class="btn-add-cart out-of-stock" disabled style="opacity:0.6;cursor:not-allowed;background:#64748b;">
              <i class="fas fa-ban"></i> Out of Stock
            </button>
          ` : `
            <button class="btn-add-cart" onclick="handleAddToCart(${item.id}, this)" id="add-btn-${item.id}">
              <i class="fas fa-plus"></i> Add
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

function handleAddToCart(itemId, btn) {
  const item = getItemById(itemId);
  if (!item) return;
  addToCart(item);
  btn.classList.add('added');
  btn.innerHTML = '<i class="fas fa-check"></i> Added!';
  setTimeout(() => {
    btn.classList.remove('added');
    btn.innerHTML = '<i class="fas fa-plus"></i> Add';
  }, 1500);
}
