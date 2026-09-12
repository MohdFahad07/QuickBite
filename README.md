# 🍔 QuickBite - Online Food Ordering System

A full-stack food ordering web application built with **Node.js, Express, MySQL** on the backend and **HTML, CSS, JavaScript** on the frontend.

---

## 🚀 Live Features

- 🏠 **Dynamic Homepage** — Animated burger hero, scroll-assembled layers, mango shake "tapakta hua" drip animation
- 🍽️ **Menu Page** — Browse all food items with category filters & pagination
- 🛒 **Cart System** — Add/remove items, apply promo codes (QUICKBITE50, FAHAD20, MANGO15)
- 📦 **Order Management** — Place & track orders with real-time status
- 👤 **User Auth** — Register, login with JWT-based session management
- 🔐 **Admin Dashboard** — Full CRUD for menu items, categories, users, and orders

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript     |
| Backend   | Node.js, Express.js                 |
| Database  | MySQL                               |
| Auth      | JWT (JSON Web Tokens) + bcryptjs    |
| Styling   | Custom CSS with animations (GSAP)   |

---

## ⚙️ Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/MohdFahad07/QuickBite.git
cd QuickBite
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=quickbite_db
JWT_SECRET=your_secret_key_here
PORT=5000
```

### 4. Set Up the Database
Make sure MySQL is running, then:
```bash
node db/setup.js
```

### 5. Start the Server
```bash
node server.js
```

Open your browser and go to: **http://localhost:5000**

---

## 🔑 Default Admin Access

| Field    | Value                     |
|----------|---------------------------|
| Username | `admin123`                |
| Password | `admin@123`               |

---

## 📁 Project Structure

```
QuickBite/
├── assets/          # Images and static assets
├── config/          # Database configuration
├── css/             # Stylesheets (style.css, home.css)
├── db/              # Database setup scripts
├── js/              # Frontend JavaScript files
├── .env             # Environment variables (not uploaded)
├── server.js        # Main Express server
├── package.json     # Dependencies
└── *.html           # HTML pages (index, menu, cart, orders, admin)
```

---

## 👨‍💻 Developer

**Mohd Fahad**  
Full Stack Web Development Project  
© 2024 QuickBite. All rights reserved.
