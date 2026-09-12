// ==========================================
// QuickBite - Menu Data (with real images)
// Developer: Mohd Fahad
// ==========================================

const CATEGORIES = [
  { id: 'all', name: 'All', color: '#ff6b35', bg: 'rgba(255,107,53,0.12)', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80' },
  { id: 'pizza', name: 'Pizza', color: '#e74c3c', bg: 'rgba(231,76,60,0.12)', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80' },
  { id: 'burger', name: 'Burgers', color: '#e67e22', bg: 'rgba(230,126,34,0.12)', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80' },
  { id: 'biryani', name: 'Biryani', color: '#f39c12', bg: 'rgba(243,156,18,0.12)', image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=300&q=80' },
  { id: 'noodles', name: 'Noodles', color: '#27ae60', bg: 'rgba(39,174,96,0.12)', image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=300&q=80' },
  { id: 'tacos', name: 'Tacos', color: '#16a085', bg: 'rgba(22,160,133,0.12)', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=300&q=80' },
  { id: 'sushi', name: 'Sushi', color: '#8e44ad', bg: 'rgba(142,68,173,0.12)', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80' },
  { id: 'desserts', name: 'Desserts', color: '#c0392b', bg: 'rgba(192,57,43,0.12)', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80' },
  { id: 'drinks', name: 'Drinks', color: '#2980b9', bg: 'rgba(41,128,185,0.12)', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80' },
];

/* SVG-only icon renderer shared by all pages. */
function getCategoryIcon(category, className = 'category-svg') {
  const icons = { all: 'plate', pizza: 'pizza', burger: 'burger', biryani: 'bowl', noodles: 'noodles', tacos: 'taco', sushi: 'sushi', desserts: 'dessert', drinks: 'drink' };
  return `<svg class="${className}" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-${icons[category] || 'plate'}"></use></svg>`;
}

const MENU_ITEMS = [
  // ---- PIZZA ----
  {
    id: 1, category: 'pizza', featured: true,
    name: 'Margherita Classic',
    desc: 'Fresh tomato base, mozzarella, basil leaves — simple perfection.',
    emoji: '🍕',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
    price: 299, originalPrice: 399, rating: 4.8, reviews: 234, time: '25 min', spicy: false, veg: true
  },
  {
    id: 2, category: 'pizza', featured: true,
    name: 'BBQ Chicken Pizza',
    desc: 'Smoky BBQ sauce, grilled chicken, red onions, jalapeños.',
    emoji: '🍕',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80',
    price: 449, originalPrice: 549, rating: 4.9, reviews: 412, time: '28 min', spicy: true, veg: false
  },
  {
    id: 3, category: 'pizza', featured: false,
    name: 'Paneer Tikka Pizza',
    desc: 'Indian fusion with tandoori paneer, bell peppers, mint chutney.',
    emoji: '🍕',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80',
    price: 399, originalPrice: 499, rating: 4.7, reviews: 189, time: '30 min', spicy: true, veg: true
  },
  {
    id: 4, category: 'pizza', featured: false,
    name: 'Veggie Supreme',
    desc: 'Loaded with mushrooms, olives, capsicum, and corn.',
    emoji: '🍕',
    image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=400&q=80',
    price: 349, originalPrice: 429, rating: 4.5, reviews: 156, time: '25 min', spicy: false, veg: true
  },

  // ---- BURGER ----
  {
    id: 5, category: 'burger', featured: true,
    name: 'Classic Smash Burger',
    desc: 'Double smash patty, cheddar, pickles, special QB sauce.',
    emoji: '🍔',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
    price: 249, originalPrice: 329, rating: 4.9, reviews: 567, time: '20 min', spicy: false, veg: false
  },
  {
    id: 6, category: 'burger', featured: true,
    name: 'Spicy Chicken Burger',
    desc: 'Crispy fried chicken, sriracha mayo, coleslaw, lettuce.',
    emoji: '🍔',
    image: 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=400&q=80',
    price: 279, originalPrice: 349, rating: 4.8, reviews: 345, time: '22 min', spicy: true, veg: false
  },
  {
    id: 7, category: 'burger', featured: false,
    name: 'Veggie Aloo Burger',
    desc: 'Spiced potato patty, mint chutney, onions, tomatoes.',
    emoji: '🍔',
    image: 'https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=400&q=80',
    price: 159, originalPrice: 219, rating: 4.4, reviews: 213, time: '18 min', spicy: false, veg: true
  },
  {
    id: 8, category: 'burger', featured: false,
    name: 'Mushroom Swiss Burger',
    desc: 'Sautéed mushrooms, swiss cheese, garlic aioli, brioche bun.',
    emoji: '🍔',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80',
    price: 299, originalPrice: 379, rating: 4.6, reviews: 178, time: '25 min', spicy: false, veg: true
  },

  // ---- BIRYANI ----
  {
    id: 9, category: 'biryani', featured: true,
    name: 'Chicken Dum Biryani',
    desc: 'Slow-cooked aromatic basmati rice with tender chicken pieces.',
    emoji: '🍛',
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&q=80',
    price: 349, originalPrice: 449, rating: 4.9, reviews: 678, time: '35 min', spicy: true, veg: false
  },
  {
    id: 10, category: 'biryani', featured: false,
    name: 'Mutton Hyderabadi Biryani',
    desc: 'Authentic Hyderabadi style with slow-cooked mutton.',
    emoji: '🍛',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
    price: 429, originalPrice: 549, rating: 4.8, reviews: 445, time: '40 min', spicy: true, veg: false
  },
  {
    id: 11, category: 'biryani', featured: false,
    name: 'Veg Biryani',
    desc: 'Fragrant rice with mixed vegetables, whole spices, raita.',
    emoji: '🍛',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&q=80',
    price: 249, originalPrice: 329, rating: 4.5, reviews: 267, time: '30 min', spicy: false, veg: true
  },

  // ---- NOODLES ----
  {
    id: 12, category: 'noodles', featured: true,
    name: 'Hakka Noodles',
    desc: 'Stir-fried noodles with vegetables and soy-chilli sauce.',
    emoji: '🍜',
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=400&q=80',
    price: 199, originalPrice: 259, rating: 4.6, reviews: 312, time: '20 min', spicy: false, veg: true
  },
  {
    id: 13, category: 'noodles', featured: false,
    name: 'Chicken Schezwan Noodles',
    desc: 'Fiery Schezwan sauce, chicken strips, spring onions.',
    emoji: '🍜',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
    price: 249, originalPrice: 319, rating: 4.7, reviews: 234, time: '22 min', spicy: true, veg: false
  },
  {
    id: 14, category: 'noodles', featured: false,
    name: 'Pad Thai',
    desc: 'Thai-style rice noodles with tofu, peanuts, lime, bean sprouts.',
    emoji: '🍜',
    image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=400&q=80',
    price: 279, originalPrice: 359, rating: 4.8, reviews: 198, time: '25 min', spicy: false, veg: true
  },

  // ---- SUSHI ----
  {
    id: 15, category: 'sushi', featured: true,
    name: 'Dragon Roll',
    desc: 'Shrimp tempura, avocado, cucumber, eel sauce.',
    emoji: '🍣',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=80',
    price: 499, originalPrice: 649, rating: 4.9, reviews: 289, time: '30 min', spicy: false, veg: false
  },
  {
    id: 16, category: 'sushi', featured: false,
    name: 'Spicy Tuna Roll',
    desc: 'Fresh tuna, spicy mayo, cucumber, sesame seeds.',
    emoji: '🍣',
    image: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?auto=format&fit=crop&w=400&q=80',
    price: 449, originalPrice: 569, rating: 4.7, reviews: 167, time: '28 min', spicy: true, veg: false
  },

  // ---- TACOS ----
  {
    id: 17, category: 'tacos', featured: false,
    name: 'Chicken Tacos (3 pcs)',
    desc: 'Grilled chicken, fresh salsa, guacamole, sour cream.',
    emoji: '🌮',
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=400&q=80',
    price: 299, originalPrice: 379, rating: 4.8, reviews: 234, time: '20 min', spicy: false, veg: false
  },
  {
    id: 18, category: 'tacos', featured: false,
    name: 'Paneer Tikka Tacos',
    desc: 'Indian fusion tacos with tandoori paneer, mint chutney.',
    emoji: '🌮',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
    price: 249, originalPrice: 319, rating: 4.6, reviews: 178, time: '22 min', spicy: true, veg: true
  },

  // ---- DESSERTS ----
  {
    id: 19, category: 'desserts', featured: true,
    name: 'Chocolate Lava Cake',
    desc: 'Warm molten chocolate cake with vanilla ice cream.',
    emoji: '🎂',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
    price: 179, originalPrice: 229, rating: 4.9, reviews: 456, time: '15 min', spicy: false, veg: true
  },
  {
    id: 20, category: 'desserts', featured: false,
    name: 'Mango Kulfi',
    desc: 'Creamy Indian ice cream with real mango chunks.',
    emoji: '🍨',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
    price: 129, originalPrice: 169, rating: 4.7, reviews: 312, time: '10 min', spicy: false, veg: true
  },
  {
    id: 21, category: 'desserts', featured: false,
    name: 'Gulab Jamun (6 pcs)',
    desc: 'Soft milk-solid balls soaked in rose-flavored sugar syrup.',
    emoji: '🍯',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
    price: 99, originalPrice: 139, rating: 4.8, reviews: 523, time: '10 min', spicy: false, veg: true
  },

  // ---- DRINKS ----
  {
    id: 22, category: 'drinks', featured: false,
    name: 'Mango Lassi',
    desc: 'Chilled yogurt-based mango drink, creamy and refreshing.',
    emoji: '🥭',
    image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&w=400&q=80',
    price: 99, originalPrice: 129, rating: 4.8, reviews: 445, time: '10 min', spicy: false, veg: true
  },
  {
    id: 23, category: 'drinks', featured: false,
    name: 'Cold Coffee',
    desc: 'Chilled blended coffee with cream and caramel drizzle.',
    emoji: '☕',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80',
    price: 119, originalPrice: 159, rating: 4.6, reviews: 234, time: '10 min', spicy: false, veg: true
  },
  {
    id: 24, category: 'drinks', featured: false,
    name: 'Fresh Lime Soda',
    desc: 'Freshly squeezed lime with soda, sweet or salted.',
    emoji: '🍋',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80',
    price: 69, originalPrice: 99, rating: 4.5, reviews: 312, time: '8 min', spicy: false, veg: true
  },
];

// ---- Helpers & MySQL Sync ----
async function loadMenuFromDB() {
  if (window.API) {
    try {
      const items = await window.API.getMenu();
      if (items && Array.isArray(items) && items.length > 0) {
        MENU_ITEMS.length = 0;
        items.forEach(i => {
          const descText = i.desc || i.description || '';
          const isVegVal = i.veg !== undefined ? Boolean(i.veg) : Boolean(i.isVeg);
          const isSpicyVal = i.spicy !== undefined ? Boolean(i.spicy) : Boolean(i.isSpicy);
          MENU_ITEMS.push({
            ...i,
            desc: descText,
            description: descText,
            veg: isVegVal,
            isVeg: isVegVal,
            spicy: isSpicyVal,
            isSpicy: isSpicyVal,
            originalPrice: i.originalPrice || i.original_price || Math.round(i.price * 1.25),
            time: i.time || '20-25 min'
          });
        });
        console.log(`✅ Loaded ${items.length} menu items from MySQL Database`);
      }
    } catch (e) {
      console.warn('⚠️ Could not connect to MySQL Backend, falling back to local dataset:', e.message);
    }
  }
}

// Auto load from DB on start
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    loadMenuFromDB().then(() => {
      // Dispatch custom event so pages can re-render if needed
      window.dispatchEvent(new CustomEvent('menuDataLoaded'));
    });
  });
}

function getFeaturedItems()           { return MENU_ITEMS.filter(i => i.featured); }
function getItemsByCategory(category) { return (!category || category === 'all') ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === category); }
function searchItems(query)           { const q = query.toLowerCase().trim(); return q ? MENU_ITEMS.filter(i => i.name.toLowerCase().includes(q) || (i.desc && i.desc.toLowerCase().includes(q)) || (i.description && i.description.toLowerCase().includes(q)) || i.category.toLowerCase().includes(q)) : MENU_ITEMS; }
function getItemById(id)              { return MENU_ITEMS.find(i => i.id == id); }

