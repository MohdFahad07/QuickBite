-- ==========================================
-- QuickBite Food Ordering System - MySQL Database Schema
-- Database Name: quickbite_db
-- ==========================================

CREATE DATABASE IF NOT EXISTS quickbite_db;
USE quickbite_db;

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(30) NOT NULL,
  bg VARCHAR(50) NOT NULL,
  image VARCHAR(500) NOT NULL
);

-- 2. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  image VARCHAR(500) NOT NULL,
  is_veg BOOLEAN DEFAULT TRUE,
  is_spicy BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3, 1) DEFAULT 4.8,
  reviews INT DEFAULT 10,
  out_of_stock BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 3. PROMO CODES TABLE
CREATE TABLE IF NOT EXISTS promo_codes (
  code VARCHAR(50) PRIMARY KEY,
  discount_pct INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CUSTOMER ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  status ENUM('Confirmed', 'Preparing', 'Out for Delivery', 'Delivered') DEFAULT 'Confirmed',
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  order_items LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. USERS TABLE (AUTH SYSTEM)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- SEED INITIAL DATA
-- ==========================================

-- Insert Categories
INSERT IGNORE INTO categories (id, name, color, bg, image) VALUES
('all', 'All', '#ff6b35', 'rgba(255,107,53,0.12)', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80'),
('pizza', 'Pizza', '#e74c3c', 'rgba(231,76,60,0.12)', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80'),
('burger', 'Burgers', '#e67e22', 'rgba(230,126,34,0.12)', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80'),
('biryani', 'Biryani', '#f39c12', 'rgba(243,156,18,0.12)', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=300&q=80'),
('noodles', 'Noodles', '#27ae60', 'rgba(39,174,96,0.12)', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=300&q=80'),
('tacos', 'Tacos', '#16a085', 'rgba(22,160,133,0.12)', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=300&q=80'),
('sushi', 'Sushi', '#8e44ad', 'rgba(142,68,173,0.12)', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80'),
('desserts', 'Desserts', '#c0392b', 'rgba(192,57,43,0.12)', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80'),
('drinks', 'Drinks', '#2980b9', 'rgba(41,128,185,0.12)', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80');

-- Insert Initial Promo Codes
INSERT IGNORE INTO promo_codes (code, discount_pct, is_active) VALUES
('WELCOME20', 20, TRUE),
('QUICK50', 50, TRUE),
('FESTIVE100', 15, TRUE);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  1 AS id, 'pizza' AS category_id, 'Margherita Classic' AS name, 'Fresh tomato base, mozzarella, basil leaves — simple perfection.' AS description, 299.00 AS price, 399.00 AS original_price, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, TRUE AS is_popular, TRUE AS featured, 4.8 AS rating, 234 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 1);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  2 AS id, 'pizza' AS category_id, 'BBQ Chicken Pizza' AS name, 'Smoky BBQ sauce, grilled chicken, red onions, jalapeños.' AS description, 449.00 AS price, 549.00 AS original_price, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80' AS image, FALSE AS is_veg, TRUE AS is_spicy, TRUE AS is_popular, TRUE AS featured, 4.9 AS rating, 412 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 2);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  3 AS id, 'pizza' AS category_id, 'Paneer Tikka Pizza' AS name, 'Indian fusion with tandoori paneer, bell peppers, mint chutney.' AS description, 399.00 AS price, 499.00 AS original_price, 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, TRUE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.7 AS rating, 189 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 3);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  4 AS id, 'pizza' AS category_id, 'Pepperoni Feast' AS name, 'Double pepperoni, extra mozzarella, garlic oil drizzle.' AS description, 499.00 AS price, 599.00 AS original_price, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80' AS image, FALSE AS is_veg, FALSE AS is_spicy, TRUE AS is_popular, FALSE AS featured, 4.9 AS rating, 530 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 4);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  5 AS id, 'burger' AS category_id, 'Classic Cheeseburger' AS name, 'Juicy beef patty, cheddar cheese, pickles, signature sauce.' AS description, 199.00 AS price, 249.00 AS original_price, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' AS image, FALSE AS is_veg, FALSE AS is_spicy, TRUE AS is_popular, TRUE AS featured, 4.7 AS rating, 310 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 5);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  6 AS id, 'burger' AS category_id, 'Crispy Veggie Burger' AS name, 'Crispy potato & corn patty, lettuce, mayo, sesame bun.' AS description, 149.00 AS price, 199.00 AS original_price, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, FALSE AS is_popular, TRUE AS featured, 4.6 AS rating, 195 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 6);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  7 AS id, 'biryani' AS category_id, 'Hyderabadi Chicken Biryani' AS name, 'Long-grain basmati, tender chicken, aromatic spices, mirchi ka salan.' AS description, 349.00 AS price, 429.00 AS original_price, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&q=80' AS image, FALSE AS is_veg, TRUE AS is_spicy, TRUE AS is_popular, TRUE AS featured, 4.9 AS rating, 670 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 7);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  8 AS id, 'desserts' AS category_id, 'Sizzling Brownie with Ice Cream' AS name, 'Warm chocolate brownie, vanilla ice cream, hot fudge.' AS description, 179.00 AS price, 229.00 AS original_price, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, TRUE AS is_popular, TRUE AS featured, 4.9 AS rating, 512 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 8);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  9 AS id, 'biryani' AS category_id, 'Chicken Dum Biryani' AS name, 'Slow-cooked aromatic basmati rice with tender chicken pieces.' AS description, 349.00 AS price, 449.00 AS original_price, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&q=80' AS image, FALSE AS is_veg, TRUE AS is_spicy, TRUE AS is_popular, TRUE AS featured, 4.9 AS rating, 678 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 9);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  10 AS id, 'biryani' AS category_id, 'Mutton Hyderabadi Biryani' AS name, 'Authentic Hyderabadi style with slow-cooked mutton.' AS description, 429.00 AS price, 549.00 AS original_price, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' AS image, FALSE AS is_veg, TRUE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.8 AS rating, 445 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 10);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  11 AS id, 'biryani' AS category_id, 'Veg Biryani' AS name, 'Fragrant rice with mixed vegetables, whole spices, raita.' AS description, 249.00 AS price, 329.00 AS original_price, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.5 AS rating, 267 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 11);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  12 AS id, 'noodles' AS category_id, 'Hakka Noodles' AS name, 'Stir-fried noodles with vegetables and soy-chilli sauce.' AS description, 199.00 AS price, 259.00 AS original_price, 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, TRUE AS is_popular, TRUE AS featured, 4.6 AS rating, 312 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 12);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  13 AS id, 'noodles' AS category_id, 'Chicken Schezwan Noodles' AS name, 'Fiery Schezwan sauce, chicken strips, spring onions.' AS description, 249.00 AS price, 319.00 AS original_price, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80' AS image, FALSE AS is_veg, TRUE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.7 AS rating, 234 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 13);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  14 AS id, 'noodles' AS category_id, 'Pad Thai' AS name, 'Thai-style rice noodles with tofu, peanuts, lime, bean sprouts.' AS description, 279.00 AS price, 359.00 AS original_price, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.8 AS rating, 198 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 14);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  15 AS id, 'sushi' AS category_id, 'Dragon Roll' AS name, 'Shrimp tempura, avocado, cucumber, eel sauce.' AS description, 499.00 AS price, 649.00 AS original_price, 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=80' AS image, FALSE AS is_veg, FALSE AS is_spicy, TRUE AS is_popular, TRUE AS featured, 4.9 AS rating, 289 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 15);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  16 AS id, 'sushi' AS category_id, 'Spicy Tuna Roll' AS name, 'Fresh tuna, spicy mayo, cucumber, sesame seeds.' AS description, 449.00 AS price, 569.00 AS original_price, 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?auto=format&fit=crop&w=400&q=80' AS image, FALSE AS is_veg, TRUE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.7 AS rating, 167 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 16);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  17 AS id, 'tacos' AS category_id, 'Chicken Tacos (3 pcs)' AS name, 'Grilled chicken, fresh salsa, guacamole, sour cream.' AS description, 299.00 AS price, 379.00 AS original_price, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=400&q=80' AS image, FALSE AS is_veg, FALSE AS is_spicy, TRUE AS is_popular, FALSE AS featured, 4.8 AS rating, 234 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 17);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  18 AS id, 'tacos' AS category_id, 'Paneer Tikka Tacos' AS name, 'Indian fusion tacos with tandoori paneer, mint chutney.' AS description, 249.00 AS price, 319.00 AS original_price, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, TRUE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.6 AS rating, 178 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 18);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  19 AS id, 'desserts' AS category_id, 'Chocolate Lava Cake' AS name, 'Warm molten chocolate cake with vanilla ice cream.' AS description, 179.00 AS price, 229.00 AS original_price, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, TRUE AS is_popular, TRUE AS featured, 4.9 AS rating, 456 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 19);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  20 AS id, 'desserts' AS category_id, 'Mango Kulfi' AS name, 'Creamy Indian ice cream with real mango chunks.' AS description, 129.00 AS price, 169.00 AS original_price, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.7 AS rating, 312 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 20);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  21 AS id, 'desserts' AS category_id, 'Gulab Jamun (6 pcs)' AS name, 'Soft milk-solid balls soaked in rose-flavored sugar syrup.' AS description, 99.00 AS price, 139.00 AS original_price, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.8 AS rating, 523 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 21);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  22 AS id, 'drinks' AS category_id, 'Mango Lassi' AS name, 'Chilled yogurt-based mango drink, creamy and refreshing.' AS description, 99.00 AS price, 129.00 AS original_price, 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.8 AS rating, 445 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 22);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  23 AS id, 'drinks' AS category_id, 'Cold Coffee' AS name, 'Chilled blended coffee with cream and caramel drizzle.' AS description, 119.00 AS price, 159.00 AS original_price, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.6 AS rating, 234 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 23);

INSERT INTO menu_items (id, category_id, name, description, price, original_price, image, is_veg, is_spicy, is_popular, featured, rating, reviews, out_of_stock)
SELECT * FROM (SELECT 
  24 AS id, 'drinks' AS category_id, 'Fresh Lime Soda' AS name, 'Freshly squeezed lime with soda, sweet or salted.' AS description, 69.00 AS price, 99.00 AS original_price, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80' AS image, TRUE AS is_veg, FALSE AS is_spicy, FALSE AS is_popular, FALSE AS featured, 4.5 AS rating, 312 AS reviews, FALSE AS out_of_stock
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 24);
