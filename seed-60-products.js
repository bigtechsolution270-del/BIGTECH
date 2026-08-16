// One-time script to bulk-add the 60 BIGTECH demo products via the real
// admin API (same endpoint the Add Product page uses), so they show up
// properly in the database and on the live site.
//
// USAGE (run from the project folder, with the server already running):
//   node seed-60-products.js
//
// To target your LIVE Render site instead of localhost, set BASE_URL:
//   BASE_URL=https://bigtech-ynhz.onrender.com node seed-60-products.js
//
// You will be prompted for nothing — it logs in with the admin
// credentials below. Change ADMIN_PASSWORD if you've already changed
// your password on the target site.

const { products, RATE } = require("./products-data.js");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "599730Pp@@";

async function main() {
  console.log(`Target site: ${BASE_URL}`);
  console.log("Logging in as admin...");

  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
  });
  const loginData = await loginRes.json();

  if (!loginRes.ok || !loginData.token) {
    console.error("Login failed:", loginData.error || loginRes.status);
    console.error("Check ADMIN_USERNAME / ADMIN_PASSWORD env vars if you've changed your password.");
    process.exit(1);
  }

  const token = loginData.token;
  console.log("Logged in. Adding 60 products...\n");

  let created = 0;
  let failed = 0;

  for (const p of products) {
    // IMPORTANT: BIGTECH's database stores `price` directly as Nicaraguan
    // córdoba (the frontend just prefixes it with "C$", it does not convert).
    // So we convert USD -> NIO here before sending it to the API.
    const priceNIO = Math.round(p.priceUSD * RATE);

    const body = {
      name: p.name,
      description: p.description,
      price: priceNIO,
      stock: 10,
      category: p.category,
      image: "", // no hotlinked photo — falls back to the category icon; add a real photo URL later via Edit Product
      featured: 0
    };

    try {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        console.log(`  ✗ ${p.name}: ${data.error || res.status}`);
        failed++;
      } else {
        console.log(`  ✓ ${p.name} (${p.category}) — $${p.priceUSD} USD / C$${priceNIO.toLocaleString("en-US")} NIO`);
        created++;
      }
    } catch (err) {
      console.log(`  ✗ ${p.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Created: ${created}, Failed: ${failed}`);
}

main().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
