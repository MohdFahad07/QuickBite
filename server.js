const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const db = require('./config/db');
const setupDatabase = require('./db/setup');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Header Middleware with Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Disabled CSP so external image URLs & CDNs load smoothly
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser with Payload Size limits to prevent DoS attacks
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Global Rate Limiter for general API calls
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Strict Rate Limiter for Order Submission
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Limit each IP to 20 orders per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Order submission limit reached. Please wait a few minutes.' }
});

app.use('/api/', globalLimiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Input Sanitizer helper to prevent Stored XSS
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Helper to format menu item booleans & properties safely
function formatMenuItem(row) {
  const descText = row.description || row.desc || '';
  const isVegVal = Boolean(row.is_veg !== undefined ? row.is_veg : row.veg);
  const isSpicyVal = Boolean(row.is_spicy !== undefined ? row.is_spicy : row.spicy);
  const priceVal = Number(row.price);
  const origPriceVal = row.original_price ? Number(row.original_price) : (row.originalPrice ? Number(row.originalPrice) : Math.round(priceVal * 1.25));

  return {
    id: row.id,
    name: row.name,
    description: descText,
    desc: descText,
    price: priceVal,
    originalPrice: origPriceVal,
    image: row.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    isVeg: isVegVal,
    veg: isVegVal,
    isSpicy: isSpicyVal,
    spicy: isSpicyVal,
    isPopular: Boolean(row.is_popular !== undefined ? row.is_popular : row.isPopular),
    featured: Boolean(row.featured),
    outOfStock: Boolean(row.out_of_stock !== undefined ? row.out_of_stock : row.outOfStock),
    rating: Number(row.rating) || 4.8,
    reviews: Number(row.reviews) || 10,
    time: row.time || '20-25 min',
    category: row.category_id || row.category
  };
}

// -------------------------------------------------------------
// 1. CATEGORIES API
// -------------------------------------------------------------
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API Error /api/categories:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve categories' });
  }
});

app.post('/api/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, name, color, bg, image } = req.body;
    if (!id || !name) return res.status(400).json({ success: false, message: 'Category ID and Name required' });

    const cleanId = sanitizeString(id).toLowerCase().replace(/\s+/g, '-');
    const cleanName = sanitizeString(name);
    const cleanColor = sanitizeString(color || '#ff6b35');
    const cleanBg = sanitizeString(bg || 'rgba(255,107,53,0.12)');
    const cleanImg = sanitizeString(image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80');

    await db.query(
      'INSERT INTO categories (id, name, color, bg, image) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, color=?, bg=?, image=?',
      [cleanId, cleanName, cleanColor, cleanBg, cleanImg, cleanName, cleanColor, cleanBg, cleanImg]
    );
    res.status(201).json({ success: true, message: 'Category saved successfully' });
  } catch (err) {
    console.error('API Error POST /api/categories:', err);
    res.status(500).json({ success: false, message: 'Failed to save category' });
  }
});

app.delete('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cleanId = sanitizeString(req.params.id);
    if (cleanId === 'all') return res.status(400).json({ success: false, message: 'Cannot delete default category' });
    await db.query('DELETE FROM categories WHERE id = ?', [cleanId]);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('API Error DELETE /api/categories/:id:', err);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

// -------------------------------------------------------------
// 2. MENU ITEMS API
// -------------------------------------------------------------
app.get('/api/menu', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM menu_items WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category_id = ?';
      params.push(sanitizeString(category));
    }
    if (search) {
      const cleanSearch = sanitizeString(search);
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${cleanSearch}%`, `%${cleanSearch}%`);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await db.query(query, params);
    const formatted = rows.map(formatMenuItem);
    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('API Error /api/menu:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
  }
});

app.get('/api/menu/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const [rows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, data: formatMenuItem(rows[0]) });
  } catch (err) {
    console.error('API Error /api/menu/:id:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch item details' });
  }
});

app.post('/api/menu', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { category, name, description, price, originalPrice, image, isVeg, isSpicy, isPopular, featured, outOfStock } = req.body;
    
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
    }

    const cleanName = sanitizeString(name);
    const cleanDesc = sanitizeString(description || '');
    const cleanCategory = sanitizeString(category);
    const cleanImage = sanitizeString(image || '');
    const numPrice = parseFloat(price);

    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid price value' });
    }

    const [result] = await db.query(
      `INSERT INTO menu_items (category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, out_of_stock) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanCategory,
        cleanName,
        cleanDesc,
        numPrice,
        originalPrice ? parseFloat(originalPrice) : null,
        cleanImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        Boolean(isVeg),
        Boolean(isSpicy),
        Boolean(isPopular),
        Boolean(featured),
        Boolean(outOfStock)
      ]
    );

    const [newItem] = await db.query('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: formatMenuItem(newItem[0]), message: 'Menu item created successfully' });
  } catch (err) {
    console.error('API Error POST /api/menu:', err);
    res.status(500).json({ success: false, message: 'Failed to create menu item' });
  }
});

app.put('/api/menu/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const { category, name, description, price, originalPrice, image, isVeg, isSpicy, isPopular, featured, outOfStock } = req.body;
    
    const cleanName = sanitizeString(name);
    const cleanDesc = sanitizeString(description || '');
    const cleanCategory = sanitizeString(category);
    const cleanImage = sanitizeString(image || '');
    const numPrice = parseFloat(price);

    await db.query(
      `UPDATE menu_items SET 
        category_id = ?, name = ?, description = ?, price = ?, original_price = ?, 
        image = ?, is_veg = ?, is_spicy = ?, is_popular = ?, featured = ?, out_of_stock = ?
       WHERE id = ?`,
      [
        cleanCategory,
        cleanName,
        cleanDesc,
        numPrice,
        originalPrice ? parseFloat(originalPrice) : null,
        cleanImage,
        Boolean(isVeg),
        Boolean(isSpicy),
        Boolean(isPopular),
        Boolean(featured),
        Boolean(outOfStock),
        id
      ]
    );

    const [updated] = await db.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (updated.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, data: formatMenuItem(updated[0]), message: 'Menu item updated successfully' });
  } catch (err) {
    console.error('API Error PUT /api/menu/:id:', err);
    res.status(500).json({ success: false, message: 'Failed to update menu item' });
  }
});

app.patch('/api/menu/:id/stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const { outOfStock } = req.body;
    await db.query('UPDATE menu_items SET out_of_stock = ? WHERE id = ?', [Boolean(outOfStock), id]);
    const [updated] = await db.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    res.json({ success: true, data: formatMenuItem(updated[0]), message: 'Stock status updated' });
  } catch (err) {
    console.error('API Error PATCH /api/menu/:id/stock:', err);
    res.status(500).json({ success: false, message: 'Failed to update stock status' });
  }
});

app.delete('/api/menu/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

    await db.query('DELETE FROM menu_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) {
    console.error('API Error DELETE /api/menu/:id:', err);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
});

// -------------------------------------------------------------
// 3. PROMO CODES API
// -------------------------------------------------------------
app.get('/api/promos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API Error GET /api/promos:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch promo codes' });
  }
});

app.post('/api/promos/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Promo code required' });

    const cleanCode = sanitizeString(code).toUpperCase();
    const [rows] = await db.query('SELECT * FROM promo_codes WHERE code = ? AND is_active = TRUE', [cleanCode]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired promo code' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('API Error POST /api/promos/validate:', err);
    res.status(500).json({ success: false, message: 'Error validating promo code' });
  }
});

app.post('/api/promos', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { code, discount_pct } = req.body;
    if (!code || !discount_pct) {
      return res.status(400).json({ success: false, message: 'Code and discount percentage are required' });
    }
    const cleanCode = sanitizeString(code).toUpperCase();
    const numPct = parseInt(discount_pct);
    if (isNaN(numPct) || numPct < 1 || numPct > 100) {
      return res.status(400).json({ success: false, message: 'Discount percentage must be between 1 and 100' });
    }

    await db.query('INSERT INTO promo_codes (code, discount_pct) VALUES (?, ?) ON DUPLICATE KEY UPDATE discount_pct = ?', [cleanCode, numPct, numPct]);
    res.json({ success: true, message: 'Promo code saved successfully' });
  } catch (err) {
    console.error('API Error POST /api/promos:', err);
    res.status(500).json({ success: false, message: 'Failed to save promo code' });
  }
});

app.delete('/api/promos/:code', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cleanCode = sanitizeString(req.params.code).toUpperCase();
    await db.query('DELETE FROM promo_codes WHERE code = ?', [cleanCode]);
    res.json({ success: true, message: 'Promo code deleted' });
  } catch (err) {
    console.error('API Error DELETE /api/promos/:code:', err);
    res.status(500).json({ success: false, message: 'Failed to delete promo code' });
  }
});

// -------------------------------------------------------------
// 4. ORDERS API
// -------------------------------------------------------------
app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = rows.map(r => ({
      id: r.id,
      customerName: r.customer_name,
      phone: r.phone,
      address: r.address,
      paymentMethod: r.payment_method,
      status: r.status,
      subtotal: Number(r.subtotal),
      deliveryFee: Number(r.delivery_fee),
      discountAmount: Number(r.discount_amount),
      total: Number(r.total),
      items: typeof r.order_items === 'string' ? JSON.parse(r.order_items) : r.order_items,
      createdAt: r.created_at
    }));
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('API Error GET /api/orders:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch customer orders' });
  }
});

app.post('/api/orders', orderLimiter, async (req, res) => {
  try {
    const { customerName, phone, address, paymentMethod, items, subtotal, deliveryFee, discountAmount, total } = req.body;

    if (!customerName || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required order details' });
    }

    const cleanName = sanitizeString(customerName);
    const cleanPhone = sanitizeString(phone);
    const cleanAddress = sanitizeString(address);
    const cleanPayment = sanitizeString(paymentMethod || 'Cash on Delivery');

    // Phone validation (digits, spaces, hyphens, plus)
    if (!/^[\d\s\+\-]{7,20}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    // Sanitize item names and descriptions in items payload
    const sanitizedItems = items.map(item => ({
      id: item.id,
      name: sanitizeString(item.name || ''),
      price: Number(item.price) || 0,
      quantity: Math.max(1, parseInt(item.quantity) || 1),
      image: sanitizeString(item.image || '')
    }));

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const orderItemsJson = JSON.stringify(sanitizedItems);

    await db.query(
      `INSERT INTO orders (id, customer_name, phone, address, payment_method, status, subtotal, delivery_fee, discount_amount, total, order_items) 
       VALUES (?, ?, ?, ?, ?, 'Confirmed', ?, ?, ?, ?, ?)`,
      [
        orderId,
        cleanName,
        cleanPhone,
        cleanAddress,
        cleanPayment,
        parseFloat(subtotal) || 0,
        parseFloat(deliveryFee) || 0,
        parseFloat(discountAmount) || 0,
        parseFloat(total) || 0,
        orderItemsJson
      ]
    );

    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const r = rows[0];
    const createdOrder = {
      id: r.id,
      customerName: r.customer_name,
      phone: r.phone,
      address: r.address,
      paymentMethod: r.payment_method,
      status: r.status,
      subtotal: Number(r.subtotal),
      deliveryFee: Number(r.delivery_fee),
      discountAmount: Number(r.discount_amount),
      total: Number(r.total),
      items: JSON.parse(r.order_items),
      createdAt: r.created_at
    };

    res.status(201).json({ success: true, data: createdOrder, message: 'Order placed successfully!' });
  } catch (err) {
    console.error('API Error POST /api/orders:', err);
    res.status(500).json({ success: false, message: 'Failed to place order. Please try again.' });
  }
});

app.patch('/api/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cleanId = sanitizeString(req.params.id);
    const { status } = req.body;
    const cleanStatus = sanitizeString(status);

    const validStatuses = ['Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
    if (!validStatuses.includes(cleanStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    await db.query('UPDATE orders SET status = ? WHERE id = ?', [cleanStatus, cleanId]);
    res.json({ success: true, message: `Order status updated to ${cleanStatus}` });
  } catch (err) {
    console.error('API Error PATCH /api/orders/:id/status:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

app.delete('/api/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cleanId = sanitizeString(req.params.id);
    await db.query('DELETE FROM orders WHERE id = ?', [cleanId]);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    console.error('API Error DELETE /api/orders/:id:', err);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
});

// -------------------------------------------------------------
// 5. STATS API FOR ADMIN
// -------------------------------------------------------------
app.get('/api/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalRevenue }]] = await db.query('SELECT COALESCE(SUM(total), 0) AS totalRevenue FROM orders');
    const [[{ totalMenu }]] = await db.query('SELECT COUNT(*) AS totalMenu FROM menu_items');
    const [[{ outOfStock }]] = await db.query('SELECT COUNT(*) AS outOfStock FROM menu_items WHERE out_of_stock = TRUE');
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: Number(totalRevenue),
        totalMenu,
        outOfStock,
        totalUsers
      }
    });
  } catch (err) {
    console.error('API Error GET /api/stats:', err);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
});

// Admin User Accounts API
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, phone, address, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('API Error GET /api/users:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch user accounts' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid User ID' });
    if (req.user.id === id) return res.status(400).json({ success: false, message: 'Cannot delete active logged-in admin account' });

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User account deleted successfully' });
  } catch (err) {
    console.error('API Error DELETE /api/users/:id:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user account' });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'quickbite_super_secret_jwt_key_2026';

// Auth Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware to require admin role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin privileges required' });
  }
  next();
}

// -------------------------------------------------------------
// DISPOSABLE / TEMP EMAIL FILTER & OTP VERIFICATION STORE
// -------------------------------------------------------------
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'mailinator.com', '10minutemail.com',
  'guerrillamail.com', 'trashmail.com', 'throwawaymail.com', 'yopmail.com',
  'sharklasers.com', 'dispostable.com', 'getnada.com', 'maildrop.cc',
  'crazymailing.com', 'tmailor.com', 'disposablemail.com', 'generator.email',
  'emailondeck.com', 'tempmail.net', 'fakemailgenerator.com', 'mohmal.com',
  'tempmailo.com', 'boun.cr', 'burnermail.io', 'mailsac.com', 'dropmail.me',
  'inboxkitten.com', 'nada.ltd', 'mytemp.email', 'tempinbox.com', 'mailcatch.com',
  'guerrillamailblock.com', 'pokemail.net', 'spamgourmet.com', 'trashmail.net'
]);

function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const clean = email.trim().toLowerCase();
  const parts = clean.split('@');
  if (parts.length !== 2) return true;
  const domain = parts[1];

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;

  const suspiciousPatterns = ['temp', 'disposable', 'trash', 'fake', 'burner', 'throwaway', '10min', 'guerrilla'];
  if (suspiciousPatterns.some(p => domain.includes(p))) return true;

  const invalidTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.tmp'];
  if (invalidTLDs.some(tld => domain.endsWith(tld))) return true;

  return false;
}

// Nodemailer Real Email Sending Helper
async function sendRealEmailOTP(toEmail, otpCode, userName) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;

  if (!smtpUser || !smtpPass) {
    console.log(`ℹ️ [SMTP Info] Real email credentials not set in .env (SMTP_USER & SMTP_PASS). Running in demo mode.`);
    return { sent: false, reason: 'no_credentials' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #0f0f1a; padding: 40px 20px; color: #ffffff; text-align: center;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #16162a; border: 1px solid #ff6b35; border-radius: 20px; padding: 32px; box-shadow: 0 12px 40px rgba(0,0,0,0.6);">
          <h1 style="color: #ff6b35; margin-bottom: 4px; font-size: 28px;">⚡ QuickBite</h1>
          <p style="color: #a0aec0; font-size: 13px; margin-top: 0;">Online Food Delivery Verification</p>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />
          
          <h2 style="font-size: 20px; color: #ffffff; margin-bottom: 10px;">Verify Your Email Address</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">Hi <strong>${userName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">Use the 6-digit verification code below to complete your registration:</p>

          <div style="background: rgba(255, 107, 53, 0.15); border: 2px dashed #ff6b35; border-radius: 14px; padding: 18px; margin: 24px 0; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ff6b35;">
            ${otpCode}
          </div>

          <p style="color: #a0aec0; font-size: 12px;">This code expires in 10 minutes. If you did not request this email, please ignore it.</p>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0 16px;" />
          <p style="color: #64748b; font-size: 11px; margin: 0;">🔒 Encrypted & Secured by QuickBite Authentication Engine</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"QuickBite Food Delivery" <no-reply@quickbite.com>',
      to: toEmail,
      subject: `⚡ Your QuickBite Verification Code: ${otpCode}`,
      html: htmlContent
    });

    console.log(`✅ [REAL EMAIL SENT] OTP ${otpCode} delivered to ${toEmail}`);
    return { sent: true };
  } catch (emailErr) {
    console.error(`❌ [SMTP Error] Email delivery failed:`, emailErr.message);
    return { sent: false, error: emailErr.message };
  }
}

// In-memory OTP Store (email -> { otp, expiresAt, signupData })
const otpStore = new Map();

// -------------------------------------------------------------
// 6. AUTHENTICATION API (SIGNUP, OTP VERIFICATION, LOGIN, PROFILE)
// -------------------------------------------------------------

// Step 1: Send Email Verification OTP
app.post('/api/auth/send-otp', authLimiter, async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const cleanName = sanitizeString(name);
    const cleanEmail = sanitizeString(email).toLowerCase();
    const cleanPhone = sanitizeString(phone || '');
    const cleanAddress = sanitizeString(address || '');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email format' });
    }

    if (isDisposableEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: '🚫 Temporary or disposable emails are strictly not allowed. Please use a valid email address (e.g. Gmail, Outlook, Yahoo).'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please login instead.' });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanEmail, {
      otp,
      expiresAt,
      signupData: { name: cleanName, email: cleanEmail, password, phone: cleanPhone, address: cleanAddress, role: role === 'admin' ? 'admin' : 'customer' }
    });

    console.log(`\n==============================================`);
    console.log(`📩 VERIFICATION OTP FOR [${cleanEmail}]: ${otp}`);
    console.log(`==============================================\n`);

    // Attempt real email sending via Nodemailer
    const emailResult = await sendRealEmailOTP(cleanEmail, otp, cleanName);

    res.json({
      success: true,
      email: cleanEmail,
      isRealSent: emailResult.sent,
      otpDemo: emailResult.sent ? null : otp,
      message: emailResult.sent
        ? `📩 Real verification code sent to ${cleanEmail}. Check your inbox!`
        : `Verification OTP generated & sent to ${cleanEmail}.`
    });
  } catch (err) {
    console.error('API Error /api/auth/send-otp:', err);
    res.status(500).json({ success: false, message: 'Failed to send email verification OTP' });
  }
});

// Step 2: Verify OTP and Create Account
app.post('/api/auth/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP code are required' });
    }

    const cleanEmail = sanitizeString(email).toLowerCase();
    const cleanOtp = sanitizeString(otp).trim();

    const stored = otpStore.get(cleanEmail);
    if (!stored) {
      return res.status(400).json({ success: false, message: 'Verification session expired. Please request a new OTP.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
    }

    if (stored.otp !== cleanOtp) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit OTP code. Please check and try again.' });
    }

    // OTP verified! Proceed with account creation
    const { name, password, phone, address, role } = stored.signupData;
    otpStore.delete(cleanEmail);

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'customer';

    const [result] = await db.query(
      `INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, cleanEmail, hashedPassword, phone, address, userRole]
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId, email: cleanEmail, role: userRole }, JWT_SECRET, { expiresIn: '7d' });

    const userProfile = {
      id: userId,
      name,
      email: cleanEmail,
      phone,
      address,
      role: userRole
    };

    res.status(201).json({
      success: true,
      token,
      user: userProfile,
      message: '✅ Email verified & account created successfully!'
    });
  } catch (err) {
    console.error('API Error /api/auth/verify-otp:', err);
    res.status(500).json({ success: false, message: 'Failed to verify email OTP.' });
  }
});

// Standard Signup (with disposable check safeguard)
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const cleanName = sanitizeString(name);
    const cleanEmail = sanitizeString(email).toLowerCase();
    const cleanPhone = sanitizeString(phone || '');
    const cleanAddress = sanitizeString(address || '');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (isDisposableEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: '🚫 Temporary or disposable emails are strictly not allowed. Please use a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'customer';

    const [result] = await db.query(
      `INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)`,
      [cleanName, cleanEmail, hashedPassword, cleanPhone, cleanAddress, userRole]
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId, email: cleanEmail, role: userRole }, JWT_SECRET, { expiresIn: '7d' });

    const userProfile = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      address: cleanAddress,
      role: userRole
    };

    res.status(201).json({
      success: true,
      token,
      user: userProfile,
      message: 'Account created successfully!'
    });
  } catch (err) {
    console.error('API Error /api/auth/signup:', err);
    res.status(500).json({ success: false, message: 'Signup failed. Please try again.' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    let cleanEmail = sanitizeString(email).toLowerCase();
    if (cleanEmail === 'admin123' || cleanEmail === 'admin') {
      cleanEmail = 'admin123@quickbite.com';
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      role: user.role
    };

    res.json({
      success: true,
      token,
      user: userProfile,
      message: `Welcome back, ${user.name}!`
    });
  } catch (err) {
    console.error('API Error /api/auth/login:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('API Error /api/auth/me:', err);
    res.status(500).json({ success: false, message: 'Error fetching user profile' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const cleanName = sanitizeString(name);
    const cleanPhone = sanitizeString(phone || '');
    const cleanAddress = sanitizeString(address || '');

    await db.query('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', [cleanName, cleanPhone, cleanAddress, req.user.id]);

    const [rows] = await db.query('SELECT id, name, email, phone, address, role FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, user: rows[0], message: 'Profile updated successfully' });
  } catch (err) {
    console.error('API Error PUT /api/auth/profile:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Fallback 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start Server after running database setup
setupDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🔒 QuickBite Secure MySQL Backend Server running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database on startup:', err);
});
