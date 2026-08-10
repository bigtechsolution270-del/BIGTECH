/* BIGTECH storefront — shared frontend logic.
   Single source of truth for products (fetched from the API/database),
   the cart (localStorage), search, filtering, and rendering used by
   index.html, category.html, product.html, cart.html and checkout.html. */
(() => {
  const API = "/api/products";
  const CART_KEY = "bigtech_cart";
  const WISH_KEY = "bigtech_wishlist";

  const ICONS = {
    phones: "📱", tablets: "📲", laptops: "💻", nintendo: "🎮",
    playstation: "🎮", xbox: "🎮", deals: "🔥", default: "🛍️"
  };

  const get = (k, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  let cart = get(CART_KEY);
  let wishlist = get(WISH_KEY);
  let products = [];
  let productsLoaded = false;

  const money = n => `C$${Number(n || 0).toLocaleString("en-US")}`;
  const icon = category => ICONS[String(category || "").toLowerCase()] || ICONS.default;
  const find = id => products.find(p => String(p.id) === String(id));

  async function loadProducts() {
    if (productsLoaded) return products;
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      products = Array.isArray(data) ? data : (data.products || []);
      productsLoaded = true;
    } catch (err) {
      console.error("BIGTECH: could not load products", err);
      products = [];
    }
    return products;
  }

  // ---------- cart ----------
  function cartCount() { return cart.reduce((sum, x) => sum + x.qty, 0); }

  function updateBadges() {
    document.querySelectorAll(".cart-count,[data-cart-count]").forEach(el => el.textContent = cartCount());
    document.querySelectorAll("[data-wishlist-count]").forEach(el => el.textContent = wishlist.length);
  }

  function add(id, qty = 1) {
    const p = find(id);
    if (!p) return;
    if (p.stock !== undefined && p.stock <= 0) { toast("Sorry, this item is out of stock"); return; }
    const row = cart.find(x => String(x.id) === String(id));
    const currentQty = row ? row.qty : 0;
    const maxAllowed = p.stock !== undefined ? Number(p.stock) : Infinity;

    if (currentQty + qty > maxAllowed) {
      const remaining = Math.max(maxAllowed - currentQty, 0);
      if (remaining <= 0) { toast(`You already have all ${maxAllowed} in stock in your cart`); return; }
      if (row) row.qty += remaining; else cart.push({ id, qty: remaining });
      save(CART_KEY, cart);
      updateBadges();
      toast(`Only ${maxAllowed} of ${p.name} in stock — added ${remaining} more`);
      renderCart();
      return;
    }

    if (row) row.qty += qty; else cart.push({ id, qty });
    save(CART_KEY, cart);
    updateBadges();
    toast(`${p.name} added to cart`);
  }

  function remove(id) {
    cart = cart.filter(x => String(x.id) !== String(id));
    save(CART_KEY, cart);
    updateBadges();
  }

  function change(id, delta) {
    const row = cart.find(x => String(x.id) === String(id));
    if (!row) return;
    const p = find(id);
    const maxAllowed = p && p.stock !== undefined ? Number(p.stock) : Infinity;
    if (delta > 0 && row.qty + delta > maxAllowed) {
      toast(`Only ${maxAllowed} of ${p?.name || "this item"} in stock`);
      return;
    }
    row.qty += delta;
    if (row.qty <= 0) remove(id); else save(CART_KEY, cart);
    updateBadges();
    renderCart();
  }

  function toggleWish(id) {
    if (wishlist.includes(id)) wishlist = wishlist.filter(x => x !== id);
    else wishlist.push(id);
    save(WISH_KEY, wishlist);
    updateBadges();
  }

  function toast(msg) {
    let t = document.getElementById("bt-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "bt-toast";
      t.style.cssText = "position:fixed;right:20px;bottom:90px;z-index:9999;background:#151a24;color:#fff;border:1px solid #8b5cf6;padding:12px 16px;border-radius:12px;box-shadow:0 14px 35px #0008;font:600 13px Inter,sans-serif;transition:.25s;max-width:280px";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = "1";
    clearTimeout(window.__btToast);
    window.__btToast = setTimeout(() => t.style.opacity = "0", 2200);
  }

  // ---------- product card rendering ----------
  function mediaFor(p) {
    if (p.image) {
      return `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" loading="lazy" onerror="this.remove();this.parentElement.insertAdjacentHTML('beforeend','<span class=&quot;card-icon-fallback&quot;>${icon(p.category)}</span>')">`;
    }
    return `<span class="card-icon-fallback">${icon(p.category)}</span>`;
  }

  function escapeAttr(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }
  function escapeHtml(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function productCard(p) {
    const outOfStock = p.stock !== undefined && Number(p.stock) <= 0;
    const lowStock = !outOfStock && p.stock !== undefined && Number(p.stock) > 0 && Number(p.stock) <= 5;
    return `<article class="product-card" data-product-id="${p.id}">
      <a href="product.html?id=${p.id}" class="card-media">
        ${mediaFor(p)}
        <div class="card-badges">
          ${outOfStock ? '<span class="badge sale">Out of stock</span>' : (lowStock ? '<span class="badge">Low stock</span>' : '<span class="badge stock"><span class="dot"></span>In stock</span>')}
        </div>
      </a>
      <div class="card-body">
        <div class="card-meta">${escapeHtml(p.category || "BIGTECH")}</div>
        <h3><a href="product.html?id=${p.id}">${escapeHtml(p.name || "Unnamed product")}</a></h3>
        <div class="card-price">${money(p.price)}</div>
        <div class="card-actions">
          <button class="btn btn-primary" data-action="add-cart" data-id="${p.id}" ${outOfStock ? "disabled" : ""}>${outOfStock ? "Out of stock" : "Add to cart"}</button>
          <a class="btn btn-outline" href="product.html?id=${p.id}">View</a>
        </div>
      </div>
    </article>`;
  }

  function renderGrid(root, list) {
    if (!root) return;
    if (!list.length) {
      root.innerHTML = `<div style="padding:55px 10px;text-align:center;grid-column:1/-1"><h2>No products found</h2><p style="color:var(--muted);margin-top:8px">Try a different search or category.</p></div>`;
      return;
    }
    root.innerHTML = list.map(productCard).join("");
    root.querySelectorAll("[data-action='add-cart']").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        add(btn.dataset.id);
      });
    });
  }

  // ---------- featured grid (index.html) ----------
  async function wireFeatured() {
    const root = document.querySelector("[data-featured-root]");
    if (!root) return;
    await loadProducts();
    const featured = products.filter(p => p.featured);
    renderGrid(root, (featured.length ? featured : products).slice(0, 8));
  }

  // ---------- category / catalog listing ----------
  async function wireCatalog() {
    const root = document.querySelector("[data-catalog-root]");
    if (!root) return;
    await loadProducts();

    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    const q = params.get("q")?.toLowerCase().trim();

    let list = products.slice();

    // Build category checkboxes dynamically from real product categories
    const filterGroup = document.querySelector("[data-category-filters]");
    if (filterGroup) {
      const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();
      filterGroup.innerHTML = cats.map(c =>
        `<label><input type="checkbox" data-filter="category" value="${escapeAttr(c)}" ${cat && cat.toLowerCase() === c.toLowerCase() ? "checked" : ""}> ${escapeHtml(c)}</label>`
      ).join("") || `<p style="color:var(--faint);font-size:12px">No categories yet</p>`;
    }

    function applyFilters() {
      const selected = Array.from(document.querySelectorAll("[data-filter='category']:checked")).map(el => el.value.toLowerCase());
      list = products.filter(p => {
        const matchesCategory = !selected.length || selected.includes(String(p.category || "").toLowerCase());
        const matchesQuery = !q || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q);
        return matchesCategory && matchesQuery;
      });
      applySort();
    }

    function applySort() {
      const sortEl = document.getElementById("sort");
      const mode = sortEl ? sortEl.value : "default";
      if (mode === "low") list.sort((a, b) => Number(a.price) - Number(b.price));
      if (mode === "high") list.sort((a, b) => Number(b.price) - Number(a.price));
      renderGrid(root, list);
    }

    const heading = document.querySelector("[data-category-title]");
    if (heading) {
      if (q) heading.textContent = `Search results for "${q}"`;
      else if (cat) heading.textContent = cat;
      else heading.textContent = "All products";
    }

    document.querySelectorAll("[data-filter='category']").forEach(el => el.addEventListener("change", applyFilters));
    document.getElementById("sort")?.addEventListener("change", applySort);

    applyFilters();
  }

  // ---------- single product page ----------
  async function wireProductPage() {
    const root = document.querySelector("[data-product-root]");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    await loadProducts();
    const p = id ? find(id) : null;

    if (!p) {
      root.innerHTML = `<div style="padding:60px 10px;text-align:center;grid-column:1/-1"><h1>Product not found</h1><p style="color:var(--muted);margin:10px 0 22px">This product may have been removed.</p><a class="btn btn-primary" href="category.html">Browse all products</a></div>`;
      document.title = "BIGTECH | Product not found";
      return;
    }

    document.title = `BIGTECH | ${p.name}`;
    const outOfStock = p.stock !== undefined && Number(p.stock) <= 0;

    document.querySelectorAll("[data-product-name]").forEach(e => e.textContent = p.name);
    document.querySelectorAll("[data-product-price]").forEach(e => e.textContent = money(p.price));
    document.querySelectorAll("[data-product-desc]").forEach(e => e.textContent = p.description || `Genuine ${p.name} from BIGTECH. Door-to-door delivery is available, with free delivery around Managua. Contact +505 84883831 for availability and order confirmation.`);
    document.querySelectorAll("[data-product-category]").forEach(e => { e.textContent = p.category || "BIGTECH"; e.href = `category.html?category=${encodeURIComponent(p.category || "")}`; });
    document.querySelectorAll("[data-product-stock]").forEach(e => {
      e.innerHTML = outOfStock ? "Out of stock" : `<span class="dot"></span> In stock${p.stock ? ` (${p.stock} left)` : ""}`;
      e.classList.toggle("stock", !outOfStock);
    });
    document.querySelectorAll("[data-product-media]").forEach(e => { e.innerHTML = mediaFor(p); });

    document.querySelectorAll("[data-add-product]").forEach(b => {
      b.disabled = outOfStock;
      b.textContent = outOfStock ? "Out of stock" : "Add to cart";
      b.onclick = () => add(p.id, getQty());
    });
    document.querySelectorAll("[data-buy-product]").forEach(b => {
      b.disabled = outOfStock;
      b.onclick = () => { add(p.id, getQty()); location.href = "cart.html"; };
    });

    function getQty() {
      const stepper = document.querySelector(".pdp-actions .qty-stepper span, [data-product-qty]");
      const n = parseInt(stepper?.textContent, 10);
      return Number.isFinite(n) && n > 0 ? n : 1;
    }
  }

  // ---------- cart page ----------
  async function renderCart() {
    const root = document.querySelector("[data-cart-root]");
    if (!root) return;
    await loadProducts();

    if (!cart.length) {
      root.innerHTML = `<div style="padding:55px 10px;text-align:center"><h2>Your cart is empty</h2><p style="color:var(--muted);margin:10px 0 22px">Add products from BIGTECH to get started.</p><a class="btn btn-primary" href="category.html">Shop products</a></div>`;
      document.querySelectorAll("[data-cart-subtotal],[data-cart-total]").forEach(e => e.textContent = money(0));
      return;
    }

    root.innerHTML = cart.map(x => {
      const p = find(x.id);
      if (!p) return "";
      return `<div class="cart-item">
        <div class="cart-thumb">${mediaFor(p)}</div>
        <div><h4>${escapeHtml(p.name)}</h4><div class="meta">${escapeHtml(p.category || "")}</div><a href="#" class="remove-link" data-remove="${x.id}">Remove</a></div>
        <div class="qty-stepper"><button data-minus="${x.id}">−</button><span>${x.qty}</span><button data-plus="${x.id}">+</button></div>
        <div class="cart-price">${money((p.price || 0) * x.qty)}</div>
      </div>`;
    }).join("");

    root.querySelectorAll("[data-minus]").forEach(b => b.onclick = e => { e.preventDefault(); change(b.dataset.minus, -1); });
    root.querySelectorAll("[data-plus]").forEach(b => b.onclick = e => { e.preventDefault(); change(b.dataset.plus, 1); });
    root.querySelectorAll("[data-remove]").forEach(b => b.onclick = e => { e.preventDefault(); remove(b.dataset.remove); renderCart(); });

    const subtotal = cart.reduce((s, x) => s + (find(x.id)?.price || 0) * x.qty, 0);
    document.querySelectorAll("[data-cart-subtotal],[data-cart-total]").forEach(e => e.textContent = money(subtotal));
  }

  // ---------- checkout ----------
  async function wireCheckout() {
    const form = document.querySelector("[data-checkout-form]");
    if (!form) return;
    await loadProducts();

    const total = cart.reduce((s, x) => s + (find(x.id)?.price || 0) * x.qty, 0);
    document.querySelectorAll("[data-checkout-total]").forEach(e => e.textContent = money(total));

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!cart.length) { toast("Your cart is empty"); return; }

      const submitBtn = form.querySelector("button[type='submit']");
      const originalLabel = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Placing order…"; }

      const data = new FormData(form);
      const name = data.get("name") || "Customer";
      const address = data.get("address") || "";
      const phone = data.get("phone") || "";
      const note = data.get("note") || "";
      const items = cart.map(x => {
        const p = find(x.id);
        return { id: x.id, name: p?.name || "Product", qty: x.qty, price: p?.price || 0 };
      });
      const orderTotal = items.reduce((s, i) => s + i.price * i.qty, 0);

      let orderSaved = false;
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: name,
            customer_phone: phone,
            customer_address: address,
            items,
            total: orderTotal
          })
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok) {
          // e.g. insufficient stock — stop here, keep the cart, let the person fix it.
          toast(result.error || "Could not place your order. Please try again.");
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
          await loadFreshStock();
          renderCart();
          return;
        }
        orderSaved = true;
      } catch (err) {
        console.error("BIGTECH: could not save order", err);
        toast("Network error — please check your connection and try again.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
        return;
      }

      const lines = items.map(i => `${i.name} x${i.qty}`).join(", ");
      const msg = `Hello BIGTECH! I want to place an order.%0A%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0AAddress: ${encodeURIComponent(address)}%0ANote: ${encodeURIComponent(note)}%0AProducts: ${encodeURIComponent(lines)}%0ATotal: ${encodeURIComponent(money(orderTotal))}`;

      cart = [];
      save(CART_KEY, cart);
      updateBadges();

      window.open(`https://wa.me/50584883831?text=${msg}`, "_blank");
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      toast("Order placed! Confirm the details on WhatsApp.");
      setTimeout(() => { location.href = "index.html"; }, 1500);
    });
  }

  // Re-fetch products so stock numbers reflect the latest DB state
  // (used after a failed checkout so the cart/product pages show accurate stock).
  async function loadFreshStock() {
    productsLoaded = false;
    await loadProducts();
  }

  // ---------- search + nav ----------
  function wireSearch() {
    document.querySelectorAll(".searchbar input,[data-search]").forEach(input => {
      input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          const q = input.value.trim();
          location.href = `category.html${q ? "?q=" + encodeURIComponent(q) : ""}`;
        }
      });
    });
  }

  function wireCategoryNav() {
    document.querySelectorAll("[data-category]").forEach(a => {
      a.addEventListener("click", e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let new-tab/middle-click behave normally
        const c = a.dataset.category;
        if (c) { e.preventDefault(); location.href = `category.html?category=${encodeURIComponent(c)}`; }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateBadges();
    wireSearch();
    wireCategoryNav();
    wireFeatured();
    wireCatalog();
    wireProductPage();
    renderCart();
    wireCheckout();

    document.querySelectorAll("[data-action='shop']").forEach(b => b.onclick = () => location.href = "category.html");
    document.querySelectorAll("[data-action='cart']").forEach(b => b.onclick = () => location.href = "cart.html");
    document.querySelectorAll("[data-action='checkout']").forEach(b => b.onclick = () => location.href = "checkout.html");
    document.querySelectorAll(".cart-link").forEach(b => b.onclick = e => { e.preventDefault(); location.href = "cart.html"; });
  });

  window.BIGTECH = { add, remove, change, toggleWish, money, loadProducts };
})();
