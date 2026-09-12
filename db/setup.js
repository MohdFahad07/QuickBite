const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  console.log('🔄 Initializing QuickBite MySQL Database...');
  
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to MySQL server.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📜 Executing schema.sql...');
    await connection.query(sql);

    // 1. Remove old admin account if present
    await connection.query('DELETE FROM quickbite_db.users WHERE email = ?', ['admin@quickbite.com']);

    // 2. Ensure New Admin Account Exists (ID: admin123 / Email: admin123@quickbite.com, Password: admin@123)
    const newAdminEmail = 'admin123@quickbite.com';
    const [adminRows] = await connection.query('SELECT id FROM quickbite_db.users WHERE email = ?', [newAdminEmail]);
    const hashedPassword = await bcrypt.hash('admin@123', 10);

    if (adminRows.length === 0) {
      console.log('👑 Creating new Admin account (admin123 / admin123@quickbite.com)...');
      await connection.query(
        `INSERT INTO quickbite_db.users (name, email, password, phone, address, role) 
         VALUES ('QuickBite Master Admin', ?, ?, '+91 99999 88888', 'QuickBite HQ, New Delhi', 'admin')`,
        [newAdminEmail, hashedPassword]
      );
      console.log('✅ New Admin account (admin123 / admin@123) created successfully!');
    } else {
      await connection.query(
        'UPDATE quickbite_db.users SET password = ?, role = "admin" WHERE email = ?',
        [hashedPassword, newAdminEmail]
      );
      console.log('✅ Admin account (admin123 / admin@123) password verified!');
    }

    console.log('✅ Database quickbite_db and tables created/updated successfully with seed data!');
    await connection.end();
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
