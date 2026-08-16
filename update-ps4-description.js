// One-time script to update the existing Sony PlayStation 4 product's
// description in the database, using the properly-formatted text from the
// BIGTECH correction request. Run this once after deploying the updated
// site so the live PS4 listing picks up the new formatting.
//
// USAGE (run from the project folder):
//   node update-ps4-description.js
//
// To target your LIVE Render site instead of localhost, set BASE_URL:
//   BASE_URL=https://bigtech-ynhz.onrender.com node update-ps4-description.js
//
// If you've changed the admin password from the default, also set:
//   ADMIN_PASSWORD=your_new_password node update-ps4-description.js

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "599730Pp@@";

// Written in the same lightweight format the product page now understands:
// "## Heading" for a section title, lines starting with "* " for bullets
// (the text before a colon is bolded automatically), and a blank line
// between paragraphs.
const NEW_DESCRIPTION = `Enjoy an immersive gaming experience with the Sony PlayStation 4. Play a huge selection of PS4 games with smooth performance, excellent graphics, and online multiplayer support. Perfect for casual and serious gamers alike.

## Specifications
* Brand: Sony
* Storage: 500GB / 1TB
* Resolution: Up to 1080p
* Controller: DualShock 4 Wireless Controller
* Connectivity: Wi-Fi, Bluetooth & LAN
* Disc Drive: Blu-ray & DVD
* Audio: Headset support
* Output: HDMI
* Multiplayer: Local & Online Multiplayer
* Games: Supports physical and digital PS4 games
* Ports: USB & HDMI

## What's Included
* PS4 Console
* DualShock 4 Wireless Controller
* Power Cable
* HDMI Cable
* 2 Games

## Why Buy From BIGTECH?
* Fast Delivery
* Easy Returns
* Genuine Products
* Secure Shopping`;

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

  console.log("Looking for the PlayStation 4 product...");
  const productsRes = await fetch(`${BASE_URL}/api/products`);
  const products = await productsRes.json();

  const ps4 = Array.isArray(products)
    ? products.find(p => /playstation\s*4\b/i.test(p.name || "") && !/playstation\s*4[0-9]/i.test(p.name || ""))
    : null;

  if (!ps4) {
    console.error("Could not find a product with 'PlayStation 4' in its name.");
    console.error("Nothing was changed. You can also paste the description below into");
    console.error("the Admin panel manually (Manage Products -> Edit -> Description):\n");
    console.log(NEW_DESCRIPTION);
    process.exit(1);
  }

  console.log(`Found: "${ps4.name}" (id ${ps4.id}). Updating its description...`);

  const updateRes = await fetch(`${BASE_URL}/api/products/${ps4.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      name: ps4.name,
      description: NEW_DESCRIPTION,
      price: ps4.price,
      stock: ps4.stock,
      category: ps4.category,
      image: ps4.image,
      image_back: ps4.image_back,
      image_side: ps4.image_side,
      image_closeup: ps4.image_closeup,
      featured: ps4.featured
    })
  });

  const updateData = await updateRes.json();

  if (!updateRes.ok) {
    console.error("Update failed:", updateData.error || updateRes.status);
    process.exit(1);
  }

  console.log("Done. The PS4 product description has been updated.");
}

main().catch(err => {
  console.error("Script failed:", err.message);
  process.exit(1);
});
