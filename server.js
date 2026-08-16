const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";

app.use(cors());
app.use(express.json({ limit: "12mb" })); // raised from the default 100kb so a
                                            // base64-encoded product photo can
                                            // fit in the request body for the
                                            // background-removal endpoint below
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// DATABASE — persistent hosted Postgres (Neon / Supabase / any standard
// Postgres provider), instead of a local SQLite file. This is the fix for
// products getting wiped on every Render restart/redeploy: Render's free web
// service has no permanent disk, but a Postgres database on Neon/Supabase
// lives on its own separate, permanent infrastructure — restarting or
// redeploying the BIGTECH app itself no longer touches it at all.
//
// DATABASE_URL must be set in the environment (Render -> Environment tab).
// It looks like: postgresql://user:password@host/dbname?sslmode=require
// ---------------------------------------------------------------------------
if (!process.env.DATABASE_URL) {
  console.error("");
  console.error("FATAL: DATABASE_URL is not set.");
  console.error("Set it in your .env file (local) or Render's Environment tab (production)");
  console.error("to your Neon/Supabase Postgres connection string, then restart.");
  console.error("");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required by Neon/Supabase's managed Postgres
});

pool.on("error", err => {
  // Fired for errors on idle clients in the pool (e.g. a dropped connection)
  // — logged so it's visible, but doesn't crash the whole server.
  console.error("Unexpected error on idle Postgres client:", err);
});

// Creates all tables if they don't already exist yet. Safe to run on every
// boot: CREATE TABLE IF NOT EXISTS never touches a table that's already
// there, so this never resets or overwrites real product data.
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT DEFAULT '',
      customer_address TEXT DEFAULT '',
      items TEXT NOT NULL,
      total REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create the first admin account only if none exists yet. This never
  // overwrites an existing admin, so a real password change is never undone.
  const existingAdmin = await pool.query(
    "SELECT id FROM admins WHERE username = $1",
    ["admin"]
  );

  if (existingAdmin.rows.length === 0) {
    const passwordHash = bcrypt.hashSync("599730Pp@@", 12);
    await pool.query(
      "INSERT INTO admins (username, password) VALUES ($1, $2)",
      ["admin", passwordHash]
    );
    console.log("Default admin created.");
  }

  // Seed the starter categories used across the storefront nav, but only if
  // the categories table is completely empty — never touches it again after
  // that, so deleting/renaming categories in Admin sticks permanently.
  const categoryCount = await pool.query("SELECT COUNT(*) AS count FROM categories");
  if (Number(categoryCount.rows[0].count) === 0) {
    const defaultCategories = ["Phones", "Tablets", "Laptops", "Nintendo", "PlayStation", "Xbox"];
    for (const name of defaultCategories) {
      await pool.query(
        "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
        [name]
      );
    }
    console.log("Default categories seeded.");
  }

  // NOTE: there is deliberately no demo/sample PRODUCT seeding here anymore.
  // Products now come only from what you add through the Admin panel, and
  // nothing on startup will ever insert, modify, or remove them.
}

// Keep the categories table in sync with any category name used on a
// product, so the admin category list always reflects what's actually in
// the catalog. ON CONFLICT DO NOTHING makes this a safe no-op if the
// category already exists.
async function ensureCategoryExists(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return;
  await pool.query(
    "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
    [trimmed]
  );
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
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password are required"
    });
  }

  const result = await pool.query(
    "SELECT * FROM admins WHERE username = $1",
    [username]
  );
  const admin = result.rows[0];

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
app.post("/api/admin/change-password", authenticateAdmin, async (req, res) => {
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

  const result = await pool.query(
    "SELECT * FROM admins WHERE id = $1",
    [req.admin.id]
  );
  const admin = result.rows[0];

  if (!admin) {
    return res.status(404).json({ error: "Admin account not found" });
  }

  const validPassword = bcrypt.compareSync(currentPassword, admin.password);

  if (!validPassword) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const newHash = bcrypt.hashSync(newPassword, 12);

  await pool.query(
    "UPDATE admins SET password = $1 WHERE id = $2",
    [newHash, admin.id]
  );

  res.json({
    success: true,
    message: "Password updated successfully"
  });
});

// REMOVE BACKGROUND FROM A PRODUCT PHOTO
// Accepts a base64-encoded JPG/PNG from the admin panel, sends it to the
// remove.bg API using a server-side-only API key (never exposed to the
// browser), and returns the resulting transparent PNG as base64. The admin
// panel then uploads whichever version (original or background-removed) the
// user picks to Cloudinary itself, the same way it already does for normal
// uploads — this endpoint only ever handles the AI processing step.
app.post("/api/admin/remove-background", authenticateAdmin, async (req, res) => {
  const { image_base64 } = req.body;

  if (!image_base64) {
    return res.status(400).json({
      error: "No image data was provided"
    });
  }

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Background removal isn't configured on the server yet. Set REMOVE_BG_API_KEY in the environment and restart the server."
    });
  }

  // Rough pre-check before calling the external API (remove.bg's own
  // ceiling is around 12MB for the source image).
  const approxBytes = image_base64.length * 0.75;
  if (approxBytes > 12 * 1024 * 1024) {
    return res.status(413).json({
      error: "That image is too large for background removal. Please use a photo under 10MB."
    });
  }

  try {
    const removeBgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image_file_b64: image_base64,
        size: "auto",
        format: "png"
      })
    });

    if (!removeBgResponse.ok) {
      let message = "Background removal failed";
      try {
        const errorBody = await removeBgResponse.json();
        message = errorBody?.errors?.[0]?.title || message;
      } catch {
        // remove.bg didn't return JSON (rare) — fall back to the generic message above
      }

      // Surface unsupported-file / bad-image errors as 400s so the admin
      // panel can show a clear "unsupported image" message rather than a
      // generic server error.
      const status = removeBgResponse.status === 400 ? 400
        : removeBgResponse.status === 402 ? 402
        : 502;
      return res.status(status).json({ error: message });
    }

    const resultBuffer = Buffer.from(await removeBgResponse.arrayBuffer());

    res.json({
      success: true,
      image_base64: resultBuffer.toString("base64"),
      mime_type: "image/png"
    });
  } catch (err) {
    console.error("remove.bg request failed:", err);
    res.status(502).json({
      error: "Could not reach the background removal service. Please try again."
    });
  }
});

// DASHBOARD
app.get("/api/admin/dashboard", authenticateAdmin, async (req, res) => {
  const productCount = await pool.query("SELECT COUNT(*) AS count FROM products");
  const categoryCount = await pool.query("SELECT COUNT(*) AS count FROM categories");
  const orderCount = await pool.query("SELECT COUNT(*) AS count FROM orders");
  const pendingOrders = await pool.query(
    "SELECT COUNT(*) AS count FROM orders WHERE status = 'Pending'"
  );
  const sales = await pool.query(
    "SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status != 'Cancelled'"
  );
  const lowStock = await pool.query(
    "SELECT COUNT(*) AS count FROM products WHERE stock <= 5"
  );

  res.json({
    success: true,
    dashboard: {
      products: Number(productCount.rows[0].count),
      categories: Number(categoryCount.rows[0].count),
      orders: Number(orderCount.rows[0].count),
      pendingOrders: Number(pendingOrders.rows[0].count),
      sales: Number(sales.rows[0].total),
      lowStock: Number(lowStock.rows[0].count)
    }
  });
});

// PRODUCTS
app.get("/api/products", async (req, res) => {
  // Explicit no-cache: guarantees the storefront never gets served a stale
  // copy of the product list by a browser or intermediate cache/proxy.
  res.set("Cache-Control", "no-store");

  const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
  res.json(result.rows);
});

// SINGLE PRODUCT
app.get("/api/products/:id", async (req, res) => {
  res.set("Cache-Control", "no-store");

  const result = await pool.query(
    "SELECT * FROM products WHERE id = $1",
    [req.params.id]
  );
  const product = result.rows[0];

  if (!product) {
    return res.status(404).json({
      error: "Product not found"
    });
  }

  res.json(product);
});

// ADD PRODUCT
app.post("/api/products", authenticateAdmin, async (req, res) => {
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

  const result = await pool.query(
    `INSERT INTO products
     (name, description, price, stock, category, image, image_back, image_side, image_closeup, featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
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
    ]
  );

  await ensureCategoryExists(category);

  res.status(201).json({
    success: true,
    product: result.rows[0]
  });
});

// UPDATE PRODUCT
app.put("/api/products/:id", authenticateAdmin, async (req, res) => {
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

  const existing = await pool.query(
    "SELECT id FROM products WHERE id = $1",
    [req.params.id]
  );

  if (existing.rows.length === 0) {
    return res.status(404).json({
      error: "Product not found"
    });
  }

  const result = await pool.query(
    `UPDATE products
     SET
       name = $1,
       description = $2,
       price = $3,
       stock = $4,
       category = $5,
       image = $6,
       image_back = $7,
       image_side = $8,
       image_closeup = $9,
       featured = $10,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $11
     RETURNING *`,
    [
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
    ]
  );

  await ensureCategoryExists(category);

  res.json({
    success: true,
    product: result.rows[0]
  });
});

// DELETE PRODUCT
app.delete("/api/products/:id", authenticateAdmin, async (req, res) => {
  const result = await pool.query(
    "DELETE FROM products WHERE id = $1",
    [req.params.id]
  );

  if (result.rowCount === 0) {
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
app.get("/api/categories", async (req, res) => {
  res.set("Cache-Control", "no-store");

  const result = await pool.query("SELECT * FROM categories ORDER BY name ASC");
  res.json(result.rows);
});

// ADD CATEGORY
app.post("/api/categories", authenticateAdmin, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      error: "Category name is required"
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );

    res.status(201).json({
      success: true,
      category: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") { // unique_violation
      return res.status(409).json({
        error: "Category already exists"
      });
    }
    throw error;
  }
});

// DELETE CATEGORY
app.delete("/api/categories/:id", authenticateAdmin, async (req, res) => {
  const result = await pool.query(
    "DELETE FROM categories WHERE id = $1",
    [req.params.id]
  );

  if (result.rowCount === 0) {
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
app.get("/api/orders", authenticateAdmin, async (req, res) => {
  const result = await pool.query("SELECT * FROM orders ORDER BY id DESC");

  res.json(
    result.rows.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }))
  );
});

// CREATE ORDER
app.post("/api/orders", async (req, res) => {
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
  // what's actually in stock. Runs inside a real Postgres transaction (via
  // a single dedicated client) so it can't race with another order.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const item of items) {
      if (!item || !item.id) {
        throw Object.assign(new Error("Invalid item in order"), { statusCode: 400 });
      }

      const productResult = await client.query(
        "SELECT id, name, stock FROM products WHERE id = $1 FOR UPDATE",
        [item.id]
      );
      const product = productResult.rows[0];
      const qty = Number(item.qty || item.quantity || 1);

      if (!product) {
        throw Object.assign(new Error(`Product #${item.id} no longer exists`), { statusCode: 409 });
      }
      if (qty <= 0) {
        throw Object.assign(new Error(`Invalid quantity for ${product.name}`), { statusCode: 400 });
      }
      if (product.stock < qty) {
        throw Object.assign(
          new Error(`Only ${product.stock} left in stock for "${product.name}" (requested ${qty})`),
          { statusCode: 409 }
        );
      }
    }

    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, customer_phone, customer_address, items, total)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [customer_name, customer_phone, customer_address, JSON.stringify(items), Number(total)]
    );

    for (const item of items) {
      const qty = Number(item.qty || item.quantity || 1);
      await client.query(
        "UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [qty, item.id]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      orderId: orderResult.rows[0].id,
      message: "Order created successfully"
    });
  } catch (err) {
    await client.query("ROLLBACK");
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.statusCode ? err.message : "Could not create order" });
    if (!err.statusCode) console.error("Order creation failed:", err);
  } finally {
    client.release();
  }
});

// UPDATE ORDER STATUS
app.patch("/api/orders/:id/status", authenticateAdmin, async (req, res) => {
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

  const result = await pool.query(
    "UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [status, req.params.id]
  );

  if (result.rowCount === 0) {
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
app.delete("/api/orders/:id", authenticateAdmin, async (req, res) => {
  const result = await pool.query(
    "DELETE FROM orders WHERE id = $1",
    [req.params.id]
  );

  if (result.rowCount === 0) {
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

// Catch anything an async route handler above threw and didn't handle
// itself, so the client always gets a clean JSON error instead of an
// Express HTML error page.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

// Start server — but only after the database schema is ready, so no
// request can ever race against tables that don't exist yet.
initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log("");
      console.log("==================================");
      console.log("       BIGTECH SERVER RUNNING");
      console.log("==================================");
      console.log(`Website: http://localhost:${PORT}`);
      console.log(`API:     http://localhost:${PORT}/api/health`);
      console.log(`Database: connected (persistent Postgres)`);
      if (!process.env.JWT_SECRET) {
        console.log("");
        console.log("WARNING: JWT_SECRET is not set in .env — using an insecure");
        console.log("         default. Set JWT_SECRET before deploying this site.");
      }
      console.log("");
    });
  })
  .catch(err => {
    console.error("FATAL: could not set up the database schema:", err);
    process.exit(1);
  });
