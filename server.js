const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database
const db = new Database(path.join(__dirname, "bigtech.db"));

db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT DEFAULT '',
    image TEXT DEFAULT '',
    image_back TEXT DEFAULT '',
    image_side TEXT DEFAULT '',
    image_closeup TEXT DEFAULT '',
    featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT DEFAULT '',
    customer_address TEXT DEFAULT '',
    items TEXT NOT NULL,
    total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: add the multi-view image columns to a database that was
// created before this feature existed (e.g. your already-live site).
// SQLite has no "ADD COLUMN IF NOT EXISTS", so we check the existing
// columns first and only add the ones that are actually missing.
const existingProductColumns = db.prepare("PRAGMA table_info(products)").all().map(c => c.name);
const newImageColumns = ["image_back", "image_side", "image_closeup"];
newImageColumns.forEach(col => {
  if (!existingProductColumns.includes(col)) {
    db.exec(`ALTER TABLE products ADD COLUMN ${col} TEXT DEFAULT ''`);
    console.log(`Migration: added missing column "${col}" to products table.`);
  }
});

// Create first admin account
const existingAdmin = db
  .prepare("SELECT id FROM admins WHERE username = ?")
  .get("admin");

if (!existingAdmin) {
  const passwordHash = bcrypt.hashSync("599730Pp@@", 12);

  db.prepare(`
    INSERT INTO admins (username, password)
    VALUES (?, ?)
  `).run("admin", passwordHash);

  console.log("Default admin created.");
}

// Seed default categories used across the storefront nav, if none exist yet
const categoryCount = db.prepare("SELECT COUNT(*) AS count FROM categories").get().count;
if (categoryCount === 0) {
  const defaultCategories = ["Phones", "Tablets", "Laptops", "Nintendo", "PlayStation", "Xbox"];
  const insertCat = db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)");
  defaultCategories.forEach(name => insertCat.run(name));
  console.log("Default categories seeded.");
}

// Seed a small demo catalog so the storefront isn't empty on first run.
// This only runs once, and never touches products a real admin has already added.
const productCount = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
if (productCount <= 1) {
  const demoProducts = [
    { name: "iPhone 15 Pro Max 256GB", description: "Genuine iPhone 15 Pro Max, 256GB storage. Comes with BIGTECH warranty support.", price: 28999, stock: 8, category: "Phones", image: "", featured: 1 },
    { name: "Samsung Galaxy S24 Ultra 512GB", description: "Samsung's flagship with 512GB storage and S Pen included.", price: 24999, stock: 6, category: "Phones", image: "", featured: 1 },
    { name: "iPad 10th Generation", description: "10th generation iPad, great for work, study and entertainment.", price: 13999, stock: 10, category: "Tablets", image: "", featured: 1 },
    { name: "HP Pavilion x360", description: "Brand new HP Pavilion x360 laptop, convertible 2-in-1 design.", price: 24999, stock: 5, category: "Laptops", image: "", featured: 1 },
    { name: "Lenovo IdeaPad Slim 3", description: "Everyday Lenovo laptop with fast SSD storage, great for work and study.", price: 19999, stock: 6, category: "Laptops", image: "", featured: 0 },
    { name: "Nintendo Switch OLED", description: "Nintendo Switch OLED model with vivid 7-inch screen.", price: 10999, stock: 12, category: "Nintendo", image: "", featured: 1 },
    { name: "PlayStation 5 Digital Edition", description: "Sony PlayStation 5 Digital Edition console.", price: 17299, stock: 5, category: "PlayStation", image: "", featured: 1 },
    { name: "Xbox Series X 1TB", description: "Microsoft Xbox Series X, 1TB storage, 4K gaming.", price: 16999, stock: 7, category: "Xbox", image: "", featured: 1 }
  ];
  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, stock, category, image, featured)
    VALUES (@name, @description, @price, @stock, @category, @image, @featured)
  `);
  const insertMany = db.transaction(items => items.forEach(p => insertProduct.run(p)));
  insertMany(demoProducts);
  console.log("Demo products seeded.");
}

// Keep the categories table in sync with any category name used on a product,
// so the admin category list always reflects what's actually in the catalog.
function ensureCategoryExists(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return;
  db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)").run(trimmed);
}

// Authentication middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required"
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired login session"
    });
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BIGTECH server is running"
  });
});

// ADMIN LOGIN
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password are required"
    });
  }

  const admin = db
    .prepare("SELECT * FROM admins WHERE username = ?")
    .get(username);

  if (!admin) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  const validPassword = bcrypt.compareSync(password, admin.password);

  if (!validPassword) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  const token = jwt.sign(
    {
      id: admin.id,
      username: admin.username
    },
    JWT_SECRET,
    {
      expiresIn: "8h"
    }
  );

  res.json({
    success: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username
    }
  });
});

// VERIFY ADMIN
app.get("/api/admin/me", authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

// CHANGE ADMIN PASSWORD
app.post("/api/admin/change-password", authenticateAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: "Current password and new password are required"
    });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({
      error: "New password must be at least 8 characters"
    });
  }

  const admin = db
    .prepare("SELECT * FROM admins WHERE id = ?")
    .get(req.admin.id);

  if (!admin) {
    return res.status(404).json({ error: "Admin account not found" });
  }

  const validPassword = bcrypt.compareSync(currentPassword, admin.password);

  if (!validPassword) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const newHash = bcrypt.hashSync(newPassword, 12);

  db.prepare("UPDATE admins SET password = ? WHERE id = ?").run(newHash, admin.id);

  res.json({
    success: true,
    message: "Password updated successfully"
  });
});

// DASHBOARD
app.get("/api/admin/dashboard", authenticateAdmin, (req, res) => {
  const productCount = db
    .prepare("SELECT COUNT(*) AS count FROM products")
    .get().count;

  const categoryCount = db
    .prepare("SELECT COUNT(*) AS count FROM categories")
    .get().count;

  const orderCount = db
    .prepare("SELECT COUNT(*) AS count FROM orders")
    .get().count;

  const pendingOrders = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM orders
      WHERE status = 'Pending'
    `)
    .get().count;

  const sales = db
    .prepare(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM orders
      WHERE status != 'Cancelled'
    `)
    .get().total;

  const lowStock = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM products
      WHERE stock <= 5
    `)
    .get().count;

  res.json({
    success: true,
    dashboard: {
      products: productCount,
      categories: categoryCount,
      orders: orderCount,
      pendingOrders,
      sales,
      lowStock
    }
  });
});

// PRODUCTS
app.get("/api/products", (req, res) => {
  const products = db
    .prepare("SELECT * FROM products ORDER BY id DESC")
    .all();

  res.json(products);
});

// SINGLE PRODUCT
app.get("/api/products/:id", (req, res) => {
  const product = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id);

  if (!product) {
    return res.status(404).json({
      error: "Product not found"
    });
  }

  res.json(product);
});

// ADD PRODUCT
app.post("/api/products", authenticateAdmin, (req, res) => {
  const {
    name,
    description = "",
    price,
    stock = 0,
    category = "",
    image = "",
    image_back = "",
    image_side = "",
    image_closeup = "",
    featured = 0
  } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({
      error: "Product name and price are required"
    });
  }

  const result = db.prepare(`
    INSERT INTO products
    (name, description, price, stock, category, image, image_back, image_side, image_closeup, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    description,
    Number(price),
    Number(stock),
    category,
    image,
    image_back,
    image_side,
    image_closeup,
    featured ? 1 : 0
  );

  ensureCategoryExists(category);

  const product = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json({
    success: true,
    product
  });
});

// UPDATE PRODUCT
app.put("/api/products/:id", authenticateAdmin, (req, res) => {
  const {
    name,
    description = "",
    price,
    stock = 0,
    category = "",
    image = "",
    image_back = "",
    image_side = "",
    image_closeup = "",
    featured = 0
  } = req.body;

  const existing = db
    .prepare("SELECT id FROM products WHERE id = ?")
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({
      error: "Product not found"
    });
  }

  db.prepare(`
    UPDATE products
    SET
      name = ?,
      description = ?,
      price = ?,
      stock = ?,
      category = ?,
      image = ?,
      image_back = ?,
      image_side = ?,
      image_closeup = ?,
      featured = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name,
    description,
    Number(price),
    Number(stock),
    category,
    image,
    image_back,
    image_side,
    image_closeup,
    featured ? 1 : 0,
    req.params.id
  );

  ensureCategoryExists(category);

  const product = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id);

  res.json({
    success: true,
    product
  });
});

// DELETE PRODUCT
app.delete("/api/products/:id", authenticateAdmin, (req, res) => {
  const result = db
    .prepare("DELETE FROM products WHERE id = ?")
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Product not found"
    });
  }

  res.json({
    success: true,
    message: "Product deleted"
  });
});

// CATEGORIES
app.get("/api/categories", (req, res) => {
  const categories = db
    .prepare("SELECT * FROM categories ORDER BY name ASC")
    .all();

  res.json(categories);
});

// ADD CATEGORY
app.post("/api/categories", authenticateAdmin, (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      error: "Category name is required"
    });
  }

  try {
    const result = db
      .prepare("INSERT INTO categories (name) VALUES (?)")
      .run(name.trim());

    const category = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    res.status(409).json({
      error: "Category already exists"
    });
  }
});

// DELETE CATEGORY
app.delete("/api/categories/:id", authenticateAdmin, (req, res) => {
  const result = db
    .prepare("DELETE FROM categories WHERE id = ?")
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Category not found"
    });
  }

  res.json({
    success: true,
    message: "Category deleted"
  });
});

// ORDERS
app.get("/api/orders", authenticateAdmin, (req, res) => {
  const orders = db
    .prepare("SELECT * FROM orders ORDER BY id DESC")
    .all();

  res.json(
    orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }))
  );
});

// CREATE ORDER
app.post("/api/orders", (req, res) => {
  const {
    customer_name,
    customer_phone = "",
    customer_address = "",
    items,
    total
  } = req.body;

  if (!customer_name || !items || total === undefined) {
    return res.status(400).json({
      error: "Customer name, items and total are required"
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "Order must include at least one item"
    });
  }

  // Validate stock availability up front so nothing can be ordered beyond
  // what's actually in stock. This runs inside the same transaction as the
  // insert/decrement below so it can't race with another order.
  let stockError = null;

  const createOrder = db.transaction(() => {
    const getStock = db.prepare("SELECT id, name, stock FROM products WHERE id = ?");

    for (const item of items) {
      if (!item || !item.id) {
        stockError = "Invalid item in order";
        return null;
      }
      const product = getStock.get(item.id);
      const qty = Number(item.qty || item.quantity || 1);

      if (!product) {
        stockError = `Product #${item.id} no longer exists`;
        return null;
      }
      if (qty <= 0) {
        stockError = `Invalid quantity for ${product.name}`;
        return null;
      }
      if (product.stock < qty) {
        stockError = `Only ${product.stock} left in stock for "${product.name}" (requested ${qty})`;
        return null;
      }
    }

    const result = db.prepare(`
      INSERT INTO orders
      (customer_name, customer_phone, customer_address, items, total)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      customer_name,
      customer_phone,
      customer_address,
      JSON.stringify(items),
      Number(total)
    );

    const decrementStock = db.prepare(`
      UPDATE products
      SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    items.forEach(item => {
      decrementStock.run(Number(item.qty || item.quantity || 1), item.id);
    });

    return result.lastInsertRowid;
  });

  const orderId = createOrder();

  if (stockError) {
    return res.status(409).json({ error: stockError });
  }

  res.status(201).json({
    success: true,
    orderId,
    message: "Order created successfully"
  });
});

// UPDATE ORDER STATUS
app.patch("/api/orders/:id/status", authenticateAdmin, (req, res) => {
  const { status } = req.body;

  const allowedStatuses = [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid order status"
    });
  }

  const result = db.prepare(`
    UPDATE orders
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Order not found"
    });
  }

  res.json({
    success: true,
    message: "Order status updated"
  });
});

// DELETE ORDER
app.delete("/api/orders/:id", authenticateAdmin, (req, res) => {
  const result = db
    .prepare("DELETE FROM orders WHERE id = ?")
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Order not found"
    });
  }

  res.json({
    success: true,
    message: "Order deleted"
  });
});

// Serve BIGTECH website
app.use(express.static(__dirname));

// Start server
app.listen(PORT, () => {
  console.log("");
  console.log("==================================");
  console.log("       BIGTECH SERVER RUNNING");
  console.log("==================================");
  console.log(`Website: http://localhost:${PORT}`);
  console.log(`API:     http://localhost:${PORT}/api/health`);
  if (!process.env.JWT_SECRET) {
    console.log("");
    console.log("WARNING: JWT_SECRET is not set in .env — using an insecure");
    console.log("         default. Set JWT_SECRET before deploying this site.");
  }
  console.log("");
});